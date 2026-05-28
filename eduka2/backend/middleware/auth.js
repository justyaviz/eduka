const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "eduka_super_secret_change_this";

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function requireCeoAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ ok: false, error: "Unauthorized" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

module.exports = { signToken, requireCeoAuth };
