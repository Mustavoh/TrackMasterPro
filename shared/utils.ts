import crypto from 'crypto';

// AES Key used for encryption/decryption
export const AES_KEY = process.env.AES_KEY || "82d5d6060dff58f5875d520a6202b5384cfba4779a9db4e9c59ca3bce444a53e";
export const SENSITIVE_WORDS = ["bank", "password", "login", "credit", "card", "ssn", "social security"];

// Encrypt data using AES-GCM
export const encryptData = (plaintext: string): string => {
  if (!plaintext) return plaintext;
  
  // Convert hex AES key to bytes
  const keyBuffer = Buffer.from(AES_KEY, 'hex');
  
  // Generate a random nonce
  const nonce = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, nonce);
  
  // Encrypt the plaintext
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get the auth tag
  const tag = cipher.getAuthTag();
  
  // Return nonce + tag + ciphertext, all base64 encoded
  return Buffer.concat([nonce, tag, Buffer.from(encrypted, 'base64')]).toString('base64');
};

// Decrypt data using AES-GCM
export const decryptData = (encryptedText: string): string => {
  if (!encryptedText) return encryptedText;
  
  try {
    // Convert hex AES key to bytes
    const keyBuffer = Buffer.from(AES_KEY, 'hex');
    
    // Decode the entire encrypted message
    const buffer = Buffer.from(encryptedText, 'base64');
    
    // Extract nonce, tag, and ciphertext
    const nonce = buffer.subarray(0, 16);
    const tag = buffer.subarray(16, 32);
    const ciphertext = buffer.subarray(32);
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, nonce);
    decipher.setAuthTag(tag);
    
    // Decrypt the ciphertext
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('[ERROR] Decryption failed:', error);
    return encryptedText;
  }
};

// Detect sensitive information in text
export const containsSensitiveInfo = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return SENSITIVE_WORDS.some(word => lowerText.includes(word));
};

// Truncate text for display
export const truncateText = (text: string, maxLength = 100): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
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

// Calculate time ago from timestamp
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
  return `${days} days ago`;
};
