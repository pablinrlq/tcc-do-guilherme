import { test, expect, Page } from '@playwright/test';

/** Registra um usuário descartável via UI e retorna o e-mail. */
async function registerDisposable(page: Page, password: string): Promise<string> {
  const email = `e2e_settings_${Date.now()}@test.com`;
  await page.goto('/register');
  await page.fill('input[name="name"]', 'Usuário Configurações');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirm"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/onboarding/);
  return email;
}

test.describe('Configurações da conta', () => {
  test('alterar senha pelo painel de configurações', async ({ page }) => {
    const email = await registerDisposable(page, 'SenhaOriginal1!');

    await page.goto('/settings');
    await expect(page.getByText('Alterar senha')).toBeVisible();
    await page.fill('input[name="currentPassword"]', 'SenhaOriginal1!');
    await page.fill('input[name="newPassword"]', 'SenhaTrocada1!');
    await page.fill('input[name="confirmPassword"]', 'SenhaTrocada1!');
    await page.click('#password-form button[type="submit"]');
    await expect(page.getByText('Senha alterada com sucesso')).toBeVisible();

    // Sai e entra com a nova senha
    await page.click('#btn-logout');
    await page.click('[data-ok]');
    await expect(page).toHaveURL(/\/login/);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'SenhaTrocada1!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('excluir a conta remove o acesso definitivamente', async ({ page }) => {
    const email = await registerDisposable(page, 'SenhaExcluir1!');

    await page.goto('/settings');
    await page.click('#btn-delete');
    await page.click('[data-ok]'); // confirmação inicial
    await page.fill('#delete-form input[name="password"]', 'SenhaExcluir1!');
    await page.click('#delete-form button[type="submit"]');
    await expect(page.getByText(/conta excluída/i)).toBeVisible();

    // Tentar logar de novo falha (conta anonimizada)
    await page.goto('/login');
    await page.reload();
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'SenhaExcluir1!');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/inválidos|erro/i)).toBeVisible();
  });
});
