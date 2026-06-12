import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class SyncService implements OnModuleInit {
  constructor(@InjectQueue('matches') private matchesQueue: Queue) {}
  async onModuleInit() {
    console.log('🚀 Inicializando SyncService...');
    await this.matchesQueue.upsertJobScheduler(
      'fetch-matches',
      { every: 1000 * 60 },
      { name: 'fetch-matches' }, // ← nome do job
    );

    await this.matchesQueue.upsertJobScheduler(
      'finish-matches',
      { every: 1000 * 60 * 5 },
      { name: 'finish-matches' }, // ← nome do job
    );
    console.log(
      '✅ Job Scheduler criado: fetch-matches (vai rodar a cada 60 segundos)',
    );
  }
}
//TODO quando não existir nenhum jogo ativo, ele espaça a requisição para 5 minutos, quando tiver um jogo ativo, ele volta para 1 minuto
