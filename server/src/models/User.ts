import { Schema, model, Document } from 'mongoose';

// Placeholder — logic to be implemented
export interface IUser extends Document {}

const userSchema = new Schema({}, { timestamps: true });

export default model<IUser>('User', userSchema);
