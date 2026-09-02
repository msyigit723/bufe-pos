import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./index.css";

import { invoke } from "@tauri-apps/api/core";

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color: 'red', padding: '20px'}}>
        <h1>Render Error</h1>
        <pre>{this.state.error?.toString()}</pre>
        <pre>{this.state.error?.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

invoke('run_migrations').then(() => invoke('log_message', {msg: "main.tsx migrations ok!"})).catch(e => invoke('log_message', {msg: "main.tsx migration err: " + e.toString()}));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
