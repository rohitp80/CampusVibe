// ConnectHub - Global State Context
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { posts as initialPosts, events as initialEvents, users, chatRooms, studyNotes, connections, communities as initialCommunities } from '../data/dummyData.js';

const AppContext = createContext();

// Load posts from localStorage
const loadStoredPosts = () => {
  try {
    const stored = localStorage.getItem('campusVibe_posts');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Load events from localStorage
const loadStoredEvents = () => {
  try {
    const stored = localStorage.getItem('campusVibe_events');
    if (stored) {
      const events = JSON.parse(stored);
      // Fix date objects that become strings after JSON parsing
      return events.map(event => ({
        ...event,
        date: new Date(event.date)
      }));
    } else {
      // First time - save initial events and return them
      localStorage.setItem('campusVibe_events', JSON.stringify(initialEvents));
      return initialEvents;
    }
  } catch (error) {
    console.error('Error loading events:', error);
    return initialEvents;
  }
};

// Load initial values from localStorage
const getInitialCurrentPage = () => {
  const saved = localStorage.getItem('currentPage') || 'feed';
  console.log('getInitialCurrentPage:', saved);
  return saved;
};

const getInitialFilteredPosts = () => {
  const savedCommunity = JSON.parse(localStorage.getItem('selectedCommunity') || 'null');
  const posts = loadStoredPosts();
  
  if (savedCommunity) {
    return posts.filter(post => post.community === savedCommunity.name);
  }
  return posts;
};

const initialState = {
  // Authentication
  isAuthenticated: !!localStorage.getItem('campusVibe_currentUser'),
  currentUser: JSON.parse(localStorage.getItem('campusVibe_currentUser') || 'null'),
  
  // App state
  theme: 'dark',
  currentPage: getInitialCurrentPage(), // Persist current page
  selectedEventId: null,
  
  // Posts and feed
  posts: loadStoredPosts(),
  filteredPosts: getInitialFilteredPosts(), // Restore filtered posts based on selected community
  savedPosts: JSON.parse(localStorage.getItem('savedPosts') || '[]'),
  selectedCommunity: JSON.parse(localStorage.getItem('selectedCommunity') || 'null'),
  
  // Events
  events: loadStoredEvents(),
  eventFilter: 'all',
  
  // Communities
  communities: initialCommunities,
  
  // Chat and notes
  chatRooms,
  studyNotes,
  activeChat: null,
  selectedChatFriend: null, // Add selected chat friend
  
  // Connections
  connections,
  
  // UI state
  sidebarCollapsed: false,
  isLoading: false,
  sessionLoading: true, // Add session loading state
  notifications: [],
  viewingProfile: null,
  // Load initial friend requests from localStorage
  friendRequests: (() => {
    try {
      return JSON.parse(localStorage.getItem('friendRequests') || '[]');
    } catch (e) {
      return [];
    }
  })(),
  friends: JSON.parse(localStorage.getItem('friends') || '[]') // Add viewing profile state
};

const appReducer = (state, action) => {
  console.log('Reducer action:', action.type, 'payload:', action.payload);
  if (action.type === 'SET_CURRENT_PAGE' || state.currentPage !== (action.type === 'SET_CURRENT_PAGE' ? action.payload : state.currentPage)) {
    console.log('currentPage changing from', state.currentPage, 'to', action.type === 'SET_CURRENT_PAGE' ? action.payload : state.currentPage);
  }
  
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('campusVibe_currentUser', JSON.stringify(action.payload));
      return { 
        ...state, 
        isAuthenticated: true, 
        currentUser: action.payload 
      };
      
    case 'LOGOUT':
      localStorage.removeItem('campusVibe_currentUser');
      return { 
        ...state, 
        isAuthenticated: false, 
        currentUser: null 
      };
      
    case 'SET_THEME':
      return { ...state, theme: action.payload };
      
    case 'SET_SELECTED_EVENT':
      return { ...state, selectedEventId: action.payload, currentPage: 'eventDetail' };
      
    case 'ADD_EVENT_ANNOUNCEMENT':
      const updatedEvents = state.events.map(event => {
        if (event.id === action.payload.eventId) {
          return {
            ...event,
            announcements: [...(event.announcements || []), action.payload.announcement]
          };
        }
        return event;
      });
      return { ...state, events: updatedEvents };
      
    case 'SET_CURRENT_PAGE':
      console.log('Setting currentPage to:', action.payload);
      localStorage.setItem('currentPage', action.payload);
      console.log('Saved to localStorage:', localStorage.getItem('currentPage'));
      return { ...state, currentPage: action.payload };
      
    case 'SET_SELECTED_CHAT_FRIEND':
      return { ...state, selectedChatFriend: action.payload };
      
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
      
    case 'ADD_POST':
      const newPost = {
        ...action.payload,
        id: action.payload.id || Date.now(), // Use existing ID if provided
        timestamp: action.payload.timestamp || new Date(), // Use existing timestamp if provided
        likes: action.payload.likes || 0,
        comments: action.payload.comments || 0,
        shares: 0,
        isLiked: false
      };
      const newPostsList = [newPost, ...state.posts];
      // Save to localStorage
      localStorage.setItem('campusVibe_posts', JSON.stringify(newPostsList));
      return { 
        ...state, 
        posts: newPostsList,
        filteredPosts: [newPost, ...state.filteredPosts]
      };
      
    case 'UPDATE_POST':
      const updatedPostsList = state.posts.map(post => 
        post.id === action.payload.postId 
          ? { ...post, ...action.payload.updates }
          : post
      );
      localStorage.setItem('campusVibe_posts', JSON.stringify(updatedPostsList));
      return {
        ...state,
        posts: updatedPostsList,
        filteredPosts: state.filteredPosts?.map(post => 
          post.id === action.payload.postId 
            ? { ...post, ...action.payload.updates }
            : post
        )
      };
      
    case 'REMOVE_POST':
      const postsAfterRemoval = state.posts.filter(post => post.id !== action.payload);
      localStorage.setItem('campusVibe_posts', JSON.stringify(postsAfterRemoval));
      return {
        ...state,
        posts: postsAfterRemoval,
        filteredPosts: state.filteredPosts?.filter(post => post.id !== action.payload)
      };
      
    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload),
        filteredPosts: state.filteredPosts?.filter(post => post.id !== action.payload)
      };

    case 'SELECT_COMMUNITY':
      const communityPosts = action.payload 
        ? state.posts.filter(post => post.community === action.payload.name)
        : state.posts;
      localStorage.setItem('selectedCommunity', JSON.stringify(action.payload));
      return {
        ...state,
        selectedCommunity: action.payload,
        filteredPosts: communityPosts
      };
    
    case 'JOIN_COMMUNITY':
      return {
        ...state,
        communities: state.communities.map(community =>
          community.id === action.payload
            ? { ...community, memberCount: community.memberCount + 1, isJoined: true }
            : community
        )
      };
    
    case 'LEAVE_COMMUNITY':
      return {
        ...state,
        communities: state.communities.map(community =>
          community.id === action.payload
            ? { ...community, memberCount: community.memberCount - 1, isJoined: false }
            : community
        )
      };

    case 'SAVE_POST':
      const isAlreadySaved = state.savedPosts.some(p => p.id === action.payload.id);
      if (isAlreadySaved) return state;
      const newSavedPosts = [...state.savedPosts, action.payload];
      localStorage.setItem('savedPosts', JSON.stringify(newSavedPosts));
      return {
        ...state,
        savedPosts: newSavedPosts
      };

    case 'UNSAVE_POST':
      const filteredSavedPosts = state.savedPosts.filter(post => post.id !== action.payload);
      localStorage.setItem('savedPosts', JSON.stringify(filteredSavedPosts));
      return {
        ...state,
        savedPosts: filteredSavedPosts
      };
      
    case 'TOGGLE_LIKE':
      const updatedPosts = state.posts.map(post => {
        if (post.id === action.payload) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          };
        }
        return post;
      });
      // Save to localStorage
      localStorage.setItem('campusVibe_posts', JSON.stringify(updatedPosts));
      return { 
        ...state, 
        posts: updatedPosts,
        filteredPosts: updatedPosts.filter(post => 
          !state.selectedCommunity || post.community === state.selectedCommunity
        )
      };
      
    case 'ADD_COMMENT':
      return {
        ...state,
        posts: state.posts.map(post => 
          post.id === action.payload.postId 
            ? { 
                ...post, 
                comments: post.comments + 1,
                commentsList: [
                  ...(post.commentsList || []),
                  {
                    id: Date.now(),
                    text: action.payload.comment,
                    author: state.currentUser?.username || 'Anonymous',
                    timestamp: new Date()
                  }
                ]
              }
            : post
        ),
        filteredPosts: state.filteredPosts.map(post => 
          post.id === action.payload.postId 
            ? { 
                ...post, 
                comments: post.comments + 1,
                commentsList: [
                  ...(post.commentsList || []),
                  {
                    id: Date.now(),
                    text: action.payload.comment,
                    author: state.currentUser?.username || 'Anonymous',
                    timestamp: new Date()
                  }
                ]
              }
            : post
        )
      };
      
    case 'FILTER_BY_COMMUNITY':
      return {
        ...state,
        selectedCommunity: action.payload,
        filteredPosts: action.payload 
          ? state.posts.filter(post => post.community === action.payload)
          : state.posts
      };
      
    case 'ADD_EVENT':
      const newEvent = {
        ...action.payload,
        id: Date.now(),
        attendees: 1,
        isAttending: true,
        createdBy: state.currentUser?.username,
        organizer: state.currentUser?.username || state.currentUser?.displayName
      };
      const newEventsList = [newEvent, ...state.events];
      // Save to localStorage
      localStorage.setItem('campusVibe_events', JSON.stringify(newEventsList));
      return { ...state, events: newEventsList };
      
    case 'UPDATE_COMMUNITY_MEMBER_COUNT':
      return {
        ...state,
        communities: state.communities.map(community =>
          community.id === action.payload.communityId
            ? { ...community, member_count: action.payload.newCount, memberCount: action.payload.newCount }
            : community
        )
      };
      
    case 'DELETE_COMMUNITY':
      return { 
        ...state, 
        communities: state.communities.filter(c => c.id !== action.payload)
      };
      
    case 'LOAD_COMMUNITIES':
      return { ...state, communities: action.payload };
      
    case 'ADD_COMMUNITY':
      const newCommunity = {
        ...action.payload,
        // Don't override the ID from backend - use the UUID from Supabase
        memberCount: action.payload.member_count || 1,
        trending: action.payload.trending || false,
        color: action.payload.color || '#8B5CF6',
        tags: action.payload.tags || []
      };
      return { ...state, communities: [newCommunity, ...state.communities] };
      
    case 'SET_EVENT_FILTER':
      return { ...state, eventFilter: action.payload };
      
    case 'TOGGLE_EVENT_ATTENDANCE':
      const eventsWithUpdatedAttendance = state.events.map(event => {
        if (event.id === action.payload) {
          return {
            ...event,
            isAttending: !event.isAttending,
            attendees: event.isAttending ? event.attendees - 1 : event.attendees + 1
          };
        }
        return event;
      });
      // Save to localStorage
      localStorage.setItem('campusVibe_events', JSON.stringify(eventsWithUpdatedAttendance));
      return { ...state, events: eventsWithUpdatedAttendance };
      
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChat: action.payload };
      
    case 'ADD_STUDY_NOTE':
      const newNote = {
        ...action.payload,
        id: Date.now(),
        timestamp: new Date(),
        author: state.currentUser.username,
        isEditing: false
      };
      return { ...state, studyNotes: [newNote, ...state.studyNotes] };
      
    case 'UPDATE_STUDY_NOTE':
      return {
        ...state,
        studyNotes: state.studyNotes.map(note => 
          note.id === action.payload.id ? { ...note, ...action.payload } : note
        )
      };
      
    case 'CONNECT_USER':
      return {
        ...state,
        connections: state.connections.map(connection => 
          connection.id === action.payload 
            ? { ...connection, isConnected: true }
            : connection
        )
      };
      
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications.slice(0, 4)]
      };
      
    case 'UNLOCK_TIME_CAPSULE':
      return {
        ...state,
        posts: state.posts.map(post => 
          post.id === action.payload 
            ? { ...post, isLocked: false }
            : post
        )
      };

    case 'SEND_FRIEND_REQUEST':
      // Simple approach - just add to global storage immediately
      const request = {
        id: Date.now(),
        from: state.currentUser.username,
        to: action.payload.username,
        status: 'pending'
      };
      
      // Get existing requests and add new one
      const currentRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
      const updatedRequests = [...currentRequests, request];
      localStorage.setItem('friendRequests', JSON.stringify(updatedRequests));
      
      console.log('SENT REQUEST:', request);
      console.log('ALL REQUESTS NOW:', updatedRequests);
      
      // Force immediate state update - NO NOTIFICATION ADDED
      return {
        ...state,
        friendRequests: updatedRequests
      };

    case 'ACCEPT_FRIEND_REQUEST':
      const acceptRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
      const acceptedRequest = acceptRequests.find(req => req.id === action.payload);
      const remainingRequests = acceptRequests.filter(req => req.id !== action.payload);
      
      localStorage.setItem('friendRequests', JSON.stringify(remainingRequests));
      
      // Add to friends list (check for duplicates)
      let updatedFriends = [...state.friends];
      if (acceptedRequest) {
        const friendExists = updatedFriends.some(f => f.username === acceptedRequest.from);
        if (!friendExists) {
          const newFriend = {
            id: acceptedRequest.from,
            username: acceptedRequest.from,
            display_name: acceptedRequest.from
          };
          updatedFriends.push(newFriend);
          localStorage.setItem('friends', JSON.stringify(updatedFriends));
        }
      }
      
      console.log('Friend request accepted:', acceptedRequest);
      console.log('Updated friends:', updatedFriends);
      
      return {
        ...state,
        friendRequests: remainingRequests,
        friends: updatedFriends
      };

    case 'REJECT_FRIEND_REQUEST':
      const allRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
      const filteredRequests = allRequests.filter(req => req.id !== action.payload);
      localStorage.setItem('friendRequests', JSON.stringify(filteredRequests));
      
      console.log('Friend request rejected');
      console.log('Remaining requests:', filteredRequests);
      
      // Force immediate state update
      return {
        ...state,
        friendRequests: filteredRequests
      };

    case 'CANCEL_FRIEND_REQUEST':
      const storedRequests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
      const cancelledRequests = storedRequests.filter(req => 
        !(req.from === state.currentUser.username && req.to === action.payload.username && req.status === 'pending')
      );
      localStorage.setItem('friendRequests', JSON.stringify(cancelledRequests));
      
      console.log('Friend request cancelled to:', action.payload.username);
      console.log('Remaining requests:', cancelledRequests);
      
      // Force immediate state update
      return {
        ...state,
        friendRequests: cancelledRequests
      };

    case 'REFRESH_FRIEND_DATA':
      // Simple refresh from localStorage
      let requests = [];
      try {
        requests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
      } catch (e) {
        requests = [];
      }
      
      console.log('REFRESHING - Current user:', state.currentUser?.username);
      console.log('REFRESHING - All requests:', requests);
      console.log('REFRESHING - My incoming:', requests.filter(r => r.to === state.currentUser?.username));
      
      return {
        ...state,
        friendRequests: requests
      };
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_SESSION_LOADING':
      return { ...state, sessionLoading: action.payload };
      
    case 'SET_VIEWING_PROFILE':
      return { ...state, viewingProfile: action.payload };
      
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Initialize Supabase auth listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Load profile data from database
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles/${session.user.id}`);
          const result = await response.json();
          
          let profileData;
          if (result.success) {
            // Use database profile data
            profileData = {
              id: session.user.id,
              email: session.user.email,
              displayName: result.data.display_name || session.user.user_metadata?.full_name || session.user.email,
              username: result.data.username || session.user.email.split('@')[0],
              avatar: result.data.avatar_url || session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
              bio: result.data.bio || 'Connected via Supabase',
              phone: result.data.phone,
              dateOfBirth: result.data.date_of_birth,
              gender: result.data.gender,
              location: result.data.location,
              university: result.data.university || "University",
              course: result.data.course,
              department: result.data.department,
              graduationYear: result.data.graduation_year,
              year: result.data.year || "Student",
              interests: result.data.interests || [],
              skills: result.data.skills || [],
              isOnline: true
            };
          } else {
            // Fallback to auth metadata if profile not found
            profileData = {
              id: session.user.id,
              email: session.user.email,
              displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email,
              username: session.user.email.split('@')[0],
              avatar: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
              university: session.user.user_metadata?.university || "University",
              year: "Student",
              location: "Campus",
              bio: 'Connected via Supabase',
              interests: [],
              skills: [],
              isOnline: true
            };
          }
          
          dispatch({ 
            type: 'LOGIN', 
            payload: profileData
          });
        } catch (error) {
          console.error('Error loading profile:', error);
          // Fallback to auth metadata
          dispatch({ 
            type: 'LOGIN', 
            payload: {
              id: session.user.id,
              email: session.user.email,
              displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email,
              username: session.user.email.split('@')[0],
              avatar: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
              university: session.user.user_metadata?.university || "University",
              year: "Student",
              location: "Campus",
              bio: 'Connected via Supabase',
              interests: [],
              skills: [],
              isOnline: true
            }
          });
        }
      }
      // Session check complete
      dispatch({ type: 'SET_SESSION_LOADING', payload: false });
    });

    // Listen for auth changes (including OAuth callbacks)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT' });
      } else if (session?.user) {
        dispatch({ 
          type: 'LOGIN', 
          payload: {
            id: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email,
            username: session.user.email.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
            university: session.user.user_metadata?.university || "University",
            year: "Student",
            location: "Campus",
            bio: 'Connected via Supabase',
            isOnline: true
          }
        });
      }
      // Session change handled
      dispatch({ type: 'SET_SESSION_LOADING', payload: false });
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('connecthub-theme') || 'dark';
    dispatch({ type: 'SET_THEME', payload: savedTheme });
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);
  
  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('connecthub-theme', state.theme);
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  // Restore currentPage from localStorage after auth loads
  useEffect(() => {
    if (!state.sessionLoading) {
      const savedPage = localStorage.getItem('currentPage');
      if (savedPage && savedPage !== state.currentPage) {
        console.log('Restoring currentPage from localStorage:', savedPage);
        dispatch({ type: 'SET_CURRENT_PAGE', payload: savedPage });
      }
    }
  }, [state.sessionLoading]);
  
  // Simulate time capsule unlocking
  useEffect(() => {
    const interval = setInterval(() => {
      state.posts.forEach(post => {
        if (post.type === 'timecapsule' && post.isLocked && post.unlockDate <= new Date()) {
          dispatch({ type: 'UNLOCK_TIME_CAPSULE', payload: post.id });
          dispatch({ 
            type: 'ADD_NOTIFICATION', 
            payload: {
              id: Date.now(),
              type: 'time_capsule',
              message: 'A time capsule has been unlocked!',
              timestamp: new Date()
            }
          });
        }
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [state.posts]);
  
  // Load communities from API
  const loadCommunities = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/community/');
      if (response.ok) {
        const result = await response.json();
        dispatch({ type: 'LOAD_COMMUNITIES', payload: result.data });
      }
    } catch (error) {
      console.error('Failed to load communities:', error);
    }
  };

  // Load communities on app start
  useEffect(() => {
    loadCommunities();
    
    // Listen for community deletion events
    const handleCommunityDeleted = (event) => {
      dispatch({ type: 'DELETE_COMMUNITY', payload: event.detail });
    };
    
    // Listen for community updates (join/leave to refresh member counts)
    const handleCommunityUpdated = () => {
      loadCommunities();
    };
    
    window.addEventListener('communityDeleted', handleCommunityDeleted);
    window.addEventListener('communityUpdated', handleCommunityUpdated);
    
    return () => {
      window.removeEventListener('communityDeleted', handleCommunityDeleted);
      window.removeEventListener('communityUpdated', handleCommunityUpdated);
    };
  }, []);

  const actions = {
    dispatch, // Expose dispatch for direct access
    login: (user) => dispatch({ type: 'LOGIN', payload: user }),
    logout: async () => {
      try {
        await supabase.auth.signOut();
        dispatch({ type: 'LOGOUT' });
      } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if Supabase fails
        dispatch({ type: 'LOGOUT' });
      }
    },
    setTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    setCurrentPage: (page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page }),
    setSelectedEvent: (eventId) => dispatch({ type: 'SET_SELECTED_EVENT', payload: eventId }),
    addEventAnnouncement: (eventId, announcement) => dispatch({ 
      type: 'ADD_EVENT_ANNOUNCEMENT', 
      payload: { eventId, announcement } 
    }),
    setSelectedChatFriend: (friend) => dispatch({ type: 'SET_SELECTED_CHAT_FRIEND', payload: friend }),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    addPost: (post) => dispatch({ type: 'ADD_POST', payload: post }),
    updatePost: (postId, updates) => dispatch({ type: 'UPDATE_POST', payload: { postId, updates } }),
    removePost: (postId) => dispatch({ type: 'REMOVE_POST', payload: postId }),
    deletePost: (postId) => dispatch({ type: 'DELETE_POST', payload: postId }),
    savePost: (post) => dispatch({ type: 'SAVE_POST', payload: post }),
    unsavePost: (postId) => dispatch({ type: 'UNSAVE_POST', payload: postId }),
    toggleLike: (postId) => dispatch({ type: 'TOGGLE_LIKE', payload: postId }),
    addComment: (postId, comment) => dispatch({ type: 'ADD_COMMENT', payload: { postId, comment } }),
    filterByCommunity: (community) => dispatch({ type: 'FILTER_BY_COMMUNITY', payload: community }),
    selectCommunity: (community) => dispatch({ type: 'SELECT_COMMUNITY', payload: community }),
    joinCommunity: (communityId) => dispatch({ type: 'JOIN_COMMUNITY', payload: communityId }),
    leaveCommunity: (communityId) => dispatch({ type: 'LEAVE_COMMUNITY', payload: communityId }),
    addEvent: (event) => dispatch({ type: 'ADD_EVENT', payload: event }),
    addCommunity: async (community) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('Not authenticated');
          return;
        }

        const response = await fetch('http://localhost:3000/api/community/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(community)
        });

        if (response.ok) {
          const result = await response.json();
          dispatch({ type: 'ADD_COMMUNITY', payload: result.data });
          // Navigate to the new community as admin
          dispatch({ type: 'SELECT_COMMUNITY', payload: result.data });
          dispatch({ type: 'SET_CURRENT_PAGE', payload: 'community' });
        } else {
          console.error('Failed to create community');
        }
      } catch (error) {
        console.error('Create community error:', error);
      }
    },
    setEventFilter: (filter) => dispatch({ type: 'SET_EVENT_FILTER', payload: filter }),
    toggleEventAttendance: (eventId) => dispatch({ type: 'TOGGLE_EVENT_ATTENDANCE', payload: eventId }),
    setActiveChat: (chatId) => dispatch({ type: 'SET_ACTIVE_CHAT', payload: chatId }),
    addStudyNote: (note) => dispatch({ type: 'ADD_STUDY_NOTE', payload: note }),
    updateStudyNote: (note) => dispatch({ type: 'UPDATE_STUDY_NOTE', payload: note }),
    connectUser: (userId) => dispatch({ type: 'CONNECT_USER', payload: userId }),
    addNotification: (notification) => dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    unlockTimeCapsule: (postId) => dispatch({ type: 'UNLOCK_TIME_CAPSULE', payload: postId }),
    sendFriendRequest: (user) => dispatch({ type: 'SEND_FRIEND_REQUEST', payload: user }),
    cancelFriendRequest: (user) => dispatch({ type: 'CANCEL_FRIEND_REQUEST', payload: user }),
    acceptFriendRequest: (requestId) => dispatch({ type: 'ACCEPT_FRIEND_REQUEST', payload: requestId }),
    rejectFriendRequest: (requestId) => dispatch({ type: 'REJECT_FRIEND_REQUEST', payload: requestId }),
    refreshFriendData: () => dispatch({ type: 'REFRESH_FRIEND_DATA' }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setViewingProfile: (profile) => dispatch({ type: 'SET_VIEWING_PROFILE', payload: profile })
  };

  // Load friend requests on app start and when user changes
  useEffect(() => {
    // Always refresh on mount
    dispatch({ type: 'REFRESH_FRIEND_DATA' });
    
    if (state.currentUser) {
      // Set up aggressive polling every 500ms
      const interval = setInterval(() => {
        dispatch({ type: 'REFRESH_FRIEND_DATA' });
      }, 500);
      
      // Refresh when window gets focus
      const handleFocus = () => {
        dispatch({ type: 'REFRESH_FRIEND_DATA' });
      };
      
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [state.currentUser?.username]);
  
  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;