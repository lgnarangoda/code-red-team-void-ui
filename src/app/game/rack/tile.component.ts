import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tile } from '../../core/models/tile.model';

@Component({
  selector: 'app-tile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile.component.html',
  styleUrl: './tile.component.scss'
})
export class TileComponent {
  @Input() tile!: Tile;
  @Input() isSelected: boolean = false;
  @Input() isDragging: boolean = false;

  get displayLetter(): string {
    if (this.tile.isBlank && this.tile.blankLetter) {
      return this.tile.blankLetter;
    }
    return this.tile.letter;
  }

  onMouseDown(event: MouseEvent): void {
    // Prevent default to allow custom drag behavior
    event.preventDefault();
  }

  onDragStart(event: DragEvent): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', this.tile.id);
      event.dataTransfer.effectAllowed = 'move';
    }
    this.isDragging = true;
  }

  onDragEnd(event: DragEvent): void {
    this.isDragging = false;
  }
}
