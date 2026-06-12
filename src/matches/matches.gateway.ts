import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Match, MatchesService } from './matches.service';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { instrument } from '@socket.io/admin-ui';

type MatchEvent = {
  event: {
    text: string;
    time: string;
    athletesInvolved: {
      displayName: string;
    }[];
    type: {
      scoreValue?: number | undefined;
      scoringPlay?: boolean | undefined;
      redCard?: boolean | undefined;
      yellowCard?: boolean | undefined;
      penaltyKick?: boolean | undefined;
    };
    team: {
      id: string;
      homeAway: string;
      color: string;
      abbreviation: string;
    };
  };
};
@Injectable()
@WebSocketGateway({
  namespace: 'match',
  cors: {
    origin: [
      'https://admin.socket.io',
      'http://localhost:3000',
      'http://localhost:1420',
    ],
    credentials: true,
  },
})
export class MatchesGateway implements OnGatewayInit, OnGatewayDisconnect {
  private readonly logger = new Logger(MatchesGateway.name);

  constructor(private matchesService: MatchesService) {}
  @WebSocketServer() server!: Server;

  afterInit() {
    this.logger.log('WebSocket Gateway iniciado na porta 3000/match');
    // TODO: Configurar admin-ui corretamente com a versão compatível
    try {
      instrument(this.server, {
        auth: false,
        mode: 'development',
      });
    } catch (error) {
      this.logger.warn(`Admin UI não disponível: ${(error as Error).message}`);
    }
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    client.emit('connection', { message: 'Bem-vindo ao WC API WebSocket!' });
  }

  @SubscribeMessage('match:enter')
  async handleMatches(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      this.logger.log(
        `Cliente solicitando entrada na partida: ${JSON.stringify(data)}`,
      );
      const match_id = data;
      this.logger.log(`Cliente ${client.id} entrando na partida ${match_id}`);

      const match = await this.matchesService.findMatchById(match_id);
      if (!match) {
        client.emit('error', { message: `Partida ${match_id} não encontrada` });
        return;
      }

      await client.join(`match-${match_id}`);
      client.emit('match:state', { match });
      this.logger.log(`Cliente ${client.id} entrou na sala match-${match_id}`);
    } catch (error) {
      this.logger.error('Erro ao entrar na partida', (error as Error).stack);
      client.emit('error', { message: (error as Error).message });
    }
  }

  handleMatchGoal(event: MatchEvent, match_id: string) {
    this.server.to(`match-${match_id}`).emit('match:goal', { event });
  }

  handleMatchRedCard(event: MatchEvent, match_id: string) {
    this.server.to(`match-${match_id}`).emit('match:red-card', { event });
  }

  handleMatchYellowCard(event: MatchEvent, match_id: string) {
    this.server.to(`match-${match_id}`).emit('match:yellow-card', { event });
  }

  handleMatchPenalty(event: MatchEvent, match_id: string) {
    this.server.to(`match-${match_id}`).emit('match:penalty', { event });
  }
  handleMatchUpdate(event: Match, match_id: string) {
    //TODO manda a partida inteira para o frontend entender onde estamos
    this.server.to(`match-${match_id}`).emit('match:update', { event });
  }

  handleMatchFinished(match: Match) {
    this.server.to(`match-${match.id}`).emit('match:finish', { match });
    this.server.to(`match-${match.id}`).disconnectSockets();
  }

  handleDisconnect(client: any) {
    // Handle client disconnection if needed
  }

  isRoomActive(match_id: string): boolean {
    const room = this.server.sockets.adapter.rooms.get(`match-${match_id}`);
    return room !== undefined && room.size > 0;
  }
}
