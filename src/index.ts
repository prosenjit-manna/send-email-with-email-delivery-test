// Export all types and classes
export {
  EmailDeliverabilityTester,
  type MxRecord,
  type SmtpConfig,
  type TestMessage,
  type EmailTestConfig,
  type DeliveryTestResults,
  type EmailTestResult,
  type BatchTestResult,
  type EmailValidationResult,
  quickEmailValidation,
  quickEmailTestWithSes,
  quickEmailTestWithSmtp,
  batchEmailValidation
} from './email-tester';

// Export email sender functionality
export {
  EmailSender,
  type EmailAttachment,
  type EmailOptions,
  type AwsSesConfig,
  type EmailSendResult,
  quickSendEmail,
  quickSendWithSes,
  quickSendWithSmtp
} from './email-sender';

// Re-export the main class as default
export { default } from './email-tester';
