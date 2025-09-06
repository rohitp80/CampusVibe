import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { communities } from '../data/dummyData';
import { Hash, Users, MessageCircle } from 'lucide-react';

const Community = () => {
  const { state, actions } = useApp();
  
  // Simple fallback logic
  const currentCommunity = communities[0]; // Just use first community for now
  
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <h1 className="text-2xl font-bold mb-4">Community Page</h1>
        
        {currentCommunity ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Hash className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">#{currentCommunity.name}</h2>
                <p className="text-muted-foreground">{currentCommunity.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{currentCommunity.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>Category: {currentCommunity.category}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Tags:</h3>
              <div className="flex gap-2">
                {currentCommunity.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-3 py-1 bg-secondary/50 text-secondary-foreground rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p>No community data available</p>
        )}
        
        <div className="mt-6">
          <button 
            onClick={() => actions.setCurrentPage('explore')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Back to Explore
          </button>
        </div>
      </div>
    </div>
  );
};

export default Community;
