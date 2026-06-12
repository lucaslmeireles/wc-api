import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MatchDocument = HydratedDocument<Match>;

@Schema({ _id: false })
class StatusType {
  @Prop({ type: String }) name!: string;
  @Prop({ type: String }) description!: string;
  @Prop({ type: String }) shortDetail!: string;
}

@Schema({ _id: false })
class MatchStatus {
  @Prop({ type: String }) clock!: string;
  @Prop({ type: String }) displayClock!: string;
  @Prop({ type: Number }) period!: number;
  @Prop({ type: StatusType }) type!: StatusType;
}

@Schema({ _id: false })
class VenueAddress {
  @Prop({ type: String }) city!: string;
  @Prop({ type: String }) country!: string;
}

@Schema({ _id: false })
class MatchVenue {
  @Prop({ type: String }) fullName!: string;
  @Prop({ type: VenueAddress }) address!: VenueAddress;
}

@Schema({ _id: false })
class TeamInfo {
  @Prop({ type: String }) abbreviation!: string;
  @Prop({ type: String }) displayName!: string;
  @Prop({ type: String }) color!: string;
  @Prop({ type: String }) alternativeColor!: string;
  @Prop({ type: String }) logo!: string;
}

@Schema({ _id: false })
class Competitor {
  @Prop({ type: String, required: true }) id!: string;
  @Prop({ type: String }) name!: string;
  @Prop({ type: String }) homeAway!: string;
  @Prop({ type: Number }) score!: number;
  @Prop({ type: TeamInfo }) info!: TeamInfo;
}

@Schema({ _id: false })
class Athlete {
  @Prop({ type: String }) displayName!: string;
}

@Schema({ _id: false })
class EventDetailType {
  @Prop({ type: Number }) scoreValue?: number;
  @Prop({ type: Boolean }) scoringPlay?: boolean;
  @Prop({ type: Boolean }) redCard?: boolean;
  @Prop({ type: Boolean }) yellowCard?: boolean;
  @Prop({ type: Boolean }) penaltyKick?: boolean;
}

@Schema({ _id: false })
class EventDetail {
  @Prop({ type: String }) text!: string;
  @Prop({ type: String }) time!: string;
  @Prop({ type: [Athlete], default: [] }) athletesInvolved!: Athlete[];
  @Prop({ type: EventDetailType }) type!: EventDetailType;
  @Prop({ type: Competitor }) team!: Competitor;
}

@Schema({ timestamps: true })
export class Match {
  @Prop({ type: String, required: true, unique: true }) id!: string;
  @Prop({ type: String }) uuid?: string;
  @Prop({ type: String, required: true }) shortName!: string;
  @Prop({ type: MatchStatus, required: true }) status!: MatchStatus;
  @Prop({ type: MatchVenue, required: true }) venue!: MatchVenue;
  @Prop({ type: [Competitor], default: [] }) teams!: Competitor[];
  @Prop({ type: [EventDetail], default: [] }) match_info!: EventDetail[];
}

export const MatchSchema = SchemaFactory.createForClass(Match);
