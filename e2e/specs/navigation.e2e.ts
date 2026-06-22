import { test, expect } from '@playwright/test';
import { loginAs } from '../support/auth';

test.describe('Navegação autenticada', () => {
  test('navega pela barra inferior (busca, trocas, carteira)', async ({ page }) => {
    await loginAs(page);

    await page.click('a[data-nav="search"]');
    await expect(page).toHaveURL(/\/search/);
    await expect(page.locator('a.nav-item.active[data-nav="search"]')).toBeVisible();

    await page.click('a[data-nav="requests"]');
    await expect(page).toHaveURL(/\/requests/);

    await page.click('a[data-nav="wallet"]');
    await expect(page).toHaveURL(/\/wallet/);
    await expect(page.getByRole('heading', { name: 'Carteira' })).toBeVisible();
  });

  test('exibe o saldo de moedas na carteira', async ({ page }) => {
    await loginAs(page);
    await page.goto('/wallet');
    await expect(page.getByRole('heading', { name: 'Carteira' })).toBeVisible();
    await expect(page.locator('.wallet-card__balance')).toContainText(/\d+/);
  });

  test('painel administrativo acessível para admin', async ({ page }) => {
    await loginAs(page); // ana é ADMIN
    await page.goto('/admin');
    await expect(page.getByText('Painel administrativo')).toBeVisible();
    await expect(page.getByText('Usuários')).toBeVisible();
  });

  test('logout encerra a sessão', async ({ page }) => {
    await loginAs(page);
    await page.goto('/profile/me');
    const sair = page.getByRole('button', { name: /Sair/ });
    await sair.click();
    // diálogo de confirmação
    await page.locator('[data-ok]').click();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
