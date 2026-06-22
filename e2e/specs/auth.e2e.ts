import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('rota protegida redireciona para login quando deslogado', async ({ page }) => {
    await page.goto('/feed');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login com conta semeada leva ao feed e mostra matches', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'ana@skillex.com');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/feed/);
    await expect(page.getByText('Para você')).toBeVisible();
    // Bruno é um match perfeito da Ana (violino ↔ tricô) → aparece no feed
    await expect(page.getByText('Bruno Carvalho')).toBeVisible();
  });

  test('login inválido exibe mensagem de erro', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'ana@skillex.com');
    await page.fill('input[name="password"]', 'senha-errada');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/inválidos|Erro ao entrar/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('cadastro de novo usuário leva ao onboarding', async ({ page }) => {
    await page.goto('/register');
    const email = `e2e_${Date.now()}@test.com`;
    await page.fill('input[name="name"]', 'Usuário E2E');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'SenhaForte1!');
    await page.fill('input[name="confirm"]', 'SenhaForte1!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/onboarding/);
  });
});
