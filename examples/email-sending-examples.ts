import { EmailSender, quickSendEmail, quickSendWithSes, quickSendWithSmtp } from '../src/email-sender';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function basicEmailSendingExample() {
  console.log('=== Basic Email Sending Examples ===\n');

  // Example 1: Quick send with auto-detection
  console.log('1. Quick send with auto provider detection:');
  const quickResult = await quickSendEmail({
    to: 'recipient@example.com',
    subject: 'Test Email',
    text: 'This is a test email sent using auto-detection.',
    html: '<p>This is a <strong>test email</strong> sent using auto-detection.</p>'
  });
  
  console.log(`✓ Quick send result:`, quickResult);
  console.log();

  // Example 2: Using EmailSender class with AWS SES
  if (process.env.AWS_ACCESS_KEY_ID) {
    console.log('2. Sending with AWS SES:');
    const sender = new EmailSender({
      aws: {
        region: process.env.AWS_REGION || 'us-east-1'
      },
      defaultFrom: process.env.EMAIL_FROM || 'no-reply@example.com'
    });

    const sesResult = await sender.sendWithSes({
      to: 'recipient@example.com',
      subject: 'AWS SES Test Email',
      text: 'This email was sent via AWS SES.',
      html: '<p>This email was sent via <strong>AWS SES</strong>.</p>'
    });

    console.log(`✓ AWS SES result:`, sesResult);
    console.log();
  }

  // Example 3: Using SMTP
  if (process.env.SMTP_HOST) {
    console.log('3. Sending with SMTP:');
    const smtpConfig = {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!
      }
    };

    const smtpResult = await quickSendWithSmtp({
      to: 'recipient@example.com',
      subject: 'SMTP Test Email',
      text: 'This email was sent via SMTP.',
      html: '<p>This email was sent via <strong>SMTP</strong>.</p>'
    }, smtpConfig);

    console.log(`✓ SMTP result:`, smtpResult);
    console.log();
  }

  // Example 4: Sending with attachments
  console.log('4. Sending email with attachments:');
  const sender = new EmailSender({
    defaultFrom: process.env.EMAIL_FROM || 'no-reply@example.com'
  });

  const attachmentResult = await sender.send({
    to: 'recipient@example.com',
    subject: 'Email with Attachments',
    text: 'Please find the attached files.',
    html: '<p>Please find the <strong>attached files</strong>.</p>',
    attachments: [
      {
        filename: 'test.txt',
        content: 'This is a test attachment content.',
        contentType: 'text/plain'
      },
      {
        filename: 'data.json',
        content: JSON.stringify({ message: 'Hello from attachment!' }, null, 2),
        contentType: 'application/json'
      }
    ]
  });

  console.log(`✓ Attachment result:`, attachmentResult);
  console.log();

  // Example 5: Multiple recipients
  console.log('5. Sending to multiple recipients:');
  const multipleResult = await sender.send({
    to: ['recipient1@example.com', 'recipient2@example.com'],
    cc: 'cc@example.com',
    bcc: 'bcc@example.com',
    subject: 'Email to Multiple Recipients',
    text: 'This email is sent to multiple recipients.',
    html: '<p>This email is sent to <strong>multiple recipients</strong>.</p>'
  });

  console.log(`✓ Multiple recipients result:`, multipleResult);
  console.log();

  // Example 6: Testing connection
  console.log('6. Testing email provider connections:');
  const connectionTest = await sender.testConnection();
  console.log(`✓ Connection test:`, connectionTest);
  
  const configStatus = sender.getConfigStatus();
  console.log(`✓ Configuration status:`, configStatus);
}

// Example of error handling
async function errorHandlingExample() {
  console.log('\n=== Error Handling Examples ===\n');

  // Example 1: No provider configured
  console.log('1. No provider configured:');
  const noConfigSender = new EmailSender();
  const noConfigResult = await noConfigSender.send({
    to: 'test@example.com',
    subject: 'Test',
    text: 'Test'
  });
  console.log(`✓ No config result:`, noConfigResult);
  console.log();

  // Example 2: Invalid SMTP configuration
  console.log('2. Invalid SMTP configuration:');
  const invalidSmtpResult = await quickSendWithSmtp({
    to: 'test@example.com',
    subject: 'Test',
    text: 'Test'
  }, {
    host: 'invalid-smtp-server.com',
    port: 587,
    secure: false,
    auth: {
      user: 'invalid@user.com',
      pass: 'wrongpassword'
    }
  });
  console.log(`✓ Invalid SMTP result:`, invalidSmtpResult);
}

// Run examples
async function runExamples() {
  try {
    await basicEmailSendingExample();
    await errorHandlingExample();
  } catch (error) {
    console.error('Example error:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runExamples();
}

export { basicEmailSendingExample, errorHandlingExample };
