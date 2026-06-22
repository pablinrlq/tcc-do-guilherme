import { Page, expect } from '@playwright/test';

/** Faz login pela UI com uma conta semeada e aguarda o feed carregar. */
export async function loginAs(
  page: Page,
  email = 'ana@skillex.com',
  password = 'senha123',
): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/feed/);
  await expect(page.getByText('Para você')).toBeVisible();
}
