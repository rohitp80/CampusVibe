import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import PostCard from '../components/Post/PostCard.jsx';
import { Bookmark, Heart } from 'lucide-react';

const SavedPosts = () => {
  const { state } = useApp();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Bookmark className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Saved Posts</h1>
        </div>
        <p className="text-muted-foreground">
          Posts you've saved for later viewing
        </p>
      </div>

      {state.savedPosts.length > 0 ? (
        <div className="space-y-6">
          {state.savedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No saved posts yet
          </h3>
          <p className="text-muted-foreground">
            Save posts by clicking the three dots menu and selecting "Save Post"
          </p>
        </div>
      )}
    </div>
  );
};

export default SavedPosts;
