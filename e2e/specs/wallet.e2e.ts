import { test, expect } from '@playwright/test';
import { loginAs } from '../support/auth';

test.describe('Carteira — compra de moedas', () => {
  test('adiciona moedas e atualiza o histórico', async ({ page }) => {
    await loginAs(page);
    await page.goto('/wallet');
    await expect(page.getByRole('heading', { name: 'Carteira' })).toBeVisible();

    await page.click('#buy-btn');
    // folha (sheet) de recarga
    await page.click('[data-amt="50"]');
    await page.click('#confirm-buy');

    // toast de sucesso confirma a recarga
    await expect(page.getByText(/moedas adicionadas/i)).toBeVisible();
    // a transação de compra aparece no histórico
    await expect(page.getByText('Compra de moedas').first()).toBeVisible();
  });
});
