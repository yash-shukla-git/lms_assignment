import { Schema, model, Document as MongoDocument, Types } from 'mongoose';

export interface IDocument extends MongoDocument {
  applicationId: Types.ObjectId;
  filePath: string;
  fileType: string;
}

const documentSchema = new Schema<IDocument>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<IDocument>('Document', documentSchema);
