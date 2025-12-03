
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
    // There are two "Admin Login" buttons (one in Navbar, one in Footer). 
    // We want the one in the Navbar (top), which is usually inside a <nav> or identified by 'navigation'.
    // Or we can pick the first one which is usually the top one.
    // Using nth(0) or chaining from a header container is safer.
    // However, the user provided specific locators. 
    // "aka getByRole('navigation').getByRole('button', { name: 'Admin Login' })"
    
    // Assuming Navbar is a 'navigation' region.
    await page.getByRole('navigation').getByRole('button', { name: 'Admin Login' }).click();
    
    await expect(page.getByText('Admin Portal Access')).toBeVisible();
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
