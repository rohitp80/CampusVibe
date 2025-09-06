import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tefsuxgslyowilylcqtw.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnN1eGdzbHlvd2lseWxjcXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzExMTExNiwiZXhwIjoyMDcyNjg3MTE2fQ.6v82VuPhy0KU01hom4AesZCx0JPOq_sfTy4icr_2vNg";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addForeignKey() {
  try {
    console.log('🔧 Adding foreign key relationships...\n');
    
    // Add foreign key constraint for user_id -> profiles(id)
    console.log('1. Adding foreign key: community_members.user_id -> profiles.id');
    const { error: fkError1 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE community_members 
        DROP CONSTRAINT IF EXISTS fk_community_members_user_id;
        
        ALTER TABLE community_members 
        ADD CONSTRAINT fk_community_members_user_id 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
      `
    });
    
    if (fkError1) {
      console.log('Note: exec_sql not available, trying direct SQL execution...');
      
      // Try alternative approach using raw SQL
      const { error: altError1 } = await supabase
        .from('community_members')
        .select('count')
        .limit(0); // This will fail but might trigger schema refresh
        
      console.log('Foreign key constraint needs to be added manually in Supabase dashboard');
    } else {
      console.log('✅ Added foreign key constraint for user_id');
    }

    // Add foreign key constraint for community_id -> communities(id)
    console.log('2. Adding foreign key: community_members.community_id -> communities.id');
    const { error: fkError2 } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE community_members 
        DROP CONSTRAINT IF EXISTS fk_community_members_community_id;
        
        ALTER TABLE community_members 
        ADD CONSTRAINT fk_community_members_community_id 
        FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
      `
    });
    
    if (fkError2) {
      console.log('Foreign key constraint needs to be added manually in Supabase dashboard');
    } else {
      console.log('✅ Added foreign key constraint for community_id');
    }

    // Test the relationship after adding constraints
    console.log('\n3. Testing the relationship...');
    const { data: testData, error: testError } = await supabase
      .from('community_members')
      .select(`
        user_id,
        role,
        profiles:user_id (
          display_name,
          username
        )
      `)
      .limit(1);

    if (testError) {
      console.log('❌ Relationship test failed:', testError.message);
      console.log('\nManual steps needed:');
      console.log('1. Go to Supabase Dashboard > Database > Tables');
      console.log('2. Select community_members table');
      console.log('3. Go to "Foreign Keys" tab');
      console.log('4. Add foreign key: user_id -> profiles.id');
      console.log('5. Add foreign key: community_id -> communities.id');
    } else {
      console.log('✅ Relationship working! Sample data:');
      console.log(JSON.stringify(testData, null, 2));
    }

  } catch (error) {
    console.error('Error adding foreign keys:', error);
  }
}

addForeignKey().then(() => {
  console.log('\n🎉 Foreign key setup completed!');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
