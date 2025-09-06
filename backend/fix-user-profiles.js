import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "https://tefsuxgslyowilylcqtw.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnN1eGdzbHlvd2lseWxjcXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzExMTExNiwiZXhwIjoyMDcyNjg3MTE2fQ.6v82VuPhy0KU01hom4AesZCx0JPOq_sfTy4icr_2vNg";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseServiceKey ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserProfiles() {
  try {
    console.log('🔍 Checking user profiles...');
    
    // Get all community members without proper profiles
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select(`
        user_id,
        profiles:user_id (
          id,
          full_name,
          display_name,
          username
        )
      `);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return;
    }

    console.log(`Found ${members?.length || 0} community members`);

    // Find members without profiles or with incomplete profiles
    const membersNeedingFix = members?.filter(member => 
      !member.profiles || 
      (!member.profiles.full_name && !member.profiles.display_name && !member.profiles.username)
    ) || [];

    console.log(`${membersNeedingFix.length} members need profile fixes`);

    // Fix each member's profile
    for (const member of membersNeedingFix) {
      try {
        console.log(`Fixing profile for user: ${member.user_id}`);
        
        // Try to get user info from auth
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(member.user_id);
        
        let displayName = `User ${member.user_id.slice(-4)}`;
        let username = `user_${member.user_id.slice(-8)}`;
        
        if (user && !userError) {
          // Extract name from user metadata or email
          displayName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.user_metadata?.display_name ||
                       user.email?.split('@')[0] || 
                       displayName;
          
          username = user.user_metadata?.username ||
                    user.user_metadata?.preferred_username ||
                    user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '_') ||
                    username;
        }

        // Upsert the profile
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: member.user_id,
            full_name: displayName,
            display_name: displayName,
            username: username,
            email: user?.email || null,
            avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          console.error(`Error updating profile for ${member.user_id}:`, upsertError);
        } else {
          console.log(`✅ Fixed profile for ${member.user_id}: ${displayName}`);
        }
      } catch (error) {
        console.error(`Error processing member ${member.user_id}:`, error);
      }
    }

    // Also check for any existing messages with generic usernames
    console.log('\n🔍 Checking community messages...');
    
    const { data: messages, error: messagesError } = await supabase
      .from('community_messages')
      .select('id, user_id, username')
      .like('username', 'User %');

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    } else {
      console.log(`Found ${messages?.length || 0} messages with generic usernames`);
      
      // Update messages with proper usernames
      for (const message of messages || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, display_name, username')
          .eq('id', message.user_id)
          .single();

        if (profile) {
          const properUsername = profile.full_name || profile.display_name || profile.username || message.username;
          
          const { error: updateError } = await supabase
            .from('community_messages')
            .update({ username: properUsername })
            .eq('id', message.id);

          if (!updateError) {
            console.log(`✅ Updated message ${message.id}: ${message.username} → ${properUsername}`);
          }
        }
      }
    }

    console.log('\n✅ Profile fix completed!');
    
  } catch (error) {
    console.error('Error fixing profiles:', error);
  }
}

// Run the fix
fixUserProfiles().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
