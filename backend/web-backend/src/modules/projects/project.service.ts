import { Types } from 'mongoose';
import { Project, IProject } from './project.model.js';
import { Image } from '../images/image.model.js';
import { Job } from '../jobs/job.model.js';
import { CreateProjectInput, UpdateProjectInput } from './project.schema.js';
import { assertOwnership } from '../../utils/ownershipCheck.js';

export async function createProject(userId: string, input: CreateProjectInput): Promise<IProject> {
  return await Project.create({
    userId: new Types.ObjectId(userId),
    ...input,
  });
}

export async function getProjects(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ projects: IProject[]; total: number }> {
  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    Project.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments({ userId: new Types.ObjectId(userId) }),
  ]);

  return { projects, total };
}

export async function getProjectById(userId: string, projectId: string): Promise<IProject> {
  return await assertOwnership(Project, projectId, userId);
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput
): Promise<IProject> {
  const project = await assertOwnership(Project, projectId, userId);
  Object.assign(project, input);
  return await project.save();
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  await assertOwnership(Project, projectId, userId);
  const projId = new Types.ObjectId(projectId);
  const userObjectId = new Types.ObjectId(userId);

  // Unlink images and jobs associated with this project
  await Image.updateMany({ projectId: projId, userId: userObjectId }, { $unset: { projectId: 1 } });
  await Job.updateMany({ projectId: projId, userId: userObjectId }, { $unset: { projectId: 1 } });

  await Project.findByIdAndDelete(projectId);
}
