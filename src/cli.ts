#!/usr/bin/env node

import { EmailDeliverabilityTester, EmailTestConfig, EmailTestResult } from './email-tester';

interface CLIOptions {
  email?: string;
  emails?: string[];
  provider?: 'aws-ses' | 'smtp' | 'both';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  testSubject?: string;
  testMessage?: string;
  skipDelivery?: boolean;
  help?: boolean;
  validate?: boolean;
}

class EmailTestCLI {
  private parseArguments(): CLIOptions {
    const args = process.argv.slice(2);
    const options: CLIOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = args[i + 1];

      switch (arg) {
        case '--email':
        case '-e':
          options.email = nextArg;
          i++;
          break;
        case '--emails':
          options.emails = nextArg?.split(',').map(email => email.trim());
          i++;
          break;
        case '--provider':
        case '-p':
          options.provider = nextArg as 'aws-ses' | 'smtp' | 'both';
          i++;
          break;
        case '--smtp-host':
          options.smtpHost = nextArg;
          i++;
          break;
        case '--smtp-port':
          options.smtpPort = parseInt(nextArg);
          i++;
          break;
        case '--smtp-user':
          options.smtpUser = nextArg;
          i++;
          break;
        case '--smtp-pass':
          options.smtpPass = nextArg;
          i++;
          break;
        case '--smtp-secure':
          options.smtpSecure = nextArg?.toLowerCase() === 'true';
          i++;
          break;
        case '--test-subject':
          options.testSubject = nextArg;
          i++;
          break;
        case '--test-message':
          options.testMessage = nextArg;
          i++;
          break;
        case '--skip-delivery':
          options.skipDelivery = true;
          break;
        case '--validate':
        case '-v':
          options.validate = true;
          break;
        case '--help':
        case '-h':
          options.help = true;
          break;
      }
    }

    return options;
  }

  private showHelp(): void {
    console.log(`
Email Deliverability Tester CLI

Usage:
  email-test [options]

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
  --help, -h                   Show this help message

Environment Variables:
  AWS_ACCESS_KEY_ID           AWS access key for SES
  AWS_SECRET_ACCESS_KEY       AWS secret key for SES
  AWS_REGION                  AWS region (default: us-east-1)
  EMAIL_FROM                  Default from email address

Examples:
  # Test single email with validation only
  email-test --email test@example.com --validate

  # Test with AWS SES
  email-test --email test@example.com --provider aws-ses

  # Test with custom SMTP
  email-test --email test@example.com --provider smtp \\
    --smtp-host smtp.gmail.com --smtp-port 587 \\
    --smtp-user your@gmail.com --smtp-pass app-password

  # Test multiple emails
  email-test --emails "test1@example.com,test2@example.com" --validate

  # Test with custom message
  email-test --email test@example.com --skip-delivery \\
    --test-subject "Custom Test" --test-message "Hello World"
`);
  }

  private formatResult(result: EmailTestResult): void {
    console.log(`\n📧 Results for: ${result.email}`);
    console.log('─'.repeat(50));
    console.log(`✓ Valid format: ${result.isValid ? '✅ Yes' : '❌ No'}`);
    console.log(`✓ Domain exists: ${result.domainExists ? '✅ Yes' : '❌ No'}`);
    console.log(`✓ MX records: ${result.mxRecords.length > 0 ? `✅ ${result.mxRecords.length} found` : '❌ None'}`);
    console.log(`✓ SPF record: ${result.spfRecord ? '✅ Found' : '⚠️  Not found'}`);
    console.log(`✓ DMARC record: ${result.dmarcRecord ? '✅ Found' : '⚠️  Not found'}`);

    if (result.deliverabilityTests.awsSes) {
      const ses = result.deliverabilityTests.awsSes;
      console.log(`✓ AWS SES: ${ses.success ? `✅ Success (${ses.messageId})` : `❌ Failed (${ses.error})`}`);
    }

    if (result.deliverabilityTests.smtp) {
      const smtp = result.deliverabilityTests.smtp;
      console.log(`✓ SMTP: ${smtp.success ? `✅ Success (${smtp.messageId})` : `❌ Failed (${smtp.error})`}`);
    }

    console.log(`\n💡 Recommendations:`);
    result.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });

    if (result.testDuration) {
      console.log(`\n⏱️  Test duration: ${result.testDuration}ms`);
    }
  }

  async run(): Promise<void> {
    const options = this.parseArguments();

    if (options.help) {
      this.showHelp();
      return;
    }

    if (!options.email && !options.emails) {
      console.error('❌ Error: Please provide an email address using --email or --emails');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    try {
      // Load environment variables if dotenv is available
      try {
        require('dotenv').config();
      } catch {
        // dotenv not available, continue without it
      }

      const tester = new EmailDeliverabilityTester();

      // Build SMTP config if provided
      const smtpConfig = options.smtpHost ? {
        host: options.smtpHost,
        port: options.smtpPort || 587,
        secure: options.smtpSecure || false,
        auth: options.smtpUser && options.smtpPass ? {
          user: options.smtpUser,
          pass: options.smtpPass
        } : undefined
      } : undefined;

      // Build test message if provided
      const testMessage = options.testSubject || options.testMessage ? {
        subject: options.testSubject || 'Email Deliverability Test',
        text: options.testMessage || 'This is a test email to verify deliverability',
        html: options.testMessage ? `<p>${options.testMessage}</p>` : undefined
      } : undefined;

      if (options.emails) {
        // Batch testing
        console.log(`🚀 Testing ${options.emails.length} email addresses...\n`);
        
        const configs: EmailTestConfig[] = options.emails.map(email => ({
          email,
          provider: options.provider,
          smtpConfig,
          testMessage,
          skipActualDelivery: options.skipDelivery || options.validate
        }));

        const batchResult = await tester.testMultipleEmails(configs);
        
        batchResult.results.forEach(result => this.formatResult(result));
        
        console.log(`\n📊 Batch Summary:`);
        console.log(`   Total: ${batchResult.total}`);
        console.log(`   Successful: ${batchResult.successful}`);
        console.log(`   Failed: ${batchResult.failed}`);
        console.log(`   Duration: ${batchResult.duration}ms`);

      } else if (options.email) {
        // Single email testing
        console.log(`🚀 Testing email: ${options.email}\n`);
        
        const config: EmailTestConfig = {
          email: options.email,
          provider: options.provider,
          smtpConfig,
          testMessage,
          skipActualDelivery: options.skipDelivery || options.validate
        };

        const result = await tester.testEmailDeliverability(config);
        this.formatResult(result);
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new EmailTestCLI();
  cli.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}
