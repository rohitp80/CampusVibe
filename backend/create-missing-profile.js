import { supabase } from './src/lib/supabase.js';

async function createMissingProfile() {
  const userId = '5bf890bc-e38d-42c6-92e4-6428507478ab';
  
  try {
    // Check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (existingProfile) {
      console.log('Profile already exists for user:', userId);
      return;
    }
    
    // Create profile with the data we know
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: 'rohit_verma',
        display_name: 'Rohit Verma',
        avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocI77Yk0lsKaJOEVQ_G0LarzdMcE76TkatpCcIRyM4X03IuVNUS7=s96-c',
        bio: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (createError) {
      console.error('Failed to create profile:', createError);
    } else {
      console.log('Profile created successfully:', newProfile);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createMissingProfile();
