output "cloudfront_url" {
  description = "Public URL of the CloudFront distribution"
  value       = "https://${aws_cloudfront_distribution.ui.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (needed for manual cache invalidations)"
  value       = aws_cloudfront_distribution.ui.id
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
