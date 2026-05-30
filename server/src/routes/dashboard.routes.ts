import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import {
  getLeads,
  getPendingLoans,
  approveLoan,
  rejectLoan,
  getSanctionedLoans,
  disburseLoan,
  getDisbursedLoans,
  recordPayment,
  getLoanPayments,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(protect);

// Sales
router.get('/sales/leads', authorize(['sales', 'admin']), getLeads);

// Sanction
router.get('/sanction/applications', authorize(['sanction', 'admin']), getPendingLoans);
router.patch('/sanction/applications/:loanId/approve', authorize(['sanction', 'admin']), approveLoan);
router.patch('/sanction/applications/:loanId/reject', authorize(['sanction', 'admin']), rejectLoan);

// Disbursement
router.get('/disbursement/loans', authorize(['disbursement', 'admin']), getSanctionedLoans);
router.patch('/disbursement/loans/:loanId/disburse', authorize(['disbursement', 'admin']), disburseLoan);

// Collection
router.get('/collection/loans', authorize(['collection', 'admin']), getDisbursedLoans);
router.post('/collection/loans/:loanId/payment', authorize(['collection', 'admin']), recordPayment);
router.get('/collection/loans/:loanId/payments', authorize(['collection', 'admin']), getLoanPayments);

export default router;
