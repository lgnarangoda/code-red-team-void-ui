import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Square } from '../../core/models/game-state.model';

@Component({
  selector: 'app-square',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './square.component.html',
  styleUrl: './square.component.scss'
})
export class SquareComponent {
  @Input() square!: Square;
  @Input() isSelected: boolean = false;

  getSquareClasses(): string {
    const classes = ['square'];
    if (this.isSelected) {
      classes.push('selected');
    }
    if (this.square.premiumType) {
      classes.push(this.square.premiumType);
    }
    return classes.join(' ');
  }

  getBackgroundColor(): string {
    if (this.square.isOccupied) {
      return '#f8f8f8';
    }
    
    switch (this.square.premiumType) {
      case 'double-letter':
        return '#87CEEB';
      case 'triple-letter':
        return '#4169E1';
      case 'double-word':
        return '#FFB6C1';
      case 'triple-word':
        return '#DC143C';
      case 'center':
        return '#FFD700';
      default:
        return '#f5f5f5';
    }
  }

  getPremiumText(): string {
    switch (this.square.premiumType) {
      case 'double-letter':
        return 'DL';
      case 'triple-letter':
        return 'TL';
      case 'double-word':
        return 'DW';
      case 'triple-word':
        return 'TW';
      case 'center':
        return '★';
      default:
        return '';
    }
  }
}
