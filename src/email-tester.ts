import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import dns from 'dns';
import { promisify } from 'util';

// Promisify DNS functions
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);

/**
 * MX Record interface
 */
export interface MxRecord {
  exchange: string;
  priority: number;
}

/**
 * SMTP Configuration for testing
 */
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

/**
 * Test message configuration
 */
export interface TestMessage {
  subject: string;
  text: string;
  html?: string;
}

/**
 * Email test configuration
 */
export interface EmailTestConfig {
  email: string;
  provider?: 'aws-ses' | 'smtp' | 'both';
  smtpConfig?: SmtpConfig;
  testMessage?: TestMessage;
  skipActualDelivery?: boolean;
}

/**
 * Delivery test results for different providers
 */
export interface DeliveryTestResults {
  awsSes?: {
    success: boolean;
    messageId?: string;
    error?: string;
  };
  smtp?: {
    success: boolean;
    messageId?: string;
    error?: string;
  };
}

/**
 * Complete email test result
 */
export interface EmailTestResult {
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

/**
 * Batch test result summary
 */
export interface BatchTestResult {
  successful: number;
  failed: number;
  total: number;
  results: EmailTestResult[];
  duration: number;
}

/**
 * Email validation result
 */
export interface EmailValidationResult {
  validEmails: string[];
  invalidEmails: Array<{
    email: string;
    issues: string[];
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

/**
 * Main EmailDeliverabilityTester class
 */
export class EmailDeliverabilityTester {
  private sesClient?: SESClient;
  private defaultFromEmail: string;

  constructor(awsConfig?: {
    accessKeyId: string;
    secretAccessKey: string;
    region?: string;
  }, fromEmail?: string) {
    this.defaultFromEmail = fromEmail || process.env.EMAIL_FROM || 'no-reply@example.com';
    
    // Initialize AWS SES client
    if (awsConfig || (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) {
      this.sesClient = new SESClient({
        region: awsConfig?.region || process.env.AWS_REGION || 'us-east-1',
        credentials: awsConfig ? {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey,
        } : {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
    }
  }

  /**
   * Validate email format using regex
   */
  private validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Extract domain from email
   */
  private extractDomain(email: string): string {
    return email.split('@')[1];
  }

  /**
   * Check if domain exists and get MX records
   */
  private async checkDomainAndMX(domain: string): Promise<{ exists: boolean; mxRecords: MxRecord[] }> {
    try {
      const mxRecords = await resolveMx(domain);
      return { exists: true, mxRecords: mxRecords || [] };
    } catch {
      return { exists: false, mxRecords: [] };
    }
  }

  /**
   * Check SPF record
   */
  private async checkSpfRecord(domain: string): Promise<string | undefined> {
    try {
      const txtRecords = await resolveTxt(domain);
      const spfRecord = txtRecords.find(record => 
        record.some(txt => txt.toLowerCase().startsWith('v=spf1'))
      );
      return spfRecord ? spfRecord.join('') : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Check DMARC record
   */
  private async checkDmarcRecord(domain: string): Promise<string | undefined> {
    try {
      const dmarcDomain = `_dmarc.${domain}`;
      const txtRecords = await resolveTxt(dmarcDomain);
      const dmarcRecord = txtRecords.find(record => 
        record.some(txt => txt.toLowerCase().startsWith('v=dmarc1'))
      );
      return dmarcRecord ? dmarcRecord.join('') : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Test email delivery via AWS SES
   */
  private async testAwsSesDelivery(config: EmailTestConfig): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.sesClient) {
      return { success: false, error: 'AWS SES not configured' };
    }

    if (config.skipActualDelivery) {
      return { success: true, messageId: 'skipped-test-mode' };
    }

    const defaultMessage: TestMessage = {
      subject: 'Email Deliverability Test',
      text: `This is a test email to verify deliverability for ${config.email}`,
      html: `<p>This is a test email to verify deliverability for <strong>${config.email}</strong></p>`
    };

    const message = config.testMessage || defaultMessage;

    const params = {
      Destination: {
        ToAddresses: [config.email],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: message.html || message.text,
          },
          Text: {
            Charset: 'UTF-8',
            Data: message.text,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: message.subject,
        },
      },
      Source: this.defaultFromEmail,
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);
      return { success: true, messageId: response.MessageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Test email delivery via SMTP
   */
  private async testSmtpDelivery(config: EmailTestConfig): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!config.smtpConfig) {
      return { success: false, error: 'SMTP configuration not provided' };
    }

    if (config.skipActualDelivery) {
      return { success: true, messageId: 'skipped-test-mode' };
    }

    const defaultMessage: TestMessage = {
      subject: 'Email Deliverability Test',
      text: `This is a test email to verify deliverability for ${config.email}`,
      html: `<p>This is a test email to verify deliverability for <strong>${config.email}</strong></p>`
    };

    const message = config.testMessage || defaultMessage;

    try {
      const transporter = nodemailer.createTransport(config.smtpConfig);
      
      // Verify SMTP connection
      await transporter.verify();

      const info = await transporter.sendMail({
        from: config.smtpConfig.auth?.user || this.defaultFromEmail,
        to: config.email,
        subject: message.subject,
        text: message.text,
        html: message.html || message.text,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(result: Partial<EmailTestResult>): string[] {
    const recommendations: string[] = [];

    if (!result.isValid) {
      recommendations.push('Email format is invalid. Please check the email address.');
    }

    if (!result.domainExists) {
      recommendations.push('Domain does not exist or has no MX records. Check domain configuration.');
    }

    if (result.mxRecords && result.mxRecords.length === 0) {
      recommendations.push('No MX records found. Email delivery may fail.');
    }

    if (!result.spfRecord) {
      recommendations.push('No SPF record found. Consider adding an SPF record to improve deliverability.');
    }

    if (!result.dmarcRecord) {
      recommendations.push('No DMARC record found. Consider adding a DMARC policy for better email security.');
    }

    if (result.deliverabilityTests?.awsSes?.success === false) {
      recommendations.push(`AWS SES delivery failed: ${result.deliverabilityTests.awsSes.error}`);
    }

    if (result.deliverabilityTests?.smtp?.success === false) {
      recommendations.push(`SMTP delivery failed: ${result.deliverabilityTests.smtp.error}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Email appears to be deliverable. All tests passed successfully.');
    }

    return recommendations;
  }

  /**
   * Test email deliverability
   */
  async testEmailDeliverability(config: EmailTestConfig): Promise<EmailTestResult> {
    const startTime = Date.now();
    const result: Partial<EmailTestResult> = {
      email: config.email,
      deliverabilityTests: {}
    };

    // Validate email format
    result.isValid = this.validateEmailFormat(config.email);
    
    if (!result.isValid) {
      result.domainExists = false;
      result.mxRecords = [];
      result.recommendations = this.generateRecommendations(result);
      result.testDuration = Date.now() - startTime;
      return result as EmailTestResult;
    }

    // Extract domain and check domain/MX records
    const domain = this.extractDomain(config.email);
    const domainCheck = await this.checkDomainAndMX(domain);
    result.domainExists = domainCheck.exists;
    result.mxRecords = domainCheck.mxRecords;

    // Check SPF and DMARC records
    result.spfRecord = await this.checkSpfRecord(domain);
    result.dmarcRecord = await this.checkDmarcRecord(domain);

    // Initialize deliverabilityTests if not already set
    if (!result.deliverabilityTests) {
      result.deliverabilityTests = {};
    }

    // Test delivery based on provider preference
    const provider = config.provider || 'both';

    if (provider === 'aws-ses' || provider === 'both') {
      result.deliverabilityTests.awsSes = await this.testAwsSesDelivery(config);
    }

    if (provider === 'smtp' || provider === 'both') {
      result.deliverabilityTests.smtp = await this.testSmtpDelivery(config);
    }

    // Generate recommendations
    result.recommendations = this.generateRecommendations(result);
    result.testDuration = Date.now() - startTime;

    return result as EmailTestResult;
  }

  /**
   * Test multiple emails in batch
   */
  async testMultipleEmails(configs: EmailTestConfig[]): Promise<BatchTestResult> {
    const startTime = Date.now();
    const results: EmailTestResult[] = [];
    let successful = 0;
    let failed = 0;
    
    for (const config of configs) {
      try {
        const result = await this.testEmailDeliverability(config);
        results.push(result);
        
        // Check if email is generally deliverable
        const isDeliverable = result.isValid && result.domainExists && result.mxRecords.length > 0;
        if (isDeliverable) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        results.push({
          email: config.email,
          isValid: false,
          domainExists: false,
          mxRecords: [],
          deliverabilityTests: {},
          recommendations: [`Error testing email: ${error instanceof Error ? error.message : 'Unknown error'}`]
        });
      }
    }

    return {
      successful,
      failed,
      total: configs.length,
      results,
      duration: Date.now() - startTime
    };
  }

  /**
   * Pre-validate emails without sending actual test emails
   */
  async validateEmails(emails: string[]): Promise<EmailValidationResult> {
    const configs = emails.map(email => ({ 
      email, 
      skipActualDelivery: true 
    }));
    
    const batchResult = await this.testMultipleEmails(configs);
    
    const validEmails: string[] = [];
    const invalidEmails: Array<{ email: string; issues: string[] }> = [];

    batchResult.results.forEach(result => {
      const isValid = result.isValid && result.domainExists && result.mxRecords.length > 0;
      
      if (isValid) {
        validEmails.push(result.email);
      } else {
        invalidEmails.push({
          email: result.email,
          issues: result.recommendations.filter(r => !r.includes('successfully'))
        });
      }
    });

    return {
      validEmails,
      invalidEmails,
      summary: {
        total: emails.length,
        valid: validEmails.length,
        invalid: invalidEmails.length
      }
    };
  }

  /**
   * Check if AWS SES is configured
   */
  isAwsSesConfigured(): boolean {
    return !!this.sesClient;
  }

  /**
   * Set default from email address
   */
  setDefaultFromEmail(email: string): void {
    this.defaultFromEmail = email;
  }
}

// Utility functions for quick testing

/**
 * Quick email validation (no actual delivery test)
 */
export async function quickEmailValidation(email: string): Promise<EmailTestResult> {
  const tester = new EmailDeliverabilityTester();
  return await tester.testEmailDeliverability({ 
    email, 
    skipActualDelivery: true 
  });
}

/**
 * Quick email test with AWS SES
 */
export async function quickEmailTestWithSes(email: string): Promise<EmailTestResult> {
  const tester = new EmailDeliverabilityTester();
  return await tester.testEmailDeliverability({ 
    email, 
    provider: 'aws-ses' 
  });
}

/**
 * Quick email test with SMTP
 */
export async function quickEmailTestWithSmtp(
  email: string, 
  smtpConfig: SmtpConfig
): Promise<EmailTestResult> {
  const tester = new EmailDeliverabilityTester();
  return await tester.testEmailDeliverability({ 
    email, 
    provider: 'smtp',
    smtpConfig 
  });
}

/**
 * Batch email validation
 */
export async function batchEmailValidation(emails: string[]): Promise<EmailValidationResult> {
  const tester = new EmailDeliverabilityTester();
  return await tester.validateEmails(emails);
}

// Default export
export default EmailDeliverabilityTester;
