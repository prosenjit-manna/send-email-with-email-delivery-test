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

// Re-export the main class as default
export { default } from './email-tester';
