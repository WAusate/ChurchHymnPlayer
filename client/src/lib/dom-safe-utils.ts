/**
 * DOM-safe utility functions to prevent insertBefore and other DOM manipulation errors
 */

/**
 * Safely check if a node is still in the DOM before any operation
 */
export function isNodeInDOM(node: Node | null | undefined): boolean {
  if (!node) return false;
  
  try {
    // Check if the node is connected to the document
    if ('isConnected' in node) {
      return node.isConnected;
    }
    
    // Fallback for older browsers
    return document.contains(node);
  } catch (error) {
    console.warn('DOM node check error:', error);
    return false;
  }
}

/**
 * Safely dispatch events with DOM validation
 */
export function safeDispatchEvent(eventName: string, detail?: any): void {
  try {
    if (document.body && document.documentElement && window) {
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.warn('Event dispatch error:', error);
  }
}

/**
 * Safely get element by ID with DOM validation
 */
export function safeGetElementById(id: string): HTMLElement | null {
  try {
    const element = document.getElementById(id);
    if (element && isNodeInDOM(element)) {
      return element;
    }
    return null;
  } catch (error) {
    console.warn('Element access error:', error);
    return null;
  }
}

/**
 * Safely insert element with proper validation
 */
export function safeInsertBefore(parent: Node, newNode: Node, referenceNode: Node | null): boolean {
  try {
    if (!isNodeInDOM(parent) || !newNode) {
      return false;
    }
    
    // If reference node is null or not in DOM, use appendChild instead
    if (!referenceNode || !isNodeInDOM(referenceNode) || !parent.contains(referenceNode)) {
      parent.appendChild(newNode);
      return true;
    }
    
    parent.insertBefore(newNode, referenceNode);
    return true;
  } catch (error) {
    console.warn('Safe insertBefore error:', error);
    // Fallback to appendChild
    try {
      if (isNodeInDOM(parent) && newNode) {
        parent.appendChild(newNode);
        return true;
      }
    } catch (fallbackError) {
      console.warn('Fallback appendChild error:', fallbackError);
    }
    return false;
  }
}

/**
 * Safely remove element with DOM validation
 */
export function safeRemoveElement(element: Node): boolean {
  try {
    if (!element || !isNodeInDOM(element)) {
      return false;
    }
    
    const parent = element.parentNode;
    if (parent && isNodeInDOM(parent)) {
      parent.removeChild(element);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Safe element removal error:', error);
    return false;
  }
}