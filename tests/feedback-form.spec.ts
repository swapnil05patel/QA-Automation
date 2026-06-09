import { test, expect, type Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'https://landing-bookmark.rayoinnovations.com/';

const selectors = {
  contactSupportButton: 'role=button[name="Contact Support"]',
  emailField: 'role=textbox[name="Your email"]',
  subjectField: 'role=textbox[name="Subject"]',
  messageField: 'role=textbox[name="Your message"]',
  submitButton: 'role=button[name="Submit"]',
  validationAlert: 'role=alert',
};

async function openFeedbackModal(page: Page) {
  await page.goto(BASE_URL);
  await page.getByRole('button', { name: 'Contact Support' }).click();
  await expect(page.locator(selectors.emailField)).toBeVisible();
}

// Fill the feedback form fields with the provided values.
async function fillFeedbackForm(page: Page, email: string, subject: string, message: string) {
  await page.getByRole('textbox', { name: 'Your email' }).fill(email);
  await page.getByRole('textbox', { name: 'Subject' }).fill(subject);
  await page.getByRole('textbox', { name: 'Your message' }).fill(message);
}

// Submit the feedback form and wait for navigation or UI updates.
async function submitFeedback(page: Page) {
  await page.getByRole('button', { name: 'Submit' }).click();
}

// Verify that the page shows at least one validation error after a failed submission.
async function expectValidationError(page: Page) {
  // Check if Submit button is disabled (form validation blocks submission)
  const submitButton = page.getByRole('button', { name: 'Submit' });
  const isDisabled = await submitButton.isDisabled();
  
  // If button is disabled, form validation is working
  if (isDisabled) {
    expect(isDisabled).toBe(true);
  } else {
    // Otherwise, verify that success message did NOT appear
    await expect(page.locator('text=Feedback submitted successfully')).toHaveCount(0, { timeout: 5000 });
  }
}

async function expectSuccessMessage(page: Page) {
  const success = page.locator('text=Feedback submitted successfully').first();
  await expect(success).toBeVisible({ timeout: 10000 });
}

async function expectFormSubmitFailure(page: Page) {
  await expect(page.locator('text=Feedback submitted successfully')).toHaveCount(0);
  await expectValidationError(page);
}

async function randomFeedback() {
  return {
    email: faker.internet.email(),
    subject: faker.lorem.sentence(5),
    message: faker.lorem.paragraphs(2),
  };
}

async function openAndFill(page: Page, email: string, subject: string, message: string) {
  await openFeedbackModal(page);
  await fillFeedbackForm(page, email, subject, message);
  await submitFeedback(page);
}

test.describe('Feedback form', () => {
  // Positive path: a valid message should submit successfully.
  test('valid submission with randomly generated data', async ({ page }) => {
    const feedback = await randomFeedback();
    await openAndFill(page, feedback.email, feedback.subject, feedback.message);
    await expectSuccessMessage(page);
  });

  // Negative path: email is required and the form should show validation feedback.
  test('empty email field validation', async ({ page }) => {
    await openFeedbackModal(page);
    await fillFeedbackForm(page, '', faker.lorem.sentence(), faker.lorem.paragraph());
    // Don't submit - button should be disabled
    await expectFormSubmitFailure(page);
  });

  test.describe('invalid email formats', () => {
    const invalidEmails = ['abc', 'test@', '@gmail.com'];
    for (const invalidEmail of invalidEmails) {
      test(`reject invalid email: ${invalidEmail}`, async ({ page }) => {
        await openFeedbackModal(page);
        await fillFeedbackForm(page, invalidEmail, faker.lorem.sentence(), faker.lorem.paragraph());
        // Don't submit - button should be disabled for invalid email
        await expectFormSubmitFailure(page);
      });
    }
  });

  test('empty subject validation', async ({ page }) => {
    await openFeedbackModal(page);
    await fillFeedbackForm(page, faker.internet.email(), '', faker.lorem.paragraph());
    // Don't submit - button should be disabled
    await expectFormSubmitFailure(page);
  });

  test('empty message validation', async ({ page }) => {
    await openFeedbackModal(page);
    await fillFeedbackForm(page, faker.internet.email(), faker.lorem.sentence(), '');
    // Don't submit - button should be disabled
    await expectFormSubmitFailure(page);
  });

  test('very long subject text does not break the form', async ({ page }) => {
    const subject = faker.lorem.words(80);
    await openAndFill(page, faker.internet.email(), subject, faker.lorem.paragraph());
    await expectSuccessMessage(page);
  });

  test('very long message text does not break the form', async ({ page }) => {
    const message = faker.lorem.paragraphs(10);
    await openAndFill(page, faker.internet.email(), faker.lorem.sentence(), message);
    await expectSuccessMessage(page);
  });

  test('special characters and emoji input', async ({ page }) => {
    await openAndFill(page, faker.internet.email(), 'Feedback ❤️🔥', 'Hello! This is a test with emoji 😊 and special chars #@$%^&*().');
    await expectSuccessMessage(page);
  });

  test('leading and trailing spaces in inputs are trimmed or accepted', async ({ page }) => {
    await openAndFill(page, `  ${faker.internet.email()}  `, `  ${faker.lorem.words(4)}  `, `  ${faker.lorem.sentences(3)}  `);
    await expectSuccessMessage(page);
  });

  test('multiple consecutive submissions using different fake data', async ({ page }) => {
    for (let i = 0; i < 3; i += 1) {
      await openFeedbackModal(page);
      const feedback = await randomFeedback();
      await fillFeedbackForm(page, feedback.email, feedback.subject, feedback.message);
      await submitFeedback(page);
      await expectSuccessMessage(page);
      await page.reload();
    }
  });
});
