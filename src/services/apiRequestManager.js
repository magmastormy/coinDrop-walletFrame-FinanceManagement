// Simple request deduplication to prevent rate limiting
const pendingRequests = new Map();

export const makeRequest = async (key, requestFn) => {
    // Check if same request is already pending
    if (pendingRequests.has(key)) {
        // Return the existing promise
        return pendingRequests.get(key);
    }

    // Create new request
    const promise = requestFn();
    
    // Store the promise
    pendingRequests.set(key, promise);
    
    // Clean up when request completes
    promise.finally(() => {
        pendingRequests.delete(key);
    });
    
    return promise;
};

export const clearPendingRequests = () => {
    pendingRequests.clear();
};
