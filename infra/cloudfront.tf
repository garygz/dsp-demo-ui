# ── Origin Access Control ─────────────────────────────────────────────────────
# OAC is the modern replacement for OAI — signs requests to S3 using SigV4.

resource "aws_cloudfront_origin_access_control" "ui" {
  name                              = local.prefix
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ── CloudFront distribution ───────────────────────────────────────────────────

resource "aws_cloudfront_distribution" "ui" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US, Canada, Europe — cheapest tier
  comment             = local.prefix

  origin {
    domain_name              = aws_s3_bucket.hosting.bucket_regional_domain_name
    origin_id                = "s3-${aws_s3_bucket.hosting.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.ui.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-${aws_s3_bucket.hosting.id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    # index.html is cached for 60 s so deploys propagate quickly.
    # Hashed assets (index-abc123.js) rely on long-lived browser cache set by CodeBuild.
    min_ttl     = 0
    default_ttl = 60
    max_ttl     = 86400
  }

  # SPA routing: S3 returns 403 (key not found via OAC) or 404 for any unknown
  # path. Both must redirect to index.html so React Router can handle the route.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
