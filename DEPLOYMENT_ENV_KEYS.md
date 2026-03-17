# Deployment Environment Keys (Rotate Later)

Use this document as your hosting checklist for Render/Railway (backend) and Netlify/Vercel (frontend).

Important:
- Do not commit real secret values.
- Use placeholders first, then rotate to fresh production keys.

## Backend (server) required keys

Set these in your backend hosting provider environment settings.

```env
# App
PORT=3001

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional fallback key name used by code
# SUPABASE_SERVICE_KEY=your_service_role_key_here

# Optional (not required when service role key is set)
SUPABASE_ANON_KEY=your_anon_key_here

# Stellar network
STELLAR_NETWORK=TESTNET
HORIZON_URL=https://horizon-testnet.stellar.org

# Escrow wallet (secret)
ESCROW_SECRET=your_escrow_secret_here

# Soroban
SOROBAN_CONTRACT_ID=your_contract_id_here
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Optional fallback key name used by code
# SOROBAN_RPC=https://soroban-testnet.stellar.org
```

## Backend key notes

- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Preferred server key (required for privileged operations).
- `SUPABASE_SERVICE_KEY`: Optional alias supported by code.
- `SUPABASE_ANON_KEY`: Optional if service role key is present.
- `STELLAR_NETWORK`: Use `TESTNET` now, switch to `PUBLIC` for mainnet.
- `HORIZON_URL`: Testnet or mainnet Horizon endpoint.
- `ESCROW_SECRET`: Secret key for escrow account (sensitive).
- `SOROBAN_CONTRACT_ID`: Required for Soroban escrow flow.
- `SOROBAN_RPC_URL` / `SOROBAN_RPC`: Soroban RPC endpoint.

## Frontend (client) keys

Currently, this frontend does not require runtime `.env` keys for API usage because it calls relative `/api/*` routes.

For production, configure a proxy/redirect on your frontend host:

```txt
/api/*  https://your-backend-domain/api/:splat  200
```

## Rotation checklist (do later)

1. Rotate `SUPABASE_SERVICE_ROLE_KEY`.
2. Rotate `SUPABASE_ANON_KEY`.
3. Generate a new `ESCROW_SECRET` and fund that account.
4. Update hosting env vars with rotated values.
5. Redeploy backend.
6. Verify `GET /api/health`.
