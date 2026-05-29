import { Schema, model, Document as MongoDocument } from 'mongoose';

// Placeholder — logic to be implemented
export interface IDocument extends MongoDocument {}

const documentSchema = new Schema({}, { timestamps: true });

export default model<IDocument>('Document', documentSchema);
