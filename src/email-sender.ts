import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand, SendRawEmailCommand, GetSendQuotaCommand } from "@aws-sdk/client-ses";

/**
 * Email attachment interface
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: string;
  cid?: string; // for inline attachments
}

/**
 * Email options interface
 */
export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}

/**
 * SMTP Configuration
 */
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
}

/**
 * AWS SES Configuration
 */
export interface AwsSesConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
}

/**
 * Configuration options for EmailSender
 */
export interface EmailSenderConfig {
  aws?: AwsSesConfig;
  smtp?: SmtpConfig;
  defaultFrom?: string;
  autoDetectFromEnv?: boolean; // New option to auto-detect from environment
}

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'aws-ses' | 'smtp';
}

/**
 * Universal Email Sender class that supports both AWS SES and SMTP
 */
export class EmailSender {
  private sesClient?: SESClient;
  private smtpTransporter?: nodemailer.Transporter;
  private defaultFromEmail: string;

  constructor(config: EmailSenderConfig = {}) {
    // Auto-detect from environment if enabled (default: true)
    const autoDetect = config.autoDetectFromEnv !== false;
    
    // Set default from email with priority: config > env vars > fallback
    this.defaultFromEmail = 
      config.defaultFrom || 
      process.env.EMAIL_FROM || 
      process.env.AWS_EMAIL_FROM || 
      process.env.SMTP_EMAIL_FROM || 
      'no-reply@example.com';

    // Initialize AWS SES - check config first, then auto-detect
    if (config.aws) {
      this.initializeAwsSes(config.aws);
    } else if (autoDetect && this.hasAwsEnvVars()) {
      this.initializeAwsSes();
    }

    // Initialize SMTP - check config first, then auto-detect
    if (config.smtp) {
      this.initializeSmtp(config.smtp);
    } else if (autoDetect && this.hasSmtpEnvVars()) {
      try {
        const envSmtpConfig = this.getSmtpConfigFromEnv();
        this.initializeSmtp(envSmtpConfig);
      } catch (error) {
        console.warn('Failed to initialize SMTP from environment variables:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Check if AWS environment variables are available
   */
  private hasAwsEnvVars(): boolean {
    return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  }

  /**
   * Check if SMTP environment variables are available
   */
  private hasSmtpEnvVars(): boolean {
    return !!(
      (process.env.SMTP_HOST || process.env.SMPTP_HOST) && 
      (process.env.SMTP_USER || process.env.SMPT_USER) && 
      (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.SMPT_PASSWORD)
    );
  }

  /**
   * Get SMTP config from environment variables
   */
  private getSmtpConfigFromEnv(): SmtpConfig {
    const host = process.env.SMTP_HOST || process.env.SMPTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE?.toLowerCase() === 'true' || port === 465;
    const user = process.env.SMTP_USER || process.env.SMPT_USER;
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.SMPT_PASSWORD;

    if (!host) {
      throw new Error('SMTP host not found in environment variables');
    }

    return {
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
      }
    };
  }

  /**
   * Initialize AWS SES client
   */
  private initializeAwsSes(config?: AwsSesConfig): void {
    this.sesClient = new SESClient({
      region: config?.region || process.env.AWS_REGION || 'us-east-1',
      credentials: config ? {
        accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY!,
      } : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeSmtp(config: SmtpConfig): void {
    this.smtpTransporter = nodemailer.createTransport(config);
  }

  /**
   * Send email via AWS SES
   */
  async sendWithSes(emailOptions: EmailOptions): Promise<EmailSendResult> {
    if (!this.sesClient) {
      return {
        success: false,
        error: 'AWS SES not configured. Please provide AWS credentials.',
        provider: 'aws-ses'
      };
    }

    try {
      const toAddresses = Array.isArray(emailOptions.to) ? emailOptions.to : [emailOptions.to];
      const ccAddresses = emailOptions.cc ? (Array.isArray(emailOptions.cc) ? emailOptions.cc : [emailOptions.cc]) : undefined;
      const bccAddresses = emailOptions.bcc ? (Array.isArray(emailOptions.bcc) ? emailOptions.bcc : [emailOptions.bcc]) : undefined;

      // If there are attachments, use SendRawEmailCommand
      if (emailOptions.attachments && emailOptions.attachments.length > 0) {
        return await this.sendRawEmailWithSes(emailOptions);
      }

      const params = {
        Destination: {
          ToAddresses: toAddresses,
          CcAddresses: ccAddresses,
          BccAddresses: bccAddresses,
        },
        Message: {
          Body: {
            Html: emailOptions.html ? {
              Charset: 'UTF-8',
              Data: emailOptions.html,
            } : undefined,
            Text: emailOptions.text ? {
              Charset: 'UTF-8',
              Data: emailOptions.text,
            } : undefined,
          },
          Subject: {
            Charset: 'UTF-8',
            Data: emailOptions.subject,
          },
        },
        Source: emailOptions.from || this.defaultFromEmail,
        ReplyToAddresses: emailOptions.replyTo ? [emailOptions.replyTo] : undefined,
      };

      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
        provider: 'aws-ses'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown AWS SES error';
      return {
        success: false,
        error: errorMessage,
        provider: 'aws-ses'
      };
    }
  }

  /**
   * Send raw email with attachments via AWS SES
   */
  private async sendRawEmailWithSes(emailOptions: EmailOptions): Promise<EmailSendResult> {
    try {
      // Create a temporary SMTP transporter to generate raw email
      const tempTransporter = nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail'
      });

      const mailOptions = {
        from: emailOptions.from || this.defaultFromEmail,
        to: emailOptions.to,
        cc: emailOptions.cc,
        bcc: emailOptions.bcc,
        subject: emailOptions.subject,
        text: emailOptions.text,
        html: emailOptions.html,
        replyTo: emailOptions.replyTo,
        attachments: emailOptions.attachments,
        headers: emailOptions.headers,
      };

      // Generate raw email
      const rawEmail = await new Promise<Buffer>((resolve, reject) => {
        tempTransporter.sendMail(mailOptions, (error: any, info: any) => {
          if (error) {
            reject(error);
          } else {
            // Get the raw message
            resolve(Buffer.from(info.message));
          }
        });
      });

      const params = {
        RawMessage: {
          Data: rawEmail,
        },
      };

      const command = new SendRawEmailCommand(params);
      const response = await this.sesClient!.send(command);

      return {
        success: true,
        messageId: response.MessageId,
        provider: 'aws-ses'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown AWS SES raw email error';
      return {
        success: false,
        error: errorMessage,
        provider: 'aws-ses'
      };
    }
  }

  /**
   * Send email via SMTP
   */
  async sendWithSmtp(emailOptions: EmailOptions): Promise<EmailSendResult> {
    if (!this.smtpTransporter) {
      return {
        success: false,
        error: 'SMTP not configured. Please provide SMTP configuration.',
        provider: 'smtp'
      };
    }

    try {
      // Verify SMTP connection
      await this.smtpTransporter.verify();

      const mailOptions = {
        from: emailOptions.from || this.defaultFromEmail,
        to: emailOptions.to,
        cc: emailOptions.cc,
        bcc: emailOptions.bcc,
        subject: emailOptions.subject,
        text: emailOptions.text,
        html: emailOptions.html,
        replyTo: emailOptions.replyTo,
        attachments: emailOptions.attachments,
        headers: emailOptions.headers,
      };

      const info = await this.smtpTransporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown SMTP error';
      return {
        success: false,
        error: errorMessage,
        provider: 'smtp'
      };
    }
  }

  /**
   * Send email with automatic fallback (tries SES first, then SMTP)
   */
  async send(emailOptions: EmailOptions, provider?: 'aws-ses' | 'smtp'): Promise<EmailSendResult> {
    console.log(`🔧 EmailSender.send() called with provider: ${provider || 'auto-detect'}`);
    console.log(`   SES Client configured: ${!!this.sesClient}`);
    console.log(`   SMTP Transporter configured: ${!!this.smtpTransporter}`);
    
    if (provider === 'aws-ses') {
      console.log('📤 Using AWS SES (explicitly requested)');
      return await this.sendWithSes(emailOptions);
    }

    if (provider === 'smtp') {
      console.log('📤 Using SMTP (explicitly requested)');
      return await this.sendWithSmtp(emailOptions);
    }

    // Auto-fallback: try SES first, then SMTP
    if (this.sesClient) {
      console.log('📤 Auto-detecting: Trying AWS SES first');
      const sesResult = await this.sendWithSes(emailOptions);
      if (sesResult.success) {
        return sesResult;
      }
    }

    if (this.smtpTransporter) {
      console.log('📤 Auto-detecting: Using SMTP');
      return await this.sendWithSmtp(emailOptions);
    }

    return {
      success: false,
      error: 'No email provider configured. Please configure AWS SES or SMTP.',
      provider: 'aws-ses'
    };
  }

  /**
   * Test connection to configured email providers
   */
  async testConnection(): Promise<{
    aws: { configured: boolean; connected?: boolean; error?: string };
    smtp: { configured: boolean; connected?: boolean; error?: string };
  }> {
    const result: {
      aws: { configured: boolean; connected?: boolean; error?: string };
      smtp: { configured: boolean; connected?: boolean; error?: string };
    } = {
      aws: { configured: false },
      smtp: { configured: false }
    };

    // Test AWS SES
    if (this.sesClient) {
      result.aws.configured = true;
      try {
        // Simple test to check if SES is accessible - try to get sending quota
        await this.sesClient.send(new GetSendQuotaCommand({}));
        result.aws.connected = true;
      } catch (error) {
        result.aws.connected = false;
        result.aws.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Test SMTP
    if (this.smtpTransporter) {
      result.smtp.configured = true;
      try {
        await this.smtpTransporter.verify();
        result.smtp.connected = true;
      } catch (error) {
        result.smtp.connected = false;
        result.smtp.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return result;
  }

  /**
   * Get current configuration status
   */
  getConfigStatus(): {
    hasAwsSes: boolean;
    hasSmtp: boolean;
    defaultFrom: string;
  } {
    return {
      hasAwsSes: !!this.sesClient,
      hasSmtp: !!this.smtpTransporter,
      defaultFrom: this.defaultFromEmail
    };
  }
}

/**
 * Quick send functions for convenience
 */

/**
 * Quick send email with automatic provider detection and environment variable support
 */
export async function quickSendEmail(
  emailOptions: EmailOptions,
  config?: EmailSenderConfig
): Promise<EmailSendResult> {
  const sender = new EmailSender(config);
  return await sender.send(emailOptions);
}

/**
 * Quick send email via AWS SES (with optional config, falls back to env vars)
 */
export async function quickSendWithSes(
  emailOptions: EmailOptions,
  awsConfig?: AwsSesConfig
): Promise<EmailSendResult> {
  const sender = new EmailSender({ aws: awsConfig, autoDetectFromEnv: true });
  return await sender.sendWithSes(emailOptions);
}

/**
 * Quick send email via SMTP (with optional config, falls back to env vars)
 */
export async function quickSendWithSmtp(
  emailOptions: EmailOptions,
  smtpConfig?: SmtpConfig
): Promise<EmailSendResult> {
  // If no config provided, try to auto-detect from environment
  const sender = new EmailSender({ 
    smtp: smtpConfig, 
    autoDetectFromEnv: !smtpConfig // Only auto-detect if no config provided
  });
  return await sender.sendWithSmtp(emailOptions);
}
