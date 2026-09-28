import { HouseholdData } from '../domain/models';

/**
 * Helper to generate a random 12-byte IV for AES-GCM
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Helper to create a 256-bit AES-GCM CryptoKey from a given password string
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // We use a fixed salt for simplicity in this MVP, but in a real app, salt should be random and passed along.
  // Since the user is just sharing a link, we embed a "key" inside the link or just use a fixed passphrase for the link generation
  // Actually, to make the link self-contained AND encrypted, the key MUST be in the link (the fragment).
  // Wait, if the key is in the link, anyone with the link can decrypt it, so it's not truly secure against someone who *has* the link.
  // But it hides the data from intermediaries/server logs if it's in the hash. 
  // Let's generate a random encryption key per snapshot, and put it in the hash: #payload=iv:ciphertext:key
  
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encodes ArrayBuffer to Base64URL string
 */
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes Base64URL string to ArrayBuffer
 */
function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '='
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function createEncryptedSnapshot(data: HouseholdData): Promise<string> {
  const jsonStr = JSON.stringify(data);
  const enc = new TextEncoder();
  const plainText = enc.encode(jsonStr);
  
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  const rawKey = await crypto.subtle.exportKey('raw', key);
  const keyStr = bufferToBase64Url(rawKey);
  
  const iv = generateIV();
  const ivStr = bufferToBase64Url(iv.buffer);
  
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plainText
  );
  
  const cipherStr = bufferToBase64Url(cipherBuffer);
  
  // Format: key.iv.ciphertext (all base64url)
  return `${keyStr}.${ivStr}.${cipherStr}`;
}

export async function decryptSnapshot(payload: string): Promise<HouseholdData> {
  const parts = payload.split('.');
  if (parts.length !== 3) throw new Error("Invalid snapshot format");
  
  const [keyStr, ivStr, cipherStr] = parts;
  
  const rawKey = base64UrlToBuffer(keyStr);
  const key = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const iv = base64UrlToBuffer(ivStr);
  const cipherBuffer = base64UrlToBuffer(cipherStr);
  
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    cipherBuffer
  );
  
  const dec = new TextDecoder();
  const jsonStr = dec.decode(plainBuffer);
  return JSON.parse(jsonStr);
}
