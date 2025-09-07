import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { supabase } from '../../lib/supabase.js';
import { X, Plus, Hash, Users, Tag } from 'lucide-react';

const CreateCommunity = ({ onClose }) => {
  const { actions } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Academic', 'Technology', 'Sports', 'Arts', 'Music', 
    'Gaming', 'Study Groups', 'Events', 'Social', 'Other'
  ];

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Community name is required',
        timestamp: new Date()
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        actions.addNotification({
          id: Date.now(),
          type: 'error',
          message: 'Please log in to create a community',
          timestamp: new Date()
        });
        return;
      }

      // Create community in database
      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          category: category || null,
          color: color,
          tags: tags.length > 0 ? tags : null,
          creator_id: session.user.id,
          member_count: 1 // Creator is first member
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating community:', error);
        actions.addNotification({
          id: Date.now(),
          type: 'error',
          message: error.message.includes('duplicate') 
            ? 'Community name already exists' 
            : 'Failed to create community',
          timestamp: new Date()
        });
      } else {
        // Add creator as first member
        await supabase
          .from('community_members')
          .insert({
            community_id: data.id,
            user_id: session.user.id,
            role: 'admin'
          });

        // Add to local state
        actions.addCommunity(data);

        actions.addNotification({
          id: Date.now(),
          type: 'success',
          message: `Community "${name}" created successfully! 🎉`,
          timestamp: new Date()
        });

        onClose();
      }
    } catch (error) {
      console.error('Error creating community:', error);
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Failed to create community',
        timestamp: new Date()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Create Community</h2>
              <p className="text-sm text-muted-foreground">Build your community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-secondary/50 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Community Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Community Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter community name"
              className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">{name.length}/50 characters</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your community about?"
              rows={3}
              className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/200 characters</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Community Color</label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(colorOption => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === colorOption ? 'border-foreground scale-110' : 'border-border'
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                className="flex-1 px-3 py-2 bg-secondary/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-secondary/50 rounded-md text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="w-4 h-4 hover:bg-secondary/70 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-secondary/50 hover:bg-secondary/70 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunity;
