import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recomendado para GCM
const DEFAULT_KEY_HEX =
  'e4d909c290d0fb1ca068ffaddf22cbd0e4d909c290d0fb1ca068ffaddf22cbd0';

function getMasterKey(): Buffer {
  const hex = process.env.CASEDESK_MASTER_KEY || DEFAULT_KEY_HEX;
  return Buffer.from(hex, 'hex');
}

/**
 * Cifra un texto plano (ej. contraseña de base de datos) usando AES-256-GCM
 * Formato resultante: iv:authTag:ciphertext (en hexadecimal)
 */
export function encryptCredentials(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Descifra credenciales cifradas con AES-256-GCM
 */
export function decryptCredentials(encryptedValue: string): string {
  if (!encryptedValue) return '';
  const parts = encryptedValue.split(':');
  if (parts.length !== 3) {
    // Si no está cifrado en formato GCM, retorna vacío o el texto
    return '';
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
