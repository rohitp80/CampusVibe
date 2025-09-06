import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAndCreateProfile() {
  const userId = '8316b40d-b133-4f83-a3c0-d015b070d058';
  
  console.log('🔍 Checking profile for user:', userId);
  
  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profileError && profileError.code !== 'PGRST116') {
    console.log('❌ Error checking profile:', profileError);
    return;
  }
  
  if (profile) {
    console.log('✅ Profile exists:', profile);
  } else {
    console.log('❌ No profile found, creating one...');
    
    // Create profile
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: 'karan_dev',
        display_name: 'Karan Developer',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=karan',
        bio: 'Full Stack Developer',
        university: 'Tech University',
        year: 'Final Year',
        location: 'Campus'
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Error creating profile:', createError);
    } else {
      console.log('✅ Profile created:', newProfile);
    }
  }
  
  // Test posts with profile join
  console.log('\n🔍 Testing posts with profile join...');
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      *,
      profiles!user_id(username, display_name, avatar_url)
    `)
    .limit(1);
  
  if (postsError) {
    console.log('❌ Posts query error:', postsError);
  } else {
    console.log('✅ Posts with profiles:', JSON.stringify(posts, null, 2));
  }
}

checkAndCreateProfile().catch(console.error);
