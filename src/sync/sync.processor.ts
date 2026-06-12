import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MatchesGateway } from 'src/matches/matches.gateway';
import { Match, MatchesService } from 'src/matches/matches.service';

@Injectable()
@Processor('matches')
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private matchesService: MatchesService,
    private gateway: MatchesGateway,
  ) {
    super();
  }
  async process(job: Job): Promise<any> {
    switch (job.name) {
      case 'fetch-matches':
        return this.handleFetchMatches(job);
      case 'finish-matches':
        return this.handleFinishMatch(job);
      default:
        this.logger.warn(`Job desconhecido: ${job.name}`);
    }
  }

  private async handleFetchMatches(job: Job): Promise<void> {
    this.logger.log(
      `Processing job: ${job.name} at ${new Date().toISOString()}`,
    );
    try {
      const matches = await this.matchesService.getMatches(
        new Date().toISOString(),
      );
      this.logger.log(`Fetched ${matches.length} matches from API`);
      for (const match of matches) {
        const existingMatch = await this.matchesService.findMatchById(match.id);
        if (existingMatch) {
          this.logger.log(
            `Updating match ${match.id}: ${match.teams[0].name} vs ${match.teams[1].name}`,
          );
          const newEvent = this.matchesService.compareMatch(
            existingMatch.toObject<Match>(),
            match,
          );
          const isFinished = match.status.type.name === 'STATUS_FULL_TIME';
          if (isFinished) {
            this.gateway.handleMatchFinished(match);
          }
          if (newEvent) {
            console.log(
              `New event detected in match ${match.id}: ${newEvent.event?.text} at ${newEvent.event?.time} for team ${newEvent.event?.team?.abbreviation}`,
            );
            switch (newEvent.event?.text.toLowerCase()) {
              case 'goal':
                this.gateway.handleMatchGoal(newEvent, match.id);
                break;
              case 'red card':
                this.gateway.handleMatchRedCard(newEvent, match.id);
                break;
              case 'yellow card':
                this.gateway.handleMatchYellowCard(newEvent, match.id);
                break;
              case 'penalty - scored':
                this.gateway.handleMatchPenalty(newEvent, match.id);
                break;
              default:
                this.gateway.handleMatchUpdate(match, match.id);
            }
          }
          await this.matchesService.updateMatch(match.id, match);
          this.gateway.handleMatchUpdate(match, match.id);
        } else {
          this.logger.log(
            `Creating new match ${match.id}: ${match.teams[0].name} vs ${match.teams[1].name}`,
          );
          const created = await this.matchesService.createMatch(match);
          this.logger.log(`Match created with ID: ${created.id}`);
        }
      }
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Error processing job', stack);
      throw error;
    }
  }
  private async handleFinishMatch(job: Job): Promise<void> {
    this.logger.log(
      `Processing job: ${job.name} at ${new Date().toISOString()}`,
    );
    try {
      const matches = await this.matchesService.getActiveAndScheduledMatches();
      this.logger.log(
        `Fetched ${matches.length} ACTIVE and SCHEDULED matches from database`,
      );
      for (const match of matches) {
        const existingMatch = await this.matchesService.findMatchById(match.id);
        if (!existingMatch) continue;

        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const isStale = existingMatch.updatedAt < twoHoursAgo;

        if (isStale) {
          this.logger.log(`Match ${match.id} is stale, fetching from API...`);

          const freshMatch = await this.matchesService.fetchMatchById(match.id);

          if (freshMatch) {
            await this.matchesService.updateMatch(match.id, freshMatch);
            this.logger.log(`Match ${match.id} recovered from API`);
          } else {
            await this.matchesService.updateMatch(match.id, {
              ...existingMatch.toObject(),
              status: {
                ...existingMatch.status,
                type: {
                  ...existingMatch.status.type,
                  name: 'STATUS_FULL_TIME',
                },
              },
            });
          }
        }
      }
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Error processing job', stack);
      throw error;
    }
  }
}
