# E2E Testing with Playwright

This directory contains end-to-end tests using Playwright with accessibility testing via @axe-core/playwright.

## Test Structure

```
tests/e2e/
├── auth.spec.ts         - Authentication tests (login, register)
├── dashboard.spec.ts    - Dashboard tests (management, student)
├── properties.spec.ts   - Properties management tests
└── README.md            - This file
```

## Running Tests

### All tests
```bash
npm run test
```

### Specific test file
```bash
npx playwright test auth.spec.ts
```

### Debug mode
```bash
npx playwright test --debug
```

### Headed mode
```bash
npx playwright test --headed
```

### Specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Accessibility Testing

All tests include accessibility scans using @axe-core/playwright:
- WCAG 2.1 Level A and AA compliance
- Automated detection of accessibility violations
- Detailed violation reports with fixes

Example:
```typescript
const accessibilityScanResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();

expect(accessibilityScanResults.violations).toEqual([]);
```

## Writing New Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/path');

    // Test assertions
    await expect(page.getByRole('button')).toBeVisible();

    // Accessibility scan
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

### Authentication Helper
```typescript
async function login(page: any, role: 'admin' | 'manager' | 'student') {
  await page.goto('/login');

  const credentials = {
    admin: { email: 'admin@example.com', password: 'Admin123!' },
    manager: { email: 'manager@example.com', password: 'Manager123!' },
    student: { email: 'student@example.com', password: 'Student123!' },
  };

  await page.getByLabel(/email/i).fill(credentials[role].email);
  await page.getByLabel(/password/i).fill(credentials[role].password);
  await page.getByRole('button', { name: /sign in/i }).click();
}
```

## Test Coverage

### Authentication
- [x] Login page accessibility
- [x] Login form validation
- [x] Invalid credentials error
- [x] Registration navigation
- [x] Registration form validation

### Dashboards
- [x] Management dashboard accessibility
- [x] Student dashboard accessibility
- [x] Statistics display
- [x] Navigation
- [x] Sign out

### Properties
- [x] Properties list accessibility
- [x] Table display
- [x] Filters (NSFAS, city)
- [x] Property details navigation

## Best Practices

1. **Use semantic selectors**: Prefer `getByRole`, `getByLabel` over CSS selectors
2. **Test user flows**: Focus on complete user journeys
3. **Include accessibility**: Always run axe scans on key pages
4. **Use descriptive names**: Test names should clearly describe what they test
5. **Avoid hard waits**: Use `waitForSelector` instead of `waitForTimeout`
6. **Test mobile**: Include mobile viewport tests
7. **Clean up**: Use `beforeEach` and `afterEach` for setup/teardown

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Scheduled nightly runs

Results are published to:
- GitHub Actions artifacts
- Test report dashboard
- Slack notifications (failures only)

## Troubleshooting

### Tests timing out
- Increase timeout in playwright.config.ts
- Check if application is running
- Verify network connectivity

### Accessibility violations
- Review the violation details in the report
- Fix the underlying HTML/ARIA issues
- Rerun tests to verify fixes

### Flaky tests
- Add explicit waits for dynamic content
- Use `waitForSelector` or `waitForLoadState`
- Disable animations in test environment
