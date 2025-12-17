import { verifyOwnerToken } from "../utils/ownerToken.js";

export function requireOwner(req, res, next) {
  try {
    const secret = process.env.OWNER_TOKEN_SECRET;

    const authHeader = req.get("authorization") || "";
    const bearer =
      authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : null;
    const token = bearer || req.get("X-Owner-Token") || null;

    const result = verifyOwnerToken(token, secret);
    if (!result.ok) {
      return res.status(401).json({
        error: "Unauthorized",
        reason: result.reason,
      });
    }

    // owner context
    req.owner = result.payload;
    return next();
  } catch (error) {
    console.error("requireOwner error:", error);
    return res.status(500).json({ error: "Owner auth failed" });
  }
}


