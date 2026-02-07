export interface Player {
  id?: number;
  name: string;
  emoji: string;
  isCurrentUser: boolean;
  createdAt: Date;
}

export interface Venue {
  id?: number;
  name: string;
  isHome: boolean;
  createdAt: Date;
}

export interface Match {
  id?: number;
  date: Date;
  opponentId: number;
  venueId: number;
  format: 'Bo3' | 'Bo5';
  result: string; // e.g. 'W 3-1' or 'L 1-3'
  energyLevel?: 'Low' | 'Medium' | 'High';
  vibe?: string;
  tags?: string[];
  note?: string;
  photoBase64?: string;
  recommendationText?: string;
  createdAt: Date;
}

export interface Game {
  id?: number;
  matchId: number;
  gameNumber: number;
  myScore: number;
  opponentScore: number;
  isTight: boolean;
}

export interface RallyAnalysis {
  id?: number;
  matchId: number;
  winMethod?: string;
  loseMethod?: string;
  rallyLength?: string;
  courtCoverage?: string;
  bestShots?: string[];
  createdAt: Date;
}
