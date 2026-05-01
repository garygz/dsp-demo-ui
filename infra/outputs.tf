output "website_url" {
  description = "Public URL of the S3 static website"
  value       = "http://${aws_s3_bucket_website_configuration.hosting.website_endpoint}"
}

output "hosting_bucket" {
  description = "S3 bucket name for the static build output"
  value       = aws_s3_bucket.hosting.bucket
}

output "pipeline_name" {
  description = "CodePipeline name"
  value       = aws_codepipeline.ui.name
}

output "github_connection_arn" {
  description = "CodeStar connection ARN — must be manually activated in the AWS Console after apply"
  value       = aws_codestarconnections_connection.github.arn
}
