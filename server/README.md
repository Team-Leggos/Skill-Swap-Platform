# Skill Swap Platform - Backend

A complete Express.js backend for the Skill Swap Platform, featuring real-time communication, user management, skill swapping, and AI-powered features.

## Features

- **User Authentication & Management**: Supabase integration with JWT tokens
- **Real-time Communication**: Socket.IO for instant messaging and notifications
- **Skill Swapping System**: Complete swap request and management system
- **Session Management**: Meeting sessions with Google Meet integration
- **Feedback System**: User ratings and reviews
- **Admin Panel**: User moderation and system administration
- **AI Integration**: Content moderation and session summarization
- **RESTful API**: Comprehensive API with validation and error handling

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Supabase Auth
- **Real-time**: Socket.IO
- **Validation**: Express-validator
- **AI Service**: External FastAPI service integration
- **Security**: Helmet, CORS, Rate limiting

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Supabase account and project
- Optional: AI service (FastAPI)

## Installation

1. **Clone the repository**

   ```bash
   cd server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/skill_swap_db

   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI Service Configuration
   AI_SERVICE_URL=http://localhost:8000
   ```

4. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Documentation

### Authentication Routes

#### POST `/api/auth/register`

Register a new user

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "skillsOffered": [
    {
      "name": "JavaScript",
      "proficiency": "advanced"
    }
  ],
  "skillsWanted": [
    {
      "name": "Python",
      "proficiency": "beginner"
    }
  ]
}
```

#### POST `/api/auth/login`

Login user

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/me`

Get current user profile

#### PUT `/api/auth/me`

Update user profile

### User Routes

#### GET `/api/users`

Get all users with filtering

```
?skill=javascript&location=NYC&rating=4&page=1&limit=20
```

#### GET `/api/users/:id`

Get user by ID

#### GET `/api/users/:id/public`

Get user's public profile with stats

#### GET `/api/users/me/stats`

Get current user's statistics

### Swap Routes

#### POST `/api/swaps`

Create a new swap request

```json
{
  "offererId": "user_id",
  "skillOffered": {
    "name": "JavaScript",
    "proficiency": "advanced",
    "description": "ES6+, React, Node.js"
  },
  "skillRequested": {
    "name": "Python",
    "proficiency": "beginner",
    "description": "Data analysis and automation"
  },
  "description": "I can help you learn JavaScript in exchange for Python tutoring",
  "duration": 60,
  "scheduledTime": "2024-01-15T14:00:00Z",
  "location": "Online",
  "tags": ["programming", "web-development"]
}
```

#### GET `/api/swaps`

Get user's swaps

```
?status=pending&role=requester&page=1&limit=20
```

#### PUT `/api/swaps/:id/accept`

Accept a swap request

#### PUT `/api/swaps/:id/reject`

Reject a swap request

#### PUT `/api/swaps/:id/complete`

Complete a swap

### Session Routes

#### POST `/api/sessions`

Create a new session

```json
{
  "swapId": "swap_id",
  "scheduledTime": "2024-01-15T14:00:00Z",
  "duration": 60,
  "location": "Google Meet",
  "meetingProvider": "google-meet"
}
```

#### GET `/api/sessions`

Get user's sessions

```
?status=scheduled&upcoming=true&page=1&limit=20
```

#### PUT `/api/sessions/:id/start`

Start a session

#### PUT `/api/sessions/:id/end`

End a session

### Message Routes

#### GET `/api/messages/swap/:swapId`

Get messages for a swap

```
?page=1&limit=50
```

#### POST `/api/messages`

Send a message

```json
{
  "swapId": "swap_id",
  "content": "Hello! When would you like to start?",
  "messageType": "text"
}
```

#### PUT `/api/messages/:id`

Edit a message

#### DELETE `/api/messages/:id`

Delete a message

### Feedback Routes

#### POST `/api/feedback`

Submit feedback

```json
{
  "sessionId": "session_id",
  "toUserId": "user_id",
  "rating": 5,
  "comment": "Great session! Very helpful and patient.",
  "categories": ["knowledge", "communication"],
  "isPublic": true
}
```

#### GET `/api/feedback/user/:userId`

Get feedback for a user

#### GET `/api/feedback/me`

Get user's own feedback

### Admin Routes (Admin only)

#### GET `/api/admin/users`

Get all users for admin

#### PUT `/api/admin/users/:id`

Update user (admin)

#### POST `/api/admin/users/:id/ban`

Ban a user

#### GET `/api/admin/messages/flagged`

Get flagged messages

#### GET `/api/admin/stats`

Get system statistics

### AI Routes

#### POST `/api/ai/moderate`

Moderate content

```json
{
  "content": "Message content to moderate",
  "contentType": "message"
}
```

#### POST `/api/ai/summarize`

Summarize session

```json
{
  "transcript": "Session transcript content",
  "sessionId": "session_id",
  "context": "Additional context"
}
```

#### POST `/api/ai/sentiment`

Analyze sentiment

```json
{
  "content": "Content to analyze"
}
```

## Socket.IO Events

### Client to Server

- `joinSwap`: Join a swap room
- `leaveSwap`: Leave a swap room
- `message`: Send a message
- `typing`: Typing indicator
- `messageRead`: Mark message as read
- `swapUpdate`: Update swap status
- `sessionUpdate`: Update session

### Server to Client

- `newMessage`: New message received
- `userTyping`: User typing indicator
- `messageRead`: Message read receipt
- `swapUpdated`: Swap status updated
- `sessionUpdated`: Session updated
- `newMessageNotification`: New message notification

## Database Models

### User

- Profile information
- Skills offered/wanted
- Role-based access control
- Rating and statistics

### Swap

- Skill exchange requests
- Status management
- Scheduling and notes
- Feedback integration

### Session

- Meeting sessions
- Video call integration
- Transcripts and summaries
- Participant tracking

### Message

- Real-time chat
- File attachments
- Reactions and flags
- Read receipts

### Feedback

- User ratings
- Comments and categories
- Helpful votes
- Moderation flags

## Security Features

- **JWT Authentication**: Supabase JWT verification
- **Role-based Access**: User, moderator, admin roles
- **Input Validation**: Express-validator middleware
- **Rate Limiting**: Request throttling
- **CORS Protection**: Cross-origin resource sharing
- **Helmet Security**: HTTP headers protection
- **Content Moderation**: AI-powered content filtering

## Error Handling

The API uses consistent error responses:

```json
{
  "error": "Error message",
  "details": ["Validation errors"],
  "stack": "Stack trace (development only)"
}
```

## Development

### Running Tests

```bash
npm test
```

### Code Structure

```
server/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── socket/          # Socket.IO handlers
├── server.js        # Main server file
└── package.json     # Dependencies
```

### Environment Variables

- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `AI_SERVICE_URL`: External AI service URL
- `NODE_ENV`: Environment (development/production)

## Deployment

### Production Setup

1. Set `NODE_ENV=production`
2. Configure MongoDB Atlas or cloud database
3. Set up Supabase production project
4. Configure AI service endpoint
5. Set up environment variables
6. Use PM2 or similar process manager

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
