const jwt = require('jsonwebtoken');

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

function requireCeoAuth(req,res,next) {
  const header=String(req.headers.authorization||'');
  const token=header.startsWith('Bearer ')?header.slice(7):null;
  if(!token) return res.status(401).json({ok:false,error:'Unauthorized'});
  try { req.user=jwt.verify(token,jwtSecret()); return next(); }
  catch { return res.status(401).json({ok:false,error:'Invalid token'}); }
}

module.exports={signToken,requireCeoAuth};
