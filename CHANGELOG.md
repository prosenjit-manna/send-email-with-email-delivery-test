# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-20

### Added
- Initial release of email-deliverability-tester
- Email format validation using regex
- Domain existence verification
- MX record lookup and validation
- SPF record checking
- DMARC record checking
- AWS SES integration for delivery testing
- SMTP integration for delivery testing
- Batch email testing capability
- Smart recommendations system
- Performance tracking and duration measurement
- TypeScript support with full type definitions
- Command-line interface (CLI) tool
- Comprehensive test suite
- Documentation and examples
- Error handling and logging

### Features
- `EmailDeliverabilityTester` main class
- `quickEmailValidation` utility function
- `quickEmailTestWithSes` utility function
- `quickEmailTestWithSmtp` utility function
- `batchEmailValidation` utility function
- CLI tool with multiple options
- Support for environment variables
- Configurable SMTP settings
- AWS SES credential configuration
- Skip delivery mode for validation-only testing
