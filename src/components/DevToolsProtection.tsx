import { useEffect } from "react";

const DevToolsProtection = () => {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable common dev tools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I / Cmd+Option+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C (Element picker)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View source)
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        return false;
      }
    };

    // DevTools detection via debugger timing
    let devtoolsOpen = false;
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          console.clear();
          console.log(
            "%c⚠️ AVISO DE SEGURANÇA",
            "color: red; font-size: 40px; font-weight: bold;"
          );
          console.log(
            "%cEsta funcionalidade do navegador é destinada a desenvolvedores. Se alguém lhe disse para copiar e colar algo aqui, é uma tentativa de fraude.",
            "font-size: 16px; color: #333;"
          );
        }
      } else {
        devtoolsOpen = false;
      }
    };

    // Disable text selection on sensitive elements
    const style = document.createElement("style");
    style.textContent = `
      .no-select { 
        -webkit-user-select: none; 
        -moz-user-select: none; 
        -ms-user-select: none; 
        user-select: none; 
      }
    `;
    document.head.appendChild(style);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    const interval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

export default DevToolsProtection;
