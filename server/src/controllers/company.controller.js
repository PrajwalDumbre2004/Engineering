import { z } from 'zod';
import Company from '../models/Company.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Part from '../models/Part.js';
import { createMember, generatePassword, hashPassword } from '../utils/credentials.js';
import { httpError } from '../middleware/error.js';

const name = z.string().trim().min(1).max(100);

export const createCompanySchema = z.object({
  name,
  code: z.string().trim().regex(/^[A-Za-z0-9]{2,10}$/, '2-10 letters/digits'),
  member: z.object({ name }), // a company must be created with its first member
});
export const updateCompanySchema = z.object({ name: name.optional(), isActive: z.boolean().optional() });
export const memberSchema = z.object({ name });
export const updateUserSchema = z.object({ name: name.optional(), isActive: z.boolean().optional() });

const countBy = async (Model, match = {}) =>
  new Map((await Model.aggregate([{ $match: match }, { $group: { _id: '$companyId', n: { $sum: 1 } } }])).map((r) => [String(r._id), r.n]));

export async function listCompanies(req, res) {
  const [companies, members, projects] = await Promise.all([
    Company.find().sort({ name: 1 }).lean(),
    countBy(User, { role: 'customer' }),
    countBy(Project),
  ]);
  res.json({
    companies: companies.map((c) => ({
      ...c,
      memberCount: members.get(String(c._id)) || 0,
      projectCount: projects.get(String(c._id)) || 0,
    })),
  });
}

export async function createCompany(req, res) {
  const { name, code, member } = req.body;
  const company = await Company.create({ name, code });
  try {
    const { user, credentials } = await createMember(company, member.name);
    res.status(201).json({ company, member: user, credentials });
  } catch (err) {
    await Company.deleteOne({ _id: company._id }); // keep "company always has a member" invariant
    throw err;
  }
}

export async function getCompany(req, res) {
  const company = await Company.findById(req.params.id);
  if (!company) throw httpError(404, 'Company not found');
  const members = await User.find({ companyId: company._id, role: 'customer' }).sort({ loginId: 1 });
  res.json({ company, members });
}

export async function updateCompany(req, res) {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!company) throw httpError(404, 'Company not found');
  res.json({ company });
}

export async function addMember(req, res) {
  const company = await Company.findById(req.params.id);
  if (!company) throw httpError(404, 'Company not found');
  const { user, credentials } = await createMember(company, req.body.name);
  res.status(201).json({ member: user, credentials });
}

export async function updateUser(req, res) {
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'customer' }, req.body, { new: true });
  if (!user) throw httpError(404, 'User not found');
  res.json({ member: user });
}

export async function resetPassword(req, res) {
  const password = generatePassword();
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'customer' },
    { passwordHash: await hashPassword(password) }
  );
  if (!user) throw httpError(404, 'User not found');
  res.json({ credentials: { loginId: user.loginId, password } });
}

export async function deleteCompany(req, res) {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) throw httpError(404, 'Company not found');
  await Promise.all([
    User.deleteMany({ companyId: company._id }),
    Project.deleteMany({ companyId: company._id }),
    Part.deleteMany({ companyId: company._id }),
  ]);
  res.json({ ok: true });
}
