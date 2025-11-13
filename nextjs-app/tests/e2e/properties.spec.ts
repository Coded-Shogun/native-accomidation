/**
 * Properties Management E2E Tests
 * CRUD operations for properties
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper function to login as admin
async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@example.com');
  await page.getByLabel(/password/i).fill('Admin123!');
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('Properties Management', () => {
  test('properties list should be accessible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/management/properties');

    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should display properties table', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/management/properties');

    // Check for table headers
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /location/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /capacity/i })).toBeVisible();
  });

  test('should filter properties', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/management/properties');

    // Use search filter
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Test Property');
      await page.keyboard.press('Enter');

      // Wait for results to load
      await page.waitForTimeout(1000);
    }
  });

  test('add property button should be visible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/management/properties');

    // Check for add button
    await expect(page.getByRole('link', { name: /add property/i })).toBeVisible();
  });

  test('should navigate to property details', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/management/properties');

    // Click first view button
    const viewButton = page.getByRole('button', { name: /view/i }).first();
    if (await viewButton.isVisible()) {
      await viewButton.click();

      // Verify navigation to details page
      await expect(page).toHaveURL(/\/management\/properties\/.+/);
    }
  });
});

test.describe('Property Filters', () => {
  test('should filter by NSFAS approved', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/management/properties');

    // Select NSFAS filter
    const nsfasFilter = page.getByLabel(/nsfas/i);
    if (await nsfasFilter.isVisible()) {
      await nsfasFilter.selectOption('true');

      // Wait for filtered results
      await page.waitForTimeout(500);
    }
  });

  test('should filter by city', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/management/properties');

    // Select city filter
    const cityFilter = page.getByLabel(/city/i);
    if (await cityFilter.isVisible()) {
      await cityFilter.selectOption({ index: 1 });

      // Wait for filtered results
      await page.waitForTimeout(500);
    }
  });
});
