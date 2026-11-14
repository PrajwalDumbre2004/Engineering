import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import config from '../config.js';
import User from '../models/User.js';
import Company from '../models/Company.js';

export const loginSchema = z.object({
  loginId: z.string().trim().min(1),
  password: z.string().min(1),
});

const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: config.isProd };

const publicUser = (user, company) => ({
  id: user._id,
  name: user.name,
  loginId: user.loginId,
  role: user.role,
  companyId: user.companyId || null,
  companyName: company?.name || null,
});

export async function login(req, res) {
  const invalid = () => res.status(401).json({ message: 'Invalid credentials' });
  const { loginId, password } = req.body;

  const user = await User.findOne({ loginId: loginId.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) return invalid();

  let company = null;
  if (user.role === 'customer') {
    company = await Company.findById(user.companyId);
    if (!company || !company.isActive) return invalid();
  }

  if (!(await bcrypt.compare(password, user.passwordHash))) return invalid();

  const token = jwt.sign({ sub: user._id, role: user.role, companyId: user.companyId }, config.jwtSecret, {
    expiresIn: config.jwtExpires,
  });
  res.cookie('token', token, cookieOptions);
  res.json({ user: publicUser(user, company) });
}

export const me = (req, res) => res.json({ user: publicUser(req.user, req.company) });

export function logout(req, res) {
  res.clearCookie('token', cookieOptions);
  res.json({ ok: true });
}
