# Supabase Scripts

This directory contains scripts for managing your Supabase project.

## Create Reels Bucket

The `create-reels-bucket.js` script creates the "reels" bucket in Supabase storage, which is required for the reel creation functionality.

### Prerequisites

- Node.js installed
- Supabase service role key (not the anon key)

### How to Run

1. Get your Supabase service role key from the Supabase dashboard:
   - Go to Project Settings > API
   - Copy the "service_role" key (not the anon key)

2. Set the environment variable:
   ```bash
   # On Windows (PowerShell)
   $env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   
   # On Windows (Command Prompt)
   set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # On macOS/Linux
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Run the script:
   ```bash
   node create-reels-bucket.js
   ```

### Troubleshooting

If you encounter any issues:

1. Make sure you're using the service role key, not the anon key
2. Check that your Supabase project is active
3. Verify that you have the necessary permissions in your Supabase project 