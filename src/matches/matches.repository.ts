import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { Match } from '../schemas/match.schema';

export type MatchDocument = HydratedDocument<Match> & {
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class MatchesRepository {
  constructor(@InjectModel(Match.name) private matchModel: Model<Match>) {}

  async create(dto) {
    try {
      const createdMatch = new this.matchModel(dto);
      const saved = await createdMatch.save();
      console.log('✅ Match salvo com sucesso! _id:', saved._id);

      return saved;
    } catch (error) {
      console.error('❌ Erro ao salvar Match:', error.message);
      throw error;
    }
  }

  async update(id: string, dto) {
    return this.matchModel.findOneAndUpdate({ id: id }, dto, {
      returnDocument: 'after',
    });
  }

  async findById(id: string): Promise<MatchDocument | null> {
    return this.matchModel.findOne({ id: id });
  }

  async getActiveAndScheduledMatches(): Promise<Match[]> {
    return this.matchModel
      .find({ 'status.type.name': { $ne: 'STATUS_FULL_TIME' } })
      .lean()
      .exec();
  }

  async getMatchesByStatus(status: string): Promise<Match[]> {
    return this.matchModel.find({ 'status.type.name': status }).lean().exec();
  }
}
