import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Dashboard ErrorBoundary] Terjadi error pada React:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#172B3A] text-white flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="max-w-lg bg-[#12222E] border border-rose-500/40 p-6 rounded-md shadow-2xl space-y-4">
            <div className="inline-flex p-3 bg-rose-500/20 text-rose-400 rounded-full text-2xl mb-1">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Terjadi Kesalahan Aplikasi
            </h2>
            <p className="text-xs text-slate-300">
              {this.state.error?.message || 'Error tidak diketahui saat memuat dashboard.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#66856A] hover:bg-[#527056] text-white text-xs font-bold rounded-sm transition-colors uppercase tracking-wider"
              >
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
