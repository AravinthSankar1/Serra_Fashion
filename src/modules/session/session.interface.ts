import { Document, Types } from 'mongoose';

export interface IActiveSession extends Document {
    userId?: Types.ObjectId;
    sessionId: string; // Browser unique ID/Token
    ip: string;
    userAgent: string;
    currentPath: string;
    lastActive: Date;
    createdAt: Date;
    updatedAt: Date;
}
