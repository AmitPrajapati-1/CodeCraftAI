import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import dynamic from "next/dynamic";
import ChatPanel from "../../components/ChatPanel";
import Preview from "../../components/Preview";
import { exportCode } from "../../utils/export";

const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then(mod => ({ default: mod.default })),
  { ssr: false }
);

export default function EditorPage() {
  const router = useRouter();
  const { id } = router.query;
  const [jsx, setJsx] = useState("");
  const [css, setCss] = useState("");
  
  // Default component to show when session is empty
  const defaultComponent = {
    jsx: `function Component() {
  return (
    <div className="welcome-container">
      <div className="hero-section">
        <h1 className="hero-title">Welcome to CodeCraft AI</h1>
        <p className="hero-subtitle">Start creating amazing React components with AI</p>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered</h3>
            <p>Generate components using natural language</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Live Preview</h3>
            <p>See your changes in real-time</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Interactive Chat</h3>
            <p>Refine components with AI assistance</p>
          </div>
        </div>
        <button className="cta-button">Get Started</button>
      </div>
    </div>
  );
}`,
    css: `.welcome-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.hero-section {
  text-align: center;
  max-width: 800px;
  background: rgba(255, 255, 255, 0.95);
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 3rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.feature-card {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: #6b7280;
  line-height: 1.5;
}

.cta-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}`
  };
  const [activeTab, setActiveTab] = useState("jsx");
  const [chatHistory, setChatHistory] = useState([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [copyMsg, setCopyMsg] = useState("");
  const saveTimeout = useRef();
  const [chatInputDraft, setChatInputDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState(null);
  const [propertyPanel, setPropertyPanel] = useState({
    visible: false,
    selector: '',
    tag: '', className: '', id: '', text: '',
    color: '', fontSize: '', padding: '',
    backgroundColor: '', border: '', boxShadow: '', borderRadius: ''
  });
  const [targetedPrompt, setTargetedPrompt] = useState("");
  const [targetedLoading, setTargetedLoading] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [showCodeEditor, setShowCodeEditor] = useState(true);
  const [isEditable, setIsEditable] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(40); // Percentage

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (id) loadSession();
    const draft = localStorage.getItem(`chatInputDraft_${id}`);
    if (draft) setChatInputDraft(draft);
    // eslint-disable-next-line
  }, [id, token]);

  async function loadSession() {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Use default component if session is empty
    const hasContent = res.data.jsx && res.data.jsx.trim() !== "";
    setJsx(hasContent ? res.data.jsx : defaultComponent.jsx);
    setCss(hasContent ? res.data.css : defaultComponent.css);
    setChatHistory(res.data.chatHistory || []);
    setSessionName(res.data.name || "New Session");
    setActiveTab(res.data.editorState?.activeTab || "jsx");
    setLoading(false);
  }

  async function saveSession(chatHistory, editorStateOverride) {
    if (loading) return;
    const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${id}/save`, {
      chatHistory, jsx, css,
      editorState: editorStateOverride || { activeTab }
    }, { headers: { Authorization: `Bearer ${token}` } });

    if (res.data.sessionName && res.data.sessionName !== sessionName) {
      setSessionName(res.data.sessionName);
      if (typeof window !== "undefined" && window.parent !== window) {
        window.parent.postMessage({
          type: 'session-name-updated',
          sessionId: id,
          sessionName: res.data.sessionName
        }, '*');
      }
    }
  }

  function handleCopy(text, type) {
    navigator.clipboard.writeText(text);
    setCopyMsg(`${type} copied!`);
    setTimeout(() => setCopyMsg(""), 1500);
  }

  function handleElementSelect(selector, data) {
    setSelectedElement({ selector, ...data });
    setPropertyPanel({
      visible: true,
      selector,
      tag: data.tag,
      className: data.className,
      id: data.id,
      text: data.text,
      color: '',
      fontSize: '',
      padding: '',
      backgroundColor: '',
      border: '',
      boxShadow: '',
      borderRadius: ''
    });
  }

  function handlePropertyChange(e) {
    const { name, value } = e.target;
    setPropertyPanel(panel => ({ ...panel, [name]: value }));

    if (!selectedElement) return;

    if (name === 'color') {
      setCss(css => `${css}\n${selectedElement.selector} { color: ${value} !important; }`);
    }
    if (name === 'fontSize') {
      setCss(css => `${css}\n${selectedElement.selector} { font-size: ${value}px !important; }`);
    }
    if (name === 'padding') {
      setCss(css => `${css}\n${selectedElement.selector} { padding: ${value}px !important; }`);
    }
    if (name === 'backgroundColor') {
      setCss(css => `${css}\n${selectedElement.selector} { background-color: ${value} !important; }`);
    }
    if (name === 'border') {
      setCss(css => `${css}\n${selectedElement.selector} { border: ${value} !important; }`);
    }
    if (name === 'boxShadow') {
      setCss(css => `${css}\n${selectedElement.selector} { box-shadow: ${value} !important; }`);
    }
    if (name === 'borderRadius') {
      setCss(css => `${css}\n${selectedElement.selector} { border-radius: ${value}px !important; }`);
    }
    if (name === 'text') {
      const iframe = document.querySelector('iframe[title="preview"]');
      if (iframe) {
        iframe.contentWindow.postMessage({
          type: 'update-element-text',
          selector: selectedElement.selector,
          text: value
        }, '*');
      }
    }
  }

  function closePropertyPanel() {
    setPropertyPanel(panel => ({ ...panel, visible: false }));
  }

  async function handleTargetedChatSubmit(e) {
    e.preventDefault();
    if (!targetedPrompt || !selectedElement) return;
    setTargetedLoading(true);
    const prompt = `Target selector: ${selectedElement.selector}\nCurrent JSX:\n${jsx}\nCurrent CSS:\n${css}\nUser instruction: ${targetedPrompt}`;
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${id}/chat`, {
        prompt,
        currentJsx: jsx,
        currentCss: css,
        history: JSON.stringify(chatHistory)
      }, { headers: { Authorization: `Bearer ${token}` } });
      const code = res.data.code;
      const [jsxCodeRaw, cssCodeRaw] = code.split("/* CSS */");
      setJsx((jsxCodeRaw || "").trim());
      setCss((cssCodeRaw || "").trim());
      setTargetedPrompt("");
      setTargetedLoading(false);
    } catch (err) {
      alert("AI error: " + (err.response?.data?.error || err.message));
      setTargetedLoading(false);
    }
  }

  // Auto-save on code changes
  useEffect(() => {
    if (!id) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => { saveSession(chatHistory); }, 800);
    return () => clearTimeout(saveTimeout.current);
    // eslint-disable-next-line
  }, [jsx, css]);

  useEffect(() => {
    if (!id) return;
    saveSession(chatHistory, { activeTab });
    // eslint-disable-next-line
  }, [activeTab]);

  useEffect(() => {
    if (!id) return;
    localStorage.setItem(`chatInputDraft_${id}`, chatInputDraft);
  }, [chatInputDraft, id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + E to toggle edit mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setIsEditable((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditable]);

  // Resize preview/code editor panels
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.target.closest('.cursor-col-resize')) {
        const startX = e.clientX;
        const startWidth = previewWidth;

        const handleMouseMove = (e) => {
          const deltaX = e.clientX - startX;
          const containerWidth = window.innerWidth - 384; // Account for chat panel
          const deltaPercent = (deltaX / containerWidth) * 100;
          const newWidth = Math.max(20, Math.min(70, startWidth + deltaPercent));
          setPreviewWidth(newWidth);
        };

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [previewWidth]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading Editor</h3>
          <p className="text-gray-600 dark:text-gray-400">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-900 flex">
      {/* Hide webkit scrollbar (global) */}
      <style jsx global>{`
        *::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
      {/* Chat Panel */}
      <div className={`${showChatPanel ? 'w-96' : 'w-16'} transition-all duration-300 ease-in-out bg-slate-800 border-r border-slate-600 flex-shrink-0 h-screen`}>
        {showChatPanel ? (
          <ChatPanel
            sessionId={id}
            initialMessages={chatHistory}
            currentJsx={jsx}
            currentCss={css}
            chatInputDraft={chatInputDraft}
            setChatInputDraft={setChatInputDraft}
            setChatHistory={setChatHistory}
            onCodeClick={(jsxCode, cssCode) => {
              if (jsxCode) setJsx(jsxCode);
              if (cssCode) setCss(cssCode);
            }}
            onNewCode={(code, newMessages) => {
              if (loading) return;
              saveSession(newMessages);
              if (/<html|<body|<head/i.test(code)) {
                alert("The AI returned HTML. Please rephrase your prompt or try again. Only React function components are supported.");
                setJsx("");
                setCss("");
                return;
              }
              const [jsxCodeRaw, cssCodeRaw] = code.split("/* CSS */");
              if (jsxCodeRaw && /\.[a-zA-Z0-9_-]+\s*\{/.test(jsxCodeRaw)) {
                alert("The AI returned CSS in the JSX section. Please rephrase your prompt or try again.");
                setJsx("");
                setCss("");
                return;
              }
              let jsxCode = (jsxCodeRaw || "")
                .replace(/import.*from.*;?/g, "")
                .replace(/export\s+default\s+Component;?/g, "")
                .replace(/export\s+default\s+function\s+Component\s*\(/g, "function Component(")
                .replace(/const\s+Component\s*=\s*\(\)\s*=>\s*{/, "function Component() {")
                .replace(/window\.Component\s*=\s*Component;?/g, "")
                .replace(/window\.onload\s*=\s*function\s*\(\)\s*{[\s\S]*?}/g, "")
                .replace(/;\s*$/, "");

              const openBraces = (jsxCode.match(/{/g) || []).length;
              const closeBraces = (jsxCode.match(/}/g) || []).length;
              if (openBraces !== closeBraces) {
                alert("The AI did not return a complete function Component. Please try again or rephrase your prompt.");
                setJsx("");
                setCss("");
                return;
              }

              const cssCode = (cssCodeRaw || "")
                .split('\n')
                .filter(line => !line.trim().toLowerCase().startsWith("the css segment"))
                .join('\n');

              if (!jsxCode.includes("function Component")) {
                alert("The AI did not return a valid function Component. Please try again or rephrase your prompt.");
                setJsx("");
                setCss("");
                return;
              }
              if (jsxCode.includes('useState(') && !jsxCode.includes('const { useState }')) {
                jsxCode = 'const { useState } = window.React;\n' + jsxCode;
              }
              setJsx(jsxCode);
              setCss(cssCode || "");
              setChatHistory(newMessages);
              saveSession(newMessages);
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <button
              onClick={() => setShowChatPanel(true)}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <div className="text-xs text-gray-300 text-center">
              AI<br />Chat
            </div>
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Dashboard</span>
              </button>
              <div className="w-px h-6 bg-slate-600"></div>
              <div>
                <h1 className="text-xl font-bold text-white">{sessionName}</h1>
                <p className="text-sm text-gray-300">CodeCraft AI Editor</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowChatPanel(!showChatPanel)}
                className="p-2 text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors duration-200"
                title={showChatPanel ? "Hide Chat Panel" : "Show Chat Panel"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button
                onClick={() => setShowCodeEditor(!showCodeEditor)}
                className="p-2 text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors duration-200"
                title={showCodeEditor ? "Hide Code Editor" : "Show Code Editor"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
              <button
                onClick={() => exportCode(jsx, css)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden min-w-0" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Left Panel - Preview */}
          <div className={`p-4 transition-all duration-300 ease-in-out ${showCodeEditor ? '' : 'w-full'}`}
            style={showCodeEditor ? { width: `${previewWidth}%`, maxWidth: 'calc(100% - 450px)' } : {}}>
            <div className="h-full bg-slate-800 rounded-xl border border-slate-600 overflow-hidden shadow-lg flex flex-col">
              <div className="bg-slate-700 px-4 py-3 border-b border-slate-600 flex-shrink-0">
                <h2 className="text-base font-semibold text-white flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Live Preview</span>
                </h2>
              </div>
              <div className="flex-1 p-4 overflow-hidden">
                <Preview jsxCode={jsx} cssCode={css} onElementSelect={handleElementSelect} />
              </div>
            </div>
          </div>

          {/* Resize Handle - Only show when code editor is visible */}
          {showCodeEditor && (
            <div className="w-1 bg-slate-700 hover:bg-slate-600 cursor-col-resize flex items-center justify-center group">
              <div className="w-1 h-8 bg-slate-500 rounded-full group-hover:bg-slate-400 transition-colors duration-200"></div>
            </div>
          )}

          {/* Right Panel - Code Editor */}
          {showCodeEditor && (
            <div className="p-4 transition-all duration-300 ease-in-out" style={{ width: `${100 - previewWidth}%`, minWidth: '400px' }}>
              <div className="h-full bg-slate-800 rounded-xl border border-slate-600 overflow-hidden shadow-lg flex flex-col">
                {/* Code Editor Header */}
                <div className="bg-slate-700 px-4 py-3 border-b border-slate-600 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setActiveTab("jsx")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === "jsx"
                          ? "bg-blue-500 text-white shadow-md"
                          : "text-gray-300 hover:text-white hover:bg-slate-600"
                          }`}
                      >JSX</button>
                      <button
                        onClick={() => setActiveTab("css")}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === "css"
                          ? "bg-blue-500 text-white shadow-md"
                          : "text-gray-300 hover:text-white hover:bg-slate-600"
                          }`}
                      >CSS</button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsEditable(!isEditable)}
                        title={`${isEditable ? "Switch to view mode" : "Switch to edit mode"} (Ctrl+E)`}
                        className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-md transition-all duration-200 ${isEditable
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "text-gray-300 hover:text-white hover:bg-slate-600"
                          }`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>{isEditable ? "View" : "Edit"}</span>
                      </button>
                      <button
                        onClick={() => handleCopy(activeTab === "jsx" ? jsx : css, activeTab.toUpperCase())}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-slate-600 rounded-md transition-all duration-200"
                        title={`Copy ${activeTab.toUpperCase()} code`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy {activeTab.toUpperCase()}</span>
                      </button>
                      {copyMsg && (
                        <span className="text-xs text-green-400 font-medium">{copyMsg}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="h-full overflow-y-auto w-full" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {/* JSX */}
                    {activeTab === "jsx" && (
                      isEditable ? (
                        <div className="w-full h-full p-4 bg-slate-800 font-mono text-sm leading-relaxed overflow-y-auto">
                          <textarea
                            value={jsx}
                            onChange={e => setJsx(e.target.value)}
                            className="w-full h-full bg-transparent text-slate-200 font-mono text-sm leading-relaxed resize-none border-0 outline-none focus:ring-0 min-w-0 caret-slate-200"
                            placeholder="// Your JSX code will appear here..."
                            spellCheck={false}
                            style={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full p-4 bg-slate-800 font-mono text-sm leading-relaxed overflow-y-auto">
                          <pre className="text-slate-200 whitespace-pre-wrap">{jsx}</pre>
                        </div>
                      )
                    )}
                    {/* CSS */}
                    {activeTab === "css" && (
                      isEditable ? (
                        <div className="w-full h-full p-4 bg-slate-800 font-mono text-sm leading-relaxed overflow-y-auto">
                          <textarea
                            value={css}
                            onChange={e => setCss(e.target.value)}
                            className="w-full h-full bg-transparent text-slate-200 font-mono text-sm leading-relaxed resize-none border-0 outline-none focus:ring-0 min-w-0 caret-slate-200"
                            placeholder="/* Your CSS code will appear here... */"
                            spellCheck={false}
                            style={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full p-4 bg-slate-800 font-mono text-sm leading-relaxed overflow-y-auto">
                          <pre className="text-slate-200 whitespace-pre-wrap">{css}</pre>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Panel */}
      {propertyPanel.visible && (
        <div className="w-80 flex-shrink-0 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 shadow-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Properties</span>
              </h3>
              <button
                onClick={closePropertyPanel}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selected Element
                </label>
                <code className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded">
                  {propertyPanel.selector}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Content</label>
                <input
                  name="text"
                  value={propertyPanel.text}
                  onChange={handlePropertyChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Color</label>
                  <input
                    name="color"
                    type="color"
                    value={propertyPanel.color}
                    onChange={handlePropertyChange}
                    className="w-full h-10 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size (px)</label>
                  <input
                    name="fontSize"
                    type="number"
                    value={propertyPanel.fontSize}
                    onChange={handlePropertyChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Color</label>
                <input
                  name="backgroundColor"
                  type="color"
                  value={propertyPanel.backgroundColor}
                  onChange={handlePropertyChange}
                  className="w-full h-10 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Padding (px)</label>
                  <input
                    name="padding"
                    type="number"
                    value={propertyPanel.padding}
                    onChange={handlePropertyChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Border Radius (px)</label>
                  <input
                    name="borderRadius"
                    type="number"
                    value={propertyPanel.borderRadius}
                    onChange={handlePropertyChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Border</label>
                <input
                  name="border"
                  value={propertyPanel.border}
                  onChange={handlePropertyChange}
                  placeholder="e.g., 1px solid black"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Box Shadow</label>
                <input
                  name="boxShadow"
                  value={propertyPanel.boxShadow}
                  onChange={handlePropertyChange}
                  placeholder="e.g., 0 2px 4px rgba(0,0,0,0.1)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <form onSubmit={handleTargetedChatSubmit} className="pt-6 border-t border-gray-200 dark:border-slate-600">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Instruction</label>
                <input
                  type="text"
                  value={targetedPrompt}
                  onChange={e => setTargetedPrompt(e.target.value)}
                  placeholder="e.g., Make this button red and bold"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white mb-3"
                />
                <button
                  type="submit"
                  disabled={targetedLoading || !targetedPrompt}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {targetedLoading ? 'Sending...' : 'Send to AI'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
