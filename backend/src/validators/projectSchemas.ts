import { z } from 'zod';

export const GitHubSubmissionSchema = z.object({
  repoUrl: z
    .string()
    .trim()
    .min(1, 'Repository URL is required')
    .refine((url) => {
      // Must be a valid public github.com URL: https://github.com/owner/repo
      return /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/)?$/.test(url);
    }, 'Must be a valid GitHub repository URL (e.g., https://github.com/owner/repo)'),
});

export const AIDocumentationResponseSchema = z.object({
  executiveSummary: z.string().min(1).max(3000),
  projectOverview: z.string().min(1).max(3000),
  architectureExplanation: z.string().min(1).max(3000),
  dataFlowExplanation: z.string().min(1).max(3000),
  componentInsights: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      keyRole: z.string(),
    })
  ).max(20).optional(),
  limitations: z.array(z.string().max(1000)).max(15).optional(),
});

export type GitHubSubmissionInput = z.infer<typeof GitHubSubmissionSchema>;
export type AIDocumentationResponse = z.infer<typeof AIDocumentationResponseSchema>;
