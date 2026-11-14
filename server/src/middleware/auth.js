import jwt from 'jsonwebtoken';
import config from '../config.js';
import User from '../models/User.js';
import Company from '../models/Company.js';

// Reads the JWT cookie and loads the user from the DB on every request,
// so deactivating a user or company takes effect immediately.
export async function verifyToken(req, res, next) {
  const unauthorized = () => res.status(401).json({ message: 'Not authenticated' });
  const token = req.cookies?.token;
  if (!token) return unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return unauthorized();
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) return unauthorized();

  if (user.role === 'customer') {
    const company = await Company.findById(user.companyId);
    if (!company || !company.isActive) return unauthorized();
    req.company = company;
  }

  req.user = user;
  next();
}

export const requireRole = (role) => (req, res, next) =>
  req.user.role === role ? next() : res.status(403).json({ message: 'Forbidden' });
