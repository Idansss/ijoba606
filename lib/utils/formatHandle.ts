/**
 * Format a handle for display
 * Converts "ayomide_olagbemi" to "Ayomide Olagbemi"
 */
export function formatHandleForDisplay(handle: string): string {
  if (!handle) return '';
  
  // Replace underscores with spaces and split into words
  const words = handle.replace(/_/g, ' ').split(/\s+/);
  
  // Capitalize first letter of each word
  const formatted = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return formatted;
}
