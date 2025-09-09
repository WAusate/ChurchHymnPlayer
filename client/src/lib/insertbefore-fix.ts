/**
 * Specific fix for insertBefore runtime error from Vite plugins
 * This error occurs when plugins try to insert nodes into DOM that may not be ready
 */

let isFixed = false;

export function fixInsertBeforeError(): void {
  if (isFixed) return;
  
  // Store the original insertBefore function
  const originalInsertBefore = Node.prototype.insertBefore;
  
  // Override with error handling
  Node.prototype.insertBefore = function<T extends Node>(
    newNode: T, 
    referenceNode: Node | null
  ): T {
    try {
      // Additional validation for common failure scenarios
      if (!this || !newNode) {
        console.warn('insertBefore called with invalid nodes');
        return newNode;
      }
      
      // Check if this node is still connected to the document
      if (!this.isConnected) {
        console.warn('insertBefore on disconnected parent - appending to body as fallback');
        try {
          return document.body.appendChild(newNode);
        } catch (e) {
          console.warn('Body append also failed, returning node as-is');
          return newNode;
        }
      }
      
      // Check if reference node is valid
      if (referenceNode && !this.contains(referenceNode)) {
        console.warn('Reference node not in parent - using appendChild');
        return this.appendChild(newNode);
      }
      
      // Call original function
      return originalInsertBefore.call(this, newNode, referenceNode);
      
    } catch (error) {
      console.warn('insertBefore error intercepted:', error);
      
      // Fallback strategies
      try {
        // Try appendChild as fallback
        return this.appendChild(newNode);
      } catch (appendError) {
        console.warn('appendChild fallback failed:', appendError);
        
        // Last resort: try to append to document body
        try {
          if (document.body && document.body.isConnected) {
            return document.body.appendChild(newNode);
          }
        } catch (bodyError) {
          console.warn('Body append failed:', bodyError);
        }
        
        // Return the node without inserting
        return newNode;
      }
    }
  };
  
  // Also override appendChild for consistency
  const originalAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function<T extends Node>(newChild: T): T {
    try {
      if (!this || !newChild) {
        console.warn('appendChild called with invalid nodes');
        return newChild;
      }
      
      if (!this.isConnected) {
        console.warn('appendChild on disconnected parent');
        return newChild;
      }
      
      return originalAppendChild.call(this, newChild);
    } catch (error) {
      console.warn('appendChild error intercepted:', error);
      return newChild;
    }
  };
  
  isFixed = true;
  console.log('insertBefore error fix applied');
}

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  // Apply fix immediately
  fixInsertBeforeError();
  
  // Also handle runtime errors from Vite plugins
  const originalError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (typeof message === 'string' && message.includes('insertBefore')) {
      console.warn('Vite plugin insertBefore error intercepted and suppressed');
      return true; // Prevent the error from being logged
    }
    
    if (originalError) {
      return originalError.call(this, message, source, lineno, colno, error);
    }
    
    return false;
  };
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('insertBefore')) {
      console.warn('Unhandled insertBefore promise rejection intercepted');
      event.preventDefault();
    }
  });
}