variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name — used in resource names and tags"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name — used as a prefix for all resource names"
  type        = string
  default     = "dsp-demo-ui"
}

# ── CI/CD ─────────────────────────────────────────────────────────────────────

variable "github_owner" {
  description = "GitHub organisation or username that owns the repository"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "dsp-demo-ui"
}

variable "github_branch" {
  description = "Branch to build and deploy"
  type        = string
  default     = "main"
}

# ── App runtime config (baked into the Vite build) ───────────────────────────

variable "api_base_url" {
  description = "Backend ALB URL injected as VITE_API_BASE_URL at build time"
  type        = string
}

variable "sentry_dsn" {
  description = "Sentry DSN injected as VITE_SENTRY_DSN at build time (leave empty to disable)"
  type        = string
  default     = ""
  sensitive   = true
}
