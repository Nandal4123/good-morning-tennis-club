import crypto from "crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;

function toB64(buf) {
  return Buffer.from(buf).toString("base64");
}

function fromB64(str) {
  return Buffer.from(str, "base64");
}

export function hashSecret(secret) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(secret, salt, KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  // format: scrypt$<saltB64>$<keyB64>
  return `scrypt$${toB64(salt)}$${toB64(key)}`;
}

export function verifySecret(secret, stored) {
  if (!stored || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 3) return false;
  const [algo, saltB64, keyB64] = parts;
  if (algo !== "scrypt") return false;

  const salt = fromB64(saltB64);
  const expected = fromB64(keyB64);
  const actual = crypto.scryptSync(secret, salt, expected.length, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return (
    expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
  );
}


