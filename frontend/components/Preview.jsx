import { useEffect, useRef } from "react";

export default function Preview({ jsxCode = "", cssCode = "", onElementSelect }) {
  const iframeRef = useRef();

  useEffect(() => {
    let cleanJsx = (jsxCode || "")
      .replace(/```[a-zA-Z]*/g, "")   // Remove ```javascript
      .replace(/```/g, "")            // Remove closing ```
      .replace(/import.*from.*;?/g, "")
      .replace(/export\s+default\s+Component;?/g, "")
      .replace(/export\s+default\s+function\s+Component\s*\(/g, "function Component(")
      .replace(/const\s+Component\s*=\s*\(\)\s*=>\s*{/, "function Component() {")
      .replace(/window\.Component\s*=\s*Component;?/g, "")
      .replace(/window\.onload\s*=\s*function\s*\(\)\s*{[\s\S]*?}/g, "")
      .replace(/;\s*$/, ""); // Remove trailing semicolon

    // Remove any existing hook aliasing lines from the AI output
    cleanJsx = cleanJsx.replace(/const\s*\{[^}]*\}\s*=\s*window\.React;?\n?/g, "");

    // Ensure React hooks are available in the preview iframe
    if (/use(State|Effect|Ref|Context|Reducer|Callback|Memo)\s*\(/.test(cleanJsx)) {
      cleanJsx = 'const { useState, useEffect, useRef, useContext, useReducer, useCallback, useMemo } = window.React;\n' + cleanJsx;
    }

    const doc = iframeRef.current.contentDocument;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>
      /* Hide all scrollbars in iframe */
      *::-webkit-scrollbar {
        display: none;
      }
      * {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      body {
        margin: 0;
        padding: 0;
        overflow-x: hidden;
      }
      ${cssCode || ""}
    </style><script src="https://unpkg.com/react@18/umd/react.development.js"></script><script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script></head><body><div id="root"></div><script type="text/babel">try{${cleanJsx}if(typeof Component==="function"){window.Component=Component;const root=ReactDOM.createRoot(document.getElementById('root'));root.render(React.createElement(window.Component));}else{document.getElementById('root').innerHTML="<p style='color:red'>Error: Component() function not found.</p>";}}catch(err){document.getElementById('root').innerHTML="<pre style='color:red'>Runtime Error: "+err.message+"</pre>";}</script><script>document.getElementById('root').onclick=function(e){e.preventDefault();e.stopPropagation();const el=e.target;let selector='';if(el.id)selector='#'+el.id;else if(el.className)selector='.'+el.className.split(' ').join('.');else selector=el.tagName.toLowerCase();window.parent.postMessage({type:'element-select',selector:selector,tag:el.tagName,className:el.className,id:el.id,text:el.innerText},'*');};window.addEventListener('message',function(event){if(event.data&&event.data.type==='update-element-text'){console.log('Received update-element-text:',event.data);var el=document.querySelector(event.data.selector);console.log('Element found:',!!el,el);if(el)el.innerText=event.data.text;}});</script></body></html>`);
    doc.close();
  }, [jsxCode, cssCode]);

  useEffect(() => {
    if (!onElementSelect) return;
    function handleMessage(event) {
      if (event.data && event.data.type === 'element-select') {
        onElementSelect(event.data.selector, event.data);
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementSelect]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-lg flex flex-col h-full">
      {/* Preview Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 px-4 py-3 border-b border-gray-200 dark:border-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
              Component Preview
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="relative flex-1">
        <iframe
          ref={iframeRef}
          title="preview"
          className="w-full h-full bg-white border-0"
          style={{ minHeight: '400px' }}
        />
        
        {/* Click overlay hint */}
        <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-lg opacity-75">
          Click elements to edit
        </div>
      </div>
    </div>
  );
}
