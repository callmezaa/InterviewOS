import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays the hero section', async ({ page }) => {
    await expect(page.locator('text=The OS for')).toBeVisible();
    await expect(page.locator('text=technical interviews.')).toBeVisible();
  });

  test('displays Get Started button linking to login', async ({ page }) => {
    const getStarted = page.locator('text=Get Started').first();
    await expect(getStarted).toBeVisible();
  });

  test('displays navigation links', async ({ page }) => {
    await expect(page.locator('text=Features')).toBeVisible();
    await expect(page.locator('text=How it works')).toBeVisible();
    await expect(page.locator('text=Pricing')).toBeVisible();
    await expect(page.locator('text=FAQ')).toBeVisible();
  });

  test('displays Sign In button', async ({ page }) => {
    await expect(page.locator('text=Sign In').first()).toBeVisible();
  });

  test('navigates to login page when Sign In is clicked', async ({ page }) => {
    await page.locator('text=Sign In').first().click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('displays the terminal copy box', async ({ page }) => {
    await expect(page.locator('text=No account required to try')).toBeVisible();
  });

  test('features section is present after scrolling', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('text=Everything you need for tech hiring')).toBeVisible();
  });
});

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('displays all pricing tiers', async ({ page }) => {
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Team')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test('displays Pro plan as Most Popular', async ({ page }) => {
    const proCard = page.locator('text=Most Popular').first();
    await expect(proCard).toBeVisible();
  });
});

test.describe('Auth Pages', () => {
  test('login page shows form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('text=Master Your Next Interview')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('text=Sign up')).toBeVisible();
  });

  test('login page has forgot password link', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('text=Forgot your password?')).toBeVisible();
  });

  test('register page shows form with role selection', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('text=Create your account')).toBeVisible();
  });

  test('register page has sign in link', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('text=Sign in')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('landing page navigates to pricing', async ({ page }) => {
    await page.goto('/');
    await page.locator('text=Pricing').first().click();
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('404 page shows for unknown routes', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-xyz');
    expect(response?.status()).toBe(404);
  });
});
