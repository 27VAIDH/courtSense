export interface Player {
  id?: number;
  name: string;
  emoji: string;
  isCurrentUser: boolean;
  createdAt: Date;
  sample_data?: boolean; // Flag for sample data generation
}

export interface Venue {
  id?: number;
  name: string;
  isHome: boolean;
  createdAt: Date;
  sample_data?: boolean; // Flag for sample data generation
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
  photoBase64?: string; // Legacy - for old matches
  photo_url?: string; // New - Supabase Storage URL
  recommendationText?: string;
  createdAt: Date;
  sample_data?: boolean; // Flag for sample data generation
}

export interface Game {
  id?: number;
  matchId: number;
  gameNumber: number;
  myScore: number;
  opponentScore: number;
  isTight: boolean;
  sample_data?: boolean; // Flag for sample data generation
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

export interface PhotoUploadQueue {
  id?: number;
  matchId: string; // Can be local number ID or server UUID
  blob: string; // Base64 encoded compressed image
  filename: string; // Format: {userId}/{matchId}_{timestamp}.jpg
  createdAt: Date;
  retryCount: number;
}
