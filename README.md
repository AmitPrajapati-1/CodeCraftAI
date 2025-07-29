# CodeCraft AI

<div align="center">

![CodeCraft AI Logo](https://img.shields.io/badge/CodeCraft-AI-blue?style=for-the-badge&logo=react)

**AI-Powered React Component Generator**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)

</div>

## 🚀 Overview

CodeCraft AI is an intelligent development platform that transforms natural language descriptions into fully functional React components. Built with modern web technologies and powered by AI, it streamlines the component development process for React developers.

## ✨ Key Features

- 🤖 **AI-Powered Generation**: Create components using natural language
- 🎨 **Live Preview**: Real-time component rendering and editing
- 💬 **Interactive AI Chat**: Refine components through conversation
- 🔧 **Visual Property Editor**: Click-to-edit element properties
- 📱 **Responsive Design**: Preview across different screen sizes
- 💾 **Session Management**: Save and organize your work
- 📦 **Export Options**: Download ready-to-use component files
- ⚡ **Real-time Updates**: Instant preview and collaboration

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.4.3** - React framework
- **React 19.1.0** - UI library
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Redis** - Session management
- **JWT** - Authentication
- **OpenAI API** - AI integration

## 📁 Project Structure

```
component-generator-platform/
├── frontend/                 # Next.js React application
│   ├── components/          # React components
│   ├── pages/              # Next.js pages
│   ├── utils/              # Utility functions
│   └── public/             # Static assets
├── backend/                 # Node.js Express API
│   ├── routes/             # API routes
│   ├── models/             # Database models
│   ├── middleware/         # Express middleware
│   └── services/           # Business logic
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- MongoDB database
- Redis server
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AmitPrajapati-1/CodeCraftAI
   cd component-generator-platform
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Environment Setup**
   
   Create `.env.local` in the frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
   
   Create `.env` in the backend directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   OPENAI_API_KEY=your_openai_api_key
   REDIS_URL=your_redis_url
   PORT=5000
   ```

4. **Start the application**
   ```bash
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory)
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage Guide

### Creating Components

1. **Start a Session**: Create a new development session
2. **Describe Your Component**: Use natural language to describe what you want
3. **Preview & Edit**: See your component render in real-time
4. **Refine with AI**: Use the chat to improve your component
5. **Export**: Download your finished component

### Example Prompts

- "Create a modern navigation bar with a logo and menu items"
- "Build a contact form with validation and submit button"
- "Design a card component for displaying product information"
- "Make a responsive hero section with background image"

## 🔧 Development

### Running in Development Mode

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build
npm start

# Backend
cd backend
npm start
```

## 📝 API Documentation

The backend provides RESTful APIs for:

- **Authentication**: User registration and login
- **Sessions**: Create, read, update, delete development sessions
- **AI Chat**: Interactive component generation and refinement
- **File Export**: Download components as React files

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the AI capabilities
- The React and Next.js communities
- All contributors and users of CodeCraft AI

## 📞 Support

If you have any questions or need help, please:

- Open an issue on GitHub
- Check our documentation
- Join our community discussions

---

<div align="center">

**Made with ❤️ by the CodeCraft AI Team**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/codecraft-ai?style=social)](https://github.com/yourusername/codecraft-ai)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/codecraft-ai?style=social)](https://github.com/yourusername/codecraft-ai)

</div> 
