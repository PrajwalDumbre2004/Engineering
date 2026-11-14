import { z } from 'zod';
import Company from '../models/Company.js';
import Project from '../models/Project.js';
import Part, { DONE_STATUSES } from '../models/Part.js';
import { httpError } from '../middleware/error.js';

export const projectSchema = z.object({
  projectNo: z.string().trim().min(1).max(50),
  title: z.string().trim().max(150).optional(),
});
export const updateProjectSchema = projectSchema.partial();

// Adds { total, done } part counts to each (lean) project
async function withStats(projects) {
  const stats = await Part.aggregate([
    { $match: { projectId: { $in: projects.map((p) => p._id) } } },
    {
      $group: {
        _id: '$projectId',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $in: ['$status', DONE_STATUSES] }, 1, 0] } },
      },
    },
  ]);
  const byId = new Map(stats.map((s) => [String(s._id), s]));
  return projects.map((p) => ({ ...p, total: byId.get(String(p._id))?.total || 0, done: byId.get(String(p._id))?.done || 0 }));
}

// ---- Admin ----
export async function listProjects(req, res) {
  const projects = await Project.find({ companyId: req.params.id }).sort({ createdAt: -1 }).lean();
  res.json({ projects: await withStats(projects) });
}

export async function createProject(req, res) {
  if (!(await Company.exists({ _id: req.params.id }))) throw httpError(404, 'Company not found');
  const project = await Project.create({ ...req.body, companyId: req.params.id });
  res.status(201).json({ project });
}

export async function getProject(req, res) {
  const project = await Project.findById(req.params.id).populate('companyId', 'name');
  if (!project) throw httpError(404, 'Project not found');
  res.json({ project });
}

export async function updateProject(req, res) {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!project) throw httpError(404, 'Project not found');
  res.json({ project });
}

export async function deleteProject(req, res) {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw httpError(404, 'Project not found');
  await Part.deleteMany({ projectId: project._id });
  res.json({ ok: true });
}

// ---- Customer (always scoped to the company in the verified token) ----
export async function myProjects(req, res) {
  const projects = await Project.find({ companyId: req.user.companyId }).sort({ createdAt: -1 }).lean();
  res.json({ projects: await withStats(projects) });
}

export async function myProject(req, res) {
  // Other companies' projects are reported as 404 so their existence isn't leaked
  const project = await Project.findOne({ _id: req.params.id, companyId: req.user.companyId });
  if (!project) throw httpError(404, 'Project not found');
  const parts = await Part.find({ projectId: project._id, companyId: req.user.companyId }).sort({ partNo: 1 });
  res.json({ project, parts });
}
