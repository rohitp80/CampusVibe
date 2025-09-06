import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tefsuxgslyowilylcqtw.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnN1eGdzbHlvd2lseWxjcXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzExMTExNiwiZXhwIjoyMDcyNjg3MTE2fQ.6v82VuPhy0KU01hom4AesZCx0JPOq_sfTy4icr_2vNg";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simpleFix() {
  try {
    console.log('🔧 Checking profiles table structure...\n');
    
    // Get existing profiles with current columns
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, email, avatar_url, bio, university')
      .limit(10);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    console.log(`Found ${profiles?.length || 0} profiles:`);
    profiles?.forEach(profile => {
      console.log(`  - ID: ${profile.id.slice(-8)}`);
      console.log(`    Username: ${profile.username || 'None'}`);
      console.log(`    Display Name: ${profile.display_name || 'None'}`);
      console.log(`    Email: ${profile.email || 'None'}`);
      console.log('');
    });

    // Update profiles to have better display names
    console.log('Updating profiles with better display names...\n');
    
    for (const profile of profiles || []) {
      let newDisplayName = profile.display_name;
      
      // If no display name or it's just the username, create a better one
      if (!newDisplayName || newDisplayName === profile.username) {
        if (profile.email) {
          // Extract name from email and make it more readable
          const emailPart = profile.email.split('@')[0];
          newDisplayName = emailPart
            .replace(/[._-]/g, ' ')
            .replace(/\d+/g, '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
          
          if (!newDisplayName || newDisplayName.length < 2) {
            newDisplayName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
          }
        } else {
          newDisplayName = profile.username || `User ${profile.id.slice(-4)}`;
        }
      }

      // Update if different
      if (newDisplayName !== profile.display_name) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ display_name: newDisplayName })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`Error updating profile ${profile.id}:`, updateError);
        } else {
          console.log(`✅ Updated ${profile.id.slice(-8)}: "${profile.display_name || 'None'}" → "${newDisplayName}"`);
        }
      } else {
        console.log(`✓ Profile ${profile.id.slice(-8)} already has good display name: "${newDisplayName}"`);
      }
    }

    // Update community messages
    console.log('\nUpdating community messages...\n');
    
    const { data: messages, error: messagesError } = await supabase
      .from('community_messages')
      .select('id, user_id, username');

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    } else {
      console.log(`Found ${messages?.length || 0} messages`);
      
      for (const message of messages || []) {
        // Get the profile for this user
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', message.user_id)
          .single();

        if (profile) {
          const newUsername = profile.display_name || profile.username || message.username;
          
          if (newUsername !== message.username) {
            const { error: updateError } = await supabase
              .from('community_messages')
              .update({ username: newUsername })
              .eq('id', message.id);

            if (!updateError) {
              console.log(`✅ Updated message: "${message.username}" → "${newUsername}"`);
            }
          }
        }
      }
    }

    console.log('\n✅ Simple fix completed!');
    
  } catch (error) {
    console.error('Error in simple fix:', error);
  }
}

simpleFix().then(() => {
  console.log('\n🎉 Done!');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
