import { Schema, model, Document, Types } from 'mongoose';

export interface ILoan extends Document {
  applicationId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  totalPaid: number;
  status: 'pending' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';
  rejectionReason?: string;
  sanctionedAt?: Date;
  disbursedAt?: Date;
  closedAt?: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 50000, max: 500000 },
    tenureDays: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, required: true, default: 12 },
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    totalPaid: { type: Number, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'sanctioned', 'rejected', 'disbursed', 'closed'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    sanctionedAt: { type: Date },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export default model<ILoan>('Loan', loanSchema);
