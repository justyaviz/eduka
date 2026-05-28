const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "eduka_super_secret_change_this";

function signCenterToken(user, center) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      centerId: user.center_id,
      centerName: center?.name,
      subdomain: center?.subdomain,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function requireCenterAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.centerId) return res.status(401).json({ ok: false, error: "Center token required" });
    req.centerUser = payload;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

module.exports = { signCenterToken, requireCenterAuth };
