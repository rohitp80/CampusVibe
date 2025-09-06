# ConnectHub - College-Focused Social Media Platform

A modern, dark-themed social media web app built for college students with React + Vite.

## Features ✨

- **Social Feed** - Post text, images, code snippets with mood-based sharing
- **Collaborative Chat** - Group study chats with integrated note-taking
- **Event Discovery** - Create and join local campus events 
- **AI Feedback** - Upload code/projects for instant AI analysis
- **Time Capsules** - Posts that unlock on future dates
- **Anonymous Advice** - Safe space for sensitive topics
- **Wellness Hub** - Mental health resources and mood tracking
- **Skills Tracking** - Monitor learning progress and achievements

## Tech Stack 🛠️

- **Frontend**: React 18, Vite, JavaScript (not TypeScript as requested)
- **Styling**: Tailwind CSS with custom design system
- **State**: Context API with useReducer
- **Icons**: Lucide React
- **Theme**: Dark mode by default with toggle

## Quick Start 🚀

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Adding Tailwind to Vite

Tailwind CSS is already configured. The config includes:

```js
// tailwind.config.js
export default {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // ... custom theme with ConnectHub colors
}
```

## Project Structure 📁

```
src/
├── components/
│   ├── Layout/          # Navigation, sidebars
│   ├── Post/            # Post cards, creation
│   ├── Chat/            # Messaging system
│   ├── Events/          # Event components
│   └── AI/              # AI feedback tools
├── pages/               # Main application pages
├── context/             # Global state management
├── data/                # Mock data and types
└── index.css           # Design system & utilities
```

## Key Features Implementation

### 🎨 Design System
- Purple/blue gradient theme with semantic color tokens
- Responsive layout with collapsible sidebars
- Smooth animations and hover effects
- Dark-first design with light mode toggle

### 📱 Responsive Layout
- Mobile: Stacked layout with collapsible sidebar
- Tablet: Adjusted spacing and component sizing  
- Desktop: Full three-column layout with sidebars

### 🔄 Real-time Features
- Local state updates for posts, reactions, events
- Simulated AI feedback with loading states
- Time capsule unlock animations
- Live chat interface with study notes

### 🎯 Interactive Elements
- Mood-based posting with emoji selection
- Community filtering and trending topics
- Event RSVP and attendance tracking
- Collaborative study note editing

## Backend Suggestions 💾

For production deployment, consider:

- **Node.js + Express** with MongoDB for data persistence
- **Firebase** for real-time chat and authentication
- **Supabase** for PostgreSQL database with real-time subscriptions
- **Socket.io** for live messaging and collaborative editing

## Contributing 🤝

This is a demo project showcasing modern React patterns and college-focused features. All functionality is frontend-only with simulated backend responses.

Built with ❤️ for the college community!