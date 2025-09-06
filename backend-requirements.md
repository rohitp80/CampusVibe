# CampusConnect Backend Requirements Document

## Project Overview
CampusConnect is a comprehensive social platform for university students featuring social feeds, skill tracking, wellness monitoring, local events, and real-time communication.

## Core Features Analysis

### 1. User Management System
**Required APIs:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/logout` - User logout

**User Schema:**
```json
{
  "id": "string",
  "username": "string",
  "displayName": "string",
  "email": "string",
  "avatar": "string",
  "bio": "string",
  "university": "string",
  "year": "string",
  "location": "string",
  "followers": "number",
  "following": "number",
  "isOnline": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### 2. Social Feed System
**Required APIs:**
- `GET /posts` - Get paginated posts with filters
- `POST /posts` - Create new post
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post
- `POST /posts/:id/like` - Like/unlike post
- `GET /posts/:id/comments` - Get post comments
- `POST /posts/:id/comments` - Add comment

**Post Schema:**
```json
{
  "id": "string",
  "userId": "string",
  "communityId": "string",
  "type": "text|image|code|advice",
  "content": "string",
  "codeSnippet": "string",
  "image": "string",
  "mood": "string",
  "isAnonymous": "boolean",
  "likes": "number",
  "comments": "number",
  "shares": "number",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### 3. Community Management
**Required APIs:**
- `GET /communities` - List all communities
- `GET /communities/:id` - Get community details
- `POST /communities` - Create community
- `POST /communities/:id/join` - Join community
- `DELETE /communities/:id/leave` - Leave community

**Community Schema:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "memberCount": "number",
  "category": "string",
  "color": "string",
  "trending": "boolean",
  "tags": "array",
  "createdAt": "datetime"
}
```

### 4. Events System
**Required APIs:**
- `GET /events` - Get events with filters
- `POST /events` - Create event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event
- `POST /events/:id/attend` - Mark attendance
- `GET /events/:id/attendees` - Get attendee list

**Event Schema:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "organizer": "string",
  "location": "string",
  "date": "datetime",
  "attendees": "number",
  "maxAttendees": "number",
  "tags": "array",
  "createdAt": "datetime"
}
```

### 5. Real-time Chat System
**Required APIs:**
- `GET /chat/rooms` - Get user's chat rooms
- `POST /chat/rooms` - Create chat room
- `GET /chat/rooms/:id/messages` - Get chat messages
- `POST /chat/rooms/:id/messages` - Send message
- `WebSocket /chat` - Real-time messaging

**Chat Room Schema:**
```json
{
  "id": "string",
  "name": "string",
  "type": "direct|group|study",
  "participants": "array",
  "lastMessage": "string",
  "lastActivity": "datetime",
  "createdAt": "datetime"
}
```

**Message Schema:**
```json
{
  "id": "string",
  "chatId": "string",
  "userId": "string",
  "content": "string",
  "type": "text|image|file",
  "timestamp": "datetime"
}
```

### 6. Skills Tracking System
**Required APIs:**
- `GET /skills/categories` - Get skill categories
- `GET /users/:id/skills` - Get user skills
- `PUT /users/:id/skills` - Update user skills
- `GET /users/:id/achievements` - Get user achievements
- `POST /users/:id/achievements` - Award achievement

**Skill Schema:**
```json
{
  "id": "string",
  "userId": "string",
  "categoryId": "string",
  "name": "string",
  "level": "number",
  "trend": "up|down|stable",
  "updatedAt": "datetime"
}
```

### 7. Wellness Tracking System
**Required APIs:**
- `GET /wellness/moods` - Get mood history
- `POST /wellness/moods` - Log mood
- `GET /wellness/goals` - Get wellness goals
- `POST /wellness/goals` - Create goal
- `PUT /wellness/goals/:id` - Update goal completion
- `GET /wellness/stats` - Get wellness statistics

**Wellness Schema:**
```json
{
  "id": "string",
  "userId": "string",
  "type": "mood|goal|sleep",
  "value": "string",
  "completed": "boolean",
  "date": "date",
  "createdAt": "datetime"
}
```

### 8. Study Notes System
**Required APIs:**
- `GET /notes` - Get user's study notes
- `POST /notes` - Create study note
- `PUT /notes/:id` - Update study note
- `DELETE /notes/:id` - Delete study note
- `POST /notes/:id/share` - Share note with chat room

**Study Note Schema:**
```json
{
  "id": "string",
  "userId": "string",
  "chatId": "string",
  "title": "string",
  "content": "string",
  "subject": "string",
  "tags": "array",
  "isShared": "boolean",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

## Technical Requirements

### Database
- **Primary Database:** PostgreSQL for relational data
- **Cache:** Redis for session management and real-time features
- **File Storage:** AWS S3 or similar for images/files

### Authentication
- JWT-based authentication
- Session management with Redis
- Password hashing with bcrypt

### Real-time Features
- WebSocket connections for chat
- Server-sent events for notifications
- Real-time post updates

### File Upload
- Image upload for posts and avatars
- File sharing in chat rooms
- Image optimization and compression

### Search & Filtering
- Full-text search for posts and users
- Advanced filtering by community, date, mood
- Elasticsearch integration (optional)

### Notifications
- Real-time notifications for likes, comments, messages
- Push notifications (optional)
- Email notifications for important events

## API Architecture

### Base URL Structure
```
/api/v1/
├── /auth/          # Authentication endpoints
├── /users/         # User management
├── /posts/         # Social feed
├── /communities/   # Community management
├── /events/        # Event system
├── /chat/          # Chat system
├── /skills/        # Skills tracking
├── /wellness/      # Wellness features
├── /notes/         # Study notes
└── /search/        # Search functionality
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "string",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Security Requirements
- Input validation and sanitization
- Rate limiting on all endpoints
- CORS configuration
- SQL injection prevention
- XSS protection
- File upload security

## Performance Requirements
- Response time < 200ms for most endpoints
- Support for 1000+ concurrent users
- Efficient pagination for large datasets
- Database indexing for search operations
- Caching strategy for frequently accessed data

## Deployment Requirements
- Docker containerization
- Environment-based configuration
- Health check endpoints
- Logging and monitoring
- Database migrations
- Backup strategy

## Third-party Integrations
- Email service (SendGrid/AWS SES)
- File storage (AWS S3/Cloudinary)
- Analytics (optional)
- University authentication systems (optional)
