import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tefsuxgslyowilylcqtw.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZnN1eGdzbHlvd2lseWxjcXR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzExMTExNiwiZXhwIjoyMDcyNjg3MTE2fQ.6v82VuPhy0KU01hom4AesZCx0JPOq_sfTy4icr_2vNg";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabase() {
  try {
    console.log('🔧 Fixing database schema and data...\n');
    
    // 1. Add full_name column to profiles table
    console.log('1. Adding full_name column to profiles table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;'
    });
    
    if (alterError) {
      console.error('Error adding column:', alterError);
    } else {
      console.log('✅ Added full_name column');
    }

    // 2. Update existing profiles to have proper names
    console.log('\n2. Updating existing profiles...');
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, full_name, email');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    console.log(`Found ${profiles?.length || 0} profiles to update`);

    // Update each profile
    for (const profile of profiles || []) {
      let displayName = profile.display_name || profile.username;
      
      // If no display name, try to create a better one from username or email
      if (!displayName || displayName === profile.username) {
        if (profile.email) {
          // Extract name from email
          const emailPart = profile.email.split('@')[0];
          // Convert something like "john.doe" or "johndoe123" to "John Doe"
          displayName = emailPart
            .replace(/[._-]/g, ' ')
            .replace(/\d+/g, '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
          
          if (!displayName) {
            displayName = emailPart;
          }
        } else {
          displayName = profile.username || `User ${profile.id.slice(-4)}`;
        }
      }

      // Update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: displayName,
          display_name: displayName
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`Error updating profile ${profile.id}:`, updateError);
      } else {
        console.log(`✅ Updated ${profile.id.slice(-8)}: ${profile.username} → ${displayName}`);
      }
    }

    // 3. Update existing community messages to use better usernames
    console.log('\n3. Updating community messages...');
    
    const { data: messages, error: messagesError } = await supabase
      .from('community_messages')
      .select('id, user_id, username');

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    } else {
      console.log(`Found ${messages?.length || 0} messages to potentially update`);
      
      for (const message of messages || []) {
        // Get the updated profile for this user
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, display_name, username')
          .eq('id', message.user_id)
          .single();

        if (profile) {
          const newUsername = profile.full_name || profile.display_name || profile.username || message.username;
          
          if (newUsername !== message.username) {
            const { error: updateError } = await supabase
              .from('community_messages')
              .update({ username: newUsername })
              .eq('id', message.id);

            if (!updateError) {
              console.log(`✅ Updated message: ${message.username} → ${newUsername}`);
            }
          }
        }
      }
    }

    console.log('\n✅ Database fix completed!');
    
  } catch (error) {
    console.error('Error fixing database:', error);
  }
}

fixDatabase().then(() => {
  console.log('\n🎉 All done!');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
