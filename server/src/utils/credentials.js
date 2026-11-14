import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// No 0/O/1/l/I so credentials are easy to read out or type
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export const generatePassword = (length = 10) =>
  Array.from({ length }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');

export const hashPassword = (password) => bcrypt.hash(password, 10);

// Creates a customer user for a company with an auto-generated login ID (<code>-NN)
// and password. Returns the plaintext credentials, which are never stored.
export async function createMember(company, name) {
  const password = generatePassword();
  const passwordHash = await hashPassword(password);
  const base = await User.countDocuments({ companyId: company._id });

  for (let attempt = 1; attempt <= 5; attempt++) {
    const loginId = `${company.code.toLowerCase()}-${String(base + attempt).padStart(2, '0')}`;
    try {
      const user = await User.create({ name, loginId, passwordHash, role: 'customer', companyId: company._id });
      return { user, credentials: { loginId, password } };
    } catch (err) {
      if (err.code !== 11000) throw err; // loginId taken -> try next number
    }
  }
  throw new Error('Could not generate a unique login ID');
}
