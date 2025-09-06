import { supabase } from '../src/lib/supabase.js'

console.log('🔧 Fixing Sample Data Issue\n')

async function insertSampleCommunities() {
  try {
    console.log('Checking existing communities...')
    const { data: existing, error: checkError } = await supabase
      .from('communities')
      .select('count')

    if (checkError) {
      throw new Error(`Check failed: ${checkError.message}`)
    }

    console.log(`Found ${existing?.length || 0} existing communities`)

    if (!existing || existing.length === 0) {
      console.log('Inserting sample communities...')
      
      const sampleCommunities = [
        {
          name: 'CodeCoffee',
          description: 'Developers sharing code snippets and programming tips',
          category: 'Technology',
          color: '#8B5CF6',
          trending: true,
          tags: ['coding', 'programming', 'tech']
        },
        {
          name: 'StudyBuddies',
          description: 'Find study partners and share study materials',
          category: 'Academic',
          color: '#3B82F6',
          trending: true,
          tags: ['study', 'academic', 'learning']
        },
        {
          name: 'ArtistsCorner',
          description: 'Creative minds sharing artwork and inspiration',
          category: 'Creative',
          color: '#10B981',
          trending: false,
          tags: ['art', 'creative', 'design']
        },
        {
          name: 'WellnessWarriors',
          description: 'Mental health support and wellness tips',
          category: 'Wellness',
          color: '#F59E0B',
          trending: true,
          tags: ['wellness', 'health', 'mental-health']
        },
        {
          name: 'CampusEvents',
          description: 'Local campus events and meetups',
          category: 'Events',
          color: '#EF4444',
          trending: false,
          tags: ['events', 'campus', 'meetups']
        }
      ]

      const { data, error } = await supabase
        .from('communities')
        .insert(sampleCommunities)
        .select()

      if (error) {
        throw new Error(`Insert failed: ${error.message}`)
      }

      console.log(`✅ Successfully inserted ${data.length} sample communities`)
      data.forEach(community => {
        console.log(`   - ${community.name} (${community.category})`)
      })
    } else {
      console.log('✅ Sample communities already exist')
    }

    return true
  } catch (error) {
    console.error('❌ Failed to insert sample communities:', error.message)
    return false
  }
}

// Run the fix
insertSampleCommunities().then(success => {
  if (success) {
    console.log('\n🎉 Sample data fix completed!')
    console.log('✅ API Cross-References test should now pass')
  } else {
    console.log('\n❌ Sample data fix failed')
    process.exit(1)
  }
})
