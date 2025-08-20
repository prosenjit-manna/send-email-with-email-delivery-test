import { 
  EmailDeliverabilityTester, 
  quickEmailValidation,
  quickEmailTestWithSmtp,
  batchEmailValidation 
} from '../src/index';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Basic usage examples of the Email Deliverability Tester
 */
async function basicUsageExamples() {
  console.log('🚀 Email Deliverability Tester - Basic Usage Examples\n');

  // Example 1: Quick email validation (no actual delivery)
  console.log('📋 Example 1: Quick Email Validation');
  console.log('─'.repeat(50));
  
  try {
    const result = await quickEmailValidation('test@gmail.com');
    console.log('Results for test@gmail.com:');
    console.log(`✓ Valid format: ${result.isValid}`);
    console.log(`✓ Domain exists: ${result.domainExists}`);
    console.log(`✓ MX records found: ${result.mxRecords.length}`);
    console.log(`✓ SPF record: ${result.spfRecord ? 'Found' : 'Not found'}`);
    console.log(`✓ DMARC record: ${result.dmarcRecord ? 'Found' : 'Not found'}`);
    console.log(`💡 Recommendations: ${result.recommendations.join(', ')}\n`);
  } catch (error) {
    console.error('Error in quick validation:', error);
  }

  // Example 2: Batch email validation
  console.log('📋 Example 2: Batch Email Validation');
  console.log('─'.repeat(50));
  
  try {
    const emails = [
      'valid@gmail.com',
      'test@example.com',
      'invalid-email',
      'user@nonexistentdomain12345.com'
    ];

    const batchResult = await batchEmailValidation(emails);
    
    console.log(`📊 Validation Summary:`);
    console.log(`   Total: ${batchResult.summary.total}`);
    console.log(`   Valid: ${batchResult.summary.valid}`);
    console.log(`   Invalid: ${batchResult.summary.invalid}\n`);

    console.log('✅ Valid emails:');
    batchResult.validEmails.forEach(email => console.log(`   - ${email}`));

    console.log('\n❌ Invalid emails:');
    batchResult.invalidEmails.forEach(item => {
      console.log(`   - ${item.email}: ${item.issues.join(', ')}`);
    });

  } catch (error) {
    console.error('Error in batch validation:', error);
  }

  // Example 3: Using the main class with custom configuration
  console.log('\n📋 Example 3: Custom Configuration');
  console.log('─'.repeat(50));
  
  try {
    const tester = new EmailDeliverabilityTester();
    
    // Test with validation only
    const result = await tester.testEmailDeliverability({
      email: 'support@github.com',
      skipActualDelivery: true
    });

    console.log(`Results for ${result.email}:`);
    console.log(`✓ Email is ${result.isValid ? 'valid' : 'invalid'}`);
    console.log(`✓ Domain ${result.domainExists ? 'exists' : 'does not exist'}`);
    console.log(`✓ Found ${result.mxRecords.length} MX record(s)`);
    
    if (result.mxRecords.length > 0) {
      console.log('📮 MX Records:');
      result.mxRecords.forEach(mx => {
        console.log(`   - ${mx.exchange} (priority: ${mx.priority})`);
      });
    }

    console.log(`⏱️  Test completed in ${result.testDuration}ms\n`);

  } catch (error) {
    console.error('Error in custom configuration test:', error);
  }

  // Example 4: Test with SMTP (if configured)
  console.log('📋 Example 4: SMTP Testing (Optional)');
  console.log('─'.repeat(50));
  
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const smtpConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      // Only test deliverability, don't actually send
      const result = await quickEmailTestWithSmtp('test@example.com', smtpConfig);
      console.log(`SMTP test result: ${result.deliverabilityTests.smtp?.success ? 'Connected successfully' : 'Connection failed'}`);
      
      if (result.deliverabilityTests.smtp?.error) {
        console.log(`Error: ${result.deliverabilityTests.smtp.error}`);
      }

    } catch (error) {
      console.error('Error in SMTP test:', error);
    }
  } else {
    console.log('⚠️  SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables to test SMTP functionality.');
  }
}

// Run examples
if (require.main === module) {
  basicUsageExamples().catch(console.error);
}
