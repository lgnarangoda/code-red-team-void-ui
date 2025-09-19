import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './controls.component.html',
  styleUrl: './controls.component.scss'
})
export class ControlsComponent {
  @Input() isCurrentPlayer: boolean = false;
  @Output() shuffle = new EventEmitter<void>();
  @Output() exchange = new EventEmitter<void>();
  @Output() passTurn = new EventEmitter<void>();
  @Output() submitMove = new EventEmitter<void>();

  onShuffle(): void {
    this.shuffle.emit();
  }

  onExchange(): void {
    this.exchange.emit();
  }

  onPassTurn(): void {
    this.passTurn.emit();
  }

  onSubmitMove(): void {
    this.submitMove.emit();
  }
}
