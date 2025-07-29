import { useState, useEffect } from "react";
import axios from "axios";

export default function ChatPanel({ sessionId, onNewCode, initialMessages = [], currentJsx = '', currentCss = '', chatInputDraft = '', setChatInputDraft, setChatHistory, onCodeClick }) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  async function sendMessage() {
    if (!chatInputDraft.trim() || sending) return;
    
    setSending(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}/chat`,
        {
          prompt: chatInputDraft,
          history: JSON.stringify(messages),
          currentJsx,
          currentCss
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const code = res.data.code;
      const newMessages = [
        ...messages,
        { role: "user", content: chatInputDraft },
        { role: "assistant", content: code }
      ];
      
      setMessages(newMessages);
      if (setChatHistory) setChatHistory(newMessages);
      onNewCode(code, newMessages);
      setChatInputDraft("");
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Function to detect if content contains code
  const isCodeContent = (content) => {
    return content.includes('function Component') || 
           content.includes('const Component') || 
           content.includes('/* CSS */') ||
           content.includes('className=') ||
           content.includes('return (') ||
           content.includes('export default');
  };

  // Function to extract JSX and CSS from code content
  const extractCode = (content) => {
    const parts = content.split('/* CSS */');
    const jsx = parts[0]?.trim() || '';
    const css = parts[1]?.trim() || '';
    return { jsx, css };
  };

  // Function to handle code click
  const handleCodeClick = (content) => {
    if (isCodeContent(content) && onCodeClick) {
      const { jsx, css } = extractCode(content);
      onCodeClick(jsx, css);
    }
  };

  // Function to render message content with code highlighting
  const renderMessageContent = (content, role) => {
    if (role === 'assistant' && isCodeContent(content)) {
      const { jsx, css } = extractCode(content);
      return (
        <div className="space-y-3">
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Here's your component:
          </div>
          
          {jsx && (
            <div 
              className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4 cursor-pointer hover:bg-gray-800 dark:hover:bg-slate-800 transition-colors duration-200 border border-gray-700 dark:border-slate-600"
              onClick={() => handleCodeClick(content)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">JSX</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Click to apply</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
                  </svg>
                </div>
              </div>
              <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
                <code>{jsx}</code>
              </pre>
            </div>
          )}
          
          {css && (
            <div 
              className="bg-gray-900 dark:bg-slate-900 rounded-lg p-4 cursor-pointer hover:bg-gray-800 dark:hover:bg-slate-800 transition-colors duration-200 border border-gray-700 dark:border-slate-600"
              onClick={() => handleCodeClick(content)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">CSS</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Click to apply</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
                  </svg>
                </div>
              </div>
              <pre className="text-xs text-blue-400 overflow-x-auto whitespace-pre-wrap">
                <code>{css}</code>
              </pre>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <p className="text-sm whitespace-pre-wrap break-words">
        {content}
      </p>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-800 border-r border-slate-600">
      {/* Header */}
      <div className="p-4 border-b border-slate-600 bg-slate-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-gray-300">Ask me to create components</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Start creating components</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Ask me to create React components, modify existing ones, or help with styling.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setChatInputDraft("Create a login form")}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
              >
                💡 Create a login form
              </button>
              <button
                onClick={() => setChatInputDraft("Build a navigation bar")}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
              >
                🧭 Build a navigation bar
              </button>
              <button
                onClick={() => setChatInputDraft("Design a product card")}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
              >
                🎴 Design a product card
              </button>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    {renderMessageContent(message.content, message.role)}
                    {message.role === 'assistant' && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>AI Assistant</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-slate-700 rounded-2xl px-4 py-3 border border-gray-200 dark:border-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-600 bg-slate-700 flex-shrink-0">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={chatInputDraft}
              onChange={e => setChatInputDraft(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me to create a component..."
              className="w-full px-4 py-3 pr-12 border border-slate-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-800 text-white placeholder-gray-400 resize-none transition-all duration-200"
              rows="1"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!chatInputDraft.trim() || sending}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed"
            >
              {sending ? (
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-300 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
