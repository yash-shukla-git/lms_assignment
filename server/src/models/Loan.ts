import { Schema, model, Document } from 'mongoose';

// Placeholder — logic to be implemented
export interface ILoan extends Document {}

const loanSchema = new Schema({}, { timestamps: true });

export default model<ILoan>('Loan', loanSchema);
