import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { myProjects, myProject } from '../controllers/project.controller.js';

const router = Router();
router.use(verifyToken, requireRole('customer'));

// Read-only: customers have no write endpoints
router.get('/projects', myProjects);
router.get('/projects/:id', myProject);

export default router;
