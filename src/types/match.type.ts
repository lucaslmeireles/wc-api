export interface Athlete {
  displayName: string;
}

export interface EventDetail {
  type: { text: string };
  clock: { value: string };
  team: { id: string };
  athletesInvolved: Athlete[];
  scoreValue?: number;
  scoringPlay?: boolean;
  redCard?: boolean;
  yellowCard?: boolean;
  penaltyKick?: boolean;
}

export interface Competitor {
  id: string;
  name: string;
  homeAway: string;
  score: number;
  team: {
    abbreviation: string;
    displayName: string;
    color: string;
    alternativeColor: string;
    logo: string;
  };
}

interface EventVenue {
  fullName: string;
  address: { city: string; country: string };
}

interface EventStatus {
  clock: string;
  displayClock: string;
  period: number;
  type: {
    name: string;
    description: string;
    shortDetail: string;
    detail?: string;
  };
}
export interface Event {
  id: string;
  uuid: string;
  shortName: string;
  date: string;
  competitions: Competition[];
}
export interface Competition {
  status: EventStatus;
  venue: EventVenue;
  competitors: Competitor[];
  details: EventDetail[];
}

export interface Match {
  id: string;
  uuid?: string;
  shortName: string;
  date?: string;
  status: {
    clock: string;
    displayClock: string;
    period: number;
    type: {
      name: string;
      description: string;
      shortDetail: string;
      detail?: string;
    };
  };
  venue: {
    fullName: string;
    city?: string;
    country?: string;
  };
  teams: Array<{
    id: string;
    name: string;
    homeAway: string;
    score: number;
    info: {
      abbreviation: string;
      displayName: string;
      color: string;
      alternativeColor: string;
      logo: string;
    };
  }>;
  match_info: Array<{
    text: string;
    time: string;
    athletesInvolved: Array<{ displayName: string }>;
    type: {
      scoreValue?: number;
      scoringPlay?: boolean;
      redCard?: boolean;
      yellowCard?: boolean;
      penaltyKick?: boolean;
    };
    team: {
      id: string;
      homeAway: string;
      score: number;
      info: {
        abbreviation: string;
        displayName: string;
        color: string;
        alternativeColor: string;
        logo: string;
      };
    };
  }>;
}
