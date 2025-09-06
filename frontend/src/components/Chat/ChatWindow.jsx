// ConnectHub - Chat Window Component
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { chatRooms, studyNotes } from '../../data/dummyData.js';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  BookOpen,
  Edit3,
  Save,
  X,
  Plus
} from 'lucide-react';

const ChatWindow = () => {
  const { state, actions } = useApp();
  const [message, setMessage] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  
  const activeRoom = chatRooms.find(room => room.id === state.activeChat);
  const roomNotes = studyNotes.filter(note => note.chatId === state.activeChat);
  
  const messages = [
    {
      id: 1,
      author: 'alex_codes',
      avatar: 'https://picsum.photos/seed/alex/32/32',
      content: 'Hey everyone! Ready for today\'s study session?',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isOwn: false
    },
    {
      id: 2,
      author: 'sarah_studies',
      avatar: 'https://picsum.photos/seed/sarah/32/32',
      content: 'Yes! I\'ve prepared some questions about recursion',
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      isOwn: false
    },
    {
      id: 3,
      author: 'You',
      avatar: state.currentUser.avatar,
      content: 'Perfect! I\'ll share my notes on data structures',
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      isOwn: true
    }
  ];
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Here you would typically send the message to your backend
    console.log('Sending message:', message);
    setMessage('');
    
    actions.addNotification({
      id: Date.now(),
      type: 'message',
      message: 'Message sent successfully!',
      timestamp: new Date()
    });
  };
  
  const handleSaveNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    
    actions.addStudyNote({
      chatId: state.activeChat,
      title: newNoteTitle,
      content: newNoteContent
    });
    
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowNewNoteForm(false);
    
    actions.addNotification({
      id: Date.now(),
      type: 'note',
      message: 'Study note created successfully!',
      timestamp: new Date()
    });
  };
  
  const handleEditNote = (note) => {
    setEditingNote(note.id);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
  };
  
  const handleUpdateNote = (noteId) => {
    actions.updateStudyNote({
      id: noteId,
      title: newNoteTitle,
      content: newNoteContent
    });
    
    setEditingNote(null);
    setNewNoteTitle('');
    setNewNoteContent('');
  };
  
  if (!activeRoom) {
    return (
      <div className="h-full flex items-center justify-center bg-card border border-border rounded-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No chat selected
          </h3>
          <p className="text-muted-foreground">
            Choose a chat from the sidebar to start collaborating
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img 
            src={activeRoom.avatar}
            alt={activeRoom.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-foreground">{activeRoom.name}</h3>
            <p className="text-sm text-muted-foreground">
              {activeRoom.participants} members • {activeRoom.isActive ? 'Active now' : 'Inactive'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {activeRoom.type === 'study' && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`p-2 rounded-lg transition-colors ${
                showNotes 
                  ? 'bg-primary/20 text-primary' 
                  : 'hover:bg-secondary/50 text-muted-foreground'
              }`}
              title="Study Notes"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          )}
          
          <button className="p-2 hover:bg-secondary/50 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div 
                key={msg.id}
                className={`flex gap-3 ${msg.isOwn ? 'flex-row-reverse' : ''}`}
              >
                <img 
                  src={msg.avatar}
                  alt={msg.author}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                
                <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {msg.author}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div className={`
                    px-4 py-2 rounded-xl
                    ${msg.isOwn 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-secondary/50 text-foreground'
                    }
                  `}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <button 
                    type="button"
                    className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button 
                    type="button"
                    className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    <Smile className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full p-3 bg-secondary/30 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                  rows={2}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
              </div>
              
              <button
                type="submit"
                disabled={!message.trim()}
                className={`
                  p-3 rounded-lg transition-all duration-200 flex-shrink-0
                  ${message.trim()
                    ? 'bg-primary text-primary-foreground hover:opacity-90' 
                    : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                  }
                `}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
        
        {/* Study Notes Sidebar */}
        {showNotes && activeRoom.type === 'study' && (
          <div className="w-80 border-l border-border bg-secondary/10 flex flex-col">
            {/* Notes Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Study Notes
                </h4>
                <button
                  onClick={() => setShowNewNoteForm(true)}
                  className="p-1 hover:bg-secondary/50 rounded transition-colors"
                >
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Collaborative notes for {activeRoom.name}
              </p>
            </div>
            
            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* New Note Form */}
              {showNewNoteForm && (
                <div className="bg-card/50 rounded-lg p-4 border border-border/50">
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full p-2 bg-secondary/30 border border-border/50 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mb-3"
                  />
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Write your note here..."
                    className="w-full p-2 bg-secondary/30 border border-border/50 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 mb-3"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveNote}
                      className="flex-1 px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition-opacity"
                    >
                      <Save className="w-3 h-3 inline mr-1" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowNewNoteForm(false);
                        setNewNoteTitle('');
                        setNewNoteContent('');
                      }}
                      className="px-3 py-1 bg-secondary/50 text-secondary-foreground rounded text-sm hover:bg-secondary/70 transition-colors"
                    >
                      <X className="w-3 h-3 inline mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {/* Existing Notes */}
              {roomNotes.map(note => (
                <div key={note.id} className="bg-card/50 rounded-lg p-4 border border-border/50">
                  {editingNote === note.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="w-full p-2 bg-secondary/30 border border-border/50 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="w-full p-2 bg-secondary/30 border border-border/50 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                        rows={6}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateNote(note.id)}
                          className="flex-1 px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90 transition-opacity"
                        >
                          <Save className="w-3 h-3 inline mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingNote(null);
                            setNewNoteTitle('');
                            setNewNoteContent('');
                          }}
                          className="px-3 py-1 bg-secondary/50 text-secondary-foreground rounded text-sm hover:bg-secondary/70 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm text-foreground">{note.title}</h5>
                        <button
                          onClick={() => handleEditNote(note)}
                          className="p-1 hover:bg-secondary/50 rounded transition-colors"
                        >
                          <Edit3 className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        by {note.author} • {note.timestamp.toLocaleTimeString()}
                      </div>
                      <div className="text-sm text-foreground whitespace-pre-wrap">
                        {note.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {roomNotes.length === 0 && !showNewNoteForm && (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No study notes yet
                  </p>
                  <button
                    onClick={() => setShowNewNoteForm(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity"
                  >
                    Create First Note
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
