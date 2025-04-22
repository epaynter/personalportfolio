// Thread ID key in sessionStorage
const THREAD_ID_KEY = 'assistant_thread_id';

/**
 * Get the current thread ID from sessionStorage or create a new one
 * @returns {string} The thread ID
 */
export function getThreadId() {
  if (typeof window === 'undefined') return null;
  
  let threadId = sessionStorage.getItem(THREAD_ID_KEY);
  
  if (!threadId) {
    // Generate a new thread ID if none exists
    threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(THREAD_ID_KEY, threadId);
  }
  
  return threadId;
}

/**
 * Clear the thread ID from sessionStorage
 */
export function clearThreadId() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(THREAD_ID_KEY);
} 