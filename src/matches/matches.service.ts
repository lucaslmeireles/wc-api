import { Injectable, Logger } from '@nestjs/common';
import { MatchesRepository } from './matches.repository';
import {
  Athlete,
  Competitor,
  Event,
  EventDetail,
  Match,
} from 'src/types/match.type';
import { StandingGroup } from 'src/types/rank.type';

interface ApiResponse {
  leagues: Array<Array<unknown>>;
  events: Event[];
}

interface ApiResponseRank {
  children: Array<Array<unknown>>;
}

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  constructor(private matchesRepository: MatchesRepository) {}

  async updateMatch(match_id: string, match: Match) {
    this.logger.log(`Updating match ${match_id}`);
    return this.matchesRepository.update(match_id, match);
  }

  async findMatchById(match_id: string) {
    return this.matchesRepository.findById(match_id);
  }

  async createMatch(match: Match) {
    this.logger.log(`Creating match ${match.id}`);
    return this.matchesRepository.create(match);
  }

  async getActiveAndScheduledMatches(): Promise<Match[]> {
    return this.matchesRepository.getActiveAndScheduledMatches();
  }

  async getMatchesByStatus(status: string): Promise<Match[]> {
    return this.matchesRepository.getMatchesByStatus(status);
  }
  async getMatches(date?: string): Promise<Match[]> {
    try {
      const response = await fetch(
        process.env.ESPN_API_URL ||
          'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard',
      );
      const raw: unknown = await response.json();
      const data: ApiResponse = raw as ApiResponse;
      const matches = this.extractMatchesFromApi(data);
      this.logger.log(`Fetched ${matches.length} matches from ESPN API`);
      return matches;
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Error fetching matches', stack);
      throw new Error('Failed to fetch matches');
    }
  }

  async getRank(): Promise<StandingGroup> {
    try {
      const response = await fetch(
        process.env.ESPN_API_URL ||
          'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings',
      );
      const raw: unknown = await response.json();
      const data: ApiResponseRank = raw as ApiResponseRank;
      const ranks = this.extractRankings(data);
      return ranks;
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Error fetching matches', stack);
      throw new Error('Failed to fetch matches');
    }
  }

  async fetchMatchById(matchId: string): Promise<Match | null> {
    // a ESPN tem endpoint direto por evento
    // https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/summary?event={id}
    try {
      const response = await fetch(
        process.env.ESPN_API_URL ||
          `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${matchId}`,
      );
      const raw: unknown = await response.json();
      const data: ApiResponse = raw as ApiResponse;
      const match = this.extractMatchFromSummary(data);
      this.logger.log(`Fetched match from ESPN API`);
      return match;
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Error fetching matches', stack);
      throw new Error('Failed to fetch matches');
    }
  }

  extractMatchesFromApi(data: ApiResponse): Match[] {
    const matches: Match[] = data.events.map((event: Event) => {
      const competition = event.competitions[0];
      const match = {
        id: event.id,
        uuid: event.uuid || event.id,
        shortName: event.shortName,
        date: event.date,
        status: {
          clock: competition.status.clock,
          displayClock: competition.status.displayClock,
          period: competition.status.period,
          type: {
            name: competition.status.type.name,
            description: competition.status.type.description,
            shortDetail: competition.status.type.shortDetail,
            detail: competition.status.type.detail ?? '',
          },
        },
        venue: {
          fullName: competition.venue?.fullName ?? '',
          city: competition.venue?.address?.city ?? '',
          country: competition.venue?.address?.country ?? '',
        },
        teams: competition.competitors.map((competitor: Competitor) => {
          return {
            id: competitor.id,
            name: competitor.team.displayName,
            homeAway: competitor.homeAway,
            score: competitor.score,
            info: {
              abbreviation: competitor.team.abbreviation,
              displayName: competitor.team.displayName,
              color: competitor.team.color,
              alternativeColor: competitor.team.alternativeColor,
              logo: competitor.team.logo,
            },
          };
        }),
        match_info: (competition.details ?? []).map((detail: EventDetail) => {
          const teamFound = competition.competitors.find(
            (team) => team?.id === detail.team.id,
          );
          return {
            text: detail.type?.text ?? '',
            time: detail.clock?.value ?? '',
            athletesInvolved: (detail.athletesInvolved ?? []).map(
              (athlete: Athlete) => ({
                displayName: athlete.displayName,
              }),
            ),
            type: {
              scoreValue: detail.scoreValue,
              scoringPlay: detail.scoringPlay,
              redCard: detail.redCard,
              yellowCard: detail.yellowCard,
              penaltyKick: detail.penaltyKick,
            },
            team: {
              id: teamFound?.id ?? '',
              homeAway: teamFound?.homeAway ?? '',
              score: teamFound?.score ?? 0,
              info: {
                abbreviation: teamFound?.team?.abbreviation ?? '',
                displayName: teamFound?.team?.displayName ?? '',
                color: teamFound?.team?.color ?? '',
                alternativeColor: teamFound?.team?.alternativeColor ?? '',
                logo: teamFound?.team?.logo ?? '',
              },
            },
          };
        }),
      };
      return match;
    });
    return matches;
  }

  compareMatch(oldMatch: Match, newMatch: Match) {
    const oldClock = this.normalizeToNumber((oldMatch as any).status?.clock);
    const newClock = this.normalizeToNumber((newMatch as any).status?.clock);

    if (
      oldClock !== undefined &&
      newClock !== undefined &&
      oldClock === newClock
    ) {
      return;
    }

    const oldLast = oldMatch.match_info.length
      ? oldMatch.match_info[oldMatch.match_info.length - 1]
      : undefined;
    const newLast = newMatch.match_info.length
      ? newMatch.match_info[newMatch.match_info.length - 1]
      : undefined;

    const oldLastTime = oldLast
      ? this.normalizeToNumber((oldLast as any).time)
      : undefined;
    const newLastTime = newLast
      ? this.normalizeToNumber((newLast as any).time)
      : undefined;

    const hasNewEvent =
      (newLastTime !== undefined &&
        oldLastTime !== undefined &&
        newLastTime !== oldLastTime) ||
      newMatch.match_info.length > oldMatch.match_info.length;

    if (hasNewEvent) {
      if (!newLast) return false;
      const eventTeamId = (newLast as any).teamId; // precisa guardar no schema
      const team = newMatch.teams.find((t) => t.id === eventTeamId);

      const eventWithTeam = {
        ...newLast,
        team: {
          id: team?.id ?? '',
          homeAway: team?.homeAway ?? '',
          color: team?.info.color ?? '',
          abbreviation: team?.info.abbreviation ?? '',
        },
      };

      return { event: eventWithTeam };
    }
    return false;
  }

  // Normalize clock/time values (accepts string, number or objects with `value`/`time`)
  private normalizeToNumber(v: any): number | undefined {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = parseInt(v.replace(/[^0-9-]/g, ''), 10);
      return Number.isNaN(n) ? undefined : n;
    }
    if (typeof v === 'object') {
      if ('value' in v) return this.normalizeToNumber(v.value);
      if ('time' in v) return this.normalizeToNumber(v.time);
    }
    return undefined;
  }

  extractMatchFromSummary(data: any): Match {
    const header = data.header;
    const competition = header.competitions[0];
    const competitors = competition.competitors;

    // status vem do competition dentro do header
    const status = competition.status.type;

    // details vem direto no data (não no header)
    const details = data.header.competitions[0].details ?? [];

    return {
      id: header.id,
      uuid: header.id,
      shortName: `${competitors[1].team.abbreviation} @ ${competitors[0].team.abbreviation}`,
      status: {
        clock: String(competition.status.clock ?? 0),
        displayClock: competition.status.displayClock ?? '',
        period: competition.status.period ?? 0,
        type: {
          name: status.name,
          description: status.description,
          shortDetail: status.shortDetail,
        },
      },
      venue: {
        fullName: data.gameInfo?.venue?.fullName ?? '',
        city: data.gameInfo?.venue?.address?.city ?? '',
        country: data.gameInfo?.venue?.address?.country ?? '',
      },
      teams: competitors.map((c: any) => ({
        id: c.team.id,
        name: c.team.displayName,
        homeAway: c.homeAway,
        score: parseInt(c.score ?? '0'),
        info: {
          abbreviation: c.team.abbreviation,
          displayName: c.team.displayName,
          color: c.team.color ?? '',
          alternativeColor: c.team.alternateColor ?? '',
          logo: c.team.logos?.[0]?.href ?? '',
        },
      })),
      match_info: details.map((detail: any) => {
        const teamId = detail.team?.id;
        const team = competitors.find((c: any) => c.team.id === teamId);
        return {
          text: detail.type?.text ?? '',
          time: String(detail.clock?.value ?? 0),
          teamId,
          athletesInvolved: (detail.participants ?? []).map((p: any) => ({
            displayName: p.athlete?.displayName ?? '',
          })),
          type: {
            scoreValue: detail.scoringPlay ? 1 : 0,
            scoringPlay: detail.scoringPlay ?? false,
            redCard: detail.redCard ?? false,
            yellowCard: detail.yellowCard === true,
            penaltyKick: detail.penaltyKick ?? false,
          },
          team: team
            ? {
                id: team.team.id,
                homeAway: team.homeAway,
                score: parseInt(team.score ?? '0'),
                info: {
                  abbreviation: team.team.abbreviation,
                  displayName: team.team.displayName,
                  color: team.team.color ?? '',
                  alternativeColor: team.team.alternateColor ?? '',
                  logo: team.team.logos?.[0]?.href ?? '',
                },
              }
            : undefined,
        };
      }),
    };
  }

  extractRankings(data: any) {
    const children = data.children.map((c: any) => {
      return {
        id: c.id,
        name: c.name,
        teams: c.standings.entries.map((e: any) => {
          const getStat = (name: string) =>
            e.stats.find((s: any) => s.name === name)?.value ?? 0;

          return {
            name: e.team.displayName,
            abbreviation: e.team.abbreviation,
            logo: e.team.logos?.[0]?.href ?? '',
            rank: e.note?.rank ?? 0,
            color: e.note?.color ?? '',
            description: e.note?.description ?? '',
            gamesPlayed: getStat('gamesPlayed'),
            wins: getStat('wins'),
            losses: getStat('losses'),
            draws: getStat('ties'),
            points: getStat('points'),
            goalsFor: getStat('pointsFor'),
            goalsAgainst: getStat('pointsAgainst'),
            goalDifference: getStat('pointDifferential'),
          };
        }),
      };
    });
    return children;
  }
}
