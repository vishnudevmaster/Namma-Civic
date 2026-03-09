<div align="center">

# 🏙️ NammaCivic — Bengaluru Civic Issue Portal

**Report. Track. Resolve. Empower your city.**

A full-stack civic complaint management platform built for the citizens of Bengaluru to report infrastructure issues (potholes, garbage, streetlights, water, drainage, traffic, and more), track their status in real time, and engage with the community — all backed by AI-powered assistance.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk&logoColor=white)](https://clerk.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Seeding Sample Data](#-seeding-sample-data)
- [Running Locally](#-running-locally)
- [Deployment (Vercel)](#-deployment-vercel)
- [API Reference](#-api-reference)
- [Admin Access & RBAC](#-admin-access--rbac)
- [License](#-license)

---

## ✨ Features

| Area | Details |
|---|---|
| **Report Issues** | Citizens can submit civic complaints with type, location (Google Maps autocomplete), description (voice-to-text supported), and photo evidence (uploaded to Cloudinary). |
| **Real-Time Tracking** | Each complaint gets a unique ID (`NC-YYYY-NNNNN`) and moves through a status lifecycle: `submitted → under_review → assigned → in_progress → resolved → closed`. |
| **Community Feed** | A public, filterable, sortable feed of all complaints with upvote support. |
| **My Complaints** | Authenticated users can view their own submissions and track progress. |
| **Admin Dashboard** | Protected admin panel with analytics (charts via Recharts), status management, assignment, and admin notes. |
| **AI Chatbot** | Floating chatbot powered by Google Gemini AI for civic-issue guidance and FAQs. |
| **Google Maps** | Places Autocomplete for precise location tagging of complaints. |
| **Authentication** | Clerk-based auth with sign-in/sign-up modals, organization switching, and role-based access control (RBAC). |
| **Responsive Design** | Fully responsive with a mobile bottom navigation bar and glassmorphism-styled header. |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 6** | Build tool & dev server |
| **TailwindCSS 4** | Utility-first CSS |
| **React Router v7** | Client-side routing (SPA) |
| **Clerk React** | Authentication UI components |
| **Recharts** | Analytics charts on admin dashboard |
| **Lucide React** | Icon library |
| **Motion** | Animations & transitions |

### Backend
| Technology | Purpose |
|---|---|
| **Express 4** | REST API server |
| **Supabase** | Managed PostgreSQL database |
| **Clerk SDK (Node)** | Server-side token verification |
| **Cloudinary** | Image upload & CDN storage |
| **Google Gemini AI** | AI chatbot intelligence |
| **Google Maps Places API** | Location autocomplete |

### DevOps / Tooling
| Technology | Purpose |
|---|---|
| **TypeScript 5.8** | Type safety across the stack |
| **tsx** | TypeScript execution for dev server |
| **Vercel** | Production hosting (serverless + static) |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  ┌────────────┐ │
│  │ React 19    │  │ React Router │  │ Clerk     │  │ TailwindCSS│ │
│  │ (SPA)       │  │ (Pages)      │  │ (Auth UI) │  │ (Styling)  │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬─────┘  └────────────┘ │
│         │                │                 │                        │
│         └────────────────┼─────────────────┘                        │
│                          │                                          │
│              ┌───────────▼──────────┐                               │
│              │   REST API Calls     │                               │
│              │ (fetch + Bearer JWT) │                               │
│              └───────────┬──────────┘                               │
└──────────────────────────┼──────────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────────┐
│                     EXPRESS SERVER (API)                             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  /api/       │  │  requireAuth │  │  Cloudinary  │              │
│  │  complaints  │  │  middleware   │  │  upload      │              │
│  │  analytics   │  │  (Clerk JWT) │  │  endpoint    │              │
│  │  upload      │  └──────────────┘  └──────────────┘              │
│  └──────┬───────┘                                                   │
│         │                                                           │
└─────────┼───────────────────────────────────────────────────────────┘
          │
    ┌─────▼─────┐      ┌──────────────┐      ┌──────────────┐
    │ Supabase  │      │  Cloudinary  │      │ Google       │
    │ (Postgres)│      │  (Media CDN) │      │ Gemini AI    │
    └───────────┘      └──────────────┘      └──────────────┘
```

**Request Flow:**
1. User interacts with the **React SPA** in the browser.
2. The SPA makes **REST API calls** to `/api/*` endpoints, attaching Clerk JWTs for authenticated routes.
3. The **Express server** validates tokens via Clerk, queries/writes to **Supabase** (PostgreSQL), and uploads images to **Cloudinary**.
4. Admin-only endpoints (status updates, assignments) are protected by the `requireAuth` middleware.
5. The **Gemini AI** chatbot runs client-side, calling the Gemini API directly for conversational assistance.

---

## 📁 Project Structure

```
namma-bengaluru-civic/
├── api/
│   └── index.ts              # Vercel serverless function entry point
├── src/
│   ├── components/
│   │   ├── Chatbot.tsx        # Floating AI chatbot (Gemini-powered)
│   │   └── PlacesAutocomplete.tsx  # Google Maps location picker
│   ├── pages/
│   │   ├── HomePage.tsx       # Landing page with stats & recent issues
│   │   ├── ReportPage.tsx     # Complaint submission form
│   │   ├── CommunityFeedPage.tsx   # Public feed with filters & upvotes
│   │   ├── MyComplaintsPage.tsx    # User's own complaint tracker
│   │   ├── AdminPage.tsx      # Admin dashboard with analytics
│   │   └── ComplaintDetailPage.tsx # Individual complaint detail view
│   ├── App.tsx                # Root app with routing & navigation
│   ├── main.tsx               # Entry point with ClerkProvider
│   └── index.css              # Global styles
├── server.ts                  # Express API (routes + middleware)
├── dev-server.ts              # Local dev server (Express + Vite HMR)
├── seed.ts                    # Database seed script
├── supabase_schema.sql        # Database schema (PostgreSQL DDL)
├── vite.config.ts             # Vite configuration
├── vercel.json                # Vercel deployment config
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
├── .env.example               # Environment variable template
└── .gitignore
```

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **npm** v9+ (comes with Node.js)
- A **Supabase** account — [Sign up (free)](https://supabase.com)
- A **Clerk** account — [Sign up (free)](https://clerk.com)
- A **Cloudinary** account — [Sign up (free)](https://cloudinary.com)
- A **Google Cloud** project with:
  - **Places API** enabled
  - **Maps JavaScript API** enabled
  - An API key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- (Optional) A **Google Gemini API** key — [Get one from AI Studio](https://aistudio.google.com/apikey)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/namma-bengaluru-civic.git
cd namma-bengaluru-civic
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your actual keys (see [Environment Variables](#-environment-variables) below).

### 4. Set Up the Database

Run the SQL schema in your Supabase project (see [Database Setup](#-database-setup)).

### 5. (Optional) Seed Sample Data

```bash
npx tsx seed.ts
```

### 6. Start the Dev Server

```bash
npm run dev
```

The app will be running at **http://localhost:3000** with hot module replacement.

---

## 🔑 Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Required | Description | Where to Get It |
|---|:---:|---|---|
| `VITE_GEMINI_API_KEY` | ✅ | Google Gemini API key for the AI chatbot | [AI Studio](https://aistudio.google.com/apikey) |
| `VITE_GOOGLE_MAPS_KEY` | ✅ | Google Maps API key (Places + Maps JS APIs enabled) | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk front-end publishable key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | ✅ | Clerk back-end secret key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL | [Supabase Dashboard](https://app.supabase.com) → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key | [Supabase Dashboard](https://app.supabase.com) → Settings → API |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name | [Cloudinary Dashboard](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key | [Cloudinary Dashboard](https://cloudinary.com/console) → Settings |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret | [Cloudinary Dashboard](https://cloudinary.com/console) → Settings |

> **⚠️ Important:** Variables prefixed with `VITE_` are exposed to the client-side bundle. Never put truly secret keys with a `VITE_` prefix.

---

## 🗄 Database Setup

1. Go to your [Supabase Dashboard](https://app.supabase.com).
2. Create a new project (or use an existing one).
3. Open the **SQL Editor** (left sidebar).
4. Paste and run the contents of [`supabase_schema.sql`](supabase_schema.sql):

```sql
CREATE TABLE IF NOT EXISTS complaints (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  complaint_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  location TEXT NOT NULL,
  ward TEXT DEFAULT '',
  description TEXT,
  status TEXT DEFAULT 'submitted',
  photo_url TEXT,
  resolved_photo_url TEXT,
  user_id TEXT,
  reporter_name TEXT DEFAULT 'Anonymous',
  reporter_phone TEXT DEFAULT '',
  reporter_email TEXT DEFAULT '',
  assigned_to TEXT DEFAULT '',
  admin_notes JSONB DEFAULT '[]'::jsonb,
  upvotes INTEGER DEFAULT 0,
  upvoted_by JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

5. Copy your **Project URL** and **anon key** from **Settings → API** into your `.env` file.

---

## 🌱 Seeding Sample Data

To populate the database with 12 realistic Bengaluru-based complaints:

```bash
npx tsx seed.ts
```

This inserts sample complaints across various types (Pothole, Garbage, Streetlight, Water, Drainage, Traffic) from different wards (Indiranagar, Koramangala, Whitefield, Jayanagar, etc.) with varied statuses.

---

## 🖥 Running Locally

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (Express + Vite HMR) on port `3000` |
| `npm run build` | Build the production frontend bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Type-check the project with TypeScript |
| `npm run clean` | Remove the `dist/` build directory |

### How the Dev Server Works

The `npm run dev` command runs `dev-server.ts`, which:
1. Starts the **Express** server with all API routes (`/api/*`).
2. Attaches **Vite's middleware** for SPA hot-module replacement (HMR).
3. Serves everything on `http://localhost:3000`.

This means **both the API and the frontend** run on the same port in development — no CORS issues, no proxy config needed.

---

## 🚢 Deployment (Vercel)

The project is pre-configured for **Vercel** deployment.

### How It Works

The `vercel.json` defines two build targets:

| Build | Source | Runtime | Purpose |
|---|---|---|---|
| Serverless Function | `api/index.ts` | `@vercel/node` | Express API as a serverless function |
| Static Build | `package.json` | `@vercel/static-build` | Vite builds the React SPA to `dist/` |

**Routing rules:**
- `/api/*` → routed to the serverless function
- Everything else → served from `dist/index.html` (SPA fallback)

### Deploy Steps

1. Install the [Vercel CLI](https://vercel.com/docs/cli):
   ```bash
   npm i -g vercel
   ```

2. Link your project:
   ```bash
   vercel link
   ```

3. Add all environment variables in the **Vercel Dashboard** → Project → Settings → Environment Variables.

4. Deploy:
   ```bash
   vercel --prod
   ```

---

## 📡 API Reference

All endpoints are served under `/api`.

### Public Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/complaints` | List complaints (supports `?status=`, `?type=`, `?ward=`, `?user_id=`, `?sort=` query params) |
| `GET` | `/api/complaints/:id` | Get a single complaint by DB ID or complaint_id |
| `POST` | `/api/complaints` | Submit a new complaint |
| `POST` | `/api/complaints/:id/upvote` | Toggle upvote on a complaint |
| `POST` | `/api/upload` | Upload an image to Cloudinary (accepts base64 in body) |
| `GET` | `/api/analytics` | Get aggregated analytics (by type, status, ward) |

### Protected Endpoints (Requires Admin Auth)

| Method | Endpoint | Description |
|---|---|---|
| `PATCH` | `/api/complaints/:id/status` | Update complaint status, assignment, or add admin notes |

> Protected endpoints require a valid **Clerk JWT** in the `Authorization: Bearer <token>` header.

---

## 🔐 Admin Access & RBAC

Admin access is controlled through **Clerk Organizations**:

1. **Create an Organization** in your [Clerk Dashboard](https://dashboard.clerk.com) → Organizations.
2. **Invite yourself** (or other users) to the organization with the **Admin** role.
3. Users with `org:admin` role can access the `/admin` route.

**Alternative (without Organizations):**
Set `role: "admin"` in a user's **Public Metadata** in the Clerk Dashboard → Users → Select User → Public Metadata.

The `ProtectedAdminRoute` component in `App.tsx` checks for either:
- `orgRole === 'org:admin'` (Organization-based RBAC), or
- `user.publicMetadata.role === 'admin'` (User metadata fallback)

---

## 📄 License

This project is licensed under the [Apache-2.0 License](LICENSE).

---

<div align="center">

**Built with ❤️ for Bengaluru**

*NammaCivic — Because every pothole, every broken streetlight, every overflowing drain matters.*

</div>
