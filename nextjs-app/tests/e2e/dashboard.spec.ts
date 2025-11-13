/**
 * Dashboard E2E Tests
 * Management and student dashboard functionality
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper function to login
async function login(page: any, role: 'admin' | 'manager' | 'student') {
  await page.goto('/login');

  // Use demo credentials based on role
  const credentials = {
    admin: { email: 'admin@example.com', password: 'Admin123!' },
    manager: { email: 'manager@example.com', password: 'Manager123!' },
    student: { email: 'student@example.com', password: 'Student123!' },
  };

  await page.getByLabel(/email/i).fill(credentials[role].email);
  await page.getByLabel(/password/i).fill(credentials[role].password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('Management Dashboard', () => {
  test('should be accessible', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/management');

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should display statistics cards', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/management');

    // Check for key statistics
    await expect(page.getByText(/total properties/i)).toBeVisible();
    await expect(page.getByText(/total students/i)).toBeVisible();
    await expect(page.getByText(/room occupancy/i)).toBeVisible();
    await expect(page.getByText(/active bursaries/i)).toBeVisible();
  });

  test('should navigate to properties page', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/management');

    // Click properties link in sidebar
    await page.getByRole('link', { name: /properties/i }).click();

    // Verify navigation
    await expect(page).toHaveURL(/\/management\/properties/);
    await expect(page.getByRole('heading', { name: /properties/i })).toBeVisible();
  });
});

test.describe('Student Dashboard', () => {
  test('should be accessible', async ({ page }) => {
    await login(page, 'student');
    await page.goto('/student');

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should display accommodation information', async ({ page }) => {
    await login(page, 'student');
    await page.goto('/student');

    // Check for accommodation section
    await expect(page.getByText(/my accommodation/i)).toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    await login(page, 'student');
    await page.goto('/student');

    // Check for quick action buttons
    await expect(page.getByRole('link', { name: /maintenance request/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /book laundry/i })).toBeVisible();
  });

  test('should navigate to maintenance page', async ({ page }) => {
    await login(page, 'student');
    await page.goto('/student');

    // Click maintenance link
    await page.getByRole('link', { name: /maintenance/i }).first().click();

    // Verify navigation
    await expect(page).toHaveURL(/\/student\/maintenance/);
    await expect(page.getByRole('heading', { name: /maintenance requests/i })).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('sidebar navigation should be keyboard accessible', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/management');

    // Focus first navigation item
    await page.keyboard.press('Tab');

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Verify navigation occurred
    await expect(page).toHaveURL(/\/management\//);
  });

  test('should sign out successfully', async ({ page }) => {
    await login(page, 'student');
    await page.goto('/student');

    // Click sign out
    await page.getByRole('button', { name: /sign out/i }).click();

    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
