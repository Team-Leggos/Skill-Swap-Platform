# 3D Collaborative Workspace

A full-stack application demonstrating advanced web technologies including React with 3D graphics, real-time collaboration, AI integration, and modern backend architecture.

## Architecture Overview

This project implements the comprehensive architectural blueprint for a modern web application featuring:

### Frontend (React + 3D)
- **React 18** with TypeScript for robust UI development
- **React Three Fiber** + **Three.js** for high-performance 3D rendering
- **Framer Motion** for smooth animations and micro-interactions
- **Tailwind CSS** with custom design system
- **Real-time collaboration** via Socket.IO client

### Backend (Express.js + MongoDB)
- **Express.js** API server with comprehensive middleware
- **Socket.IO** for real-time bidirectional communication
- **MongoDB** with **Mongoose** for structured data persistence
- **Supabase** authentication integration
- **JWT** token validation and session management

### AI Service (FastAPI + Gemini)
- **FastAPI** high-performance Python API
- **Google Gemini 2.0 Flash** for advanced AI capabilities
- **LangChain** for LLM orchestration and agent workflows
- **LangGraph** for complex multi-step agent reasoning

## Features

### 🎨 3D Workspace
- Interactive 3D scene with optimized rendering
- Real-time object manipulation and collaboration
- Advanced lighting system with dynamic effects
- Particle systems for visual enhancement
- Performance-optimized with 60+ FPS targeting

### 🤝 Real-time Collaboration
- Multi-user presence indicators
- Live scene synchronization across clients
- Real-time chat with persistent history
- User authentication and session management

### 🤖 AI Integration
- Natural language 3D scene generation
- Intelligent design suggestions
- Performance analysis and optimization recommendations
- Conversational AI assistant for 3D workflows

### 🔒 Security & Performance
- JWT-based authentication with Supabase
- Rate limiting and CORS protection
- Optimized 3D asset loading and caching
- Responsive design with mobile support

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ and pip
- MongoDB (local or Atlas)
- Supabase account
- Google AI Studio API key

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your Supabase credentials to .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Start development server
npm run dev
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure MongoDB and other services in .env
MONGODB_URI=mongodb://localhost:27017/3d-workspace
CLIENT_URL=http://localhost:5173

# Start backend server
npm run dev
```

### 3. AI Service Setup

```bash
# Navigate to AI service directory
cd ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Add your Gemini API key to .env
GEMINI_API_KEY=your-gemini-api-key

# Start AI service
uvicorn main:app --reload --port 8000
```

### 4. Database Setup

Ensure MongoDB is running locally or configure MongoDB Atlas connection string in the backend `.env` file.

## Project Structure

```
├── src/                          # React frontend
│   ├── components/
│   │   ├── 3d/                  # Three.js components
│   │   ├── auth/                # Authentication UI
│   │   ├── workspace/           # Main workspace components
│   │   └── ui/                  # Reusable UI components
│   ├── contexts/                # React contexts (Auth, Socket)
│   └── types/                   # TypeScript definitions
├── backend/                     # Express.js backend
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API routes
│   ├── middleware/              # Custom middleware
│   └── server.js               # Main server file
├── ai-service/                  # FastAPI AI service
│   ├── agents/                  # LangChain agents
│   ├── tools/                   # Custom AI tools
│   └── main.py                 # FastAPI application
└── docs/                       # Documentation
```

## Key Technologies

### 3D Graphics & Performance
- **React Three Fiber**: Declarative 3D with React
- **Three.js**: WebGL-based 3D rendering
- **@react-three/drei**: Useful 3D components and utilities
- **Optimized rendering**: LOD, frustum culling, instanced meshes

### Real-time Communication
- **Socket.IO**: WebSocket-based real-time communication
- **Express Sessions**: Session management integration
- **CORS**: Comprehensive cross-origin configuration

### AI & Machine Learning
- **Google Gemini 2.0 Flash**: State-of-the-art language model
- **LangChain**: LLM application framework
- **LangGraph**: Agent workflow orchestration
- **FastAPI**: High-performance async Python API

### Authentication & Security
- **Supabase Auth**: Managed authentication service
- **JWT**: Stateless token-based authentication
- **Rate Limiting**: API protection
- **Helmet.js**: Security headers

## Development Guidelines

### 3D Performance Best Practices
- Keep active meshes under 100 for 60+ FPS
- Use power-of-2 texture dimensions (256x256, 512x512)
- Implement LOD for distance-based optimization
- Employ frustum culling for off-screen objects
- Use `useRef` for 3D object references to avoid React re-renders

### Real-time Collaboration
- Implement optimistic updates for smooth UX
- Use debouncing for high-frequency updates
- Handle connection failures gracefully
- Persist critical state in MongoDB

### AI Integration
- Design prompts for specific 3D use cases
- Implement proper error handling for AI services
- Use streaming responses for better UX
- Cache AI responses when appropriate

## API Documentation

### REST API Endpoints
- `GET /api/health` - Service health check
- `GET /api/scene` - Retrieve scene objects
- `GET /api/messages` - Chat message history

### Socket.IO Events
- `chat_message` - Real-time chat
- `scene_update` - 3D object modifications
- `user_joined/left` - User presence
- `users_updated` - Active user list

### AI Service Endpoints
- `POST /chat` - Conversational AI assistance
- `POST /generate-scene` - AI-powered scene generation
- `POST /analyze-performance` - Performance optimization analysis

## Production Deployment

### Frontend (Vite Build)
```bash
npm run build
# Deploy dist/ folder to CDN or static hosting
```

### Backend (Express.js)
```bash
# Use PM2 for production process management
npm install -g pm2
pm2 start server.js --name "3d-workspace-backend"
```

### AI Service (FastAPI)
```bash
# Use Gunicorn with Uvicorn workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React Three Fiber community for excellent 3D React integration
- Socket.IO team for robust real-time communication
- Google AI team for the powerful Gemini API
- LangChain community for LLM application frameworks