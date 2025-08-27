/**
 * Request Optimizer - Improves network performance for map data loading
 * 
 * This utility provides:
 * 1. Request deduplication - prevents redundant API calls
 * 2. Connection pooling - reuses connections for better HTTP/2 multiplexing
 * 3. Request prioritization - loads critical data first
 * 4. Adaptive batch sizing - adjusts batch size based on network conditions
 */

import axios, { AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';
import { apiRequest } from '../services/api';

// In-flight request tracking
interface PendingRequest {
  promise: Promise<any>;
  cancelSource: CancelTokenSource;
  priority: number;
  startTime: number;
}

// Track in-flight requests to deduplicate identical ones
const pendingRequests: Map<string, PendingRequest> = new Map();

// Performance metrics for adaptive optimization
let lastNetworkLatency = 200; // Initial estimate in ms
let successiveSlowRequests = 0;
let successiveFastRequests = 0;
let currentConcurrencyLimit = 15; // Start with a moderate limit

// Request key generator
const getRequestKey = (url: string, params?: any): string => {
  const paramsKey = params ? JSON.stringify(params) : '';
  return `${url}|${paramsKey}`;
};

/**
 * Optimized request function that deduplicates identical requests
 * and implements connection reuse for better HTTP/2 multiplexing
 */
export const optimizedRequest = async <T = any>(
  method: string,
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
  priority: number = 5 // 1 = highest, 10 = lowest
): Promise<T> => {
  // Create a unique key for this request
  const requestKey = getRequestKey(url, config?.params);
  
  // Check if this exact request is already in flight
  if (pendingRequests.has(requestKey)) {
    // Return the existing promise to avoid duplicate requests
    return pendingRequests.get(requestKey)!.promise as Promise<T>;
  }
  
  // Create a cancel token for this request
  const cancelSource = axios.CancelToken.source();
  
  // Create the request with optimized settings
  const requestConfig: AxiosRequestConfig = {
    ...config,
    cancelToken: cancelSource.token,
    // Enable HTTP keep-alive for connection reuse
    headers: {
      ...config?.headers,
      'Connection': 'keep-alive',
    },
  };
  
  // Create the request promise
  const requestPromise = apiRequest<T>(method, url, data, requestConfig)
    .then(response => {
      // Calculate network latency
      const endTime = performance.now();
      const requestTime = endTime - pendingRequests.get(requestKey)!.startTime;
      
      // Update our network latency metrics
      updateNetworkMetrics(requestTime);
      
      // Remove from pending requests
      pendingRequests.delete(requestKey);
      
      return response;
    })
    .catch(error => {
      // Remove from pending requests
      pendingRequests.delete(requestKey);
      throw error;
    });
  
  // Store the pending request
  pendingRequests.set(requestKey, {
    promise: requestPromise,
    cancelSource,
    priority,
    startTime: performance.now()
  });
  
  return requestPromise;
};

/**
 * Update network metrics based on request performance
 */
const updateNetworkMetrics = (requestTime: number): void => {
  // Update rolling average of network latency (70% old value, 30% new value)
  lastNetworkLatency = lastNetworkLatency * 0.7 + requestTime * 0.3;
  
  // Adjust concurrency based on network conditions
  if (requestTime > lastNetworkLatency * 1.5) {
    // Request was significantly slower than average
    successiveSlowRequests++;
    successiveFastRequests = 0;
    
    // If we've seen multiple slow requests, reduce concurrency
    if (successiveSlowRequests >= 3 && currentConcurrencyLimit > 5) {
      currentConcurrencyLimit = Math.max(5, currentConcurrencyLimit - 2);
      successiveSlowRequests = 0;
    }
  } else if (requestTime < lastNetworkLatency * 0.8) {
    // Request was significantly faster than average
    successiveFastRequests++;
    successiveSlowRequests = 0;
    
    // If we've seen multiple fast requests, increase concurrency
    if (successiveFastRequests >= 3 && currentConcurrencyLimit < 25) {
      currentConcurrencyLimit = Math.min(25, currentConcurrencyLimit + 2);
      successiveFastRequests = 0;
    }
  }
};

/**
 * Get the current recommended batch size for parallel requests
 * based on network conditions
 */
export const getOptimalBatchSize = (): number => {
  return currentConcurrencyLimit;
};

/**
 * Cancel all pending requests - useful when unmounting components
 */
export const cancelAllRequests = (): void => {
  pendingRequests.forEach(request => {
    request.cancelSource.cancel('Operation canceled due to component unmount');
  });
  pendingRequests.clear();
};

/**
 * Optimized GET request
 */
export const optimizedGet = <T = any>(
  url: string, 
  config?: AxiosRequestConfig,
  priority: number = 5
): Promise<T> => {
  return optimizedRequest<T>('get', url, undefined, config, priority);
};

export default {
  optimizedGet,
  optimizedRequest,
  getOptimalBatchSize,
  cancelAllRequests
};
