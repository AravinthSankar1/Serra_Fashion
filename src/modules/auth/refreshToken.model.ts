import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
    user: mongoose.Types.ObjectId;
    token: string;
    expires: Date;
    created: Date;
    createdByIp: string;
    revoked?: Date;
    revokedByIp?: string;
    replacedByToken?: string;
    isExpired: boolean;
    isActive: boolean;
}

const schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    expires: { type: Date, required: true },
    created: { type: Date, default: Date.now },
    createdByIp: { type: String, required: true },
    revoked: { type: Date },
    revokedByIp: { type: String },
    replacedByToken: { type: String },
});

schema.virtual('isExpired').get(function (this: IRefreshToken) {
    return Date.now() >= this.expires.getTime();
});

schema.virtual('isActive').get(function (this: IRefreshToken) {
    return !this.revoked && !this.isExpired;
});

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', schema);
