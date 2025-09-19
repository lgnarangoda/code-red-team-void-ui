import { Player } from './player.model';
import { Tile } from './tile.model';

export interface Square {
  row: number;
  col: number;
  tile?: Tile;
  premiumType?: 'double-letter' | 'triple-letter' | 'double-word' | 'triple-word' | 'center';
  isOccupied: boolean;
}

export interface GameState {
  gameId: string;
  board: Square[][];
  players: Player[];
  currentPlayerId: string;
  bag: Tile[];
  gamePhase: 'waiting' | 'playing' | 'finished';
  scores: { [playerId: string]: number };
  lastMove?: {
    playerId: string;
    tiles: Tile[];
    positions: { row: number; col: number }[];
    score: number;
  };
  timeRemaining: number;
}
