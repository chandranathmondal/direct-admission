
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Interaction', () => {

  test('should restrict access to admin dashboard for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    // Use the specific locator for the Navbar Admin Login button to avoid ambiguity
    await page.getByRole('navigation').getByRole('button', { name: 'Admin Login' }).click();
    
    // Should see Login screen, not Dashboard
    // The previous text 'Admin Portal Access' was not found in Login.tsx.
    // Looking at Login.tsx, the title is 'Admin Access'.
    await expect(page.getByText('Admin Access')).toBeVisible();
    await expect(page.getByText('Dashboard')).not.toBeVisible();
  });

});
