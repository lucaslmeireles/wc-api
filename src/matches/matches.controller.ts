//TODO Get All Matches IDs and Teams x Teams names
// Com isso o usuario vai escolher qual partida quer acompanhar
//Isso pode ser tbm uma propria mensagem para o socket com o match_id já embutido
// e o cliente recebe de volta o estado da partida

import { Controller, Get, Injectable, Param } from '@nestjs/common';
import { MatchesService } from './matches.service';
@Injectable()
@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get('/active-and-scheduled')
  async getActiveAndScheduledMatches() {
    return this.matchesService.getActiveAndScheduledMatches();
  }

  @Get('/status/:status')
  async getMatchesByStatus(@Param('status') status: string) {
    return this.matchesService.getMatchesByStatus(status);
  }

  @Get('/rank')
  async getRank() {
    return this.matchesService.getRank();
  }
}
