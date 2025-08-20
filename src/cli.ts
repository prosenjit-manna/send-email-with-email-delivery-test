#!/usr/bin/env node

import { EmailDeliverabilityTester, EmailTestConfig, EmailTestResult } from './email-tester';
import { EmailSender, EmailOptions } from './email-sender';

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
  send?: boolean;
  sendTo?: string;
  sendSubject?: string;
  sendMessage?: string;
  sendHtml?: string;
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
        case '--send':
        case '-s':
          options.send = true;
          break;
        case '--send-to':
          options.sendTo = nextArg;
          i++;
          break;
        case '--send-subject':
          options.sendSubject = nextArg;
          i++;
          break;
        case '--send-message':
          options.sendMessage = nextArg;
          i++;
          break;
        case '--send-html':
          options.sendHtml = nextArg;
          i++;
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

TESTING OPTIONS:
  --email, -e <email>           Single email address to test
  --emails <email1,email2>      Multiple email addresses (comma-separated)
  --validate, -v               Validation mode (format, domain, MX, SPF, DMARC only)
  --skip-delivery              Skip actual email delivery during testing
  --test-subject <subject>     Custom test email subject
  --test-message <message>     Custom test email message

SENDING OPTIONS:
  --send, -s                   Send email mode
  --send-to <email>            Recipient email address for sending
  --send-subject <subject>     Email subject
  --send-message <text>        Email message (plain text)
  --send-html <html>           Email message (HTML)

PROVIDER OPTIONS:
  --provider, -p <provider>    Email provider: aws-ses, smtp, both (default: both)
  --smtp-host <host>           SMTP server hostname (optional if SMTP_HOST env var set)
  --smtp-port <port>           SMTP server port (optional, default: 587)
  --smtp-user <username>       SMTP username (optional if SMTP_USER env var set)
  --smtp-pass <password>       SMTP password (optional if SMTP_PASS env var set)
  --smtp-secure <true|false>   Use secure connection (optional, default: auto-detect)

GENERAL OPTIONS:
  --help, -h                   Show this help message

Environment Variables (Auto-detected):
  AWS_ACCESS_KEY_ID           AWS access key for SES (auto-detected)
  AWS_SECRET_ACCESS_KEY       AWS secret key for SES (auto-detected)
  AWS_REGION                  AWS region (default: us-east-1)
  EMAIL_FROM                  Default from email address
  AWS_EMAIL_FROM              AWS SES specific from email
  SMTP_HOST / SMPTP_HOST      SMTP server hostname (auto-detected)
  SMTP_PORT                   SMTP server port (default: 587)
  SMTP_USER / SMPT_USER       SMTP username (auto-detected)
  SMTP_PASS / SMTP_PASSWORD   SMTP password (auto-detected)
  SMPT_PASSWORD               Alternative SMTP password env var
  SMPT_EMAIL_FROM             SMTP specific from email

Examples:

  TESTING EXAMPLES:
  # Test single email with validation only
  email-test --email test@example.com --validate

  # Test with AWS SES (auto-detects from env vars)
  email-test --email test@example.com --provider aws-ses

  # Test with SMTP (auto-detects from env vars)
  email-test --email test@example.com --provider smtp

  # Test with custom SMTP (overrides env vars)
  email-test --email test@example.com --provider smtp \\
    --smtp-host smtp.gmail.com --smtp-port 587 \\
    --smtp-user your@gmail.com --smtp-pass app-password

  # Test multiple emails
  email-test --emails "test1@example.com,test2@example.com" --validate

  SENDING EXAMPLES:
  # Send email (auto-detects provider from env vars)
  email-test --send --send-to recipient@example.com \\
    --send-subject "Hello" --send-message "Test message"

  # Send email via AWS SES (uses env vars)
  email-test --send --send-to recipient@example.com \\
    --send-subject "Hello" --send-message "Test message" --provider aws-ses

  # Send email via SMTP (uses env vars)
  email-test --send --send-to recipient@example.com \\
    --send-subject "Hello" --send-html "<h1>HTML Message</h1>" --provider smtp

  # Send with custom SMTP (overrides env vars)
  email-test --send --send-to recipient@example.com \\
    --send-subject "Hello" --send-html "<h1>HTML Message</h1>" \\
    --provider smtp --smtp-host smtp.gmail.com --smtp-port 587 \\
    --smtp-user your@gmail.com --smtp-pass app-password

  # Test first, then send if valid (using env vars)
  email-test --email test@example.com --validate && \\
    email-test --send --send-to test@example.com --send-subject "Welcome"
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

    // Handle send mode
    if (options.send) {
      await this.handleSendMode(options);
      return;
    }

    // Handle test mode
    if (!options.email && !options.emails) {
      console.error('❌ Error: Please provide an email address using --email or --emails');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    await this.handleTestMode(options);
  }

  private async handleSendMode(options: CLIOptions): Promise<void> {
    if (!options.sendTo) {
      console.error('❌ Error: Please provide recipient email using --send-to');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    if (!options.sendSubject && !options.sendMessage && !options.sendHtml) {
      console.error('❌ Error: Please provide email content using --send-subject, --send-message, or --send-html');
      console.log('Use --help for usage information');
      process.exit(1);
    }

    try {
      // Load environment variables if dotenv is available
      try {
        require('dotenv').config();
        console.log('🔧 Environment variables loaded successfully');
        console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'NOT SET'}`);
        console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'NOT SET'}`);
        console.log(`   SMTP_EMAIL_FROM: ${process.env.SMTP_EMAIL_FROM || 'NOT SET'}`);
      } catch {
        console.log('⚠️  dotenv not available, continuing without it');
      }

      console.log(`📧 Sending email to: ${options.sendTo}\n`);

      // Build SMTP config if provided (otherwise auto-detect from env)
      const smtpConfig = options.smtpHost ? {
        host: options.smtpHost,
        port: options.smtpPort || 587,
        secure: options.smtpSecure || false,
        auth: options.smtpUser && options.smtpPass ? {
          user: options.smtpUser,
          pass: options.smtpPass
        } : undefined
      } : undefined; // Let auto-detection handle it if not provided

      // Build AWS config only if AWS options are explicitly provided
      // Don't create awsConfig just because env vars exist - let auto-detection handle it
      const awsConfig = undefined; // Always let auto-detection handle AWS

      // Create email sender with auto-detection enabled
      const sender = new EmailSender({
        aws: awsConfig,
        smtp: smtpConfig,
        defaultFrom: process.env.EMAIL_FROM || process.env.AWS_EMAIL_FROM || process.env.SMTP_EMAIL_FROM || 'no-reply@example.com',
        autoDetectFromEnv: true // Enable auto-detection
      });

      // Build email options
      const emailOptions: EmailOptions = {
        to: options.sendTo,
        subject: options.sendSubject || 'Email sent via CLI',
        text: options.sendMessage,
        html: options.sendHtml
      };

      // Send email with specified provider or auto-detection
      const providerToUse = options.provider === 'both' ? undefined : options.provider;
      const result = await sender.send(emailOptions, providerToUse);

      if (result.success) {
        console.log(`✅ Email sent successfully!`);
        console.log(`   Provider: ${result.provider}`);
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   To: ${options.sendTo}`);
        console.log(`   Subject: ${emailOptions.subject}`);
      } else {
        console.log(`❌ Email sending failed!`);
        console.log(`   Provider: ${result.provider}`);
        console.log(`   Error: ${result.error}`);
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private async handleTestMode(options: CLIOptions): Promise<void> {

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
