/**
 * Centralized Error Handler
 * Provides consistent error handling and user feedback across the application
 */

import { showNotification } from '../components/notifications.js';

/**
 * Error types for categorization
 */
export const ErrorType = {
  NETWORK: 'network',
  AUTH: 'auth',
  DATABASE: 'database',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
};

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  constructor(message, type = ErrorType.UNKNOWN, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Handles API fetch errors consistently
 * @param {Response} response - Fetch API response
 * @param {string} context - Context of the error (e.g., 'fetch conversations')
 * @returns {Promise<any>} Parsed JSON response
 * @throws {AppError} If response is not ok
 */
export async function handleApiResponse(response, context = 'API request') {
  if (!response.ok) {
    const errorType = response.status === 401 ? ErrorType.AUTH :
                     response.status >= 500 ? ErrorType.DATABASE :
                     ErrorType.NETWORK;

    let errorMessage = `${context} failed`;
    try {
      const data = await response.json();
      errorMessage = data.message || errorMessage;
    } catch (e) {
      errorMessage = `${context} failed with status ${response.status}`;
    }

    throw new AppError(errorMessage, errorType, { status: response.status });
  }

  return await response.json();
}

/**
 * Handles all errors and displays appropriate notifications
 * @param {Error|AppError} error - The error to handle
 * @param {Object} elements - DOM elements object for notifications
 * @param {string} defaultMessage - Default user-friendly message
 * @param {boolean} logToConsole - Whether to log to console (default: true)
 */
export function handleError(error, elements, defaultMessage = 'An error occurred', logToConsole = true) {
  if (logToConsole) {
    console.error('[Error Handler]', error);
  }

  // Determine user-friendly message
  let userMessage = defaultMessage;
  let notificationType = 'error';

  if (error instanceof AppError) {
    userMessage = error.message;

    // Special handling for auth errors
    if (error.type === ErrorType.AUTH) {
      userMessage = 'Authentication required. Please log in again.';
      setTimeout(() => {
        window.location.replace('/auth');
      }, 2000);
    }
  } else if (error instanceof TypeError && error.message.includes('fetch')) {
    userMessage = 'Network error. Please check your connection.';
  } else if (error.message) {
    userMessage = error.message;
  }

  // Show notification
  if (elements && showNotification) {
    showNotification(elements, userMessage, notificationType);
  }

  return { handled: true, message: userMessage };
}

/**
 * Wraps an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} elements - DOM elements for notifications
 * @param {string} errorContext - Context for error messages
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, elements, errorContext = 'Operation') {
  return async function(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, elements, `${errorContext} failed`);
      throw error; // Re-throw for caller to handle if needed
    }
  };
}

/**
 * Retry an async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise<any>} Result of the function
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on auth errors
      if (error instanceof AppError && error.type === ErrorType.AUTH) {
        throw error;
      }

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Validates required fields in an object
 * @param {Object} obj - Object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @throws {AppError} If validation fails
 */
export function validateRequiredFields(obj, requiredFields) {
  const missing = requiredFields.filter(field => !obj[field]);

  if (missing.length > 0) {
    throw new AppError(
      `Missing required fields: ${missing.join(', ')}`,
      ErrorType.VALIDATION,
      { missingFields: missing }
    );
  }
}

/**
 * Safe localStorage access with error handling
 * @param {string} key - Storage key
 * @param {string} method - 'get' or 'set' or 'remove'
 * @param {any} value - Value to set (if method is 'set')
 * @returns {any} Retrieved value or null
 */
export function safeStorage(key, method = 'get', value = null) {
  try {
    if (method === 'get') {
      return localStorage.getItem(key);
    } else if (method === 'set') {
      localStorage.setItem(key, value);
      return true;
    } else if (method === 'remove') {
      localStorage.removeItem(key);
      return true;
    }
  } catch (error) {
    console.warn(`Storage ${method} failed for key "${key}":`, error);
    return method === 'get' ? null : false;
  }
}
