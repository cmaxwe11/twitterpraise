import { Document, Types } from 'mongoose';

export enum EventLogTypeKey {
  PERMISSION = 'PERMISSION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERIOD = 'PERIOD',
  PRAISE = 'PRAISE',
}

export interface EventLog {
  user: Types.ObjectId;
  useraccount: Types.ObjectId;
  type: Types.ObjectId;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventLogDocument extends EventLog, Document {}

export interface EventLogDto {
  user?: string;
  useraccount?: string;
  type: EventLogTypeDto;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventLogType {
  key: string;
  label: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventLogTypeDocument extends EventLogType, Document {}

export interface EventLogTypeDto {
  _id: string;
  label: string;
  description: string;
}
