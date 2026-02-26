import React from 'react';
import { HiOutlineExclamationCircle, HiOutlineRefresh, HiOutlineHome } from 'react-icons/hi';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-container">
                    <div className="error-boundary-content">
                        <div className="error-icon-wrapper">
                            <HiOutlineExclamationCircle size={56} />
                        </div>
                        <h1>Something went wrong</h1>
                        <p>
                            We're sorry — an unexpected error occurred. Please try refreshing the page
                            or return to the home page.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="error-details">
                                <summary>Error Details (Dev Only)</summary>
                                <pre>{this.state.error.toString()}</pre>
                                <pre>{this.state.errorInfo?.componentStack}</pre>
                            </details>
                        )}
                        <div className="error-actions">
                            <button className="error-btn primary" onClick={this.handleReload}>
                                <HiOutlineRefresh size={18} />
                                Reload Page
                            </button>
                            <button className="error-btn secondary" onClick={this.handleGoHome}>
                                <HiOutlineHome size={18} />
                                Go Home
                            </button>
                        </div>
                    </div>

                    <style>{`
            .error-boundary-container {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2rem;
              background: var(--bg-secondary, #f8fafc);
            }

            .error-boundary-content {
              text-align: center;
              max-width: 480px;
            }

            .error-icon-wrapper {
              width: 96px;
              height: 96px;
              margin: 0 auto 1.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--error-bg, #fef2f2);
              color: var(--error, #ef4444);
              border-radius: 50%;
            }

            .error-boundary-content h1 {
              font-size: 1.75rem;
              font-weight: 700;
              color: var(--text-primary, #1e293b);
              margin-bottom: 0.75rem;
            }

            .error-boundary-content p {
              font-size: 1rem;
              color: var(--text-secondary, #64748b);
              line-height: 1.7;
              margin-bottom: 2rem;
            }

            .error-details {
              text-align: left;
              margin-bottom: 2rem;
              padding: 1rem;
              background: var(--bg-tertiary, #f1f5f9);
              border-radius: 12px;
              font-size: 0.8125rem;
              color: var(--text-secondary, #64748b);
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 600;
              margin-bottom: 0.5rem;
            }

            .error-details pre {
              white-space: pre-wrap;
              word-break: break-word;
              margin: 0.5rem 0 0;
              font-size: 0.75rem;
              max-height: 200px;
              overflow-y: auto;
            }

            .error-actions {
              display: flex;
              justify-content: center;
              gap: 0.75rem;
              flex-wrap: wrap;
            }

            .error-btn {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.75rem 1.5rem;
              border-radius: 12px;
              font-size: 0.9375rem;
              font-weight: 600;
              cursor: pointer;
              border: none;
              transition: all 0.2s ease;
            }

            .error-btn.primary {
              background: var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6));
              color: white;
            }

            .error-btn.primary:hover {
              opacity: 0.9;
              transform: translateY(-2px);
            }

            .error-btn.secondary {
              background: var(--bg-tertiary, #f1f5f9);
              color: var(--text-primary, #1e293b);
            }

            .error-btn.secondary:hover {
              background: var(--border-light, #e2e8f0);
            }
          `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
