import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should open auth modal on sign in click", async ({ page }) => {
    await page.goto("/");
    await page.click('button:has-text("Sign in")');
    await expect(page.locator("text=Sign In")).toBeVisible();
  });

  test("should show login form", async ({ page }) => {
    await page.goto("/");
    await page.click('button:has-text("Sign in")');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should show signup form", async ({ page }) => {
    await page.goto("/");
    await page.click('button:has-text("Sign in")');
    await page.click('button:has-text("Sign up")');
    await expect(page.locator("text=Create Account")).toBeVisible();
  });

  test("should validate email format", async ({ page }) => {
    await page.goto("/");
    await page.click('button:has-text("Sign in")');
    await page.fill('input[type="email"]', "invalid-email");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid email")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("should navigate to all main pages", async ({ page }) => {
    const pages = [
      { url: "/", title: /CyberAI/ },
      { url: "/chat", title: /Chat/ },
      { url: "/console", title: /Console/ },
      { url: "/dashboard", title: /Dashboard/ },
      { url: "/leaderboard", title: /Leaderboard/ },
    ];

    for (const p of pages) {
      await page.goto(p.url);
      await expect(page).toHaveTitle(p.title);
    }
  });

  test("should have working mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.click('button[aria-label="Toggle menu"]');
    await expect(page.locator("text=Chat")).toBeVisible();
  });
});

test.describe("Theme Toggle", () => {
  test("should toggle dark mode", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);
    await page.click('button:has-text("Light")');
    await expect(html).toHaveClass(/light/);
  });
});

test.describe("Language Selector", () => {
  test("should change language", async ({ page }) => {
    await page.goto("/");
    await page.click('button:has-text("EN")');
    await page.click('button:has-text("AR")');
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});

test.describe("Responsive Design", () => {
  test("should work on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should work on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should work on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Performance", () => {
  test("should load within 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test("should have no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors).toHaveLength(0);
  });
});

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();
  });

  test("should have alt text on images", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).toBeTruthy();
    }
  });
});
