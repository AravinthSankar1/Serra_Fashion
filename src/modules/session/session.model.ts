import mongoose, { Schema } from 'mongoose';
import { IActiveSession } from './session.interface';

const activeSessionSchema = new Schema<IActiveSession>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
        sessionId: { type: String, required: true, index: true },
        ip: { type: String, required: true },
        userAgent: { type: String, required: true },
        currentPath: { type: String, required: true },
        lastActive: { type: Date, default: Date.now, index: true },
    },
    { timestamps: true }
);

// TTL index to automatically remove inactive sessions after 15 minutes
// MongoDB checks this every minute, so it's not strictly "real-time" but efficient.
activeSessionSchema.index({ lastActive: 1 }, { expireAfterSeconds: 900 });

export const ActiveSession = mongoose.model<IActiveSession>('ActiveSession', activeSessionSchema);
