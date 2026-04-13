import React from 'react';
import errorReportingService from '../../services/errorReportingService';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        const logger = window.CoinDropLogger || console;
        
        // Log to unified logger
        logger.error('React Error Boundary caught an error', {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            errorInfo: {
                componentStack: errorInfo.componentStack,
                errorBoundary: true,
                errorBoundaryName: 'ErrorBoundary',
                errorBoundaryStack: errorInfo.errorBoundaryStack
            },
            context: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            }
        });

        // Report to error reporting service
        errorReportingService.reportError({
            error,
            errorInfo,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            component: 'ErrorBoundary'
        });

        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '8px',
                    margin: '20px'
                }}>
                    <h2>Something went wrong</h2>
                    <p>We are sorry, but something unexpected happened.</p>
                    <p>Please try refreshing the page or contact support if the problem persists.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#991b1b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
