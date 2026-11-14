// Vercel serverless entry: wraps the Express app and reuses the Mongo connection across invocations.
import mongoose from 'mongoose';
import config from '../server/src/config.js';
import app from '../server/src/app.js';

let connecting;

export default async function handler(req, res) {
  connecting ??= mongoose.connect(config.mongoUri).catch((err) => {
    connecting = undefined; // allow a retry on the next request
    throw err;
  });
  try {
    await connecting;
  } catch {
    return res.status(503).json({ message: 'Database unavailable' });
  }
  return app(req, res);
}
