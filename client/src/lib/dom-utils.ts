/**
 * Utility functions for safe DOM manipulation and event handling
 * Prevents common DOM errors in production environments
 */

/**
 * Safely add event listener with error handling
 */
export function safeAddEventListener<K extends keyof WindowEventMap>(
  target: Window | Document | Element,
  type: K,
  listener: (ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void {
  try {
    target.addEventListener(type as string, listener as EventListener, options);
  } catch (error) {
    console.warn(`Failed to add event listener for ${type}:`, error);
  }
}

/**
 * Safely remove event listener with error handling
 */
export function safeRemoveEventListener<K extends keyof WindowEventMap>(
  target: Window | Document | Element,
  type: K,
  listener: (ev: WindowEventMap[K]) => any,
  options?: boolean | EventListenerOptions
): void {
  try {
    if (target && typeof target.removeEventListener === 'function') {
      target.removeEventListener(type as string, listener as EventListener, options);
    }
  } catch (error) {
    // Silently handle cleanup errors in production
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Failed to remove event listener for ${type}:`, error);
    }
  }
}

/**
 * Safely access DOM elements with error handling
 */
export function safeGetElement(id: string): HTMLElement | null {
  try {
    return document.getElementById(id);
  } catch (error) {
    console.warn(`Failed to get element with id ${id}:`, error);
    return null;
  }
}

/**
 * Safely dispatch custom events with additional DOM manipulation protection
 */
export function safeDispatchEvent(eventName: string, detail?: any): void {
  try {
    // Use double requestAnimationFrame to avoid DOM manipulation conflicts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          window.dispatchEvent(new CustomEvent(eventName, { detail }));
        } catch (error) {
          console.warn(`Failed to dispatch event ${eventName} (RAF):`, error);
        }
      });
    });
  } catch (error) {
    console.warn(`Failed to dispatch event ${eventName}:`, error);
  }
}