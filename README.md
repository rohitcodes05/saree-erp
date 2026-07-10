# Saree ERP

A comprehensive Enterprise Resource Planning (ERP) web application tailored specifically for saree retail and wholesale businesses. It features an aesthetic and dynamic UI designed for performance and ease of use, with real-time inventory management, POS billing, user access controls, and detailed analytics.

## Tech Stack
- **Frontend:** React (Vite)
- **Styling:** Vanilla CSS (with modern aesthetics, glassmorphism, and custom theming)
- **Icons:** Lucide React
- **Forms & Validation:** React Hook Form, Zod
- **Backend/Database:** Supabase (PostgreSQL, Authentication, Row-Level Security)
- **Routing:** React Router

## Setup Instructions

Follow these steps to run the project locally:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy the provided `.env.example` file to create a new `.env` file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your Supabase project details (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

3. **Database Migrations**
   Go to your Supabase Project Dashboard → **SQL Editor**.
   Run the SQL migration files located in the `supabase/migrations/` folder in numerical order (e.g., `001_initial_schema.sql`, `002_rls_policies.sql`, etc.) to setup your database schema, triggers, and RPC functions.

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The app will start on `http://localhost:5173` (or another port if 5173 is occupied).

## Access and Roles
The system supports multiple roles including Super Admin, Shop Manager, and Cashier. Each role has specific Row-Level Security (RLS) policies applied at the database level ensuring robust data isolation and security.
