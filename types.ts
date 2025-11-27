export enum ObstacleType {
  SPIKE = 'SPIKE',
  BLOCK = 'BLOCK',
  FLYING_SPIKE = 'FLYING_SPIKE'
}

export interface ObstacleData {
  type: ObstacleType;
  xOffset: number; // Distance from previous obstacle or start
  yLevel: number; // 0 is ground, 1 is one block high, etc.
}

export interface Level {
  name: string;
  description: string;
  data: ObstacleData[];
  themeColor: string; // Hex code
  speed: number;
}

export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}
