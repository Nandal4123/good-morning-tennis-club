import crypto from "crypto";

function base64urlEncode(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str) {
  const pad = 4 - (str.length % 4 || 4);
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return Buffer.from(b64, "base64");
}

function hmacSha256(secret, data) {
  return crypto.createHmac("sha256", secret).update(data).digest();
}

export function signOwnerToken(payload, secret, expiresInSeconds = 60 * 60 * 12) {
  if (!secret) {
    throw new Error("OWNER_TOKEN_SECRET is not set");
  }

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const body = base64urlEncode(JSON.stringify(fullPayload));
  const sig = base64urlEncode(hmacSha256(secret, body));
  return `${body}.${sig}`;
}

export function verifyOwnerToken(token, secret) {
  if (!secret) {
    throw new Error("OWNER_TOKEN_SECRET is not set");
  }
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "missing_token" };
  }

  const [body, sig] = token.split(".");
  if (!body || !sig) return { ok: false, reason: "bad_format" };

  const expected = base64urlEncode(hmacSha256(secret, body));
  // timing safe compare
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(body).toString("utf-8"));
  } catch {
    return { ok: false, reason: "bad_payload" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) return { ok: false, reason: "expired" };

  return { ok: true, payload };
}


