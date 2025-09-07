// ConnectHub - Dummy Data for Development

export const users = [
  {
    id: 1,
    username: "alex_codes",
    displayName: "Alex Chen",
    avatar: "https://picsum.photos/seed/alex/100/100",
    bio: "CS Major | React Enthusiast | Coffee Addict",
    university: "Stanford University",
    year: "Junior",
    location: "Palo Alto, CA",
    followers: 234,
    following: 189,
    isOnline: true
  },
  {
    id: 2,
    username: "sarah_studies",
    displayName: "Sarah Johnson",
    avatar: "https://picsum.photos/seed/sarah/100/100",
    bio: "Pre-Med | Study Group Organizer | Yoga Lover",
    university: "Harvard University",
    year: "Sophomore",
    location: "Cambridge, MA",
    followers: 156,
    following: 201,
    isOnline: false
  },
  {
    id: 3,
    username: "mike_creates",
    displayName: "Mike Rodriguez",
    avatar: "https://picsum.photos/seed/mike/100/100",
    bio: "Digital Art | UI/UX Design | Music Producer",
    university: "RISD",
    year: "Senior",
    location: "Providence, RI",
    followers: 378,
    following: 145,
    isOnline: true
  },
  {
    id: 4,
    username: "emma_learns",
    displayName: "Emma Wilson",
    avatar: "https://picsum.photos/seed/emma/100/100",
    bio: "Psychology Major | Research Assistant | Book Worm",
    university: "NYU",
    year: "Junior",
    location: "New York, NY",
    followers: 198,
    following: 167,
    isOnline: true
  },
  {
    id: 5,
    username: "dev_danny",
    displayName: "Daniel Kim",
    avatar: "https://picsum.photos/seed/danny/100/100",
    bio: "Full Stack Dev | Hackathon Winner | Gaming Enthusiast",
    university: "MIT",
    year: "Graduate",
    location: "Boston, MA",
    followers: 445,
    following: 223,
    isOnline: false
  }
];

export const communities = [
  {
    id: 1,
    name: "CodeCoffee",
    description: "Developers sharing code snippets and programming tips",
    memberCount: 1247,
    category: "Technology",
    color: "#8B5CF6",
    trending: true,
    tags: ["programming", "coding", "tech"]
  },
  {
    id: 2,
    name: "StudyBuddies",
    description: "Find study partners and share study materials",
    memberCount: 892,
    category: "Academic",
    color: "#3B82F6",
    trending: true,
    tags: ["study", "academic", "collaboration"]
  },
  {
    id: 3,
    name: "ArtistsCorner",
    description: "Creative minds sharing artwork and inspiration",
    memberCount: 634,
    category: "Creative",
    color: "#10B981",
    trending: false,
    tags: ["art", "creative", "design"]
  },
  {
    id: 4,
    name: "WellnessWarriors",
    description: "Mental health support and wellness tips",
    memberCount: 567,
    category: "Wellness",
    color: "#F59E0B",
    trending: true,
    tags: ["wellness", "mental-health", "support"]
  },
  {
    id: 5,
    name: "CampusEvents",
    description: "Local campus events and meetups",
    memberCount: 1103,
    category: "Events",
    color: "#EF4444",
    trending: false,
    tags: ["events", "campus", "social"]
  }
];

export const posts = [
  {
    id: 1,
    userId: 1,
    username: "alex_codes",
    displayName: "Alex Chen",
    avatar: "https://picsum.photos/seed/alex/100/100",
    community: "CodeCoffee",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    mood: "excited",
    type: "text",
    content: "Just discovered this amazing React hook pattern! 🚀 Anyone else using custom hooks for API calls?",
    codeSnippet: `const useAPI = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(url).then(res => res.json()).then(setData).finally(() => setLoading(false));
  }, [url]);
  
  return { data, loading };
};`,
    likes: 23,
    comments: 8,
    shares: 3,
    isLiked: false,
    isAnonymous: false
  },
  {
    id: 2,
    userId: 2,
    username: "sarah_studies",
    displayName: "Sarah Johnson",
    avatar: "https://picsum.photos/seed/sarah/100/100",
    community: "StudyBuddies",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    mood: "focused",
    type: "image",
    content: "My study setup for finals week! Color-coded notes are life 📚✨",
    image: "https://picsum.photos/seed/study1/600/400",
    likes: 45,
    comments: 12,
    shares: 6,
    isLiked: true,
    isAnonymous: false
  },
  {
    id: 3,
    userId: 0, // Anonymous
    username: "anonymous",
    displayName: "", // Empty for anonymous posts
    avatar: "/api/placeholder/40/40",
    community: "WellnessWarriors",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    mood: "thoughtful",
    type: "advice",
    content: "Feeling overwhelmed with midterms... any tips for managing stress? Looking for some genuine advice from fellow students.",
    likes: 67,
    comments: 23,
    shares: 8,
    isLiked: false,
    isAnonymous: true
  },
  {
    id: 4,
    userId: 3,
    username: "mike_creates",
    displayName: "Mike Rodriguez",
    avatar: "https://picsum.photos/seed/mike/100/100",
    community: "ArtistsCorner",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    mood: "inspired",
    type: "image",
    content: "Working on a new UI concept for a mental health app. Thoughts on the color palette? 🎨",
    image: "https://picsum.photos/seed/ui1/600/400",
    likes: 89,
    comments: 15,
    shares: 12,
    isLiked: true,
    isAnonymous: false
  },
  {
    id: 5,
    userId: 4,
    username: "emma_learns",
    displayName: "Emma Wilson",
    avatar: "https://picsum.photos/seed/emma/100/100",
    community: "StudyBuddies",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    mood: "curious",
    type: "timecapsule",
    content: "Predictions for what college will be like in 2030! Can't wait to see how wrong I am 😅",
    unlockDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Unlocks in 7 days
    isLocked: true,
    likes: 34,
    comments: 5,
    shares: 2,
    isLiked: false,
    isAnonymous: false
  }
];

export const events = [];

export const chatRooms = [
  {
    id: 1,
    name: "CS Study Group",
    type: "study",
    participants: 8,
    lastMessage: "Anyone understand recursion? Need help with assignment 3",
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    avatar: "https://picsum.photos/seed/cs/40/40",
    isActive: true,
    hasNotes: true
  },
  {
    id: 2,
    name: "React Developers",
    type: "community",
    participants: 156,
    lastMessage: "Check out this new component library I found",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    avatar: "https://picsum.photos/seed/react/40/40",
    isActive: false,
    hasNotes: false
  },
  {
    id: 3,
    name: "Finals Prep Squad",
    type: "study",
    participants: 12,
    lastMessage: "Study schedule updated in the notes!",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    avatar: "https://picsum.photos/seed/finals/40/40",
    isActive: true,
    hasNotes: true
  }
];

export const studyNotes = [
  {
    id: 1,
    chatId: 1,
    title: "Data Structures Cheat Sheet",
    content: "## Arrays\n- Fixed size in most languages\n- O(1) access time\n- O(n) search time\n\n## Linked Lists\n- Dynamic size\n- O(n) access time\n- Easy insertion/deletion",
    author: "alex_codes",
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    isEditing: false
  },
  {
    id: 2,
    chatId: 3,
    title: "Finals Schedule",
    content: "## Week 1\n- Monday: Math 101 (2 PM)\n- Wednesday: Chemistry (10 AM)\n- Friday: Physics (1 PM)\n\n## Week 2\n- Monday: Computer Science (3 PM)\n- Thursday: Literature (11 AM)",
    author: "sarah_studies",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isEditing: false
  }
];

export const connections = [
  {
    id: 1,
    name: "Jordan Smith",
    university: "UC Berkeley",
    major: "Mechanical Engineering",
    year: "Sophomore",
    location: "Berkeley, CA",
    avatar: "https://picsum.photos/seed/jordan/100/100",
    mutualConnections: 3,
    isConnected: false
  },
  {
    id: 2,
    name: "Lisa Park",
    university: "University of Tokyo",
    major: "International Business",
    year: "Junior",
    location: "Tokyo, Japan",
    avatar: "https://picsum.photos/seed/lisa/100/100",
    mutualConnections: 1,
    isConnected: false
  },
  {
    id: 3,
    name: "Carlos Miguel",
    university: "Universidad de Barcelona",
    major: "Architecture",
    year: "Graduate",
    location: "Barcelona, Spain",
    avatar: "https://picsum.photos/seed/carlos/100/100",
    mutualConnections: 5,
    isConnected: false
  }
];

export const moods = [
  { id: 1, name: "excited", emoji: "🚀", color: "#8B5CF6" },
  { id: 2, name: "focused", emoji: "🎯", color: "#3B82F6" },
  { id: 3, name: "creative", emoji: "🎨", color: "#10B981" },
  { id: 4, name: "thoughtful", emoji: "🤔", color: "#F59E0B" },
  { id: 5, name: "inspired", emoji: "✨", color: "#EC4899" },
  { id: 6, name: "curious", emoji: "🧐", color: "#6366F1" },
  { id: 7, name: "chill", emoji: "😎", color: "#14B8A6" },
  { id: 8, name: "stressed", emoji: "😰", color: "#EF4444" }
];

export const postTypes = [
  { id: 1, name: "Text", description: "Share your thoughts" },
  { id: 2, name: "Image", description: "Share with photos" },
  { id: 3, name: "Code", description: "Share code snippets" },
  { id: 4, name: "Advice", description: "Ask for or give advice" },
  { id: 5, name: "Anonymous", description: "Post anonymously" }
];