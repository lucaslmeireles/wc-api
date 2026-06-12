import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesGateway } from './matches.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Match, MatchSchema } from 'src/schemas/match.schema';
import { MatchesRepository } from './matches.repository';
import { MatchesController } from './matches.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Match.name, schema: MatchSchema }]),
  ],
  providers: [MatchesGateway, MatchesService, MatchesRepository],
  exports: [MatchesService, MatchesRepository],
  controllers: [MatchesController],
})
export class MatchesModule {}
