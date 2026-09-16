const jwt = require('jsonwebtoken');
const pool = require('../db');

function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
  return 'dev-only-eduka-secret';
}

function signToken(user) {
  return jwt.sign(
    { id:user.id, email:user.email, role:user.role, fullName:user.full_name },
    jwtSecret(),
    { expiresIn:'7d' }
  );
}

async function requireCeoAuth(req,res,next) {
  const header=String(req.headers.authorization||'');
  const token=header.startsWith('Bearer ')?header.slice(7):null;
  if(!token) return res.status(401).json({ok:false,error:'Unauthorized'});
  try { const payload=jwt.verify(token,jwtSecret()); if(payload.centerId)return res.status(403).json({ok:false,error:'CEO access required'}); const user=(await pool.query("SELECT id,email,role,full_name FROM ceo_users WHERE id=$1 AND status='active'",[payload.id])).rows[0];if(!user)return res.status(401).json({ok:false,error:'Unauthorized'});req.user={id:user.id,email:user.email,role:user.role,fullName:user.full_name}; return next(); }
  catch { return res.status(401).json({ok:false,error:'Invalid token'}); }
}

module.exports={signToken,requireCeoAuth};
