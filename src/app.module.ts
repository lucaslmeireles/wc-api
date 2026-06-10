import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchesModule } from './matches/matches.module';
import { BullModule } from '@nestjs/bullmq';
import { SyncModule } from './sync/sync.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MatchesModule,
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    MongooseModule.forRoot(
      'mongodb://root:example@localhost:27017/nest?authSource=admin',
    ),
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
