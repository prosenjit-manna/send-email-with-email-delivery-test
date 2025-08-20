import { EmailDeliverabilityTester } from '../src/index';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Advanced usage examples including AWS SES integration and complex scenarios
 */
async function advancedUsageExamples() {
  console.log('🚀 Email Deliverability Tester - Advanced Usage Examples\n');

  // Example 1: AWS SES Integration
  console.log('📋 Example 1: AWS SES Integration');
  console.log('─'.repeat(50));
  
  try {
    // Initialize with custom AWS configuration
    const awsConfig = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1'
    };

    const tester = new EmailDeliverabilityTester(
      awsConfig.accessKeyId ? awsConfig : undefined,
      'no-reply@yourdomain.com'
    );

    console.log(`AWS SES configured: ${tester.isAwsSesConfigured()}`);

    if (tester.isAwsSesConfigured()) {
      const result = await tester.testEmailDeliverability({
        email: 'test@example.com',
        provider: 'aws-ses',
        skipActualDelivery: true, // Set to false to actually send test email
        testMessage: {
          subject: 'Custom Test Email',
          text: 'This is a custom test email for deliverability testing',
          html: '<h1>Custom Test</h1><p>This is a <strong>custom test email</strong> for deliverability testing</p>'
        }
      });

      console.log(`✓ Email validation: ${result.isValid ? 'Passed' : 'Failed'}`);
      console.log(`✓ AWS SES test: ${result.deliverabilityTests.awsSes?.success ? 'Passed' : 'Failed'}`);
      
      if (result.deliverabilityTests.awsSes?.error) {
        console.log(`❌ AWS SES error: ${result.deliverabilityTests.awsSes.error}`);
      }
    } else {
      console.log('⚠️  AWS SES not configured. Set AWS credentials to test SES functionality.');
    }

  } catch (error) {
    console.error('Error in AWS SES test:', error);
  }

  // Example 2: Complex batch testing with different providers
  console.log('\n📋 Example 2: Complex Batch Testing');
  console.log('─'.repeat(50));
  
  try {
    const tester = new EmailDeliverabilityTester();

    const testConfigs = [
      {
        email: 'admin@github.com',
        provider: 'aws-ses' as const,
        skipActualDelivery: true
      },
      {
        email: 'support@stackoverflow.com', 
        provider: 'both' as const,
        skipActualDelivery: true
      },
      {
        email: 'invalid-email@nonexistentdomain12345.com',
        provider: 'both' as const,
        skipActualDelivery: true
      },
      {
        email: 'test@gmail.com',
        provider: 'aws-ses' as const,
        skipActualDelivery: true
      }
    ];

    const batchResult = await tester.testMultipleEmails(testConfigs);

    console.log(`📊 Batch Results:`);
    console.log(`   Total tested: ${batchResult.total}`);
    console.log(`   Successful: ${batchResult.successful}`);
    console.log(`   Failed: ${batchResult.failed}`);
    console.log(`   Duration: ${batchResult.duration}ms\n`);

    batchResult.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.email}:`);
      console.log(`   ✓ Valid: ${result.isValid}`);
      console.log(`   ✓ Domain exists: ${result.domainExists}`);
      console.log(`   ✓ MX records: ${result.mxRecords.length}`);
      console.log(`   💡 Status: ${result.recommendations[0]}\n`);
    });

  } catch (error) {
    console.error('Error in complex batch testing:', error);
  }

  // Example 3: Enhanced email service integration
  console.log('📋 Example 3: Enhanced Email Service Pattern');
  console.log('─'.repeat(50));
  
  try {
    const enhancedEmailService = new EnhancedEmailService();
    
    // Simulate sending invitation with deliverability check
    const invitationResult = await enhancedEmailService.validateAndProcess({
      email: 'user@example.com',
      data: {
        name: 'John Doe',
        invitationLink: 'https://app.example.com/invite/abc123'
      },
      options: {
        skipDeliverabilityCheck: false,
        forceDelivery: false
      }
    });

    console.log(`Invitation processing result:`);
    console.log(`✓ Success: ${invitationResult.success}`);
    console.log(`✓ Email deliverable: ${invitationResult.deliverabilityResult?.isValid}`);
    
    if (!invitationResult.success) {
      console.log(`❌ Error: ${invitationResult.error}`);
    }

  } catch (error) {
    console.error('Error in enhanced email service:', error);
  }

  // Example 4: Performance testing
  console.log('\n📋 Example 4: Performance Testing');
  console.log('─'.repeat(50));
  
  try {
    const tester = new EmailDeliverabilityTester();
    const testEmails = [
      'test1@gmail.com',
      'test2@yahoo.com', 
      'test3@outlook.com',
      'test4@hotmail.com',
      'test5@example.com'
    ];

    console.log(`Testing ${testEmails.length} emails for performance...`);
    const startTime = Date.now();

    const validationResult = await tester.validateEmails(testEmails);
    const endTime = Date.now();

    console.log(`📊 Performance Results:`);
    console.log(`   Emails tested: ${validationResult.summary.total}`);
    console.log(`   Valid emails: ${validationResult.summary.valid}`);
    console.log(`   Invalid emails: ${validationResult.summary.invalid}`);
    console.log(`   Total duration: ${endTime - startTime}ms`);
    console.log(`   Average per email: ${Math.round((endTime - startTime) / testEmails.length)}ms`);

  } catch (error) {
    console.error('Error in performance testing:', error);
  }
}

/**
 * Enhanced Email Service class demonstrating integration patterns
 */
class EnhancedEmailService {
  private deliverabilityTester: EmailDeliverabilityTester;

  constructor() {
    this.deliverabilityTester = new EmailDeliverabilityTester();
  }

  async validateAndProcess(request: {
    email: string;
    data: any;
    options: {
      skipDeliverabilityCheck?: boolean;
      forceDelivery?: boolean;
    };
  }) {
    try {
      // Step 1: Check deliverability if requested
      if (!request.options.skipDeliverabilityCheck) {
        const deliverabilityResult = await this.deliverabilityTester.testEmailDeliverability({
          email: request.email,
          skipActualDelivery: true
        });

        const isDeliverable = deliverabilityResult.isValid && 
                            deliverabilityResult.domainExists && 
                            deliverabilityResult.mxRecords.length > 0;

        if (!isDeliverable && !request.options.forceDelivery) {
          return {
            success: false,
            deliverabilityResult,
            error: `Email ${request.email} failed deliverability check: ${deliverabilityResult.recommendations.join(', ')}`
          };
        }

        return {
          success: true,
          deliverabilityResult,
          message: `Email ${request.email} is deliverable`
        };
      }

      return {
        success: true,
        message: `Email processing completed (deliverability check skipped)`
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Run examples
if (require.main === module) {
  advancedUsageExamples().catch(console.error);
}
