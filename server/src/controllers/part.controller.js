import { z } from 'zod';
import Project from '../models/Project.js';
import Part, { PART_STATUSES } from '../models/Part.js';
import { httpError } from '../middleware/error.js';

const fields = {
  partNo: z.string().trim().min(1).max(50),
  quantity: z.number().int().min(1),
  status: z.enum(PART_STATUSES),
};
export const createPartSchema = z.object({ ...fields, status: fields.status.optional() });
export const updatePartSchema = z.object(fields).partial();

export async function listParts(req, res) {
  const parts = await Part.find({ projectId: req.params.id }).sort({ partNo: 1 });
  res.json({ parts });
}

export async function createPart(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) throw httpError(404, 'Project not found');
  const part = await Part.create({ ...req.body, projectId: project._id, companyId: project.companyId });
  res.status(201).json({ part });
}

export async function updatePart(req, res) {
  const part = await Part.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!part) throw httpError(404, 'Part not found');
  res.json({ part });
}

export async function deletePart(req, res) {
  const part = await Part.findByIdAndDelete(req.params.id);
  if (!part) throw httpError(404, 'Part not found');
  res.json({ ok: true });
}
