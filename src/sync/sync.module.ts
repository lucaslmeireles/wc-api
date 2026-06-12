import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { BullModule } from '@nestjs/bullmq';
import { SyncProcessor } from './sync.processor';
import { MatchesModule } from 'src/matches/matches.module';
import { MatchesGateway } from 'src/matches/matches.gateway';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'matches',
    }),
    MatchesModule,
  ],
  providers: [SyncService, SyncProcessor, MatchesGateway],
})
export class SyncModule {}
