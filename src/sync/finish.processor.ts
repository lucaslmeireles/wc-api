import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MatchesService } from 'src/matches/matches.service';

@Injectable()
@Processor('matches')
export class FinishProcessor extends WorkerHost {
  private readonly logger = new Logger(FinishProcessor.name);

  constructor(private matchesService: MatchesService) {
    super();
  }
  async process(job: Job): Promise<any> {
    