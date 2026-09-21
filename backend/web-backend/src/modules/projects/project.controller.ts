import { Request, Response, NextFunction } from 'express';
import * as projectService from './project.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export async function createProjectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.createProject(req.user!.userId, req.body);
    return sendSuccess(res, project, 201);
  } catch (error) {
    next(error);
  }
}

export async function getProjectsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { projects, total } = await projectService.getProjects(req.user!.userId, page, limit);

    return sendPaginated(
      res,
      projects,
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      200
    );
  } catch (error) {
    next(error);
  }
}

export async function getProjectByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.getProjectById(req.user!.userId, req.params.id);
    return sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
}

export async function updateProjectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.updateProject(req.user!.userId, req.params.id, req.body);
    return sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
}

export async function deleteProjectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await projectService.deleteProject(req.user!.userId, req.params.id);
    return sendSuccess(res, { message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
}
