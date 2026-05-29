import { Schema, model, Document, Types } from 'mongoose';

export interface IApplication extends Document {
  userId: Types.ObjectId;
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: 'Salaried' | 'Self-Employed' | 'Unemployed';
  breStatus: 'passed' | 'failed';
  breRejectionReason?: string;
}

const applicationSchema = new Schema<IApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true },
    pan: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: {
      type: String,
      required: true,
      enum: ['Salaried', 'Self-Employed', 'Unemployed'],
    },
    breStatus: { type: String, required: true, enum: ['passed', 'failed'], default: 'failed' },
    breRejectionReason: { type: String },
  },
  { timestamps: true }
);

export default model<IApplication>('Application', applicationSchema);
