// Script to create the reels bucket in Supabase
const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and service role key
const supabaseUrl = 'https://zmcauzefkluwavznptlh.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  console.error('Please set it with: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createReelsBucket() {
  try {
    console.log('Checking if reels bucket exists...');
    const { data: bucketExists, error: checkError } = await supabase.storage.getBucket('reels');
    
    if (checkError) {
      console.error('Error checking bucket:', checkError);
      return;
    }
    
    if (bucketExists) {
      console.log('Reels bucket already exists!');
      return;
    }
    
    console.log('Creating reels bucket...');
    const { data, error } = await supabase.storage.createBucket('reels', {
      public: true,
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
      return;
    }
    
    console.log('Reels bucket created successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createReelsBucket(); 