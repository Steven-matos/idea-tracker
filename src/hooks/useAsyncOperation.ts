/**
 * Custom hook for managing async operations with loading and error states
 * Implements DRY principle by centralizing async operation logic
 * Follows SOLID principles with single responsibility for async state management
 * Enhanced with retry mechanisms and better error handling for data integrity
 */

import { useState, useCallback, useRef } from 'react';

/**
 * State interface for async operations
 */
interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
  lastAttempt: Date | null;
}

/**
 * Configuration options for async operations
 */
interface AsyncOperationConfig {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Whether to automatically retry on failure */
  autoRetry?: boolean;
  /** Custom error message for user display */
  userErrorMessage?: string;
}

/**
 * Return type for useAsyncOperation hook
 */
interface UseAsyncOperationReturn<T, P extends any[]> {
  /** Current state of the async operation */
  state: AsyncOperationState<T>;
  /** Execute the async operation */
  execute: (...params: P) => Promise<T | undefined>;
  /** Reset the state to initial values */
  reset: () => void;
  /** Set loading state manually */
  setLoading: (loading: boolean) => void;
  /** Set error state manually */
  setError: (error: string | null) => void;
  /** Set data state manually */
  setData: (data: T | null) => void;
  /** Retry the last failed operation */
  retry: () => Promise<T | undefined>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Custom hook for managing async operations with enhanced error handling
 * 
 * @param asyncFunction - The async function to execute
 * @param initialData - Initial data value (optional)
 * @param config - Configuration options for the operation
 * @returns Object with state and control functions
 * 
 * @example
 * ```typescript
 * const { state, execute, retry } = useAsyncOperation(
 *   async (id: string) => await fetchUserById(id),
 *   null,
 *   { maxRetries: 3, autoRetry: true }
 * );
 * 
 * // Execute the operation
 * await execute('user-123');
 * 
 * // Retry on failure
 * if (state.error) {
 *   await retry();
 * }
 * ```
 */
export const useAsyncOperation = <T, P extends any[]>(
  asyncFunction: (...params: P) => Promise<T>,
  initialData: T | null = null,
  config: AsyncOperationConfig = {}
): UseAsyncOperationReturn<T, P> => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    autoRetry = false,
    userErrorMessage
  } = config;

  const [state, setState] = useState<AsyncOperationState<T>>({
    data: initialData,
    loading: false,
    error: null,
    retryCount: 0,
    lastAttempt: null,
  });

  // Store last parameters for retry functionality
  const lastParamsRef = useRef<P | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Execute the async operation with error handling, loading states, and retry logic
   */
  const execute = useCallback(async (...params: P): Promise<T | undefined> => {
    // Store parameters for potential retry
    lastParamsRef.current = params;
    
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      lastAttempt: new Date()
    }));
    
    try {
      const result = await asyncFunction(...params);
      setState(prev => ({ 
        ...prev, 
        data: result, 
        loading: false,
        retryCount: 0 // Reset retry count on success
      }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const displayMessage = userErrorMessage || errorMessage;
      
      setState(prev => ({ 
        ...prev, 
        error: displayMessage, 
        loading: false,
        retryCount: prev.retryCount + 1
      }));

      // Auto-retry if enabled and retries remaining
      if (autoRetry && state.retryCount < maxRetries) {
        timeoutRef.current = setTimeout(() => {
          retry();
        }, retryDelay);
      }

      return undefined;
    }
  }, [asyncFunction, autoRetry, maxRetries, retryDelay, state.retryCount, userErrorMessage]);

  /**
   * Retry the last failed operation
   */
  const retry = useCallback(async (): Promise<T | undefined> => {
    if (!lastParamsRef.current || state.retryCount >= maxRetries) {
      setState(prev => ({ ...prev, error: 'Maximum retry attempts reached' }));
      return undefined;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return execute(...lastParamsRef.current);
  }, [execute, state.retryCount, maxRetries]);

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState({
      data: initialData,
      loading: false,
      error: null,
      retryCount: 0,
      lastAttempt: null,
    });
    lastParamsRef.current = null;
  }, [initialData]);

  /**
   * Set loading state manually
   */
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  /**
   * Set error state manually
   */
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  /**
   * Set data state manually
   */
  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    state,
    execute,
    reset,
    setLoading,
    setError,
    setData,
    retry,
    clearError,
  };
};
