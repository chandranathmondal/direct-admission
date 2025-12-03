
import { test, expect } from '@playwright/test';

test.describe('Direct-Admission App E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to the home page before each test
    await page.goto('/');
  });

  test('should load the home page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Direct-Admission/);
    await expect(page.getByText('Secure Your Seat in')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '' })).toBeVisible(); // Search input
  });

  test('should display search results when searching for a college', async ({ page }) => {
    const searchInput = page.getByRole('textbox');
    await searchInput.fill('Kolkata');
    await expect(searchInput).toHaveValue('Kolkata');
  });

  test('should navigate to login page', async ({ page }) => {
    // Use the specific locator for the Navbar Admin Login button
    await page.getByRole('navigation').getByRole('button', { name: 'Admin Login' }).click();
    
    // Check for the actual text present in Login.tsx
    await expect(page.getByText('Admin Access')).toBeVisible();
  });

  test('should handle navigation back to home from login', async ({ page }) => {
    await page.getByRole('navigation').getByRole('button', { name: 'Admin Login' }).click();
    await page.getByRole('button', { name: 'Home' }).click(); 
    
    await expect(page.getByText('Secure Your Seat in')).toBeVisible();
  });

  test('should show empty state if search returns no results', async ({ page }) => {
    const searchInput = page.getByRole('textbox');
    await searchInput.fill('XYZNonExistentCollege123');
    
    await expect(page.getByText('No matching results found')).toBeVisible();
  });

  test('should toggle between result types', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const allResultsBtn = page.getByRole('button', { name: 'All Results' });
    const programsBtn = page.getByRole('button', { name: 'Programs Only' });
    const institutesBtn = page.getByRole('button', { name: 'Institutes Only' });

    await expect(allResultsBtn).toBeVisible();
    await expect(programsBtn).toBeVisible();
    await expect(institutesBtn).toBeVisible();

    await programsBtn.click();
  });

});
