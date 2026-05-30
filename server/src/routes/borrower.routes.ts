import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import {
  submitPersonalDetails,
  uploadDocument,
  submitLoan,
  getMyLoan,
} from '../controllers/borrower.controller';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, and PNG files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(protect, authorize(['borrower']));

router.post('/apply/personal', submitPersonalDetails);
router.post('/apply/upload', upload.single('file'), uploadDocument);
router.post('/apply/loan', submitLoan);
router.get('/loan', getMyLoan);

export default router;
