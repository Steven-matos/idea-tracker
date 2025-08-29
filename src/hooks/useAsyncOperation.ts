/**
 * Custom hook for managing async operations with loading and error states
 * Implements DRY principle by centralizing async operation logic
 * Follows SOLID principles with single responsibility for async state management
 */

import { useState, useCallback } from 'react';

/**
 * State interface for async operations
 */
interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
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
}

/**
 * Custom hook for managing async operations
 * 
 * @param asyncFunction - The async function to execute
 * @param initialData - Initial data value (optional)
 * @returns Object with state and control functions
 * 
 * @example
 * ```typescript
 * const { state, execute } = useAsyncOperation(
 *   async (id: string) => await fetchUserById(id)
 * );
 * 
 * // Execute the operation
 * await execute('user-123');
 * 
 * // Access state
 * if (state.loading) return <LoadingSpinner />;
 * if (state.error) return <ErrorMessage error={state.error} />;
 * if (state.data) return <UserProfile user={state.data} />;
 * ```
 */
export const useAsyncOperation = <T, P extends any[]>(
  asyncFunction: (...params: P) => Promise<T>,
  initialData: T | null = null
): UseAsyncOperationReturn<T, P> => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  /**
   * Execute the async operation with error handling and loading states
   */
  const execute = useCallback(async (...params: P): Promise<T | undefined> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFunction(...params);
      setState(prev => ({ ...prev, data: result, loading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return undefined;
    }
  }, [asyncFunction]);

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
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

  return {
    state,
    execute,
    reset,
    setLoading,
    setError,
    setData,
  };
};
