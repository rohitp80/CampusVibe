// ConnectHub - Event Card Component
import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  ExternalLink,
  UserCheck,
  UserPlus
} from 'lucide-react';

const EventCard = ({ event }) => {
  const { actions } = useApp();
  
  const handleEventClick = () => {
    actions.setSelectedEvent(event.id);
  };
  
  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  const getAttendancePercentage = () => {
    return Math.round((event.attendees / event.maxAttendees) * 100);
  };
  
  const getCategoryColor = (category) => {
    const colors = {
      'Workshop': '#8B5CF6',
      'Study Group': '#3B82F6', 
      'Exhibition': '#10B981',
      'Wellness': '#F59E0B',
      'Social': '#EF4444',
      'Academic': '#6366F1'
    };
    return colors[category] || '#6B7280';
  };
  
  return (
    <div 
      onClick={handleEventClick}
      className="bg-card rounded-xl border border-border shadow-card hover-lift overflow-hidden animate-fade-in cursor-pointer transition-transform hover:scale-105"
    >
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Category Badge */}
        <div 
          className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: getCategoryColor(event.category) }}
        >
          {event.category}
        </div>
        
        {/* Date Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
          <div className="text-xs font-medium text-gray-600">
            {formatDate(event.date)}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {event.date.getDate()}
          </div>
        </div>
      </div>
      
      {/* Event Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
            {event.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {event.description}
          </p>
        </div>
        
        {/* Event Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>{event.time}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>{event.attendees} people joined</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span>Requirements: {event.notes || 'None specified'}</span>
          </div>
        </div>
        
        {/* Action Button */}
        <button
          onClick={() => actions.toggleEventAttendance(event.id)}
          className={`
            w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
            ${event.isAttending 
              ? 'bg-hub-success/20 text-hub-success hover:bg-hub-success/30 border border-hub-success/30' 
              : 'bg-primary text-primary-foreground hover:opacity-90 shadow-glow'
            }
          `}
        >
          {event.isAttending ? (
            <>
              <UserCheck className="w-4 h-4" />
              Attending
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              Join Event
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EventCard;