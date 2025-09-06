import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tefsuxgslyowilylcqtw.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnN1eGdzbHlvd2lseWxjcXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzExMTExNiwiZXhwIjoyMDcyNjg3MTE2fQ.6v82VuPhy0KU01hom4AesZCx0JPOq_sfTy4icr_2vNg";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentState() {
  try {
    console.log('🔍 Checking current database state...\n');
    
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, display_name, username, email')
      .limit(10);

    if (profilesError) {
      console.error('Profiles error:', profilesError);
    } else {
      console.log(`📋 Found ${profiles?.length || 0} profiles:`);
      profiles?.forEach(profile => {
        console.log(`  - ${profile.id.slice(-8)}: ${profile.full_name || profile.display_name || profile.username || 'No name'} (${profile.email || 'No email'})`);
      });
    }

    // Check communities
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select('id, name, member_count')
      .limit(5);

    if (communitiesError) {
      console.error('Communities error:', communitiesError);
    } else {
      console.log(`\n🏘️  Found ${communities?.length || 0} communities:`);
      communities?.forEach(community => {
        console.log(`  - ${community.name}: ${community.member_count || 0} members`);
      });
    }

    // Check if community_members table exists
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('user_id, role')
      .limit(5);

    if (membersError) {
      console.log('\n❌ Community members table does not exist or has issues:', membersError.message);
    } else {
      console.log(`\n👥 Found ${members?.length || 0} community members`);
    }

    // Check community messages
    const { data: messages, error: messagesError } = await supabase
      .from('community_messages')
      .select('id, username, message, created_at')
      .limit(5)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.log('\n❌ Community messages table does not exist or has issues:', messagesError.message);
    } else {
      console.log(`\n💬 Found ${messages?.length || 0} recent messages:`);
      messages?.forEach(msg => {
        console.log(`  - ${msg.username}: ${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}`);
      });
    }

  } catch (error) {
    console.error('Error checking state:', error);
  }
}

checkCurrentState().then(() => {
  console.log('\n✅ State check completed!');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
