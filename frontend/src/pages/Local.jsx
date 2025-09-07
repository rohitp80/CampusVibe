// ConnectHub - Local Page
import React, { useState } from 'react';
import EventCard from '../components/Events/EventCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { 
  MapPin, 
  Calendar, 
  Plus, 
  Filter, 
  Search,
  Navigation,
  Clock
} from 'lucide-react';

const Local = () => {
  const { state, actions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const eventTypes = ['all', 'Workshop', 'Study Group', 'Social', 'Wellness', 'Academic'];
  
  const filteredEvents = state.events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = state.eventFilter === 'all' || event.category === state.eventFilter;
    return matchesSearch && matchesFilter;
  });
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Social',
    notes: ''
  });
  
  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location) return;
    
    const eventToCreate = {
      title: newEvent.title,
      description: newEvent.description,
      date: new Date(newEvent.date + 'T' + newEvent.time),
      time: newEvent.time,
      location: newEvent.location,
      organizer: "You",
      attendees: 1,
      maxAttendees: 50,
      category: newEvent.category,
      isAttending: true,
      notes: newEvent.notes,
      image: "https://picsum.photos/seed/" + Date.now() + "/400/200"
    };
    
    actions.addEvent(eventToCreate);
    
    // Reset form
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: 'Social',
      notes: ''
    });
    setShowCreateEvent(false);
  };
  
  const quickLocations = [
    { name: "Main Library", distance: "0.2 mi", type: "Study" },
    { name: "Student Union", distance: "0.3 mi", type: "Social" },
    { name: "Computer Lab", distance: "0.4 mi", type: "Tech" },
    { name: "Campus Gym", distance: "0.5 mi", type: "Fitness" },
    { name: "Art Building", distance: "0.6 mi", type: "Creative" },
    { name: "Coffee Shop", distance: "0.1 mi", type: "Social" }
  ];
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-hub-accent/10 to-hub-success/10 rounded-xl p-6 border border-hub-accent/20">
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="w-8 h-8 text-hub-accent" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">
              Local Events
            </h1>
            <p className="text-muted-foreground">
              Discover and create events in your area
            </p>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search events, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={state.eventFilter}
                onChange={(e) => actions.setEventFilter(e.target.value)}
                className="px-3 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Events' : type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateEvent(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>
      </div>
      
      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-elevated max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Create Local Event</h3>
                <button
                  onClick={() => setShowCreateEvent(false)}
                  className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full p-3 bg-secondary/30 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    placeholder="Enter event title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    className="w-full h-24 p-3 bg-secondary/30 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    placeholder="Describe your event"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 bg-secondary/30 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      className="w-full p-3 bg-secondary/30 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    className="w-full p-3 bg-secondary/30 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    placeholder="Enter location"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category
                    </label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                      className="w-full p-3 bg-secondary/30 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    >
                      {eventTypes.slice(1).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Notes/Requirements
                    </label>
                    <input
                      type="text"
                      value={newEvent.notes}
                      onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                      className="w-full p-3 bg-secondary/30 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                      placeholder="Special requirements or notes"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateEvent(false)}
                    className="flex-1 px-6 py-3 bg-secondary/50 text-secondary-foreground rounded-lg font-medium hover:bg-secondary/70 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <div className="col-span-full bg-card rounded-xl border border-border shadow-card p-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No events found
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Be the first to create an event in your area!'
              }
            </p>
            <button
              onClick={() => setShowCreateEvent(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create First Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Local;