import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CyberAI/);
  });

  test('should display the hero section', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('main').first();
    await expect(hero).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL(/\/about/);
  });
});

test.describe('Chat Page', () => {
  test('should load chat page', async ({ page }) => {
    await page.goto('/chat');
    await expect(page).toHaveURL(/\/chat/);
  });
});

test.describe('Dashboard', () => {
  test('should load dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
