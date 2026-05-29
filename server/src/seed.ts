import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db';
import User from './models/User';

dotenv.config();

const seedUsers = [
  { name: 'Admin',        email: 'admin@lms.com',        password: 'Admin@123',    role: 'admin' },
  { name: 'Sales',        email: 'sales@lms.com',        password: 'Sales@123',    role: 'sales' },
  { name: 'Sanction',     email: 'sanction@lms.com',     password: 'Sanction@123', role: 'sanction' },
  { name: 'Disbursement', email: 'disbursement@lms.com', password: 'Disburse@123', role: 'disbursement' },
  { name: 'Collection',   email: 'collection@lms.com',   password: 'Collect@123',  role: 'collection' },
  { name: 'Borrower',     email: 'borrower@lms.com',     password: 'Borrower@123', role: 'borrower' },
] as const;

const seed = async (): Promise<void> => {
  try {
    await connectDB();

    await User.deleteMany({});
    console.log('Cleared existing users.\n');

    for (const userData of seedUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created: ${user.email} (${user.role})`);
    }

    console.log('\n--- Seed credentials ---');
    console.log('Role           | Email                    | Password');
    console.log('---------------|--------------------------|-------------');
    for (const u of seedUsers) {
      console.log(`${u.role.padEnd(14)} | ${u.email.padEnd(24)} | ${u.password}`);
    }
    console.log('------------------------\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
