// ConnectHub - Explore Page
import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { users } from '../data/dummyData.js';
import { 
  Search, 
  Users, 
  TrendingUp,
  MapPin,
  Hash,
  Plus
} from 'lucide-react';

const Explore = () => {
  const { state, actions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('communities'); // communities, people
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: 'Academic',
    tags: []
  });
  
  
  const filteredCommunities = state.communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.bio.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-hub-secondary/10 to-hub-accent/10 rounded-xl p-6 border border-hub-secondary/20">
        <h1 className="text-3xl font-bold text-gradient-primary mb-2">
          Explore ConnectHub
        </h1>
        <p className="text-muted-foreground">
          Discover communities and people in your network
        </p>
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {[
              { id: 'communities', label: 'Communities', icon: Hash },
              { id: 'people', label: 'People', icon: Users }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${viewMode === tab.id 
                      ? 'bg-primary text-primary-foreground shadow-glow' 
                      : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>
              {viewMode === 'communities' && `${filteredCommunities.length} communities`}
              {viewMode === 'people' && `${filteredUsers.length} people`}
            </span>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${viewMode}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          {/* Create Community Button */}
          {viewMode === 'communities' && (
            <button
              onClick={() => setShowCreateCommunity(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Create Community
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="animate-fade-in">
        {/* Communities View */}
        {viewMode === 'communities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCommunities.length > 0 ? (
              filteredCommunities.map(community => (
                <div 
                  key={community.id}
                  className="bg-card rounded-xl border border-border shadow-card p-6 hover-lift cursor-pointer"
                  onClick={() => {
                    actions.selectCommunity(community);
                    actions.setCurrentPage('community');
                  }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: community.color + '20' }}
                    >
                      <Hash 
                        className="w-6 h-6"
                        style={{ color: community.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        #{community.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {community.category}
                      </p>
                    </div>
                    {community.trending && (
                      <div className="px-2 py-1 bg-hub-danger/20 text-hub-danger rounded-full">
                        <TrendingUp className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {community.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{(community.memberCount || community.member_count || 0).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex gap-1">
                      {(community.tags || []).slice(0, 2).map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-secondary/50 text-xs text-secondary-foreground rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-card rounded-xl border border-border shadow-card p-12 text-center">
                <Hash className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No communities found
                </h3>
                <p className="text-muted-foreground">
                  Try a different search term
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* People View */}
        {viewMode === 'people' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className="bg-card rounded-xl border border-border shadow-card p-6 hover-lift"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <img 
                        src={user.avatar}
                        alt={user.displayName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-hub-success rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate">
                        {user.displayName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.year} • {user.university}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {user.bio}
                  </p>
                  
                  <div className="flex items-center gap-1 mb-4 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">{user.followers}</strong> followers
                      </span>
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">{user.following}</strong> following
                      </span>
                    </div>
                    
                    <button className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity">
                      Connect
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-card rounded-xl border border-border shadow-card p-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No people found
                </h3>
                <p className="text-muted-foreground">
                  Try a different search term
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Create Community Modal */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border shadow-elevated p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-foreground mb-4">Create Community</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Community Name
                </label>
                <input
                  type="text"
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})}
                  placeholder="Enter community name"
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})}
                  placeholder="Describe your community"
                  rows={3}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <select
                  value={newCommunity.category}
                  onChange={(e) => setNewCommunity({...newCommunity, category: e.target.value})}
                  className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Academic">Academic</option>
                  <option value="Social">Social</option>
                  <option value="Professional">Professional</option>
                  <option value="Hobby">Hobby</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateCommunity(false)}
                className="flex-1 px-4 py-2 bg-secondary/50 text-secondary-foreground rounded-lg hover:bg-secondary/70 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newCommunity.name && newCommunity.description) {
                    actions.addCommunity(newCommunity);
                    setShowCreateCommunity(false);
                    setNewCommunity({ name: '', description: '', category: 'Academic', tags: [] });
                  }
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;