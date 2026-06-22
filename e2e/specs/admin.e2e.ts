import { test, expect } from '@playwright/test';
import { loginAs } from '../support/auth';

test.describe('Painel administrativo', () => {
  test('usuário comum não vê o painel', async ({ page }) => {
    await loginAs(page, 'bruno@skillex.com');
    await page.goto('/admin');
    await expect(page.getByText('Acesso restrito')).toBeVisible();
  });

  test('gestão de categorias e habilidades (criar, bloquear exclusão em uso, excluir)', async ({
    page,
  }) => {
    const stamp = Date.now();
    const catName = `Categoria E2E ${stamp}`;
    const skillName = `Skill E2E ${stamp}`;

    await loginAs(page); // ana (admin)
    await page.goto('/admin');
    await expect(page.getByText('Painel administrativo')).toBeVisible();

    // Cria categoria
    await page.click('button[data-tab="categories"]');
    await page.click('#cat-new');
    await page.fill('#cat-form input[name="name"]', catName);
    await page.fill('#cat-form input[name="color"]', '#336699');
    await page.click('#cat-form button[type="submit"]');
    await expect(page.getByText('Categoria salva')).toBeVisible();
    await expect(page.getByText(catName)).toBeVisible();

    // Cria habilidade dentro dela
    await page.click('button[data-tab="skills"]');
    await page.click('#skill-new');
    await page.fill('#skill-form input[name="name"]', skillName);
    await page.selectOption('#skill-form select[name="categoryId"]', { label: catName });
    await page.click('#skill-form button[type="submit"]');
    await expect(page.getByText('Habilidade salva')).toBeVisible();

    // Categoria com habilidade não pode ser excluída
    await page.click('button[data-tab="categories"]');
    const catCard = page.locator('[data-cat]', { hasText: catName });
    await catCard.locator('[data-del]').click();
    await page.click('[data-ok]');
    await expect(page.getByText(/possui.*habilidade/i)).toBeVisible();

    // Exclui a habilidade e então a categoria
    await page.click('button[data-tab="skills"]');
    await page.fill('#skill-search input[name="q"]', skillName);
    await page.click('#skill-search button[type="submit"]');
    const skillCard = page.locator('[data-skill]', { hasText: skillName });
    await skillCard.locator('[data-del]').click();
    await page.click('[data-ok]');
    await expect(page.getByText('Habilidade excluída')).toBeVisible();

    await page.click('button[data-tab="categories"]');
    const catCard2 = page.locator('[data-cat]', { hasText: catName });
    await catCard2.locator('[data-del]').click();
    await page.click('[data-ok]');
    await expect(page.getByText('Categoria excluída')).toBeVisible();
  });

  test('desativar usuário bloqueia o login dele', async ({ page, browser }) => {
    // Registra um usuário descartável em outro contexto (não toca no seed)
    const email = `e2e_alvo_${Date.now()}@test.com`;
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto('/register');
    await otherPage.fill('input[name="name"]', 'Alvo Desativação');
    await otherPage.fill('input[name="email"]', email);
    await otherPage.fill('input[name="password"]', 'SenhaForte1!');
    await otherPage.fill('input[name="confirm"]', 'SenhaForte1!');
    await otherPage.click('button[type="submit"]');
    await expect(otherPage).toHaveURL(/\/onboarding/);
    await other.close();

    // Admin desativa a conta
    await loginAs(page);
    await page.goto('/admin');
    await page.click('button[data-tab="users"]');
    await page.fill('#user-search input[name="q"]', email);
    await page.click('#user-search button[type="submit"]');
    const userCard = page.locator('[data-user]', { hasText: email });
    await userCard.locator('[data-toggle]').click();
    await page.click('[data-ok]');
    await expect(page.getByText('Conta desativada')).toBeVisible();

    // O usuário desativado não consegue mais entrar
    const blocked = await browser.newContext();
    const blockedPage = await blocked.newPage();
    await blockedPage.goto('/login');
    await blockedPage.fill('input[name="email"]', email);
    await blockedPage.fill('input[name="password"]', 'SenhaForte1!');
    await blockedPage.click('button[type="submit"]');
    await expect(blockedPage.getByText(/desativada/i)).toBeVisible();
    await blocked.close();
  });
});
