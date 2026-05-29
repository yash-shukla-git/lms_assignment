import dotenv from 'dotenv';
import connectDB from './config/db';

dotenv.config();

// Placeholder — seed one account per role to be implemented
const seed = async (): Promise<void> => {
  await connectDB();
  console.log('Seed script ready — logic to be implemented');
  process.exit(0);
};

seed();
