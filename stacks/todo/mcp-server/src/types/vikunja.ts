import { z } from 'zod';

// Vikunja API Types
export const VikunjaNowSchema = z.object({
  version: z.string(),
  frontend_url: z.string(),
  motd: z.string(),
  link_sharing_enabled: z.boolean(),
  max_file_size: z.string(),
  max_items_per_page: z.number(),
  available_migrators: z.array(z.string()),
  task_attachments_enabled: z.boolean(),
  enabled_background_providers: z.array(z.string()),
  totp_enabled: z.boolean(),
  legal: z.object({
    imprint_url: z.string(),
    privacy_policy_url: z.string(),
  }),
  caldav_enabled: z.boolean(),
  auth: z.object({
    local: z.object({
      enabled: z.boolean(),
      registration_enabled: z.boolean(),
    }),
    ldap: z.object({
      enabled: z.boolean(),
    }),
    openid_connect: z.object({
      enabled: z.boolean(),
      providers: z.nullable(z.any()),
    }),
  }),
  email_reminders_enabled: z.boolean(),
  user_deletion_enabled: z.boolean(),
  task_comments_enabled: z.boolean(),
  demo_mode_enabled: z.boolean(),
  webhooks_enabled: z.boolean(),
  public_teams_enabled: z.boolean(),
});

export const VikunjaTaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  done: z.boolean(),
  done_at: z.nullable(z.string()),
  due_date: z.nullable(z.string()),
  created: z.string(),
  updated: z.string(),
  priority: z.number(),
  start_date: z.nullable(z.string()),
  end_date: z.nullable(z.string()),
  repeat_after: z.number(),
  repeat_mode: z.number(),
  project_id: z.number(),
  created_by: z.object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    created: z.string(),
    updated: z.string(),
  }),
  position: z.number(),
  hex_color: z.string(),
  percent_done: z.number(),
  identifier: z.string(),
  index: z.number(),
  related_tasks: z.record(z.array(z.any())),
  attachments: z.nullable(z.array(z.any())),
  labels: z.array(z.any()),
  assignees: z.array(z.any()),
  bucket_id: z.number(),
  is_favorite: z.boolean(),
  subscription: z.nullable(z.any()),
  reminders: z.nullable(z.array(z.any())),
  cover_image_attachment_id: z.number(),
});

export const VikunjaProjectSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  identifier: z.string(),
  hex_color: z.string(),
  owner: z.object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    created: z.string(),
    updated: z.string(),
  }),
  tasks: z.array(VikunjaTaskSchema),
  is_archived: z.boolean(),
  background_information: z.nullable(z.any()),
  is_favorite: z.boolean(),
  subscription: z.nullable(z.any()),
  position: z.number(),
  created: z.string(),
  updated: z.string(),
});

export const VikunjaUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  email: z.string(),
  created: z.string(),
  updated: z.string(),
});

export const VikunjaAuthResponseSchema = z.object({
  token: z.string(),
  user: VikunjaUserSchema,
});

// Request/Response Types
export const CreateTaskRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  project_id: z.number(),
  priority: z.number().min(0).max(5).default(0),
  due_date: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const UpdateTaskRequestSchema = CreateTaskRequestSchema.partial().extend({
  done: z.boolean().optional(),
});

export const CreateProjectRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  hex_color: z.string().optional(),
});

// Export types
export type VikunjaInfo = z.infer<typeof VikunjaNowSchema>;
export type VikunjaTask = z.infer<typeof VikunjaTaskSchema>;
export type VikunjaProject = z.infer<typeof VikunjaProjectSchema>;
export type VikunjaUser = z.infer<typeof VikunjaUserSchema>;
export type VikunjaAuthResponse = z.infer<typeof VikunjaAuthResponseSchema>;
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;
export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

// Priority mappings
export const PRIORITY_LEVELS = {
  UNSET: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
  CRITICAL: 5,
} as const;

export const PRIORITY_NAMES: Record<number, string> = {
  0: "Unset",
  1: "Low",
  2: "Medium", 
  3: "High",
  4: "Urgent",
  5: "Critical",
};