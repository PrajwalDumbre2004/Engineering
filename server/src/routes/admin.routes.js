import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as company from '../controllers/company.controller.js';
import * as project from '../controllers/project.controller.js';
import * as part from '../controllers/part.controller.js';

const router = Router();
router.use(verifyToken, requireRole('admin'));

// Companies & members
router.get('/companies', company.listCompanies);
router.post('/companies', validate(company.createCompanySchema), company.createCompany);
router.get('/companies/:id', company.getCompany);
router.patch('/companies/:id', validate(company.updateCompanySchema), company.updateCompany);
router.delete('/companies/:id', company.deleteCompany);
router.post('/companies/:id/members', validate(company.memberSchema), company.addMember);
router.patch('/users/:id', validate(company.updateUserSchema), company.updateUser);
router.post('/users/:id/reset-password', company.resetPassword);

// Projects
router.get('/companies/:id/projects', project.listProjects);
router.post('/companies/:id/projects', validate(project.projectSchema), project.createProject);
router.get('/projects/:id', project.getProject);
router.patch('/projects/:id', validate(project.updateProjectSchema), project.updateProject);
router.delete('/projects/:id', project.deleteProject);

// Parts
router.get('/projects/:id/parts', part.listParts);
router.post('/projects/:id/parts', validate(part.createPartSchema), part.createPart);
router.patch('/parts/:id', validate(part.updatePartSchema), part.updatePart);
router.delete('/parts/:id', part.deletePart);

export default router;
