import { test, expect } from '@playwright/test';

test.describe('Recuperação de senha', () => {
  test('fluxo completo: esqueci a senha → link de demonstração → nova senha → login', async ({
    page,
  }) => {
    // Registra um usuário descartável via UI (não toca nas contas do seed)
    const email = `e2e_reset_${Date.now()}@test.com`;
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Usuário Reset');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'SenhaAntiga1!');
    await page.fill('input[name="confirm"]', 'SenhaAntiga1!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/onboarding/);

    // Sai da sessão (token + estado em memória, via reload) e solicita a recuperação
    await page.evaluate(() => localStorage.removeItem('skillex_token'));
    await page.goto('/forgot-password');
    await page.reload();
    await page.fill('input[name="email"]', email);
    await page.click('button[type="submit"]');

    // Em ambiente de teste a API expõe o link de redefinição na resposta
    const resetLink = page.locator('#forgot-result a');
    await expect(resetLink).toBeVisible();
    const href = await resetLink.getAttribute('href');
    expect(href).toContain('/reset-password?token=');

    // Abre o link e define a nova senha
    await page.goto(href!.replace(/^https?:\/\/[^/]+/, ''));
    await page.fill('input[name="password"]', 'SenhaNova123!');
    await page.fill('input[name="confirm"]', 'SenhaNova123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);

    // Login com a nova senha funciona
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'SenhaNova123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('confirmação divergente bloqueia o envio', async ({ page }) => {
    await page.goto('/reset-password?token=qualquercoisa');
    await page.fill('input[name="password"]', 'SenhaNova123!');
    await page.fill('input[name="confirm"]', 'Diferente123!');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/não confere/i)).toBeVisible();
  });
});
