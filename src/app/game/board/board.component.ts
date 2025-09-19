import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Square } from '../../core/models/game-state.model';
import { SquareComponent } from './square.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, SquareComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent {
  @Input() board: Square[][] = [];
  @Input() selectedTiles: string[] = [];
  @Output() tilePlaced = new EventEmitter<any>();
  @Output() tileRemoved = new EventEmitter<any>();

  get flattenedBoard(): Square[] {
    return this.board.flat();
  }

  trackBySquare(index: number, square: Square): string {
    return `${square.row}-${square.col}`;
  }

  isSquareSelected(square: Square): boolean {
    return this.selectedTiles.includes(`${square.row}-${square.col}`);
  }

  onSquareClick(square: Square): void {
    if (square.isOccupied) {
      this.tileRemoved.emit(square);
    } else {
      this.tilePlaced.emit(square);
    }
  }
}
