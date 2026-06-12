import { Test, TestingModule } from '@nestjs/testing';
import { MatchesGateway } from './matches.gateway';
import { MatchesService } from './matches.service';

describe('MatchesGateway', () => {
  let gateway: MatchesGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchesGateway, MatchesService],
    }).compile();

    gateway = module.get<MatchesGateway>(MatchesGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
