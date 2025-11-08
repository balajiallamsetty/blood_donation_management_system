// 🔒 roleMiddleware.js
// -------------------------------------------
// Purpose: Provides reusable middleware for
// role-based and ownership-based authorization
// -------------------------------------------

const User = require("../models/User");

/**
 * ✅ requireRole(roles)
 * Restricts route access to specific user roles.
 * Example:
 *   router.get("/admin", auth, requireRole(["admin"]), handler)
 */
exports.requireRole = (roles = []) => (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized: No user context" });
  }

  // Normalize input: support both single role string or array
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  // Wildcard '*' means allow all authenticated users
  if (allowedRoles.includes("*")) return next();

  if (!allowedRoles.includes(user.role)) {
    console.warn(
      `[Auth] Access denied: User ${user.id} (${user.role}) tried to access restricted route. Allowed: ${allowedRoles.join(", ")}`
    );
    return res.status(403).json({
      message: `Access denied: Requires role [${allowedRoles.join(", ")}]`,
    });
  }

  next();
};

/**
 * ✅ requireOwnerOrRole(getOwnerId, roles)
 * Allows access if the user is the resource owner OR has one of the given roles.
 * 
 * @param {Function} getOwnerId - async function that extracts the ownerId from the request (e.g., fetches DB record)
 * @param {Array|string} roles - allowed roles besides owner
 * 
 * Example:
 *   router.put("/profile/:id", auth, requireOwnerOrRole(
 *     async (req) => (await User.findById(req.params.id))._id,
 *     ["admin"]
 *   ), updateProfile)
 */
exports.requireOwnerOrRole = (getOwnerId, roles = []) => async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized: No user context" });
  }

  try {
    // Determine owner of the resource dynamically
    const ownerId = await getOwnerId(req);
    if (!ownerId) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // ✅ Allow if the logged-in user owns the resource
    if (String(ownerId) === String(user.id)) return next();

    // ✅ Allow if the user has an authorized role
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (allowedRoles.includes(user.role) || allowedRoles.includes("*")) {
      return next();
    }

    // ❌ Otherwise, block access
    console.warn(
      `[Auth] Forbidden: User=${user.id} (role=${user.role}) attempted access to resource owned by ${ownerId}`
    );
    return res
      .status(403)
      .json({ message: "Forbidden: not owner or authorized role" });
  } catch (err) {
    console.error("[Auth Error] Ownership check failed:", err);
    return res.status(500).json({ message: "Internal authorization error" });
  }
};
