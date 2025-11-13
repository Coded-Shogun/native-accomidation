const { encrypt, decrypt, hash, encryptFields, decryptFields } = require('../../utils/encryption');

describe('Encryption Utils', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'sensitive data';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(originalText);
      expect(decrypted).toBe(originalText);
    });

    it('should handle empty strings', () => {
      expect(encrypt('')).toBe('');
      expect(decrypt('')).toBe('');
    });

    it('should handle null values', () => {
      expect(encrypt(null)).toBe(null);
      expect(decrypt(null)).toBe(null);
    });
  });

  describe('hash', () => {
    it('should hash text consistently', () => {
      const text = 'password123';
      const hash1 = hash(text);
      const hash2 = hash(text);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(text);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = hash('password1');
      const hash2 = hash('password2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('encryptFields and decryptFields', () => {
    it('should encrypt specified fields in an object', () => {
      const obj = {
        name: 'John Doe',
        id_number: '9901015800083',
        email: 'john@example.com',
      };

      const encrypted = encryptFields(obj, ['id_number']);

      expect(encrypted.name).toBe('John Doe');
      expect(encrypted.email).toBe('john@example.com');
      expect(encrypted.id_number).not.toBe('9901015800083');
    });

    it('should decrypt specified fields in an object', () => {
      const obj = {
        name: 'John Doe',
        id_number: '9901015800083',
      };

      const encrypted = encryptFields(obj, ['id_number']);
      const decrypted = decryptFields(encrypted, ['id_number']);

      expect(decrypted.id_number).toBe('9901015800083');
      expect(decrypted.name).toBe('John Doe');
    });

    it('should handle missing fields gracefully', () => {
      const obj = {
        name: 'John Doe',
      };

      const encrypted = encryptFields(obj, ['id_number', 'missing_field']);

      expect(encrypted.name).toBe('John Doe');
      expect(encrypted.id_number).toBeUndefined();
    });
  });
});
