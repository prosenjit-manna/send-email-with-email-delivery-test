import { EmailSender, quickSendEmail } from '../src/email-sender';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function autoConfigurationExample() {
  console.log('=== Auto-Configuration Example ===\n');

  // Example 1: Create EmailSender with no configuration - it will auto-detect from env vars
  console.log('1. Creating EmailSender with auto-detection...');
  const autoSender = new EmailSender(); // No config provided, will auto-detect

  const configStatus = autoSender.getConfigStatus();
  console.log(`✓ Auto-detected configuration:`);
  console.log(`   AWS SES available: ${configStatus.hasAwsSes}`);
  console.log(`   SMTP available: ${configStatus.hasSmtp}`);
  console.log(`   Default from email: ${configStatus.defaultFrom}`);
  console.log();

  // Example 2: Test connections
  console.log('2. Testing auto-detected connections...');
  const connectionTest = await autoSender.testConnection();
  console.log(`✓ AWS SES: ${connectionTest.aws.configured ? (connectionTest.aws.connected ? 'Connected' : `Failed: ${connectionTest.aws.error}`) : 'Not configured'}`);
  console.log(`✓ SMTP: ${connectionTest.smtp.configured ? (connectionTest.smtp.connected ? 'Connected' : `Failed: ${connectionTest.smtp.error}`) : 'Not configured'}`);
  console.log();

  // Example 3: Send email using auto-detected configuration
  if (configStatus.hasAwsSes || configStatus.hasSmtp) {
    console.log('3. Sending email using auto-detected configuration...');
    const result = await autoSender.send({
      to: 'test@example.com',
      subject: 'Auto-Configuration Test',
      text: 'This email was sent using auto-detected configuration from environment variables.',
      html: `
        <h2>Auto-Configuration Test</h2>
        <p>This email was sent using auto-detected configuration from environment variables.</p>
        <h3>Detected Configuration:</h3>
        <ul>
          <li>AWS SES: ${configStatus.hasAwsSes ? '✓ Available' : '✗ Not available'}</li>
          <li>SMTP: ${configStatus.hasSmtp ? '✓ Available' : '✗ Not available'}</li>
          <li>From Email: ${configStatus.defaultFrom}</li>
        </ul>
      `
    });

    console.log(`✓ Send result:`, result);
  } else {
    console.log('3. No email providers auto-detected from environment variables.');
    console.log('   Please set up environment variables for AWS SES or SMTP.');
  }
  console.log();

  // Example 4: Quick send with no configuration
  console.log('4. Using quickSendEmail with auto-detection...');
  const quickResult = await quickSendEmail({
    to: 'test@example.com',
    subject: 'Quick Send Auto-Detection Test',
    text: 'This email was sent using quickSendEmail with auto-detection.'
  });
  console.log(`✓ Quick send result:`, quickResult);
}

async function partialConfigurationExample() {
  console.log('\n=== Partial Configuration Example ===\n');

  // Example 1: Provide only AWS config, SMTP will be auto-detected
  console.log('1. Providing AWS config, auto-detecting SMTP...');
  const mixedSender = new EmailSender({
    aws: {
      region: 'us-west-2' // Override region, but use env vars for credentials
    },
    // No SMTP config provided - will auto-detect from env vars
    autoDetectFromEnv: true
  });

  const mixedStatus = mixedSender.getConfigStatus();
  console.log(`✓ Mixed configuration:`);
  console.log(`   AWS SES available: ${mixedStatus.hasAwsSes}`);
  console.log(`   SMTP available: ${mixedStatus.hasSmtp}`);
  console.log();

  // Example 2: Disable auto-detection
  console.log('2. Disabling auto-detection...');
  const manualSender = new EmailSender({
    autoDetectFromEnv: false, // Disable auto-detection
    defaultFrom: 'manual@example.com'
  });

  const manualStatus = manualSender.getConfigStatus();
  console.log(`✓ Manual configuration (no auto-detection):`);
  console.log(`   AWS SES available: ${manualStatus.hasAwsSes}`);
  console.log(`   SMTP available: ${manualStatus.hasSmtp}`);
  console.log(`   Default from email: ${manualStatus.defaultFrom}`);
}

async function environmentVariablesExample() {
  console.log('\n=== Environment Variables Support ===\n');

  console.log('Supported environment variables for auto-detection:');
  console.log();

  console.log('AWS SES Configuration:');
  console.log(`• AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Not set'}`);
  console.log(`• AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Not set'}`);
  console.log(`• AWS_REGION: ${process.env.AWS_REGION || 'Not set (defaults to us-east-1)'}`);
  console.log(`• AWS_EMAIL_FROM: ${process.env.AWS_EMAIL_FROM || 'Not set'}`);
  console.log();

  console.log('SMTP Configuration:');
  console.log(`• SMTP_HOST: ${process.env.SMTP_HOST || 'Not set'}`);
  console.log(`• SMPTP_HOST: ${process.env.SMPTP_HOST || 'Not set'} (alternative)`);
  console.log(`• SMTP_PORT: ${process.env.SMTP_PORT || 'Not set (defaults to 587)'}`);
  console.log(`• SMTP_USER: ${process.env.SMTP_USER || 'Not set'}`);
  console.log(`• SMPT_USER: ${process.env.SMPT_USER || 'Not set'} (alternative)`);
  console.log(`• SMTP_PASS: ${process.env.SMTP_PASS || 'Not set'}`);
  console.log(`• SMTP_PASSWORD: ${process.env.SMTP_PASSWORD || 'Not set'} (alternative)`);
  console.log(`• SMPT_PASSWORD: ${process.env.SMPT_PASSWORD || 'Not set'} (alternative)`);
  console.log(`• SMTP_SECURE: ${process.env.SMTP_SECURE || 'Not set (auto-detected from port)'}`);
  console.log();

  console.log('General Configuration:');
  console.log(`• EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not set'}`);
  console.log(`• SMPT_EMAIL_FROM: ${process.env.SMPT_EMAIL_FROM || 'Not set'} (SMTP specific)`);
}

// Run all examples
async function runAutoConfigExamples() {
  try {
    await autoConfigurationExample();
    await partialConfigurationExample();
    await environmentVariablesExample();
    
    console.log('\n=== Auto-Configuration Examples Completed! ===');
    console.log('\nNow you can use the EmailSender without providing explicit configuration.');
    console.log('Just set up your environment variables and the system will auto-detect them!');
  } catch (error) {
    console.error('Example error:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runAutoConfigExamples();
}

export { 
  autoConfigurationExample, 
  partialConfigurationExample, 
  environmentVariablesExample 
};
