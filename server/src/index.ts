import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import borrowerRoutes from './routes/borrower.routes';
import dashboardRoutes from './routes/dashboard.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/borrower', borrowerRoutes);
app.use('/api/dashboard', dashboardRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File size must not exceed 5MB.' : err.message;
    res.status(400).json({ message });
    return;
  }
  if (err.message === 'Only PDF, JPG, and PNG files are allowed.') {
    res.status(400).json({ message: err.message });
    return;
  }
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

export default app;
