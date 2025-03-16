import crypto from 'crypto';

// AES Key used for encryption/decryption
const AES_KEY = process.env.AES_KEY || "82d5d6060dff58f5875d520a6202b5384cfba4779a9db4e9c59ca3bce444a53e";

class EncryptionService {
  // Encrypt data using AES-GCM
  encryptData(plaintext: string): string {
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
  }
  
  // Decrypt data using AES-GCM
  decryptData(encryptedText: string): string {
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
  }
  
  // Detect sensitive information in text
  containsSensitiveInfo(text: string): boolean {
    if (!text) return false;
    
    const sensitivePatterns = [
      /\b(?:\d[ -]*?){13,16}\b/,  // Credit cards
      /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/,  // SSN
      /password|passw|passwd|pwd/i,  // Password-related
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,  // Email
      /bank|account|routing|credit|loan/i,  // Banking terms
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(text));
  }
}

export const encryptionService = new EncryptionService();
