import { 
  EmailDeliverabilityTester, 
  EmailSender, 
  quickEmailValidation,
  quickSendEmail 
} from '../src/index';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function completeEmailWorkflowExample() {
  console.log('=== Complete Email Workflow: Test → Send ===\n');

  const emailToTest = 'user@example.com';
  
  // Step 1: Test email deliverability first
  console.log(`1. Testing deliverability for: ${emailToTest}`);
  const testResult = await quickEmailValidation(emailToTest);
  
  console.log(`✓ Email format valid: ${testResult.isValid}`);
  console.log(`✓ Domain exists: ${testResult.domainExists}`);
  console.log(`✓ MX records found: ${testResult.mxRecords.length}`);
  console.log(`✓ SPF record: ${testResult.spfRecord ? 'Found' : 'Not found'}`);
  console.log(`✓ DMARC record: ${testResult.dmarcRecord ? 'Found' : 'Not found'}`);
  console.log(`✓ Recommendations: ${testResult.recommendations.join(', ')}`);
  console.log();

  // Step 2: Only send if email passes basic validation
  if (testResult.isValid && testResult.domainExists) {
    console.log('2. Email passed validation, proceeding to send...');
    
    const sendResult = await quickSendEmail({
      to: emailToTest,
      subject: 'Welcome! Your email passed our deliverability test',
      text: `Hello! We've verified that your email address ${emailToTest} is valid and can receive emails.`,
      html: `
        <h2>Welcome!</h2>
        <p>We've verified that your email address <strong>${emailToTest}</strong> is valid and can receive emails.</p>
        <h3>Validation Results:</h3>
        <ul>
          <li>Email format: ✓ Valid</li>
          <li>Domain exists: ✓ Valid</li>
          <li>MX records: ${testResult.mxRecords.length} found</li>
          <li>SPF record: ${testResult.spfRecord ? '✓ Found' : '⚠ Not found'}</li>
          <li>DMARC record: ${testResult.dmarcRecord ? '✓ Found' : '⚠ Not found'}</li>
        </ul>
        <p>Thank you for using our email service!</p>
      `
    });

    console.log(`✓ Send result:`, sendResult);
  } else {
    console.log('2. Email failed validation, not sending.');
    console.log(`   Issues: ${testResult.recommendations.join(', ')}`);
  }
}

async function bulkEmailWorkflowExample() {
  console.log('\n=== Bulk Email Workflow: Validate → Filter → Send ===\n');

  const emailList = [
    'valid-user@gmail.com',
    'another-user@yahoo.com',
    'invalid-email-format',
    'user@nonexistentdomain12345.com',
    'test@example.com'
  ];

  console.log(`1. Processing ${emailList.length} emails...`);

  // Step 1: Validate all emails
  const validEmails: string[] = [];
  const invalidEmails: Array<{email: string, reason: string}> = [];

  for (const email of emailList) {
    console.log(`   Testing: ${email}`);
    const result = await quickEmailValidation(email);
    
    if (result.isValid && result.domainExists) {
      validEmails.push(email);
      console.log(`   ✓ Valid: ${email}`);
    } else {
      invalidEmails.push({
        email,
        reason: result.recommendations.join(', ')
      });
      console.log(`   ✗ Invalid: ${email} (${result.recommendations.join(', ')})`);
    }
  }

  console.log(`\n2. Validation complete:`);
  console.log(`   Valid emails: ${validEmails.length}`);
  console.log(`   Invalid emails: ${invalidEmails.length}`);

  // Step 2: Send to valid emails only
  if (validEmails.length > 0) {
    console.log(`\n3. Sending newsletter to ${validEmails.length} valid emails...`);
    
    const sender = new EmailSender({
      defaultFrom: process.env.EMAIL_FROM || 'newsletter@example.com'
    });

    // Send to valid emails
    for (const email of validEmails) {
      const sendResult = await sender.send({
        to: email,
        subject: 'Monthly Newsletter - Email Deliverability Tips',
        text: `Hello! Welcome to our monthly newsletter with email deliverability tips.`,
        html: `
          <h2>Monthly Newsletter</h2>
          <p>Hello!</p>
          <p>Welcome to our monthly newsletter with email deliverability tips.</p>
          <h3>This Month's Tips:</h3>
          <ul>
            <li>Always validate email addresses before sending</li>
            <li>Check domain reputation and MX records</li>
            <li>Implement SPF and DMARC records</li>
            <li>Monitor bounce rates and engagement</li>
          </ul>
          <p>Thank you for subscribing!</p>
          <hr>
          <small>You received this email because your address (${email}) passed our deliverability validation.</small>
        `
      });

      console.log(`   ✓ Sent to ${email}: ${sendResult.success ? 'Success' : 'Failed'}`);
      if (!sendResult.success) {
        console.log(`     Error: ${sendResult.error}`);
      }
    }
  }

  // Step 3: Report on invalid emails
  if (invalidEmails.length > 0) {
    console.log(`\n4. Invalid emails report:`);
    invalidEmails.forEach(({email, reason}) => {
      console.log(`   ✗ ${email}: ${reason}`);
    });
  }
}

async function advancedEmailExample() {
  console.log('\n=== Advanced Email Features ===\n');

  const sender = new EmailSender({
    defaultFrom: process.env.EMAIL_FROM || 'advanced@example.com'
  });

  // Example 1: Email with rich content and attachments
  console.log('1. Sending rich email with attachments...');
  const richEmailResult = await sender.send({
    to: 'recipient@example.com',
    subject: 'Advanced Email Features Demo',
    html: `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 10px; text-align: center; font-size: 12px; }
            .cta-button { background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Advanced Email Features</h1>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>This email demonstrates advanced features of our email delivery system:</p>
            <ul>
              <li>✓ Rich HTML content with embedded CSS</li>
              <li>✓ File attachments</li>
              <li>✓ Multiple recipients support</li>
              <li>✓ CC and BCC functionality</li>
              <li>✓ Custom headers</li>
            </ul>
            <p>
              <a href="https://example.com" class="cta-button">Learn More</a>
            </p>
            <p>Please find attached files for your reference.</p>
          </div>
          <div class="footer">
            <p>This email was sent using our advanced email delivery system.</p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Advanced Email Features

Hello!

This email demonstrates advanced features of our email delivery system:
• Rich HTML content with embedded CSS
• File attachments
• Multiple recipients support
• CC and BCC functionality
• Custom headers

Please find attached files for your reference.

Learn More: https://example.com

This email was sent using our advanced email delivery system.`,
    attachments: [
      {
        filename: 'email-guide.txt',
        content: `Email Deliverability Guide

1. Always validate email addresses before sending
2. Use proper authentication (SPF, DKIM, DMARC)
3. Monitor your sender reputation
4. Avoid spam trigger words
5. Include unsubscribe links
6. Maintain clean email lists
7. Test across different email clients
8. Monitor bounce and complaint rates

For more information, visit our documentation.`,
        contentType: 'text/plain'
      },
      {
        filename: 'stats.json',
        content: JSON.stringify({
          deliveryStats: {
            totalSent: 1000,
            delivered: 987,
            bounced: 8,
            complaints: 5,
            deliveryRate: '98.7%'
          },
          timestamp: new Date().toISOString()
        }, null, 2),
        contentType: 'application/json'
      }
    ],
    headers: {
      'X-Custom-Header': 'Advanced-Email-Demo',
      'X-Priority': '1'
    }
  });

  console.log(`✓ Rich email result:`, richEmailResult);

  // Example 2: Test provider connections
  console.log('\n2. Testing provider connections...');
  const connectionTest = await sender.testConnection();
  console.log(`✓ Connection test results:`, connectionTest);
}

// Run all examples
async function runAllExamples() {
  try {
    await completeEmailWorkflowExample();
    await bulkEmailWorkflowExample();
    await advancedEmailExample();
    
    console.log('\n=== All Examples Completed Successfully! ===');
  } catch (error) {
    console.error('Example error:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

export { 
  completeEmailWorkflowExample, 
  bulkEmailWorkflowExample, 
  advancedEmailExample 
};
