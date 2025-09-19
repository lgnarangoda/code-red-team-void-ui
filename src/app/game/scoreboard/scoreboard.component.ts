import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameState } from '../../core/models/game-state.model';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scoreboard.component.html',
  styleUrl: './scoreboard.component.scss'
})
export class ScoreboardComponent {
  @Input() gameState: GameState | null = null;
  @Input() timeLeft: number = 0;
  @Input() isTimerRunning: boolean = false;

  get isTimeWarning(): boolean {
    return this.timeLeft <= 30 && this.timeLeft > 0;
  }

  trackByPlayer(index: number, player: any): string {
    return player.id;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getPhaseText(): string {
    switch (this.gameState?.gamePhase) {
      case 'waiting':
        return 'Waiting for Players';
      case 'playing':
        return 'Game in Progress';
      case 'finished':
        return 'Game Finished';
      default:
        return 'Unknown';
    }
  }

  getPhaseClass(): string {
    return `phase-${this.gameState?.gamePhase || 'unknown'}`;
  }
}
