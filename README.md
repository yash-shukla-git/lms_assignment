# Loan Management System

A full-stack loan management platform with two distinct interfaces: a self-service
Borrower Portal where applicants submit personal details, upload documents, and
apply for loans, and an internal Operations Dashboard used by executive roles
(Sales, Sanction, Disbursement, Collection, and Admin) to move applications through
the approval lifecycle.

---

## Demo

Live Site: https://lms-assignment-swart.vercel.app

Video Walkthrough: https://youtu.be/UfllJw7Y1Kw

---

## Tech Stack

| Layer      | Technology                                     |
|------------|------------------------------------------------|
| Frontend   | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend    | Node.js, Express.js, TypeScript                |
| Database   | MongoDB, Mongoose                              |
| Auth       | JWT, bcrypt                                    |
| Validation | Zod                                            |
| Uploads    | Multer                                         |

---

## Prerequisites

- Node.js v18 or above
- A MongoDB Atlas connection string

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yash-shukla-git/lms_assignment.git
cd lms_assignment
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
# Set NEXT_PUBLIC_API_URL to your backend URL
npm install
npm run dev         # starts on http://localhost:3000
```

### 4. Open the app

Visit http://localhost:3000 in your browser.

---

## Environment Variables

### Server — server/.env

| Variable     | Description                        |
|--------------|------------------------------------|
| PORT         | Port the Express server listens on |
| MONGO_URI    | MongoDB Atlas connection string    |
| JWT_SECRET   | Secret key used to sign JWTs       |

### Client — client/.env.local

| Variable              | Description                 |
|-----------------------|-----------------------------|
| NEXT_PUBLIC_API_URL   | Base URL of the backend API |

---

## Login Credentials

Run npm run seed in the server/ directory to create these accounts:

| Role         | Email                  | Password     |
|--------------|------------------------|--------------|
| Admin        | admin@lms.com          | Admin@123    |
| Sales        | sales@lms.com          | Sales@123    |
| Sanction     | sanction@lms.com       | Sanction@123 |
| Disbursement | disbursement@lms.com   | Disburse@123 |
| Collection   | collection@lms.com     | Collect@123  |
| Borrower     | borrower@lms.com       | Borrower@123 |

---

## Project Architecture

```
lms_assignment/
├── client/                        # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── (auth)/            # Login and register pages
│       │   ├── apply/             # Borrower multi-step flow
│       │   └── dashboard/         # Operations dashboard (all 4 modules)
│       ├── components/            # Reusable UI components
│       ├── lib/                   # Axios instance, interest utility
│       ├── hooks/                 # useAuth hook
│       ├── middleware.ts          # Route protection and role-based redirects
│       └── types/                 # Shared TypeScript interfaces
│
└── server/                        # Express backend
    └── src/
        ├── config/                # MongoDB connection
        ├── controllers/           # Route handlers and business logic
        ├── middleware/            # JWT auth and RBAC middleware
        ├── models/                # Mongoose schemas
        ├── routes/                # Express routers
        ├── utils/                 # BRE and interest calculation
        └── seed.ts                # Seeds one account per role
```

### Key Design Decisions

- Roles are stored on the User model and enforced on every protected API route
  via RBAC middleware. Hiding UI elements alone is not relied upon.
- BRE runs on the server to prevent client-side bypass.
- Loan status transitions are strictly enforced in controllers:
  pending → sanctioned/rejected → disbursed → closed
- Interest formula: SI = (P × R × T) / (365 × 100) at fixed 12% p.a.
- Loan auto-closes when totalPaid >= totalRepayment after a payment is recorded.
- UTR uniqueness is enforced at both the schema level and in the controller.

---

## Loan Flow

```
Borrower applies → pending
    ↓
Sanction executive reviews
    ├── Approves → sanctioned
    └── Rejects  → rejected (borrower can reapply)

Disbursement executive releases funds → disbursed
    ↓
Collection executive records payments
    ↓
totalPaid >= totalRepayment → closed (auto)
```

Borrower can apply for a new loan after a closed or rejected loan.

---

## BRE Eligibility Rules

An application passes only if all four conditions are met:

1. Age must be between 23 and 50 years
2. Monthly salary must be at least 25,000
3. Employment mode must not be Unemployed
4. PAN must match the format AAAAA9999A (5 letters, 4 digits, 1 letter)

---

## Interest Calculation

```
SI = (P × R × T) / (365 × 100)

Where:
  P = Principal (loan amount)
  R = 12 (annual rate, fixed)
  T = Tenure in days

Total Repayment = P + SI
```
