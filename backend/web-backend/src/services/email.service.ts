import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter: nodemailer.Transporter | null = null;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendJobCompletionEmail(
  toEmail: string,
  jobId: string,
  rmse: number,
  inlierCount: number
): Promise<void> {
  if (!transporter) {
    logger.debug(`Email service not configured. Skipping job completion notification to ${toEmail}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: toEmail,
      subject: `OrbitLens Registration Completed — Job #${jobId.slice(-6)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">OrbitLens Registration Completed</h2>
          <p>Your lunar image registration job has completed successfully.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p><strong>Job ID:</strong> ${jobId}</p>
            <p><strong>RMSE Accuracy:</strong> ${rmse.toFixed(3)} px</p>
            <p><strong>Verified Inlier Matches:</strong> ${inlierCount}</p>
          </div>
          <p><a href="${env.CLIENT_URL}/jobs/${jobId}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Results & Metrics</a></p>
        </div>
      `,
    });
  } catch (error: any) {
    logger.error(`Failed to send email to ${toEmail}:`, error.message);
  }
}
