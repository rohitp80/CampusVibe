import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ArrowLeft, Calendar, MapPin, Users, Megaphone, Plus } from 'lucide-react';

const EventDetail = () => {
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState('details');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  
  const eventId = state.selectedEventId;
  const event = state.events.find(e => e.id === eventId);
  
  if (!event) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Event not found</h2>
          <button 
            onClick={() => actions.setCurrentPage('local')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }
  
  const currentUsername = state.currentUser?.username;
  const currentDisplayName = state.currentUser?.displayName;
  
  const isOrganizer = event.organizer === currentUsername || 
                     event.organizer === currentDisplayName ||
                     event.createdBy === currentUsername ||
                     event.createdBy === state.currentUser?.id;
  
  console.log('Organizer check:', {
    eventOrganizer: event.organizer,
    eventCreatedBy: event.createdBy,
    currentUsername,
    currentDisplayName,
    currentUserId: state.currentUser?.id,
    isOrganizer
  });
  
  const announcements = event.announcements || [];
  
  const handleAddAnnouncement = () => {
    if (!newAnnouncement.trim() || !isOrganizer) {
      console.log('Cannot post announcement:', { hasContent: !!newAnnouncement.trim(), isOrganizer });
      return;
    }
    
    console.log('Adding announcement:', newAnnouncement);
    
    const announcement = {
      id: Date.now(),
      content: newAnnouncement.trim(),
      author: state.currentUser?.username || state.currentUser?.displayName || 'Organizer',
      timestamp: new Date()
    };
    
    console.log('Created announcement:', announcement);
    
    actions.addEventAnnouncement(eventId, announcement);
    setNewAnnouncement('');
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => actions.setCurrentPage('local')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </button>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">{event.title}</h1>
          <p className="text-muted-foreground mb-4">{event.description}</p>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{event.date?.toLocaleDateString()} • {event.time}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{event.attendees} attending</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'announcements'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Announcements ({announcements.length})
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold mb-4">Event Details</h3>
              <div className="space-y-3 text-sm">
                <div><strong>Organizer:</strong> {event.organizer}</div>
                <div><strong>Category:</strong> {event.category}</div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'announcements' && (
          <div className="bg-card rounded-lg border border-border h-96 flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {announcements.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No announcements yet
                </div>
              ) : (
                announcements.map(announcement => (
                  <div key={announcement.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {announcement.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{announcement.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {announcement.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-secondary/20 rounded-lg p-3">
                        <p className="text-sm">{announcement.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Chat Input - Only for Organizer */}
            {isOrganizer && (
              <div className="border-t border-border p-4">
                <div className="flex gap-3">
                  <textarea
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder="Type your announcement..."
                    className="flex-1 p-3 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddAnnouncement();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddAnnouncement}
                    disabled={!newAnnouncement.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
