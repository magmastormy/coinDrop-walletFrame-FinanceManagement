import React from 'react';
import './styles/errorBoundaryStyles.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        // Log error to your error tracking service
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-container">
                    <div className="error-boundary-content">
                        <h2>Oops! Something went wrong</h2>
                        <p>We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="refresh-button"
                        >
                            Refresh Page
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <details className="error-details">
                                <summary>Error Details</summary>
                                <pre>{this.state.error?.toString()}</pre>
                                <pre>{this.state.errorInfo?.componentStack}</pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
