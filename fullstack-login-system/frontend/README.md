# Frontend – Next.js

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** – strict mode
- **TailwindCSS** – modern UI styling
- **React Hook Form** – form management
- **Zod** – runtime schema validation
- **Zustand** – lightweight state management with persistence
- **ESLint + Prettier** – linting and formatting

---

## Prerequisites

- Node.js 18+
- npm or yarn

---

## Installation

```bash
cd frontend

# Install dependencies
npm install
```

---

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Run Dev Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

---

## Key Features

- **Authentication Store**: Uses Zustand with `localStorage` persistence.
- **Form Validation**: Zod-powered validation with clear error messages.
- **Protected Routes**: Automatic redirection from `/dashboard` if not logged in.
- **Premium UI**: Dark mode themed layout using TailwindCSS.

---

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/       # Protected area
│   │   ├── login/           # Authentication page
│   │   ├── globals.css      # Tailwind directives
│   │   └── layout.tsx       # Root layout & Metadata
│   ├── hooks/
│   │   ├── useAuth.ts       # Identity & Logout logic
│   │   └── useLogin.ts      # Authentication flow logic
│   ├── lib/
│   │   └── zod-schemas.ts   # Validation & Shared types
│   ├── store/
│   │   └── authStore.ts     # Global state (Zustand)
│   └── middleware.ts        # Next.js route protection
├── .eslintrc.json           # Linting rules
├── .prettierrc              # Formatter rules
├── tailwind.config.ts       # Styles config
└── tsconfig.json            # TypeScript settings
```
