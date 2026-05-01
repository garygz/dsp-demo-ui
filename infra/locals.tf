locals {
  prefix     = "${var.app_name}-${var.environment}"
  account_id = data.aws_caller_identity.current.account_id
}
