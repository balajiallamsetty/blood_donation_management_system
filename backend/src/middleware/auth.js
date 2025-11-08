const jwt = require("jsonwebtoken");

/* ============================================================
   🧠 Verify JWT and Attach User Info
   ============================================================ */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user info
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* ============================================================
   🛡️ Restrict Access to Admins Only
   ============================================================ */
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }
    next();
  });
};

/* ============================================================
   🩸 Restrict Access to Donors Only
   ============================================================ */
const verifyDonor = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== "donor") {
      return res.status(403).json({
        message: "Access denied. Donors only.",
      });
    }
    next();
  });
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyDonor,
};
