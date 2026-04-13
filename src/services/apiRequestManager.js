// Simple request deduplication to prevent rate limiting
const pendingRequests = new Map();

export const makeRequest = async (key, requestFn) => {
    // Check if same request is already pending
    if (pendingRequests.has(key)) {
        // Return the existing promise
        return pendingRequests.get(key);
    }

    // Create new request with timestamp tracking and error boundary
    let promise;
    try {
        promise = requestFn();
    } catch (error) {
        // Handle synchronous errors in requestFn
        return Promise.reject(error);
    }

    const trackedPromise = {
        promise,
        createdAt: Date.now(),
        then: promise.then.bind(promise),
        catch: promise.catch.bind(promise),
        finally: promise.finally.bind(promise)
    };
    
    // Store the tracked promise
    pendingRequests.set(key, trackedPromise);
    
    // Clean up when request completes
    promise.finally(() => {
        pendingRequests.delete(key);
    });
    
    return promise;
};

export const clearPendingRequests = () => {
    pendingRequests.clear();
};

// Add cleanup mechanism for abandoned requests
export const cleanupStaleRequests = (maxAge = 30000) => {
    const now = Date.now();
    for (const [key, trackedPromise] of pendingRequests.entries()) {
        if (trackedPromise.createdAt && (now - trackedPromise.createdAt > maxAge)) {
            pendingRequests.delete(key);
        }
    }
};

// Set up periodic cleanup
if (typeof window !== 'undefined') {
    setInterval(cleanupStaleRequests, 60000); // Cleanup every minute
}
