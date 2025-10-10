# 🚀 SkillLink Africa - Setup Guide for New Computer

This guide will help you set up the complete dual approval payment system on any new computer.

## 📋 Prerequisites

### Required Software:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **Git** - [Download here](https://git-scm.com/)
3. **Code Editor** - VS Code recommended
4. **Web Browser** - Chrome/Firefox with Freighter wallet extension

### Required Accounts:

1. **GitHub Account** - To clone the repository
2. **Supabase Account** - Database service
3. **Stellar Testnet Account** - For testing (we'll create this)

## 🔧 Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/hloni2004/Stellar.git
cd Stellar

# Check you have the dual approval system
git log --oneline -5
# Should show: "🚀 Implement Dual Approval Payment System"
```

## 🗄️ Step 2: Database Setup (Supabase)

### Create New Supabase Project:

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region (recommend closest to you)
4. Wait for database to initialize

### Get Database Credentials:

1. Go to **Settings** → **API**
2. Copy these values:
   - `Project URL`
   - `anon/public key`
   - `service_role key`

### Create Database Tables:

1. Go to **SQL Editor** in Supabase
2. Run this SQL to create all tables:

```sql
-- Users table
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  public_key text,
  full_name text,
  skills text[],
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Jobs table with dual approval columns
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  category text NOT NULL,
  location text NOT NULL,
  worker_public_key text NOT NULL,
  status text DEFAULT 'open'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  user_id uuid,
  employer_public_key text,
  assigned_at timestamp with time zone,
  completed_at timestamp with time zone,
  completion_notes text,
  approved_at timestamp with time zone,
  employer_approved_at timestamp with time zone,
  worker_approved boolean NOT NULL DEFAULT false,
  employer_approved boolean NOT NULL DEFAULT false,
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid,
  client_public_key text NOT NULL,
  worker_public_key text NOT NULL,
  amount numeric NOT NULL,
  transaction_hash text NOT NULL UNIQUE,
  status text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  client_user_id uuid,
  worker_user_id uuid,
  released_at timestamp with time zone,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT payments_client_user_id_fkey FOREIGN KEY (client_user_id) REFERENCES public.users(id),
  CONSTRAINT payments_worker_user_id_fkey FOREIGN KEY (worker_user_id) REFERENCES public.users(id)
);
```

## 🔐 Step 3: Environment Configuration

### Server Environment (.env file):

Create `server/.env` file with these values:

```env
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
STELLAR_NETWORK=TESTNET
HORIZON_URL=https://horizon-testnet.stellar.org
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Generate new escrow account (see Step 4)
ESCROW_SECRET=your_new_escrow_secret_key
```

### Environment variables (server)

After creating `server/.env`, ensure these variables are set (copy from `.env.example`):

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — optional public anon key for client operations
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_KEY` — server-only service role key (preferred on the server)
- `ESCROW_SECRET` — the escrow Stellar account secret used to release payments (server-only)
- `HORIZON_URL` and `STELLAR_NETWORK` — (optional) override Stellar network settings

Security note: Do NOT commit `server/.env` or any secret values to source control. If any keys or the escrow secret were accidentally exposed, rotate them immediately from the Supabase dashboard and generate a new escrow account/secret. Store production secrets in a secure secrets manager provided by your hosting platform.

## 🌟 Step 4: Create New Escrow Account

### Generate Escrow Account:

```bash
# Navigate to server directory
cd server

# Run this Node.js script to generate new account
node -e "
const stellarSdk = require('@stellar/stellar-sdk');
const pair = stellarSdk.Keypair.random();
console.log('🔐 NEW ESCROW ACCOUNT:');
console.log('Public Key:', pair.publicKey());
console.log('Secret Key:', pair.secret());
console.log('⚠️  SAVE THE SECRET KEY SECURELY!');
"
```

### Fund the Escrow Account:

1. Copy the **Public Key** from above
2. Go to: https://laboratory.stellar.org/#account-creator?network=test
3. Paste the public key and click **"Create Account"**
4. This gives the account 10,000 XLM for testing

### Update .env file:

- Add the **Secret Key** to `ESCROW_SECRET` in your `.env` file

## 📦 Step 5: Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

## 🚀 Step 6: Start the Application

### Terminal 1 - Start Server:

```bash
cd server
npm start
```

Should show:

- ✅ SkillLink Africa server running on port 3001
- ✅ Stellar Network: TESTNET
- ✅ Supabase connectivity check OK

### Terminal 2 - Start Client:

```bash
cd client
npm run dev
```

Should show:

- ✅ Local: http://localhost:5173/

## 🔍 Step 7: Verify Setup

### Test the System:

1. **Open browser**: Go to `http://localhost:5173`
2. **Install Freighter**: Browser extension for Stellar wallet
3. **Create test account**: Use Freighter to generate testnet account
4. **Fund test account**: Use Stellar Laboratory friendbot
5. **Test workflow**:
   - Post a job
   - Hire a worker
   - Start job → Complete → Approve → Payment released

### Check Escrow Account:

```bash
cd server
node debug-escrow.js
```

Should show escrow account balance and recent transactions.

## 📁 Required Files Summary

```
skilllink-africa/
├── server/
│   ├── .env                    # ⚠️ CREATE THIS - Database & escrow config
│   ├── package.json            # ✅ Included
│   └── src/                    # ✅ Included - All server code
├── client/
│   ├── package.json            # ✅ Included
│   └── src/                    # ✅ Included - All client code
├── DUAL_APPROVAL_SYSTEM.md     # ✅ Included - System documentation
├── DUAL_APPROVAL_SETUP.md      # ✅ Included - Database setup guide
└── README.md                   # ✅ Included
```

## 🔑 Critical Security Notes

### ⚠️ NEVER COMMIT THESE TO GIT:

- `server/.env` file (contains secret keys)
- Escrow secret key
- Supabase service role key

### ✅ SAFE TO SHARE:

- All source code files
- Public keys
- Supabase project URL
- Supabase anon key

## 🆘 Troubleshooting

### Common Issues:

1. **"Escrow not configured"** → Check ESCROW_SECRET in .env
2. **"Supabase connection failed"** → Verify Supabase credentials
3. **"Account not found"** → Fund escrow account with friendbot
4. **"Module not found"** → Run `npm install` in both directories

### Get Help:

- Check `DUAL_APPROVAL_SYSTEM.md` for complete documentation
- Run debug scripts in `server/` directory
- Check browser console for client errors
- Check terminal output for server errors

## 🎉 Success Indicators

When everything is working:

- ✅ Both servers start without errors
- ✅ Website loads at localhost:5173
- ✅ Can connect Freighter wallet
- ✅ Can post and complete jobs
- ✅ Payments release automatically after dual approval
- ✅ All transactions appear on Stellar testnet

Your dual approval payment system is now ready on the new computer! 🚀
