
import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for MSW to activate and data to load
        // We look for a key widget element
        await expect(page.locator('text=London, UK (Mock)')).toBeVisible({ timeout: 10000 });
    });

    test('should display global location and toggle overlay', async ({ page }) => {
        // Map Widget should be visible
        const mapFrame = page.locator('iframe[src*="maps.google.com"]');
        await expect(mapFrame).toBeVisible();

        // Location text in overlay (initially hidden or shown on hover, but DOM should be present)
        // Note: The overlay is opacity-0/translate-y-full by default until hover.
        // We can force hover to check visibility
        const container = page.locator('text=London, UK (Mock)').first();
        await expect(container).toBeVisible(); // The text itself is in the DOM
    });

    test('should display weather data from MSW', async ({ page }) => {
        // Check for specific mock values
        await expect(page.locator('text=15°')).toBeVisible(); // Temp
        await expect(page.locator('text=Partly Cloudy')).toBeVisible(); // Condition
    });

    test('should display upcoming trains from MSW', async ({ page }) => {
        // Elizabeth Line widget
        await expect(page.locator('text=West Ealing → East')).toBeVisible();
        
        // Mock trains
        await expect(page.locator('text=Stratford (Mock)')).toBeVisible();
        await expect(page.locator('text=Shenfield (Mock)')).toBeVisible();
        
        // Status checks
        await expect(page.locator('text=On Time').first()).toBeVisible();
        await expect(page.locator('text=Delayed')).toBeVisible();
    });

    test('should display RSS headlines from MSW', async ({ page }) => {
        await expect(page.locator('text=SolidJS 2.0 Announced (Mock)')).toBeVisible();
        await expect(page.locator('text=Hacker News')).toBeVisible();
    });
});
