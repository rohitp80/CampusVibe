import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory fallback for membership when table doesn't exist
const membershipStore = new Map();

// Middleware to get current user
const getCurrentUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Helper function to get membership (with fallback)
const getMembership = async (communityId, userId) => {
  const key = `${communityId}_${userId}`;
  
  try {
    const { data, error } = await supabase
      .from('community_members')
      .select('role, joined_at')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return membershipStore.get(key) || null;
    }
    return data;
  } catch (error) {
    return membershipStore.get(key) || null;
  }
};

// Helper function to add membership (with fallback)
const addMembership = async (communityId, userId, role = 'member') => {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .insert([{
        community_id: communityId,
        user_id: userId,
        role: role
      }])
      .select()
      .single();

    if (error) {
      const key = `${communityId}_${userId}`;
      const membership = {
        community_id: communityId,
        user_id: userId,
        role: role,
        joined_at: new Date().toISOString()
      };
      membershipStore.set(key, membership);
      return membership;
    }
    return data;
  } catch (error) {
    const key = `${communityId}_${userId}`;
    const membership = {
      community_id: communityId,
      user_id: userId,
      role: role,
      joined_at: new Date().toISOString()
    };
    membershipStore.set(key, membership);
    return membership;
  }
};

// Helper function to remove membership (with fallback)
const removeMembership = async (communityId, userId) => {
  const key = `${communityId}_${userId}`;
  
  try {
    const { data: existing, error: selectError } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single();
    
    if (selectError || !existing) {
      membershipStore.delete(key);
      return true;
    }

    const { error, count } = await supabase
      .from('community_members')
      .delete({ count: 'exact' })
      .eq('id', existing.id);

    if (error || count === 0) {
      membershipStore.delete(key);
    } else {
      membershipStore.delete(key);
    }
    return true;
  } catch (error) {
    membershipStore.delete(key);
    return true;
  }
};

// Get all communities
router.get('/', async (req, res) => {
  try {
    const { data: communities, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch communities error:', error);
      return res.status(500).json({ error: 'Failed to fetch communities' });
    }

    res.json({ success: true, data: communities || [] });
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ error: 'Failed to get communities' });
  }
});

// Create community (creator becomes admin)
router.post('/create', getCurrentUser, async (req, res) => {
  try {
    const { name, description, category, color } = req.body;
    const userId = req.user.id;

    console.log('Creating community for user:', userId);

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Community name is required' });
    }

    // Create community in Supabase
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .insert([{
        name: name.trim(),
        description: description || '',
        category: category || 'General',
        color: color || '#8B5CF6',
        creator_id: userId,
        member_count: 1
      }])
      .select()
      .single();

    if (communityError) {
      console.error('Community creation error:', communityError);
      return res.status(500).json({ error: 'Failed to create community' });
    }

    console.log('Community created:', community);

    // Use the actual community ID from database (keep as UUID)
    const communityId = community.id;
    console.log('Adding admin membership - communityId:', communityId, 'userId:', userId);
    
    const membershipResult = await addMembership(communityId, userId, 'admin');
    console.log('Membership result:', membershipResult);

    // Verify membership was added
    const verifyMembership = await getMembership(communityId, userId);
    console.log('Verified membership:', verifyMembership);

    // Return community with original UUID ID
    res.status(201).json({ success: true, data: community });
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

// Join community
router.post('/:id/join', getCurrentUser, async (req, res) => {
  try {
    const { id: communityId } = req.params;
    const userId = req.user.id;

    // Check if already a member
    const existing = await getMembership(communityId, userId);
    if (existing) {
      return res.status(409).json({ error: 'Already a member' });
    }

    const data = await addMembership(communityId, userId, 'member');
    
    // Increment member count
    const { data: community } = await supabase
      .from('communities')
      .select('member_count')
      .eq('id', communityId)
      .single();
    
    if (community) {
      const newCount = (community.member_count || 0) + 1;
      await supabase
        .from('communities')
        .update({ member_count: newCount })
        .eq('id', communityId);
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({ error: 'Failed to join community' });
  }
});

// Leave community
router.post('/:id/leave', getCurrentUser, async (req, res) => {
  try {
    const { id: communityId } = req.params;
    const userId = req.user.id;

    const membership = await getMembership(communityId, userId);
    
    if (membership?.role === 'admin') {
      return res.status(400).json({ error: 'Admin cannot leave. Transfer ownership first.' });
    }

    if (!membership) {
      return res.status(400).json({ error: 'Not a member of this community' });
    }

    await removeMembership(communityId, userId);
    
    // Decrement member count - get current count and update
    const { data: community } = await supabase
      .from('communities')
      .select('member_count')
      .eq('id', communityId)
      .single();
    
    if (community) {
      await supabase
        .from('communities')
        .update({ member_count: Math.max((community.member_count || 1) - 1, 0) })
        .eq('id', communityId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Leave community error:', error);
    res.status(500).json({ error: 'Failed to leave community' });
  }
});

// Get community members
router.get('/:id/members', getCurrentUser, async (req, res) => {
  try {
    const { id: communityId } = req.params;
    const userId = req.user.id;

    // Check if user is a member
    const membership = await getMembership(communityId, userId);
    if (!membership) {
      return res.status(403).json({ error: 'Must be a member to view members' });
    }

    // Try foreign key relationship first, fallback to manual join
    let membersWithProfiles = [];
    
    // Attempt 1: Try with foreign key relationship
    const { data: membersFK, error: errorFK } = await supabase
      .from('community_members')
      .select(`
        user_id, 
        role, 
        joined_at,
        profiles!user_id (
          display_name,
          username,
          avatar_url
        )
      `)
      .eq('community_id', communityId)
      .order('joined_at', { ascending: true });

    if (!errorFK && membersFK) {
      // Foreign key relationship works
      membersWithProfiles = membersFK.map(member => ({
        ...member,
        profiles: {
          full_name: member.profiles?.display_name || member.profiles?.username || `User ${member.user_id.slice(-4)}`,
          avatar_url: member.profiles?.avatar_url || null
        }
      }));
    } else {
      // Attempt 2: Manual join fallback
      const { data: members, error } = await supabase
        .from('community_members')
        .select('user_id, role, joined_at')
        .eq('community_id', communityId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Get members error:', error);
        return res.status(500).json({ error: 'Failed to get members' });
      }

      if (!members || members.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Get profiles manually
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Get profiles error:', profilesError);
      }

      // Create profile lookup map
      const profileMap = {};
      (profiles || []).forEach(profile => {
        profileMap[profile.id] = profile;
      });

      // Join data manually
      membersWithProfiles = members.map(member => {
        const profile = profileMap[member.user_id];
        const displayName = profile?.display_name || profile?.username || `User ${member.user_id.slice(-4)}`;

        return {
          ...member,
          profiles: {
            full_name: displayName,
            avatar_url: profile?.avatar_url || null
          }
        };
      });
    }

    res.json({ success: true, data: membersWithProfiles });
  } catch (error) {
    console.error('Get community members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

// Remove member (admin only)
router.post('/:id/remove/:userId', getCurrentUser, async (req, res) => {
  try {
    const { id: communityId, userId: targetUserId } = req.params;
    const adminUserId = req.user.id;

    // Check if user is admin
    const adminMembership = await getMembership(communityId, adminUserId);
    if (!adminMembership || adminMembership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check target user membership
    const targetMembership = await getMembership(communityId, targetUserId);
    if (!targetMembership) {
      return res.status(404).json({ error: 'User is not a member' });
    }

    // Cannot remove another admin
    if (targetMembership.role === 'admin') {
      return res.status(400).json({ error: 'Cannot remove another admin' });
    }

    // Remove membership
    await removeMembership(communityId, targetUserId);

    // Decrement member count
    const { data: community } = await supabase
      .from('communities')
      .select('member_count')
      .eq('id', communityId)
      .single();
    
    if (community) {
      await supabase
        .from('communities')
        .update({ member_count: Math.max((community.member_count || 1) - 1, 0) })
        .eq('id', communityId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Get membership status
router.get('/:id/membership', getCurrentUser, async (req, res) => {
  try {
    const { id: communityId } = req.params;
    const userId = req.user.id;

    const membership = await getMembership(communityId, userId);

    res.json({
      success: true,
      data: {
        isMember: !!membership,
        isAdmin: membership?.role === 'admin',
        joinedAt: membership?.joined_at
      }
    });
  } catch (error) {
    console.error('Get membership error:', error);
    res.status(500).json({ error: 'Failed to get membership status' });
  }
});

// Delete community (admin only)
router.delete('/:id', getCurrentUser, async (req, res) => {
  try {
    const { id: communityId } = req.params;
    const userId = req.user.id;

    // Check if user is admin of this community
    const membership = await getMembership(communityId, userId);
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Delete community members first
    try {
      await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId);
    } catch (error) {
      console.log('Error deleting members (may not exist):', error);
    }

    // Delete community messages
    try {
      await supabase
        .from('community_messages')
        .delete()
        .eq('community_id', communityId);
    } catch (error) {
      console.log('Error deleting messages (may not exist):', error);
    }

    // Delete community
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId);

    if (error) {
      console.error('Delete community error:', error);
      return res.status(500).json({ error: 'Failed to delete community' });
    }

    // Also remove from fallback storage
    const membershipKeys = Array.from(membershipStore.keys()).filter(key => key.startsWith(`${communityId}_`));
    membershipKeys.forEach(key => membershipStore.delete(key));

    res.json({ success: true });
  } catch (error) {
    console.error('Delete community error:', error);
    res.status(500).json({ error: 'Failed to delete community' });
  }
});

export default router;
