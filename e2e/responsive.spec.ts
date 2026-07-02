import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  const breakpoints = [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1280, height: 800, name: 'Desktop' },
  ];

  for (const bp of breakpoints) {
    test(`landing page renders at ${bp.name} (${bp.width}x${bp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/');
      await expect(page.locator('text=The OS for')).toBeVisible();
    });

    test(`pricing page renders at ${bp.name} (${bp.width}x${bp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/pricing');
      await expect(page.locator('text=Pro')).toBeVisible();
    });

    test(`login page renders at ${bp.name} (${bp.width}x${bp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/auth/login');
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
  }
});
