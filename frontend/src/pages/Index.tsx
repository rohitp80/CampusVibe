// ConnectHub - Main App Layout
import React from 'react';
import { useApp } from '../context/AppContext';
import TopNav from '../components/Layout/TopNav';
import Sidebar from '../components/Layout/Sidebar';
import RightSidebar from '../components/Layout/RightSidebar';
import Feed from '../components/Feed/Feed';
import Explore from './Explore';
import Community from './Community';
import Local from './Local';
import Wellness from './Wellness';
import Profile from './Profile';
import Chat from './Chat';
import SavedPosts from './SavedPosts';
import EventDetail from './EventDetail';

const Index = () => {
  const { state, actions } = useApp();
  
  const renderPage = () => {
    console.log('renderPage called with currentPage:', state.currentPage);
    switch (state.currentPage) {
      case 'feed': return <Feed />;
      case 'explore': return <Explore />;
      case 'community': return <Community />;
      case 'local': return <Local />;
      case 'wellness': return <Wellness />;
      case 'saved': return <SavedPosts />;
      case 'profile': return <Profile />;
      case 'chat': return <Chat preSelectedFriend={state.selectedChatFriend} />;
      case 'eventDetail': return <EventDetail />;
      default: 
        console.log('Default case hit! currentPage was:', state.currentPage);
        return <Feed />;
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
