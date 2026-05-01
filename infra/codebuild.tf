resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/aws/codebuild/${local.prefix}"
  retention_in_days = 14
}

resource "aws_codebuild_project" "ui" {
  name          = local.prefix
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = 15

  source {
    type      = "CODEPIPELINE"
    buildspec = "buildspec.yml"
  }

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    type         = "LINUX_CONTAINER"
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/standard:7.0"

    # Baked into the Vite production build at compile time
    environment_variable {
      name  = "VITE_API_BASE_URL"
      value = var.api_base_url
    }

    environment_variable {
      name  = "VITE_SENTRY_DSN"
      value = var.sentry_dsn
      type  = "PLAINTEXT"
    }

    # Used by post_build to sync to S3
    environment_variable {
      name  = "S3_BUCKET"
      value = aws_s3_bucket.hosting.bucket
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.codebuild.name
    }
  }
}
