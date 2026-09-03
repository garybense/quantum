import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { Device } from '@capacitor/device';
import './index.css';

// Suppress Three.js Clock deprecation warning emitted by THREE / R3F internally
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Clock: This module has been deprecated') ||
     args[0].includes('THREE.Clock: This module has been deprecated'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  deviceInfo: any | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    deviceInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
    try {
      const info = await Device.getInfo();
      this.setState({ errorInfo, deviceInfo: info });
    } catch (e) {
      this.setState({ errorInfo });
    }
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6 font-mono select-none">
          <div className="max-w-xl w-full bg-slate-900/90 border border-rose-500/50 rounded-2xl p-6 shadow-2xl shadow-rose-950/50 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4 text-rose-400">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <h1 className="text-lg font-black tracking-wider uppercase">System Anomaly Detected</h1>
            </div>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              The neural simulation encountered a runtime exception. A system reboot will clear local cached states and restore operational equilibrium.
            </p>
            {this.state.error && (
              <div className="bg-slate-950 border border-rose-950 rounded-xl p-3 mb-5 overflow-x-auto text-xs text-rose-300 font-mono">
                <p className="font-bold mb-1">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-slate-400 opacity-80 whitespace-pre-wrap max-h-36 overflow-y-auto mt-2 border-t border-rose-900/50 pt-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
                {this.state.deviceInfo && (
                  <div className="mt-3 pt-2 border-t border-rose-900/50 text-[9px] text-slate-500 uppercase font-bold tracking-widest flex flex-wrap gap-x-4">
                    <span>Model: {this.state.deviceInfo.model}</span>
                    <span>Platform: {this.state.deviceInfo.platform}</span>
                    <span>OS: {this.state.deviceInfo.osVersion}</span>
                    <span>Manufacturer: {this.state.deviceInfo.manufacturer}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
              >
                Clear Cache & Reboot System
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Retry Execution
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

