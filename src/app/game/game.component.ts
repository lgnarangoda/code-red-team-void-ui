import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../core/services/game.service';
import { TimerService } from '../core/services/timer.service';
import { GameState, Square } from '../core/models/game-state.model';
import { BoardComponent } from './board/board.component';
import { RackComponent } from './rack/rack.component';
import { ControlsComponent } from './controls/controls.component';
import { ScoreboardComponent } from './scoreboard/scoreboard.component';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    BoardComponent,
    RackComponent,
    ControlsComponent,
    ScoreboardComponent
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, OnDestroy {
  gameState: GameState | null = null;
  selectedTiles: string[] = [];
  timeLeft$!: Observable<number>;
  isTimerRunning$!: Observable<boolean>;

  // Input mode state
  private startSquare: { row: number; col: number } | null = null;
  private direction: 'horizontal' | 'vertical' = 'horizontal';
  pendingPlacements: { row: number; col: number; tileId: string; letter?: string }[] = [];
  warnings: string[] = [];

  get isCurrentPlayer(): boolean {
    return this.gameState?.currentPlayerId === this.getCurrentUserId();
  }

  get currentPlayerRack() {
    const currentPlayer = this.gameState?.players.find(p => p.id === this.gameState?.currentPlayerId);
    return currentPlayer?.rack || [];
  }

  constructor(
    private gameService: GameService,
    private timerService: TimerService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.timeLeft$ = this.timerService.timeLeft$;
    this.isTimerRunning$ = this.timerService.isRunning$;
  }

  ngOnInit(): void {
    // Determine gameId from query param or localStorage fallback
    const qp = new URLSearchParams(window.location.search);
    const fromQuery = qp.get('gameId');
    const fromStorage = (() => { try { return localStorage.getItem('lastGameId'); } catch { return null; } })();
    const gameId = fromQuery || fromStorage || 'demo-game';

    this.gameService.connectToGame(gameId).subscribe(gameState => {
      if ((gameState as any).board) {
        this.gameState = gameState;
        this.timerService.syncWithServer(gameState.timeRemaining);
      } else if ((gameState as any).timeRemaining !== undefined) {
        this.timerService.syncWithServer((gameState as any).timeRemaining);
      }
    });
  }

  ngOnDestroy(): void {
    this.gameService.disconnect();
    this.timerService.stopTimer();
  }

  // Board interactions
  onTilePlaced(square: Square): void {
    if (!this.isCurrentPlayer) {
      return this.warn('Invalid Turn: It is not your turn.');
    }
    if (!this.startSquare) {
      this.startSquare = { row: square.row, col: square.col };
    } else if (this.startSquare.row === square.row && this.startSquare.col === square.col) {
      // Toggle direction on same square click
      this.direction = this.direction === 'horizontal' ? 'vertical' : 'horizontal';
    } else {
      // Move starting point
      this.startSquare = { row: square.row, col: square.col };
    }
  }

  onTileRemoved(square: Square): void {
    // Allow removing last pending placement if clicked
    const idx = this.pendingPlacements.findIndex(p => p.row === square.row && p.col === square.col);
    if (idx >= 0) {
      this.pendingPlacements.splice(idx, 1);
    }
  }

  // Rack selection click handlers remain for tile highlighting
  onTileSelected(tileId: string): void {
    if (!this.selectedTiles.includes(tileId)) {
      this.selectedTiles.push(tileId);
    }
  }

  onTileDeselected(tileId: string): void {
    this.selectedTiles = this.selectedTiles.filter(id => id !== tileId);
  }

  onRackReordered(newTiles: any[]): void {
    // Update local view of current player's rack order for strategic planning
    if (!this.gameState) return;
    const player = this.gameState.players.find(p => p.id === this.gameState!.currentPlayerId);
    if (player) {
      player.rack = newTiles as any;
    }
  }

  // Keyboard input for placing letters and actions
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isCurrentPlayer) {
      if (this.isLetterKey(event) || event.key === 'Enter' || event.key.toLowerCase() === 'x') {
        this.warn('Invalid Turn: It is not your turn.');
      }
      return;
    }

    if (event.key === 'Enter') {
      if (this.pendingPlacements.length === 0) {
        if (confirm('Pass your turn?')) {
          this.onPassTurn();
        }
      } else {
        this.onSubmitMove();
      }
      event.preventDefault();
      return;
    }

    if (event.key.toLowerCase() === 'x' && this.pendingPlacements.length === 0) {
      // Trigger exchange dialog
      const input = prompt('Enter letters to exchange (e.g., AEI):');
      if (input) {
        const letters = input.replace(/[^A-Z]/gi, '').toUpperCase().split('');
        const tileIds: string[] = [];
        letters.forEach(letter => {
          const tile = this.currentPlayerRack.find(t => !tileIds.includes(t.id) && (t.letter.toUpperCase() === letter || (t.isBlank && !t.blankLetter)));
          if (tile) tileIds.push(tile.id);
        });
        if (tileIds.length > 0) {
          this.onExchange(tileIds);
        } else {
          this.warn('Invalid Tile: Selected letters not in your rack.');
        }
      }
      return;
    }

    // Letter placement
    if (this.isLetterKey(event)) {
      if (!this.startSquare) {
        this.warn('Missing Starting Point: Click a starting square first.');
        return;
      }
      const useBlank = event.shiftKey; // Shift+letter to use blank
      const letter = event.key.toUpperCase();

      const tileToUse = this.pickTileForLetter(letter, useBlank);
      if (!tileToUse) {
        this.warn('Invalid Tile: You do not have that tile in your rack.');
        return;
      }

      const nextSpot = this.findNextEmptySquare(this.startSquare, this.direction, this.pendingPlacements);
      if (!nextSpot) {
        this.warn('Word Off Board: No more space in this direction.');
        return;
      }

      this.pendingPlacements.push({ row: nextSpot.row, col: nextSpot.col, tileId: tileToUse.id, letter: tileToUse.isBlank ? letter : undefined });
    }
  }

  private isLetterKey(event: KeyboardEvent): boolean {
    return event.key.length === 1 && /[a-zA-Z]/.test(event.key);
  }

  private pickTileForLetter(letter: string, preferBlank: boolean) {
    const rack = this.currentPlayerRack;
    if (preferBlank) {
      const blank = rack.find(t => t.isBlank && !this.isTileUsed(t.id));
      if (blank) return blank;
    }
    const exact = rack.find(t => t.letter.toUpperCase() === letter && !this.isTileUsed(t.id));
    if (exact) return exact;
    // If not preferBlank and exact not found, allow blank fallback
    const blank = rack.find(t => t.isBlank && !this.isTileUsed(t.id));
    return blank || null;
  }

  private isTileUsed(tileId: string): boolean {
    return this.pendingPlacements.some(p => p.tileId === tileId);
  }

  private findNextEmptySquare(start: { row: number; col: number }, dir: 'horizontal' | 'vertical', placed: { row: number; col: number }[]) {
    if (!this.gameState?.board) return null;
    const rows = this.gameState.board.length;
    const cols = this.gameState.board[0]?.length || 0;

    let r = start.row;
    let c = start.col;

    // If first placement, allow start itself if empty
    let first = true;
    while (r >= 0 && r < rows && c >= 0 && c < cols) {
      const occupied = this.gameState.board[r][c].isOccupied || placed.some(p => p.row === r && p.col === c);
      if (!occupied) {
        if (!first || (first && this.pendingPlacements.length === 0)) {
          return { row: r, col: c };
        }
      }
      first = false;
      if (dir === 'horizontal') c++; else r++;
    }
    return null;
  }

  onShuffle(): void {
    const gameId = this.gameState?.gameId;
    if (!gameId) return;
    this.gameService.sendShuffle(gameId);
  }

  onExchange(tileIds?: string[]): void {
    const gameId = this.gameState?.gameId;
    if (!gameId) return;
    if (!tileIds || tileIds.length === 0) return;
    this.gameService.sendExchange(gameId, tileIds);
  }

  onPassTurn(): void {
    const gameId = this.gameState?.gameId;
    if (!gameId) return;
    this.gameService.sendPass(gameId);
  }

  onSubmitMove(): void {
    const gameId = this.gameState?.gameId;
    if (!gameId) return;
    if (this.pendingPlacements.length === 0) return;
    this.gameService.sendPlaceTiles(gameId, this.pendingPlacements);
    this.gameService.sendSubmitMove(gameId);
    this.pendingPlacements = [];
    this.startSquare = null;
  }

  returnToLobby(): void {
    this.router.navigate(['/lobby']);
  }

  private getCurrentUserId(): string {
    return this.authService.getCurrentUser() || 'current-user';
  }

  private warn(message: string): void {
    this.warnings.push(message);
    setTimeout(() => {
      this.warnings = this.warnings.filter(m => m !== message);
    }, 2500);
  }
}
