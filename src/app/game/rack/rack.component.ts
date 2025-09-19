import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tile } from '../../core/models/tile.model';
import { TileComponent } from './tile.component';

@Component({
  selector: 'app-rack',
  standalone: true,
  imports: [CommonModule, TileComponent],
  templateUrl: './rack.component.html',
  styleUrl: './rack.component.scss'
})
export class RackComponent {
  @Input() tiles: Tile[] = [];
  @Input() selectedTiles: string[] = [];
  @Output() tileSelected = new EventEmitter<string>();
  @Output() tileDeselected = new EventEmitter<string>();
  @Output() tilesReordered = new EventEmitter<Tile[]>();

  private dragIndex: number | null = null;

  trackByTile(index: number, tile: Tile): string {
    return tile.id;
  }

  isTileSelected(tileId: string): boolean {
    return this.selectedTiles.includes(tileId);
  }

  onTileClick(tile: Tile): void {
    if (this.isTileSelected(tile.id)) {
      this.tileDeselected.emit(tile.id);
    } else {
      this.tileSelected.emit(tile.id);
    }
  }

  onDragStart(index: number, event: DragEvent): void {
    this.dragIndex = index;
    event.dataTransfer?.setData('text/plain', index.toString());
    event.dataTransfer!.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    if (this.dragIndex === null || this.dragIndex === index) return;
    const newTiles = [...this.tiles];
    const [moved] = newTiles.splice(this.dragIndex, 1);
    newTiles.splice(index, 0, moved);
    this.tiles = newTiles;
    this.tilesReordered.emit(this.tiles);
    this.dragIndex = null;
  }
}
