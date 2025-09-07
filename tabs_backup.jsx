        {/* Tabs Section - BACKUP */}
        <div className="bg-card border border-border rounded-xl mt-6 max-w-4xl mx-auto">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Posts ({(state.posts || []).filter(post => 
                (post.author === profileUser.username || post.username === profileUser.username) && !post.isAnonymous
              ).length})
            </button>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'requests'
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Friend Requests
                </button>
                <button
                  onClick={() => setActiveTab('friends')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'friends'
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Friends ({friends.length})
                </button>
              </>
            )}
          </div>
          
          <div className="p-8">
            {activeTab === 'posts' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Posts
                </h2>
                
                <div className="space-y-6">
                  {(state.posts || [])
                    .filter(post => (post.author === profileUser.username || post.username === profileUser.username) && !post.isAnonymous)
                    .map(post => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        onLike={() => actions.likePost(post.id)}
                        onComment={(comment) => actions.addComment(post.id, comment)}
                        onShare={() => actions.sharePost(post.id)}
                        onDelete={() => actions.deletePost(post.id)}
                        currentUser={state.user}
                      />
                    ))}
                </div>
              </div>
            )}
            
            {(state.posts || []).filter(post => (post.author === profileUser.username || post.username === profileUser.username) && !post.isAnonymous).length === 0 && (
              <p className="text-muted-foreground text-center py-8">No posts yet</p>
            )}
                </div>

            {activeTab === 'requests' && isOwnProfile && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Friend Requests
                </h2>
                <FriendRequests />
              </div>
            )}
            {activeTab === 'friends' && isOwnProfile && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Friends
                </h2>
                <FriendsList friends={friends} />
              </div>
            )}
          </div>
        </div>
