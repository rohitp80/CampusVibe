// ConnectHub - Main App Layout
import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import TopNav from '../components/Layout/TopNav.jsx';
import Sidebar from '../components/Layout/Sidebar.jsx';
import RightSidebar from '../components/Layout/RightSidebar.jsx';
import Feed from '../components/Feed/Feed.jsx';
import Explore from './Explore.jsx';
import Local from './Local.jsx';
import Wellness from './Wellness.jsx';
import Profile from './Profile.jsx';
import Chat from './Chat.jsx';

const Index = () => {
  const { state, actions } = useApp();
  
  const renderPage = () => {
    switch (state.currentPage) {
      case 'explore': return <Explore />;
      case 'local': return <Local />;
      case 'wellness': return <Wellness />;
      case 'profile': return <Profile />;
      case 'chat': return <Chat />;
      default: return <Feed />;
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <div className="flex">
        {/* Left Sidebar - Fixed positioning */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className={`
          flex-1 transition-all duration-300 ease-out
          ${state.sidebarCollapsed 
            ? 'ml-0 lg:ml-16' 
            : 'ml-0 lg:ml-80'
          }
        `}>
          <main className="min-h-[calc(100vh-4rem)] xl:mr-80">
            <div className="p-4 lg:p-6">
              {renderPage()}
            </div>
          </main>
        </div>
        
        {/* Right Sidebar - Fixed positioning */}
        <RightSidebar />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {!state.sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => actions.toggleSidebar()}
        />
      )}
    </div>
  );
};

export default Index;
