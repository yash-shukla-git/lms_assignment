# Loan Management System

A full-stack loan management platform with two distinct interfaces: a self-service Borrower Portal where applicants submit personal details, upload documents, and apply for loans, and an internal Operations Dashboard used by executive roles (sales, sanction, disbursement, collection, and admin) to move applications through the approval lifecycle.

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | Next.js (App Router), TypeScript, Tailwind CSS  |
| Backend    | Node.js, Express.js, TypeScript                 |
| Database   | MongoDB, Mongoose                               |
| Auth       | JWT, bcrypt                                     |
| Validation | Zod                                             |
| Uploads    | Multer                                          |

---

## Prerequisites

- Node.js v18 or above
- MongoDB running locally, or a MongoDB Atlas connection string

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repo-url>
cd loan_management
```

### 2. Server setup

```bash
cd server
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET in .env
npm install
npm run seed        # creates all role accounts
npm run dev         # starts on http://localhost:5001
```

### 3. Client setup

```bash
cd client
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL if your server runs on a different port
npm install
npm run dev         # starts on http://localhost:3000
```

### 4. Open the app

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

### Server — `server/.env`

| Variable     | Description                        |
|--------------|------------------------------------|
| `PORT`       | Port the Express server listens on |
| `MONGO_URI`  | MongoDB connection string          |
| `JWT_SECRET` | Secret key used to sign JWTs       |

### Client — `client/.env.local`

| Variable              | Description                 |
|-----------------------|-----------------------------|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

---

## Login Credentials

Run `npm run seed` in the `server/` directory to create these accounts:

| Role         | Email                  | Password     |
|--------------|------------------------|--------------|
| Admin        | admin@lms.com          | Admin@123    |
| Sales        | sales@lms.com          | Sales@123    |
| Sanction     | sanction@lms.com       | Sanction@123 |
| Disbursement | disbursement@lms.com   | Disburse@123 |
| Collection   | collection@lms.com     | Collect@123  |
| Borrower     | borrower@lms.com       | Borrower@123 |

---

## Loan Flow

```
Borrower applies → pending
    ↓
Sanction executive reviews
    ├── Approves → sanctioned
    └── Rejects  → rejected

         Disbursement executive releases funds → disbursed
              ↓
         Collection executive records payments
              ↓
         totalPaid >= totalRepayment → closed (auto)
```

---

## BRE Eligibility Rules

An application passes the Business Rules Engine only if all four conditions are met:

1. Applicant age must be between **23 and 50 years**
2. Monthly salary must be at least **₹25,000**
3. Employment mode must not be **Unemployed**
4. PAN must match the format **AAAAA9999A** (5 letters, 4 digits, 1 letter)

---

## Interest Calculation

Simple interest is used with a fixed annual rate of 12%:

```
SI = (P × R × T) / (365 × 100)

Where:
  P = Principal (loan amount)
  R = 12 (annual rate, fixed)
  T = Tenure in days

Total Repayment = P + SI
```
