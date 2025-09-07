import { supabase } from './src/lib/supabase.js';

async function setupChatStorage() {
  try {
    console.log('Setting up chat attachments storage bucket...');

    // Create the bucket
    const { data: bucket, error: bucketError } = await supabase.storage
      .createBucket('chat-attachments', {
        public: true,
        allowedMimeTypes: [
          'image/*',
          'video/*',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain'
        ],
        fileSizeLimit: 10485760 // 10MB
      });

    if (bucketError && bucketError.message !== 'Bucket already exists') {
      console.error('Error creating bucket:', bucketError);
      return;
    }

    console.log('✅ Chat attachments bucket created/verified');

    // Test bucket access
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const chatBucket = buckets.find(b => b.name === 'chat-attachments');
    if (chatBucket) {
      console.log('✅ Chat attachments bucket is accessible');
      console.log('Bucket details:', {
        name: chatBucket.name,
        public: chatBucket.public,
        created_at: chatBucket.created_at
      });
    }

    // Test upload (create a small test file)
    const testContent = 'Test file for chat attachments';
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload('test/test.txt', testBlob);

    if (uploadError) {
      console.error('Error testing upload:', uploadError);
    } else {
      console.log('✅ Test upload successful');
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl('test/test.txt');
      
      console.log('✅ Public URL generated:', publicUrl);
      
      // Clean up test file
      await supabase.storage
        .from('chat-attachments')
        .remove(['test/test.txt']);
      
      console.log('✅ Test file cleaned up');
    }

    console.log('🎉 Chat storage setup complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupChatStorage();
