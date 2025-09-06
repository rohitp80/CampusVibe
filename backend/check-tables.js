import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tefsuxgslyowilylcqtw.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnN1eGdzbHlvd2lseWxjcXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzExMTExNiwiZXhwIjoyMDcyNjg3MTE2fQ.6v82VuPhy0KU01hom4AesZCx0JPOq_sfTy4icr_2vNg";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  try {
    console.log('🔍 Checking table relationships...\n');
    
    // Try different approaches to get community members
    console.log('1. Direct query without join:');
    const { data: members1, error: error1 } = await supabase
      .from('community_members')
      .select('user_id, role, joined_at')
      .limit(3);

    if (error1) {
      console.error('Error:', error1);
    } else {
      console.log('✅ Found', members1?.length || 0, 'members');
      members1?.forEach(m => console.log(`  - ${m.user_id.slice(-8)}: ${m.role}`));
    }

    console.log('\n2. Manual join approach:');
    // Get members first, then profiles separately
    const { data: members2, error: error2 } = await supabase
      .from('community_members')
      .select('user_id, role, joined_at')
      .limit(3);

    if (error2) {
      console.error('Error:', error2);
    } else {
      console.log('✅ Found', members2?.length || 0, 'members');
      
      // Get profiles for these users
      if (members2?.length > 0) {
        const userIds = members2.map(m => m.user_id);
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, username')
          .in('id', userIds);

        if (profileError) {
          console.error('Profile error:', profileError);
        } else {
          console.log('✅ Found', profiles?.length || 0, 'profiles');
          profiles?.forEach(p => console.log(`  - ${p.id.slice(-8)}: ${p.display_name || p.username}`));
        }
      }
    }

    console.log('\n3. Check if foreign key exists:');
    // This is a workaround - we'll manually join the data
    const { data: allMembers, error: allError } = await supabase
      .from('community_members')
      .select('*');

    if (allError) {
      console.error('Error getting all members:', allError);
    } else {
      console.log(`Found ${allMembers?.length || 0} total community members`);
      
      if (allMembers?.length > 0) {
        // Get all unique user IDs
        const uniqueUserIds = [...new Set(allMembers.map(m => m.user_id))];
        console.log(`Unique users: ${uniqueUserIds.length}`);
        
        // Get profiles for all users
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('id, display_name, username')
          .in('id', uniqueUserIds);

        if (allProfilesError) {
          console.error('Error getting profiles:', allProfilesError);
        } else {
          console.log(`Found profiles for ${allProfiles?.length || 0} users`);
          
          // Create a map for easy lookup
          const profileMap = {};
          allProfiles?.forEach(p => {
            profileMap[p.id] = p;
          });
          
          // Show sample joined data
          console.log('\nSample joined data:');
          allMembers.slice(0, 3).forEach(member => {
            const profile = profileMap[member.user_id];
            const displayName = profile?.display_name || profile?.username || `User ${member.user_id.slice(-4)}`;
            console.log(`  - ${member.user_id.slice(-8)}: ${displayName} (${member.role})`);
          });
        }
      }
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables().then(() => {
  console.log('\n✅ Table check completed!');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
