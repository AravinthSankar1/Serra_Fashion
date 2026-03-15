import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
    conversation: Types.ObjectId | string;
    sender: Types.ObjectId | string;
    text: string;
    isRead: boolean;
    createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export const Message = mongoose.model<IMessage>('Message', messageSchema);

export interface IConversation extends Document {
    participants: (Types.ObjectId | string)[];
    lastMessage?: Types.ObjectId | string;
    subject?: string;
    status: 'OPEN' | 'CLOSED';
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
    {
        participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
        subject: { type: String, default: 'General Inquiry' },
        status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    },
    { timestamps: true }
);

// Ensure index for participant lookup
conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
