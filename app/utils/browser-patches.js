/**
 * Applies various patches to browser APIs to prevent errors from extensions
 */
export function applyBrowserPatches() {
  if (typeof window === 'undefined') return;
  
  // Patch MutationObserver
  patchMutationObserver();
  
  // Add any other browser patches here
}

/**
 * Patches the MutationObserver to prevent errors from browser extensions
 * like Solana wallets that try to observe non-Node elements
 */
function patchMutationObserver() {
  try {
    if (window.MutationObserver && window.MutationObserver.prototype.observe) {
      const originalObserve = window.MutationObserver.prototype.observe;
      
      window.MutationObserver.prototype.observe = function(target, options) {
        // Handle null or undefined targets
        if (!target) {
          console.warn('Prevented MutationObserver error with null target');
          return undefined;
        }
        
        // Check if target is a valid Node
        if (!(target instanceof Node)) {
          console.warn('Prevented MutationObserver error with invalid target type');
          return undefined;
        }
        
        try {
          return originalObserve.call(this, target, options);
        } catch (error) {
          // If it's a TypeError about parameter 1, suppress it
          if (error instanceof TypeError && 
              (error.message.includes('parameter 1') || 
               error.message.includes('Failed to execute'))) {
            console.warn('Caught and suppressed MutationObserver error:', error.message);
            return undefined;
          }
          
          // Re-throw other errors
          throw error;
        }
      };
      
      console.debug('MutationObserver patched successfully');
    }
  } catch (error) {
    console.warn('Could not patch MutationObserver:', error);
  }
} 