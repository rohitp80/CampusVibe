import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h2 className="text-lg font-semibold text-destructive mb-4">Something went wrong</h2>
          <details className="text-sm">
            <summary className="cursor-pointer mb-2">Error Details</summary>
            <pre className="bg-secondary/30 p-3 rounded text-xs overflow-auto">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
