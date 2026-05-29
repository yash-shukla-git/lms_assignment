import { Schema, model, Document } from 'mongoose';

// Placeholder — logic to be implemented
export interface IPayment extends Document {}

const paymentSchema = new Schema({}, { timestamps: true });

export default model<IPayment>('Payment', paymentSchema);
