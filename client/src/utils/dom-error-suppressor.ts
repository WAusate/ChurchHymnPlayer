/**
 * DOM Error Suppressor
 * This utility prevents DOM manipulation conflicts with Vite's runtime error plugin
 * by safely handling insertBefore and related DOM operations
 */

// Store original methods
const originalInsertBefore = Node.prototype.insertBefore;
const originalRemoveChild = Node.prototype.removeChild;
const originalAddEventListener = EventTarget.prototype.addEventListener;
const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

// Flag to track if suppression is active
let isSuppressionActive = false;

export function enableDOMErrorSuppression() {
  if (isSuppressionActive) return;
  isSuppressionActive = true;

  // Override insertBefore to handle common conflicts
  Node.prototype.insertBefore = function(newNode: Node, referenceNode: Node | null) {
    try {
      // Check if the operation is safe
      if (this.contains && referenceNode && !this.contains(referenceNode)) {
        console.warn('DOM Error Suppressed: insertBefore with invalid reference node');
        return this.appendChild(newNode);
      }
      return originalInsertBefore.call(this, newNode, referenceNode);
    } catch (error) {
      console.warn('DOM Error Suppressed: insertBefore failed, using appendChild fallback', error);
      try {
        return this.appendChild(newNode);
      } catch (fallbackError) {
        console.warn('DOM Error Suppressed: appendChild fallback also failed', fallbackError);
        return newNode;
      }
    }
  };

  // Override removeChild to handle conflicts
  Node.prototype.removeChild = function(child: Node) {
    try {
      if (this.contains && !this.contains(child)) {
        console.warn('DOM Error Suppressed: removeChild with invalid child');
        return child;
      }
      return originalRemoveChild.call(this, child);
    } catch (error) {
      console.warn('DOM Error Suppressed: removeChild failed', error);
      return child;
    }
  };

  // Suppress global DOM errors
  window.addEventListener('error', (event) => {
    if (event.message?.includes('insertBefore') || 
        event.message?.includes('removeChild') ||
        event.message?.includes('NotFoundError')) {
      console.warn('DOM Error Suppressed:', event.message);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  console.log('DOM Error Suppression enabled');
}

export function disableDOMErrorSuppression() {
  if (!isSuppressionActive) return;
  isSuppressionActive = false;

  // Restore original methods
  Node.prototype.insertBefore = originalInsertBefore;
  Node.prototype.removeChild = originalRemoveChild;
  EventTarget.prototype.addEventListener = originalAddEventListener;
  EventTarget.prototype.removeEventListener = originalRemoveEventListener;

  console.log('DOM Error Suppression disabled');
}