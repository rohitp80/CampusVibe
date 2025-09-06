// ConnectHub - Global State Context
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { posts as initialPosts, events as initialEvents, users, chatRooms, studyNotes, connections, communities as initialCommunities } from '../data/dummyData.js';

const AppContext = createContext();

const initialState = {
  // Authentication
  isAuthenticated: false,
  currentUser: null,
  
  // App state
  theme: 'dark',
  
  // Posts and feed
  posts: initialPosts,
  filteredPosts: initialPosts,
  selectedCommunity: null,
  
  // Events
  events: initialEvents,
  eventFilter: 'all',
  
  // Communities
  communities: initialCommunities,
  
  // Chat and notes
  chatRooms,
  studyNotes,
  activeChat: null,
  
  // Connections
  connections,
  
  // UI state
  sidebarCollapsed: false,
  currentPage: 'feed',
  isLoading: false,
  notifications: []
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { 
        ...state, 
        isAuthenticated: true, 
        currentUser: action.payload 
      };
      
    case 'LOGOUT':
      return { 
        ...state, 
        isAuthenticated: false, 
        currentUser: null 
      };
      
    case 'SET_THEME':
      return { ...state, theme: action.payload };
      
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
      
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
      
    case 'ADD_POST':
      const newPost = {
        ...action.payload,
        id: Date.now(),
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false
      };
      return { 
        ...state, 
        posts: [newPost, ...state.posts],
        filteredPosts: [newPost, ...state.filteredPosts]
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
        isAttending: true
      };
      return { ...state, events: [newEvent, ...state.events] };
      
    case 'ADD_COMMUNITY':
      const newCommunity = {
        ...action.payload,
        id: Date.now(),
        memberCount: 1,
        trending: false,
        color: '#8B5CF6',
        tags: action.payload.tags || []
      };
      return { ...state, communities: [newCommunity, ...state.communities] };
      
    case 'SET_EVENT_FILTER':
      return { ...state, eventFilter: action.payload };
      
    case 'TOGGLE_EVENT_ATTENDANCE':
      return {
        ...state,
        events: state.events.map(event => {
          if (event.id === action.payload) {
            return {
              ...event,
              isAttending: !event.isAttending,
              attendees: event.isAttending ? event.attendees - 1 : event.attendees + 1
            };
          }
          return event;
        })
      };
      
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
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
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
  
  const actions = {
    login: (user) => dispatch({ type: 'LOGIN', payload: user }),
    logout: () => dispatch({ type: 'LOGOUT' }),
    setTheme: (theme) => dispatch({ type: 'SET_THEME', payload: theme }),
    setCurrentPage: (page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page }),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    addPost: (post) => dispatch({ type: 'ADD_POST', payload: post }),
    toggleLike: (postId) => dispatch({ type: 'TOGGLE_LIKE', payload: postId }),
    addComment: (postId, comment) => dispatch({ type: 'ADD_COMMENT', payload: { postId, comment } }),
    filterByCommunity: (community) => dispatch({ type: 'FILTER_BY_COMMUNITY', payload: community }),
    addEvent: (event) => dispatch({ type: 'ADD_EVENT', payload: event }),
    addCommunity: (community) => dispatch({ type: 'ADD_COMMUNITY', payload: community }),
    setEventFilter: (filter) => dispatch({ type: 'SET_EVENT_FILTER', payload: filter }),
    toggleEventAttendance: (eventId) => dispatch({ type: 'TOGGLE_EVENT_ATTENDANCE', payload: eventId }),
    setActiveChat: (chatId) => dispatch({ type: 'SET_ACTIVE_CHAT', payload: chatId }),
    addStudyNote: (note) => dispatch({ type: 'ADD_STUDY_NOTE', payload: note }),
    updateStudyNote: (note) => dispatch({ type: 'UPDATE_STUDY_NOTE', payload: note }),
    connectUser: (userId) => dispatch({ type: 'CONNECT_USER', payload: userId }),
    addNotification: (notification) => dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    unlockTimeCapsule: (postId) => dispatch({ type: 'UNLOCK_TIME_CAPSULE', payload: postId }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading })
  };
  
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