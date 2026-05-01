# ── Static hosting bucket ─────────────────────────────────────────────────────
# Public bucket with S3 static website hosting.
# The error_document is also index.html so React Router handles all unknown paths.

resource "aws_s3_bucket" "hosting" {
  bucket = "${local.prefix}-hosting-${local.account_id}"
}

resource "aws_s3_bucket_public_access_block" "hosting" {
  bucket = aws_s3_bucket.hosting.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "hosting" {
  # Explicit dependency ensures access block is fully applied first
  depends_on = [aws_s3_bucket_public_access_block.hosting]

  bucket = aws_s3_bucket.hosting.id

  index_document { suffix = "index.html" }

  # All unknown paths (React Router routes) fall back to index.html
  error_document { key = "index.html" }
}

resource "aws_s3_bucket_policy" "hosting" {
  # Explicit dependency ensures access block is fully applied before policy
  depends_on = [aws_s3_bucket_public_access_block.hosting]

  bucket = aws_s3_bucket.hosting.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.hosting.arn}/*"
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
