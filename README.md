# Loan Management System (LMS)

A full-stack loan management platform with a borrower-facing portal and an internal operations dashboard.

---

## Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | Next.js 15, TypeScript, Tailwind CSS, Axios   |
| Backend   | Node.js, Express, TypeScript                  |
| Database  | MongoDB (Mongoose)                            |
| Auth      | JSON Web Tokens (JWT), bcryptjs               |
| Validation| Zod                                           |
| Uploads   | Multer                                        |

---

## Project Structure

```
lms/
├── client/   # Next.js frontend
└── server/   # Express backend
```

---

## Setup

### Prerequisites

- Node.js >= 18
- MongoDB running locally (or a MongoDB Atlas URI)

### Server

```bash
cd server
cp .env.example .env
# Edit .env and set MONGO_URI, JWT_SECRET, PORT
npm install
npm run dev
```

### Client

```bash
cd client
cp .env.local.example .env.local
# Edit .env.local if needed
npm install
npm run dev
```

The client runs on `http://localhost:3000` and the server on `http://localhost:5000`.

---

## Seed Script

To create one default account per role:

```bash
cd server
npm run seed
```

---

## Login Credentials

> To be filled in after seed script is implemented.

| Role         | Email | Password |
|--------------|-------|----------|
| Borrower     | —     | —        |
| Sales        | —     | —        |
| Sanction     | —     | —        |
| Disbursement | —     | —        |
| Collection   | —     | —        |
