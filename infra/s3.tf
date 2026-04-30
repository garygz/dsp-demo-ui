# ── Static hosting bucket ─────────────────────────────────────────────────────
# Private bucket — CloudFront accesses it via OAC (no public access).

resource "aws_s3_bucket" "hosting" {
  bucket = "${local.prefix}-hosting-${local.account_id}"
}

resource "aws_s3_bucket_public_access_block" "hosting" {
  bucket                  = aws_s3_bucket.hosting.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Allow CloudFront OAC to read objects
resource "aws_s3_bucket_policy" "hosting" {
  bucket = aws_s3_bucket.hosting.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontOAC"
      Effect = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.hosting.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.ui.arn
        }
      }
    }]
  })
}

# ── Pipeline artifacts bucket ─────────────────────────────────────────────────

resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket = "${local.prefix}-pipeline-artifacts-${local.account_id}"
}

resource "aws_s3_bucket_public_access_block" "pipeline_artifacts" {
  bucket                  = aws_s3_bucket.pipeline_artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  rule {
    id     = "expire-old-artifacts"
    status = "Enabled"
    filter {}
    expiration { days = 30 }
  }
}
