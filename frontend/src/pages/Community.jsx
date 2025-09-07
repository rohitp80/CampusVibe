import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { useCommunityMembership } from '../hooks/useCommunityMembership';
import CommunityChat from './CommunityChat';
import CommunityPost from '../components/Community/CommunityPost.jsx';
import { Hash, Users, MessageCircle, Send, ArrowLeft, Paperclip, Download, FileText, Image, Smile, UserPlus, UserMinus, Shield, Trash2, Crown, UserX } from 'lucide-react';

const Community = () => {
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  const currentCommunity = state.selectedCommunity || {
    id: 1,
    name: "CodeCoffee",
    description: "Developers sharing code snippets and programming tips",
    memberCount: 1247,
    color: "#8B5CF6"
  };

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Real-time subscription for membership changes
  useEffect(() => {
    if (!currentCommunity?.id || !currentUserId) return;

    const subscription = supabase
      .channel(`community_membership:${currentCommunity.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members'
        },
        async (payload) => {
          if (payload.new?.community_id === currentCommunity.id) {
            // Refresh membership status
            const result = await checkMembership();
            if (result.success) {
              setIsMember(result.isMember);
              setIsAdmin(result.isAdmin);
              
              // Update member count
              if (payload.eventType === 'INSERT') {
                actions.addNotification({
                  id: Date.now(),
                  type: 'info',
                  message: 'Someone joined the community! 🎉',
                  timestamp: new Date()
                });
              } else if (payload.eventType === 'DELETE') {
                actions.addNotification({
                  id: Date.now(),
                  type: 'info',
                  message: 'Someone left the community',
                  timestamp: new Date()
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentCommunity?.id, currentUserId]);
  const {
    isMember: rawIsMember,
    isAdmin,
    loading: membershipLoading,
    joinCommunity,
    leaveCommunity,
    deleteCommunity
  } = useCommunityMembership(currentCommunity.id);

  // Admin is always a member
  const isMember = rawIsMember || isAdmin;

  // Common emojis for quick access
  const commonEmojis = [
    '😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', 
    '👍', '👎', '👏', '🙌', '💪', '🔥', '❤️', '💯',
    '🎉', '🎊', '✨', '⭐', '💡', '🚀', '💻', '📱',
    '☕', '🍕', '🎵', '📚', '✅', '❌', '⚡', '🌟'
  ];

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Clear messages when user is no longer a member
  useEffect(() => {
    if (!membershipLoading && !isMember) {
      setMessages([]);
      setLoading(false);
    }
  }, [isMember, membershipLoading]);

  // Fetch messages when component loads or membership changes
  useEffect(() => {
    let cleanup;
    
    // Only setup when membership loading is complete
    if (!membershipLoading) {
      if (isMember) {
        fetchMessages();
        cleanup = setupRealtimeSubscription();
      } else {
        setMessages([]);
        setLoading(false);
      }
    }
    
    return () => {
      // Cleanup polling interval
      if (cleanup) cleanup();
    };
  }, [currentCommunity.id, isMember, membershipLoading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (isPolling = false) => {
    // Only fetch if user is a member and not loading
    if (!isMember || membershipLoading) {
      if (!isPolling) setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found');
        if (!isPolling) setLoading(false);
        return;
      }

      // Check if community_messages table exists, otherwise use posts table
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', currentCommunity.id)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (!error && data) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          content: msg.content,
          timestamp: new Date(msg.created_at + 'Z'),
          userId: msg.user_id,
          username: msg.profiles?.username || 'User',
          displayName: msg.profiles?.display_name || 'User',
          avatar: msg.profiles?.avatar_url || '/api/placeholder/32/32'
        }));
        setMessages(formattedMessages);
      } else {
        console.error('Failed to fetch messages:', error);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!isMember || membershipLoading) {
      return;
    }
    
    // Use simple polling instead of WebSocket to avoid connection issues
    const pollInterval = setInterval(() => {
      if (isMember && !membershipLoading) {
        fetchMessages(true); // Pass true to indicate this is polling
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(pollInterval);
    };
  };

  const sendMessage = async () => {
    if (!message.trim() || !isMember) return;
    
    const messageText = message.trim();
    setMessage(''); // Clear input immediately
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        return;
      }

      const response = await fetch(`http://localhost:3000/api/chat/community/${currentCommunity.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: messageText
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessages(prev => [...prev, result.data]);
      } else {
        console.error('Failed to send message:', response.status);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const fetchMembers = async () => {
    if (!isMember) return;
    
    setLoadingMembers(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:3000/api/community/${currentCommunity.id}/members`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setMembers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const removeMember = async (userId) => {
    if (!isAdmin) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:3000/api/community/${currentCommunity.id}/remove/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        // Remove from local state
        setMembers(prev => prev.filter(member => member.user_id !== userId));
        // Update member count
        const newCount = Math.max((currentCommunity.member_count || currentCommunity.memberCount || 1) - 1, 0);
        actions.dispatch({ 
          type: 'UPDATE_COMMUNITY_MEMBER_COUNT', 
          payload: { communityId: currentCommunity.id, newCount } 
        });
        // Trigger community list refresh
        window.dispatchEvent(new CustomEvent('communityUpdated'));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member');
    }
  };

  const handleFileUpload = async (event) => {
    if (!isMember) return;
    
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`http://localhost:3000/api/chat/community/${currentCommunity.id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setMessages(prev => [...prev, result.data]);
      } else {
        console.error('Failed to upload file:', response.status);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => actions.setCurrentPage('explore')}
              className="p-2 hover:bg-secondary rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: currentCommunity.color }}
            >
              {currentCommunity.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Hash className="w-6 h-6" />
                {currentCommunity.name}
              </h1>
              <p className="text-muted-foreground">{currentCommunity.description}</p>
            </div>
          </div>
          
          {/* Membership Controls */}
          <div className="flex items-center gap-2">
            {/* Members Button - Show for all members */}
            {isMember && (
              <button
                onClick={() => {
                  setShowMembers(!showMembers);
                  if (!showMembers) fetchMembers();
                }}
                className="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg hover:bg-secondary/90 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Members
              </button>
            )}
            
            {membershipLoading ? (
              <div className="bg-secondary px-4 py-2 rounded-lg">
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                {!isMember ? (
                  <button
                    onClick={async () => {
                      const result = await joinCommunity();
                      if (!result.success) {
                        alert(result.error);
                      } else {
                        // Update member count immediately in UI
                        const newCount = (currentCommunity.member_count || currentCommunity.memberCount || 0) + 1;
                        actions.dispatch({ 
                          type: 'UPDATE_COMMUNITY_MEMBER_COUNT', 
                          payload: { communityId: currentCommunity.id, newCount } 
                        });
                        // Trigger community list refresh
                        window.dispatchEvent(new CustomEvent('communityUpdated'));
                      }
                    }}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Join Community
                  </button>
                ) : (
                  <>
                    {!isAdmin && (
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to leave this community?')) {
                            const result = await leaveCommunity();
                            if (result.success) {
                              // Update member count immediately in UI
                              const newCount = Math.max((currentCommunity.member_count || currentCommunity.memberCount || 1) - 1, 0);
                              actions.dispatch({ 
                                type: 'UPDATE_COMMUNITY_MEMBER_COUNT', 
                                payload: { communityId: currentCommunity.id, newCount } 
                              });
                              // Clear messages and go back to explore
                              setMessages([]);
                              // Trigger community list refresh
                              window.dispatchEvent(new CustomEvent('communityUpdated'));
                              actions.setCurrentPage('explore');
                            } else {
                              alert(result.error);
                            }
                          }
                        }}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 flex items-center gap-2"
                      >
                        <UserMinus className="w-4 h-4" />
                        Leave
                      </button>
                    )}
                    
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
                              const result = await deleteCommunity();
                              if (!result.success) {
                                alert(result.error);
                              } else {
                                actions.setCurrentPage('explore');
                              }
                            }
                          }}
                          className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg hover:bg-destructive/90"
                          title="Delete Community"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{(state.communities.find(c => c.id === currentCommunity.id)?.member_count || 
                   state.communities.find(c => c.id === currentCommunity.id)?.memberCount || 
                   currentCommunity.memberCount || 0)} members</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>Real-time chat</span>
          </div>
          {isMember && (
            <span className="text-primary">✓ Member</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Hash className="w-4 h-4 inline mr-2" />
            Posts
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'chat' ? (
        /* Live Chat Area */
        <div className="bg-card rounded-xl border border-border shadow-card">
          <CommunityChat 
            communityId={currentCommunity?.id} 
            communityName={currentCommunity?.name}
          />
        </div>
      ) : (
        /* Community Posts */
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <CommunityPost community={currentCommunity} />
        </div>
      )}
      
      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-elevated p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Community Members</h2>
              <button
                onClick={() => setShowMembers(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            {loadingMembers ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading members...</div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {(member.profiles?.full_name || 'User').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {member.profiles?.full_name || 'User'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {member.role === 'admin' && (
                              <span className="flex items-center gap-1 text-primary">
                                <Crown className="w-3 h-3" />
                                Admin
                              </span>
                            )}
                            {member.role === 'member' && (
                              <span>Member</span>
                            )}
                            <span>•</span>
                            <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Remove button - Only show for admin and not for other admins */}
                      {isAdmin && member.role !== 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${member.profiles?.full_name || 'this user'} from the community?`)) {
                              removeMember(member.user_id);
                            }
                          }}
                          className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                          title="Remove member"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {members.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No members found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
