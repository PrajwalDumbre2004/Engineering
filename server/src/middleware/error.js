import { ZodError } from 'zod';
import config from '../config.js';

export const notFound = (req, res) => res.status(404).json({ message: 'Route not found' });

export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
    return res.status(400).json({ message });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).find((k) => k !== 'companyId' && k !== 'projectId') || 'value';
    return res.status(409).json({ message: `This ${field} already exists` });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.status) return res.status(err.status).json({ message: err.message });

  console.error(err);
  res.status(500).json({ message: config.isProd ? 'Server error' : err.message });
}

// Small helper for "not found" in controllers
export const httpError = (status, message) => Object.assign(new Error(message), { status });
