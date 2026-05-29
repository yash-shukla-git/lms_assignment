import { Schema, model, Document } from 'mongoose';

// Placeholder — logic to be implemented
export interface IApplication extends Document {}

const applicationSchema = new Schema({}, { timestamps: true });

export default model<IApplication>('Application', applicationSchema);
