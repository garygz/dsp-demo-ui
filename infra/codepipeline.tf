# ── GitHub connection (CodeStar) ──────────────────────────────────────────────
# After `terraform apply`, go to:
# AWS Console → Developer Tools → Connections → select this connection → click "Update pending connection"
# and complete the GitHub OAuth flow. The pipeline will not run until the
# connection status changes from PENDING to AVAILABLE.

resource "aws_codestarconnections_connection" "github" {
  name          = "${local.prefix}-github"
  provider_type = "GitHub"
}

# ── Pipeline ──────────────────────────────────────────────────────────────────
# Two stages only: Source → Build.
# CodeBuild handles the deploy (S3 sync + CloudFront invalidation) in post_build,
# so no separate Deploy stage is needed.

resource "aws_codepipeline" "ui" {
  name     = local.prefix
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    type     = "S3"
    location = aws_s3_bucket.pipeline_artifacts.bucket
  }

  stage {
    name = "Source"

    action {
      name             = "GitHub"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source"]

      configuration = {
        ConnectionArn        = aws_codestarconnections_connection.github.arn
        FullRepositoryId     = "${var.github_owner}/${var.github_repo}"
        BranchName           = var.github_branch
        OutputArtifactFormat = "CODE_ZIP"
      }
    }
  }

  stage {
    name = "Build"

    action {
      name             = "BuildAndDeploy"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source"]
      output_artifacts = ["build"]

      configuration = {
        ProjectName = aws_codebuild_project.ui.name
      }
    }
  }
}

# ── IAM role for CodePipeline ─────────────────────────────────────────────────

resource "aws_iam_role" "codepipeline" {
  name = "${local.prefix}-codepipeline"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "codepipeline.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "codepipeline" {
  name = "codepipeline-permissions"
  role = aws_iam_role.codepipeline.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3Artifacts"
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject", "s3:GetBucketVersioning"]
        Resource = [
          aws_s3_bucket.pipeline_artifacts.arn,
          "${aws_s3_bucket.pipeline_artifacts.arn}/*",
        ]
      },
      {
        Sid      = "CodeBuild"
        Effect   = "Allow"
        Action   = ["codebuild:StartBuild", "codebuild:BatchGetBuilds"]
        Resource = aws_codebuild_project.ui.arn
      },
      {
        Sid      = "CodeStarConnection"
        Effect   = "Allow"
        Action   = "codestar-connections:UseConnection"
        Resource = aws_codestarconnections_connection.github.arn
      },
    ]
  })
}
