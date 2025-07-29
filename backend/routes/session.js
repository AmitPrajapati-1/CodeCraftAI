import express from "express";
import Session from "../models/Session.js";
import { authMiddleware } from "../middleware/auth.js";
import { generateComponent } from "../services/ai.js";
import redisClient from '../services/redisClient.js';

const router = express.Router();

// Function to generate session name from chat content
async function generateSessionName(chatHistory) {
  if (!chatHistory || chatHistory.length === 0) {
    return "New Session";
  }

  try {
    // Get the first user message to understand what the session is about
    const firstUserMessage = chatHistory.find(msg => msg.role === "user");
    if (!firstUserMessage) {
      return "New Session";
    }

    // Create a prompt to generate a descriptive name
    const prompt = `Based on this user request, generate a short, descriptive session name (max 50 characters) that captures the main component or feature being created. Only return the name, nothing else.

User request: "${firstUserMessage.content}"

Examples:
- "Login Form" (for login components)
- "Navigation Bar" (for navigation components)
- "Product Card" (for product display components)
- "Contact Form" (for contact forms)
- "Dashboard Layout" (for dashboard components)

Session name:`;

    // Use the AI service to generate a name
    const response = await generateComponent(prompt, [], null, "", "");
    
    // Clean up the response to get just the name
    let sessionName = response.trim();
    
    // Remove quotes, extra spaces, and limit length
    sessionName = sessionName.replace(/^["']|["']$/g, '').trim();
    
    // Limit to 50 characters
    if (sessionName.length > 50) {
      sessionName = sessionName.substring(0, 47) + "...";
    }
    
    // Fallback if AI response is empty or invalid
    if (!sessionName || sessionName === "Session name:" || sessionName.length < 2) {
      // Extract key words from the user message
      const words = firstUserMessage.content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 3)
        .slice(0, 3);
      
      if (words.length > 0) {
        sessionName = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + " Component";
      } else {
        sessionName = "New Session";
      }
    }
    
    return sessionName;
  } catch (error) {
    console.error("Error generating session name:", error);
    return "New Session";
  }
}

// Get all sessions
router.get("/", authMiddleware, async (req, res) => {
  console.log("Fetching sessions for userId:", req.userId); // Debug log
  const sessions = await Session.find({ userId: req.userId });
  res.json(sessions);
});

// Create a new session
router.post("/", authMiddleware, async (req, res) => {
  const session = await Session.create({ userId: req.userId, name: "New Session", chatHistory: [] });
  res.json(session);
});

// Get specific session with Redis cache
router.get("/:id", authMiddleware, async (req, res) => {
  const cacheKey = `session:${req.params.id}`;
  let session = await redisClient.get(cacheKey);

  if (session) {
    session = JSON.parse(session);
    return res.json(session);
  }

  session = await Session.findById(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  // Convert image buffers to base64 data URLs
  const chatHistory = (session.chatHistory || []).map(msg => {
    if (msg.image && msg.image.data && msg.image.contentType) {
      return {
        ...msg.toObject(),
        image: `data:${msg.image.contentType};base64,${msg.image.data.toString('base64')}`
      };
    }
    return msg;
  });
  const sessionObj = { ...session.toObject(), chatHistory };
  await redisClient.set(cacheKey, JSON.stringify(sessionObj), { EX: 60 * 5 });
  res.json(sessionObj);
});

// Save session (auto-save) and invalidate cache
router.post("/:id/save", authMiddleware, async (req, res) => {
  const { chatHistory, jsx, css, editorState } = req.body;
  
  // Auto-detect session name if it's still "New Session" and we have chat history
  let sessionName = null;
  const currentSession = await Session.findById(req.params.id);
  
  if (currentSession && currentSession.name === "New Session" && chatHistory && chatHistory.length > 0) {
    sessionName = await generateSessionName(chatHistory);
  }
  
  const updateData = { chatHistory, jsx, css, editorState };
  if (sessionName) {
    updateData.name = sessionName;
  }
  
  await Session.findByIdAndUpdate(req.params.id, updateData);
  await redisClient.del(`session:${req.params.id}`); // Invalidate cache
  res.json({ message: "Saved", sessionName });
});

// Chat with AI (generate component)
router.post("/:id/chat", authMiddleware, async (req, res) => {
  let { prompt, currentJsx, currentCss } = req.body;
  let history = [];
  try {
    history = JSON.parse(req.body.history || "[]");
  } catch (e) {}
  // Augment the prompt
  prompt = `Create a React function component named Component for the following: ${prompt}\nDo NOT use HTML, <html>, <body>, <head>, or markdown. Only output a function component and CSS, separated by /* CSS */.`;

  // Save user message to chatHistory
  const userMessage = {
    role: "user",
    content: prompt
  };
  // Get session and update chatHistory
  const session = await Session.findById(req.params.id);
  if (session) {
    session.chatHistory.push(userMessage);
    await session.save();
  }

  // AI response
  const code = await generateComponent(prompt, history, null, currentJsx, currentCss);

  const aiMessage = { role: "assistant", content: code };
  if (session) {
    session.chatHistory.push(aiMessage);
    await session.save();
  }

  res.json({ code });
});

export default router;
