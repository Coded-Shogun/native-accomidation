const CryptoJS = require('crypto-js');

// Encryption key from environment (must be 32 characters for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production!!';

if (ENCRYPTION_KEY === 'default-key-change-in-production!!') {
  console.warn(
    'WARNING: Using default encryption key. Set ENCRYPTION_KEY environment variable in production!'
  );
}

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text
 */
const encrypt = (text) => {
  if (!text) return text;
  try {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt encrypted data
 * @param {string} encryptedText - Encrypted text
 * @returns {string} - Decrypted plain text
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash data (one-way, for passwords, etc.)
 * @param {string} text - Text to hash
 * @returns {string} - Hashed text
 */
const hash = (text) => {
  return CryptoJS.SHA256(text).toString();
};

/**
 * Encrypt sensitive fields in an object
 * @param {object} obj - Object containing data
 * @param {array} fields - Array of field names to encrypt
 * @returns {object} - Object with encrypted fields
 */
const encryptFields = (obj, fields = []) => {
  const encrypted = { ...obj };
  fields.forEach((field) => {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  });
  return encrypted;
};

/**
 * Decrypt sensitive fields in an object
 * @param {object} obj - Object containing encrypted data
 * @param {array} fields - Array of field names to decrypt
 * @returns {object} - Object with decrypted fields
 */
const decryptFields = (obj, fields = []) => {
  const decrypted = { ...obj };
  fields.forEach((field) => {
    if (decrypted[field]) {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  });
  return decrypted;
};

// Fields that should always be encrypted
const SENSITIVE_FIELDS = ['id_number', 'nsfas_reference', 'emergency_contact_phone'];

module.exports = {
  encrypt,
  decrypt,
  hash,
  encryptFields,
  decryptFields,
  SENSITIVE_FIELDS,
};
