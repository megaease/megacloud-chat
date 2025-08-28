"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import type { createRoot } from "react-dom/client";

interface ReactPreviewRendererProps {
  code: string;
  className?: string;
}

interface ComponentModule {
  default: React.ComponentType;
  [key: string]: unknown;
}

export function ReactPreviewRenderer({
  code,
  className = "",
}: ReactPreviewRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const updatePreview = useCallback(() => {
    if (!iframeRef.current) return;

    setIsLoading(true);
    setError(null);
    setWarnings([]);

    try {
      const iframe = iframeRef.current;
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDoc) {
        throw new Error("Cannot access iframe document");
      }

      // Create a complete HTML document with React setup
      const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
    }
    * {
      box-sizing: border-box;
    }
    .preview-container {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      background: white;
    }
  </style>
</head>
<body>
  <div id="react-root"></div>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel" data-presets="react,env">
    // User code will be injected here
    const userCode = \`${code.replace(/`/g, "\\`").replace(/\${/g, "\\${")}\`;
    
    try {
      // Transform the code to be a proper component
      const transformedCode = \`
        // Wrap user code in a component if it's not already
        let UserComponent;
        if (typeof userCode === 'function') {
          UserComponent = userCode;
        } else {
          // Try to evaluate the code as a component
          const evalResult = eval(userCode);
          UserComponent = evalResult.default || evalResult;
        }
        
        // Create a wrapper component to handle errors
        function ErrorBoundary({ children }) {
          const [hasError, setHasError] = React.useState(false);
          const [error, setError] = React.useState(null);
          
          React.useEffect(() => {
            const handleError = (event) => {
              setHasError(true);
              setError(event.error);
              console.error('React Error:', event.error);
            };
            
            window.addEventListener('error', handleError);
            return () => window.removeEventListener('error', handleError);
          }, []);
          
          if (hasError) {
            return React.createElement('div', {
              style: {
                padding: '20px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626'
              }
            }, [
              React.createElement('h3', { key: 'title' }, 'React Component Error'),
              React.createElement('pre', { 
                key: 'error',
                style: { 
                  fontSize: '12px',
                  marginTop: '10px',
                  whiteSpace: 'pre-wrap'
                }
              }, error?.message || 'Unknown error')
            ]);
          }
          
          return children;
        }
        
        // Main preview component
        function Preview() {
          return React.createElement(ErrorBoundary, null, 
            React.createElement('div', { className: 'preview-container' },
              React.createElement(UserComponent)
            )
          );
        }
        
        // Render the component
        const root = ReactDOM.createRoot(document.getElementById('react-root'));
        root.render(React.createElement(Preview));
      \`;
      
      // Execute the transformed code
      eval(transformedCode);
      
    } catch (err) {
      console.error('React compilation error:', err);
      document.getElementById('react-root').innerHTML = \`
        <div style="padding: 20px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;">
          <h3>React Compilation Error</h3>
          <pre style="font-size: 12px; margin-top: 10px; white-space: pre-wrap;">\${err.message}</pre>
        </div>
      \`;
    }
  </script>
</body>
</html>`;

      iframeDoc.open();
      iframeDoc.write(fullHtml);
      iframeDoc.close();

      // Set up error handling
      iframe.onerror = () => {
        setError("Failed to load React preview");
        setIsLoading(false);
      };

      // Check if iframe loaded successfully
      iframe.onload = () => {
        setIsLoading(false);
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to render React component"
      );
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleRefresh = () => {
    updatePreview();
  };

  const handleOpenInNewTab = () => {
    try {
      const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>React Preview</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
    }
    * {
      box-sizing: border-box;
    }
    .preview-container {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      background: white;
    }
  </style>
</head>
<body>
  <div id="react-root"></div>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel" data-presets="react,env">
    // User code
    const userCode = \`${code.replace(/`/g, "\\`").replace(/\${/g, "\\${")}\`;
    
    try {
      let UserComponent;
      if (typeof userCode === 'function') {
        UserComponent = userCode;
      } else {
        const evalResult = eval(userCode);
        UserComponent = evalResult.default || evalResult;
      }
      
      function Preview() {
        return React.createElement('div', { className: 'preview-container' },
          React.createElement(UserComponent)
        );
      }
      
      const root = ReactDOM.createRoot(document.getElementById('react-root'));
      root.render(React.createElement(Preview));
    } catch (err) {
      document.getElementById('react-root').innerHTML = \`
        <div style="padding: 20px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; color: #dc2626;">
          <h3>React Compilation Error</h3>
          <pre style="font-size: 12px; margin-top: 10px; white-space: pre-wrap;">\${err.message}</pre>
        </div>
      \`;
    }
  </script>
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Failed to open in new tab:", err);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenInNewTab}
          className="bg-background/80 backdrop-blur-sm"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Compiling React component...
          </div>
        </div>
      )}

      {/* Warnings display */}
      {warnings.length > 0 && (
        <Card className="p-4 border-yellow-200 bg-yellow-50 mb-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <strong>Warnings:</strong>
              <ul className="mt-1 space-y-1">
                {warnings.map((warning) => (
                  <li
                    key={`warning-${warning
                      .slice(0, 10)
                      .replace(/\s/g, "-")}-${Math.random()
                      .toString(36)
                      .substr(2, 5)}`}
                    className="text-xs"
                  >
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Error display */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="text-sm text-destructive">
            <strong>Error:</strong> {error}
          </div>
        </Card>
      )}

      {/* Iframe preview */}
      <iframe
        ref={iframeRef}
        className="w-full h-full border rounded-md bg-white"
        title="React Preview"
        sandbox="allow-scripts allow-same-origin"
        style={{ minHeight: "400px" }}
      />
    </div>
  );
}
