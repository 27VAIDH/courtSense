import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';
import type { Player, Venue, Match, Game, RallyAnalysis } from './types';

export function usePlayers(): Player[] | undefined {
  return useLiveQuery(() => db.players.toArray());
}

export function useVenues(): Venue[] | undefined {
  return useLiveQuery(() => db.venues.toArray());
}

export function useMatches(): Match[] | undefined {
  return useLiveQuery(() => db.matches.toArray());
}

export function useGames(matchId?: number): Game[] | undefined {
  return useLiveQuery(
    () =>
      matchId !== undefined
        ? db.games.where('matchId').equals(matchId).toArray()
        : db.games.toArray(),
    [matchId]
  );
}

export function useRallyAnalyses(matchId?: number): RallyAnalysis[] | undefined {
  return useLiveQuery(
    () =>
      matchId !== undefined
        ? db.rally_analyses.where('matchId').equals(matchId).toArray()
        : db.rally_analyses.toArray(),
    [matchId]
  );
}
