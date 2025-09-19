export interface Tile {
  letter: string;
  value: number;
  id: string;
  isBlank?: boolean;
  blankLetter?: string;
}

export interface TileBag {
  tiles: Tile[];
  remainingCount: number;
}