# Email Deliverability Tester

[![npm version](https://badge.fury.io/js/email-deliverability-tester.svg)](https://badge.fury.io/js/email-deliverability-tester)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)

A comprehensive email deliverability testing utility that validates email format, domain existence, DNS records, and tests actual delivery via AWS SES and SMTP. Perfect for applications that need to verify email addresses before sending important communications.

## 🚀 Features

- ✅ **Email Format Validation** - Validates email address format using regex
- 🌐 **Domain Verification** - Checks if the email domain exists
- 📮 **MX Record Lookup** - Retrieves and validates MX records for the domain
- 🛡️ **SPF Record Check** - Looks up SPF records for sender policy validation
- 🔒 **DMARC Record Check** - Verifies DMARC policy records
- 📤 **AWS SES Testing** - Tests actual email delivery via Amazon SES
- 📧 **SMTP Testing** - Tests email delivery via custom SMTP servers
- 🔄 **Batch Testing** - Test multiple email addresses at once
- 💡 **Smart Recommendations** - Provides actionable recommendations based on test results
- 📊 **Performance Tracking** - Measures test duration and provides batch statistics
- 🎯 **TypeScript Support** - Full TypeScript definitions included
- 🖥️ **CLI Tool** - Command-line interface for quick testing

## 📦 Installation

```bash
npm install email-deliverability-tester
```

## 🔧 Quick Start

### Basic Usage

```typescript
import { EmailDeliverabilityTester, quickEmailValidation } from 'email-deliverability-tester';

// Quick email validation (no actual delivery test)
const result = await quickEmailValidation('user@example.com');
console.log(`Email is ${result.isValid ? 'valid' : 'invalid'}`);
console.log(`Domain exists: ${result.domainExists}`);
console.log(`MX records found: ${result.mxRecords.length}`);
```

### Batch Email Validation

```typescript
import { batchEmailValidation } from 'email-deliverability-tester';

const emails = ['user1@example.com', 'user2@gmail.com', 'invalid-email'];
const result = await batchEmailValidation(emails);

console.log(`Valid emails: ${result.validEmails.length}`);
console.log(`Invalid emails: ${result.invalidEmails.length}`);
```

### AWS SES Integration

```typescript
import { EmailDeliverabilityTester } from 'email-deliverability-tester';

const tester = new EmailDeliverabilityTester({
  accessKeyId: 'your-aws-access-key',
  secretAccessKey: 'your-aws-secret-key',
  region: 'us-east-1'
}, 'your-from-email@domain.com');

const result = await tester.testEmailDeliverability({
  email: 'recipient@example.com',
  provider: 'aws-ses',
  skipActualDelivery: false // Set to true to skip sending actual email
});

console.log(`Delivery test: ${result.deliverabilityTests.awsSes?.success}`);
```

### SMTP Testing

```typescript
import { quickEmailTestWithSmtp } from 'email-deliverability-tester';

const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
};

const result = await quickEmailTestWithSmtp('recipient@example.com', smtpConfig);
console.log(`SMTP test: ${result.deliverabilityTests.smtp?.success}`);
```

## 🖥️ CLI Usage

After installation, you can use the CLI tool:

```bash
# Install globally for CLI access
npm install -g email-deliverability-tester

# Test a single email (validation only)
email-test --email test@example.com --validate

# Test with AWS SES
email-test --email test@example.com --provider aws-ses

# Test multiple emails
email-test --emails "test1@example.com,test2@example.com" --validate

# Test with custom SMTP
email-test --email test@example.com --provider smtp \
  --smtp-host smtp.gmail.com --smtp-port 587 \
  --smtp-user your@gmail.com --smtp-pass app-password
```

### CLI Options

```
Options:
  --email, -e <email>           Single email address to test
  --emails <email1,email2>      Multiple email addresses (comma-separated)
  --provider, -p <provider>     Email provider: aws-ses, smtp, both (default: both)
  --smtp-host <host>           SMTP server hostname
  --smtp-port <port>           SMTP server port (default: 587)
  --smtp-user <username>       SMTP username
  --smtp-pass <password>       SMTP password
  --smtp-secure <true|false>   Use secure connection (default: false)
  --test-subject <subject>     Custom test email subject
  --test-message <message>     Custom test email message
  --skip-delivery              Skip actual email delivery (validation only)
  --validate, -v               Validation mode (same as --skip-delivery)
  --help, -h                   Show help message
```

## 🔐 Environment Variables

Set up environment variables for AWS SES and SMTP:

```bash
# AWS SES Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
EMAIL_FROM=no-reply@yourdomain.com

# SMTP Configuration (for examples)
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

## 📖 API Reference

### EmailDeliverabilityTester

Main class for email deliverability testing.

#### Constructor

```typescript
new EmailDeliverabilityTester(awsConfig?, fromEmail?)
```

- `awsConfig` (optional): AWS SES configuration object
- `fromEmail` (optional): Default from email address

#### Methods

##### `testEmailDeliverability(config: EmailTestConfig): Promise<EmailTestResult>`

Test a single email address for deliverability.

##### `testMultipleEmails(configs: EmailTestConfig[]): Promise<BatchTestResult>`

Test multiple email addresses in batch.

##### `validateEmails(emails: string[]): Promise<EmailValidationResult>`

Validate multiple emails without sending test emails.

##### `isAwsSesConfigured(): boolean`

Check if AWS SES is properly configured.

##### `setDefaultFromEmail(email: string): void`

Set the default from email address.

### Types

#### EmailTestConfig

```typescript
interface EmailTestConfig {
  email: string;
  provider?: 'aws-ses' | 'smtp' | 'both';
  smtpConfig?: SmtpConfig;
  testMessage?: TestMessage;
  skipActualDelivery?: boolean;
}
```

#### EmailTestResult

```typescript
interface EmailTestResult {
  email: string;
  isValid: boolean;
  domainExists: boolean;
  mxRecords: MxRecord[];
  spfRecord?: string;
  dmarcRecord?: string;
  deliverabilityTests: DeliveryTestResults;
  recommendations: string[];
  testDuration?: number;
}
```

#### SmtpConfig

```typescript
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}
```

## 🔧 Advanced Usage

### Custom Email Service Integration

```typescript
import { EmailDeliverabilityTester } from 'email-deliverability-tester';

class EnhancedEmailService {
  private tester: EmailDeliverabilityTester;

  constructor() {
    this.tester = new EmailDeliverabilityTester();
  }

  async sendWithValidation(email: string, content: any) {
    // Pre-validate email
    const validation = await this.tester.testEmailDeliverability({
      email,
      skipActualDelivery: true
    });

    if (!validation.isValid || !validation.domainExists) {
      throw new Error(`Invalid email: ${validation.recommendations.join(', ')}`);
    }

    // Proceed with sending email
    return this.sendEmail(email, content);
  }

  private async sendEmail(email: string, content: any) {
    // Your email sending logic here
    console.log(`Sending email to ${email}`);
  }
}
```

### Bulk Email List Validation

```typescript
import { EmailDeliverabilityTester } from 'email-deliverability-tester';

async function validateEmailList(emails: string[]) {
  const tester = new EmailDeliverabilityTester();
  
  console.log(`Validating ${emails.length} emails...`);
  
  const result = await tester.validateEmails(emails);
  
  console.log(`✅ Valid: ${result.validEmails.length}`);
  console.log(`❌ Invalid: ${result.invalidEmails.length}`);
  
  // Log details for invalid emails
  result.invalidEmails.forEach(item => {
    console.log(`❌ ${item.email}: ${item.issues.join(', ')}`);
  });
  
  return result.validEmails;
}
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 📚 Examples

Check out the [examples](./examples) directory for more usage examples:

- [Basic Usage](./examples/basic-usage.ts) - Simple validation and testing examples
- [Advanced Usage](./examples/advanced-usage.ts) - AWS SES integration and complex scenarios

Run examples:

```bash
npm run example:basic
npm run example:advanced
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues

If you encounter any issues or have feature requests, please [create an issue](https://github.com/yourusername/email-deliverability-tester/issues) on GitHub.

## 📈 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

## 🙏 Acknowledgments

- Built with [Node.js](https://nodejs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Email delivery powered by [AWS SES](https://aws.amazon.com/ses/) and [Nodemailer](https://nodemailer.com/)
- DNS lookups using Node.js built-in `dns` module

---

Made with ❤️ for better email deliverability testing
