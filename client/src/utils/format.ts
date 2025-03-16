/**
 * Format utilities for displaying data consistently throughout the application
 */

// Truncate text to a specific length
export const truncateText = (text: string, maxLength = 100): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

// Format a timestamp in a readable format
export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch (error) {
    return timestamp;
  }
};

// Format date for display
export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  } catch (error) {
    return dateStr;
  }
};

// Format time for display
export const formatTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString();
  } catch (error) {
    return dateStr;
  }
};

// Calculate time ago from timestamp (e.g., "2 hours ago")
export const timeAgo = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} weeks ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  
  const years = Math.floor(days / 365);
  return `${years} years ago`;
};

// Format number with commas (e.g., 1,234,567)
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Format file size from bytes to KB, MB, GB
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format duration in seconds to mm:ss or hh:mm:ss
export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [
    hrs > 0 ? String(hrs).padStart(2, '0') : null,
    String(mins).padStart(2, '0'),
    String(secs).padStart(2, '0')
  ].filter(Boolean);
  
  return parts.join(':');
};

// Format IP address (add visual formatting if needed)
export const formatIpAddress = (ip: string): string => {
  return ip; // Currently just returns the IP as-is
};

// Format percentage (e.g., 42.5 -> 42.5%)
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Convert keystroke special keys to readable format
export const formatKeystrokes = (keystrokes: string): string => {
  return keystrokes
    .replace(/\[BACKSPACE\]/g, '⌫')
    .replace(/\[ENTER\]/g, '⏎')
    .replace(/\[SPACE\]/g, '␣')
    .replace(/\[TAB\]/g, '⇥')
    .replace(/\[SHIFT\]/g, '⇧')
    .replace(/\[CTRL\]/g, '⌃')
    .replace(/\[ALT\]/g, '⌥')
    .replace(/\[CMD\]/g, '⌘')
    .replace(/\[ESC\]/g, 'Esc');
};
