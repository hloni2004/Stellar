# Dual Approval System - Additional Database Columns

## Add to Jobs Table:

You need to add these 2 additional columns to your jobs table in Supabase:

### Column 1: worker_approved
- **Name**: `worker_approved`
- **Type**: `boolean`
- **Default value**: `false`
- **Is nullable**: ❌ No
- **Description**: Tracks if worker has approved/completed their work

### Column 2: employer_approved_at
- **Name**: `employer_approved_at`
- **Type**: `timestamptz`
- **Default value**: (leave empty)
- **Is nullable**: ✅ Yes
- **Description**: When employer approved service receipt

### Column 3: employer_approved
- **Name**: `employer_approved`
- **Type**: `boolean`
- **Default value**: `false`
- **Is nullable**: ❌ No
- **Description**: Tracks if employer confirmed service receipt

## Manual Steps:

1. Go to Supabase Dashboard → Table Editor → jobs table
2. Click "+ New Column" for each column above
3. Set the exact specifications as listed
4. Save changes

## Updated Job Statuses:

- **open**: Job posted, available for workers
- **paid**: Payment made to escrow, ready to start
- **in_progress**: Worker assigned and working
- **completed**: Worker finished AND approved their work (worker_approved=true)
- **approved**: BOTH worker AND employer approved, payment released

## Dual Approval Flow:

1. Worker completes job → `worker_approved=true`, `status='completed'`
2. Employer confirms service → `employer_approved=true`, `employer_approved_at=now()`
3. Both approved → `status='approved'`, payment released automatically