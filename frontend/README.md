# CodeCraft AI

An AI-powered React component generator that helps developers create beautiful, functional React components through natural language prompts.

## Features

- 🤖 **AI-Powered Generation**: Create React components using natural language descriptions
- 🎨 **Live Preview**: See your components render in real-time as you edit
- 💬 **Interactive Chat**: Have conversations with AI to refine and improve your components
- 🔧 **Visual Editor**: Click on elements to modify properties directly
- 📱 **Responsive Design**: Preview components across different screen sizes
- 💾 **Session Management**: Save and manage your component development sessions
- 📦 **Export Options**: Download your components as ready-to-use files

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **AI**: OpenAI GPT integration
- **Real-time**: WebSocket communication for live updates

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB
- Redis (for session management)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd component-generator-platform
```

2. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Set up environment variables:
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000

# Backend (.env)
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
REDIS_URL=your_redis_url
```

4. Start the development servers:
```bash
# Backend (from backend directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to start using CodeCraft AI

## Usage

1. **Create a Session**: Start a new component development session
2. **Describe Your Component**: Use natural language to describe what you want to build
3. **Preview & Edit**: See your component render in real-time and make adjustments
4. **Refine with AI**: Use the chat interface to improve your component
5. **Export**: Download your finished component as a React file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
