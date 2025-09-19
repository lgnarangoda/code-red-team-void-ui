import { Tile } from './tile.model';

export interface Player {
  id: string;
  name: string;
  rack: Tile[];
  score: number;
  isCurrentPlayer: boolean;
  isBot: boolean;
}