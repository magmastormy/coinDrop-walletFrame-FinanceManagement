import { logError, logInfo } from '../../utils/logger';

import React, { useState, useEffect } from 'react';

const MonitoringDashboard = () => {
    const [isMonitoringEnabled, setIsMonitoringEnabled] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [performanceMetrics, setPerformanceMetrics] = useState(null);
    const [isRunningTests, setIsRunningTests] = useState(false);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            logInfo('Monitoring dashboard mounted');
        }
    }, []);

    const runValidationTests = async () => {
        setIsRunningTests(true);
        try {
            setTestResults({
                summary: { totalTests: 0, passedTests: 0, failedTests: 0, passRate: '0%' },
                categories: {}
            });
            logInfo('Validation tests complete (no-test-util stub)');
        } catch (error) {
            logError('Test execution failed:', error);
        } finally {
            setIsRunningTests(false);
        }
    };

    const runApiTests = async () => {
        setIsRunningTests(true);
        try {
            setTestResults({
                summary: { totalTests: 0, passedTests: 0, failedTests: 0, passRate: '0%' },
                categories: {}
            });
            logInfo('API tests complete (no-test-util stub)');
        } catch (error) {
            logError('API test execution failed:', error);
        } finally {
            setIsRunningTests(false);
        }
    };

    const refreshMetrics = () => {
        setPerformanceMetrics({
            summary: { totalCalls: 0, successCalls: 0, averageDuration: 0, slowCalls: 0, recommendations: [] }
        });
    };

    const clearResults = () => {
        setTestResults(null);
    };

    return (
        <div style={{
            padding: '20px',
            fontFamily: 'monospace',
            fontSize: '12px',
            backgroundColor: '#f5f5f5',
            color: '#ffffff',
            borderRadius: '8px',
            margin: '10px'
        }}>
            <h3 style={{ marginBottom: '20px', color: '#00ff00' }}>🔧 Development Monitoring Dashboard</h3>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                    <h4>🧪 Test Controls</h4>
                    
                    <button
                        onClick={runValidationTests}
                        disabled={isRunningTests}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: isRunningTests ? '#666' : '#007acc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isRunningTests ? 'not-allowed' : 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        {isRunningTests ? '⏳ Running...' : '🧪 Run Validation Tests'}
                    </button>
                    
                    <button
                        onClick={runApiTests}
                        disabled={isRunningTests}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: isRunningTests ? '#666' : '#007acc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isRunningTests ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isRunningTests ? '⏳ Running...' : '🔧 Run API Tests'}
                    </button>
                    
                    <button
                        onClick={clearResults}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🗑️ Clear Results
                    </button>
                </div>

                <div style={{ flex: 1 }}>
                    <h4>📊 Performance Metrics</h4>
                    
                    <button
                        onClick={refreshMetrics}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#007acc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '10px'
                        }}
                    >
                        🔄 Refresh Metrics
                    </button>
                </div>
            </div>

            {performanceMetrics && (
                <div style={{ marginBottom: '20px' }}>
                    <h4>📈 Current Performance</h4>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '4px' }}>
                        <div>Total API Calls: {performanceMetrics.summary.totalCalls}</div>
                        <div>Success Rate: {performanceMetrics.summary.successCalls}/{performanceMetrics.summary.totalCalls} ({((performanceMetrics.summary.successCalls / performanceMetrics.summary.totalCalls) * 100).toFixed(1)}%)</div>
                        <div>Average Duration: {performanceMetrics.summary.averageDuration.toFixed(2)}ms</div>
                        <div>Slow Calls: {performanceMetrics.summary.slowCalls}</div>
                    </div>
                    
                    {performanceMetrics.summary.recommendations.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            <h4>⚠️ Recommendations</h4>
                            {performanceMetrics.summary.recommendations.map((rec, index) => (
                                <div key={index} style={{ 
                                    backgroundColor: rec.severity === 'high' ? '#ffebee' : '#fff3cd',
                                    color: rec.severity === 'high' ? '#721c24' : '#856404',
                                    padding: '10px',
                                    margin: '5px 0',
                                    borderRadius: '4px',
                                    border: '1px solid ' + (rec.severity === 'high' ? '#f59e0b' : '#fff3cd')
                                }}>
                                    <strong>{rec.type.toUpperCase()}:</strong> {rec.message}
                                    <br />
                                    <small>Action: {rec.action}</small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {testResults && (
                <div style={{ marginBottom: '20px' }}>
                    <h4>🧪 Test Results</h4>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '4px' }}>
                        <div>Tests Run: {testResults.summary.totalTests}</div>
                        <div>Passed: {testResults.summary.passedTests}</div>
                        <div>Failed: {testResults.summary.failedTests}</div>
                        <div>Pass Rate: {testResults.summary.passRate}</div>
                        
                        {testResults.categories && Object.entries(testResults.categories).map(([category, tests]) => (
                            <div key={category} style={{ marginTop: '10px' }}>
                                <h5>{category.toUpperCase()} ({tests.length})</h5>
                                {tests.map((test, index) => (
                                    <div key={index} style={{ 
                                        fontSize: '11px',
                                        padding: '5px',
                                        margin: '2px 0',
                                        borderRadius: '3px',
                                        backgroundColor: test.passed ? '#d4edda' : '#f8d7da',
                                        border: '1px solid ' + (test.passed ? '#c3e688' : '#ef4444')
                                    }}>
                                        {test.passed ? '✅' : '❌'} {test.description}
                                        <br />
                                        <small>
                                            Input: {test.input} | Expected: {test.expected} | Actual: {test.actual}
                                        </small>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonitoringDashboard;
