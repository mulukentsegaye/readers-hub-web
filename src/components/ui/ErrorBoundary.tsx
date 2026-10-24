import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#FAF9F6] text-[#0F172A] font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#E6E4DD] shadow-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
              📖
            </div>
            <h1 className="text-xl font-bold font-serif text-[#0F172A]">Something went wrong</h1>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Liread encountered an unexpected error while initializing. Please reload the page to resume your session.
            </p>
            {this.state.error && (
              <pre className="p-3 bg-stone-50 rounded-xl text-[10px] text-left text-rose-600 font-mono overflow-x-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={() => {
                window.location.hash = '';
                window.location.reload();
              }}
              className="w-full py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
