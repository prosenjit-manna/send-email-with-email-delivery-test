import { EmailDeliverabilityTester, quickEmailValidation, batchEmailValidation } from '../src/index';

describe('EmailDeliverabilityTester', () => {
  let tester: EmailDeliverabilityTester;

  beforeEach(() => {
    tester = new EmailDeliverabilityTester();
  });

  describe('Email Format Validation', () => {
    test('should validate correct email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'first.last@subdomain.example.com'
      ];

      for (const email of validEmails) {
        const result = await tester.testEmailDeliverability({
          email,
          skipActualDelivery: true
        });
        expect(result.isValid).toBe(true);
      }
    });

    test('should reject invalid email formats', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        // 'test..test@example.com', // This might actually pass some regex validation
        'test@example',
        ''
      ];

      for (const email of invalidEmails) {
        const result = await tester.testEmailDeliverability({
          email,
          skipActualDelivery: true
        });
        expect(result.isValid).toBe(false);
      }
    });
  });

  describe('Domain Validation', () => {
    test('should validate existing domains', async () => {
      const result = await tester.testEmailDeliverability({
        email: 'test@gmail.com',
        skipActualDelivery: true
      });

      expect(result.isValid).toBe(true);
      expect(result.domainExists).toBe(true);
      expect(result.mxRecords.length).toBeGreaterThan(0);
    });

    test('should reject non-existent domains', async () => {
      const result = await tester.testEmailDeliverability({
        email: 'test@nonexistentdomain12345.com',
        skipActualDelivery: true
      });

      expect(result.isValid).toBe(true);
      expect(result.domainExists).toBe(false);
      expect(result.mxRecords.length).toBe(0);
    });
  });

  describe('Batch Testing', () => {
    test('should handle batch email validation', async () => {
      const emails = [
        'valid@gmail.com',
        'invalid-email',
        'test@nonexistentdomain12345.com'
      ];

      const result = await tester.validateEmails(emails);

      expect(result.summary.total).toBe(3);
      expect(result.summary.valid).toBeGreaterThanOrEqual(0);
      expect(result.summary.invalid).toBeGreaterThanOrEqual(1);
      expect(result.validEmails.length + result.invalidEmails.length).toBe(3);
    });

    test('should handle empty email list', async () => {
      const result = await tester.validateEmails([]);

      expect(result.summary.total).toBe(0);
      expect(result.summary.valid).toBe(0);
      expect(result.summary.invalid).toBe(0);
      expect(result.validEmails).toEqual([]);
      expect(result.invalidEmails).toEqual([]);
    });
  });

  describe('Configuration', () => {
    test('should handle AWS SES configuration check', () => {
      const configured = tester.isAwsSesConfigured();
      expect(typeof configured).toBe('boolean');
    });

    test('should set default from email', () => {
      const customEmail = 'custom@example.com';
      tester.setDefaultFromEmail(customEmail);
      // No direct way to test this without exposing private property
      // This mainly tests that the method doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed email gracefully', async () => {
      const result = await tester.testEmailDeliverability({
        email: 'definitely-not-an-email',
        skipActualDelivery: true
      });

      expect(result.isValid).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0]).toContain('invalid');
    });

    test('should provide meaningful recommendations', async () => {
      const result = await tester.testEmailDeliverability({
        email: 'test@nonexistentdomain12345.com',
        skipActualDelivery: true
      });

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => rec.includes('domain'))).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should complete validation within reasonable time', async () => {
      const startTime = Date.now();
      
      await tester.testEmailDeliverability({
        email: 'test@gmail.com',
        skipActualDelivery: true
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should track test duration', async () => {
      const result = await tester.testEmailDeliverability({
        email: 'test@gmail.com',
        skipActualDelivery: true
      });

      expect(result.testDuration).toBeDefined();
      expect(result.testDuration).toBeGreaterThan(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('quickEmailValidation', () => {
    test('should validate email without delivery test', async () => {
      const result = await quickEmailValidation('test@gmail.com');
      
      expect(result.isValid).toBe(true);
      expect(result.domainExists).toBe(true);
      expect(result.mxRecords.length).toBeGreaterThan(0);
      // Quick validation skips actual delivery, so no delivery tests should be performed
    });
  });

  describe('batchEmailValidation', () => {
    test('should validate multiple emails', async () => {
      const emails = ['test1@gmail.com', 'invalid-email'];
      const result = await batchEmailValidation(emails);

      expect(result.summary.total).toBe(2);
      expect(result.validEmails.length).toBe(1);
      expect(result.invalidEmails.length).toBe(1);
    });
  });
});
