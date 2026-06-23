export interface StandingStat {
  name: string;
  displayName: string;
  description: string;
  value: number;
  displayValue: string;
}

export interface StandingEntry {
  name: string;
  abbreviation: string;
  logo: string;
  rank: number;
  color: string;
  description: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface StandingGroup {
  id: string;
  name: string;
  teams: StandingEntry[];
}
