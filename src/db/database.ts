import Dexie, { type Table } from 'dexie';
import type { Player, Venue, Match, Game, RallyAnalysis } from './types';

export class SquashIQDatabase extends Dexie {
  players!: Table<Player, number>;
  venues!: Table<Venue, number>;
  matches!: Table<Match, number>;
  games!: Table<Game, number>;
  rally_analyses!: Table<RallyAnalysis, number>;

  constructor() {
    super('squashiq-db');

    this.version(1).stores({
      players: '++id, name, emoji, isCurrentUser, createdAt',
      venues: '++id, name, isHome, createdAt',
      matches: '++id, date, opponentId, venueId, format, result, energyLevel, vibe, tags, note, photoBase64, recommendationText, createdAt',
      games: '++id, matchId, gameNumber, myScore, opponentScore, isTight',
      rally_analyses: '++id, matchId, winMethod, loseMethod, rallyLength, courtCoverage, bestShots, createdAt',
    });
  }
}

export const db = new SquashIQDatabase();

export async function ensureCurrentUser(): Promise<void> {
  const existing = await db.players.where('isCurrentUser').equals(1).first();
  if (!existing) {
    await db.players.add({
      name: 'Me',
      emoji: '🏸',
      isCurrentUser: true,
      createdAt: new Date(),
    });
  }
}
