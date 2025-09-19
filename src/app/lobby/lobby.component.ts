import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { GameService } from '../core/services/game.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnInit {
  playerName: string = '';
  isSearching: boolean = false;
  isWaiting: boolean = false;
  currentUser: string | null = null;
  isAuthenticated: boolean = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = this.authService.isAuthenticated();
    });
  }

  login(): void {
    if (this.playerName.trim()) {
      this.authService.login(this.playerName.trim());
    }
  }

  async findMatch(): Promise<void> {
    this.isSearching = true;
    this.error = null;
    try {
      const name = this.currentUser || this.playerName.trim() || `Player-${Math.floor(Math.random() * 1000)}`;
      const { gameId } = await this.gameService.joinLobby(name);
      // Persist and navigate to game; server will push snapshot on topic
      try { localStorage.setItem('lastGameId', gameId); } catch {}
      // Fallback navigation without router config: use query param
      this.router.navigate(['/game'], { queryParams: { gameId } });
    } catch (e: any) {
      this.error = e?.message || 'Failed to join lobby';
    } finally {
      this.isSearching = false;
    }
  }

  playWithBot(): void {
    // Optional: could call a backend bot endpoint if available
    this.router.navigate(['/game']);
  }
}
