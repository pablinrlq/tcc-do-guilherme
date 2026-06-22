import { test, expect } from '@playwright/test';
import { loginAs } from '../support/auth';

/**
 * Tempo real (socket.io): dois navegadores conversando na mesma solicitação.
 * Usa a troca ACEITA do seed entre Carla (solicitante) e Diego (destinatário).
 */
test.describe('Chat e notificações em tempo real', () => {
  test('mensagem aparece para o outro participante sem recarregar a página', async ({
    page,
    browser,
  }) => {
    // Diego abre a solicitação aceita com a Carla
    await loginAs(page, 'diego@skillex.com');
    await page.goto('/requests');
    await page.locator('.request-item', { hasText: 'Carla' }).first().click();
    await expect(page.locator('#chat')).toBeVisible();
    const requestPath = new URL(page.url()).pathname; // /requests/<id>

    // Carla abre a mesma solicitação em outro navegador
    const carlaCtx = await browser.newContext();
    const carlaPage = await carlaCtx.newPage();
    await loginAs(carlaPage, 'carla@skillex.com');
    await carlaPage.goto(requestPath);
    await expect(carlaPage.locator('#chat')).toBeVisible();

    // Diego envia uma mensagem → aparece para ele (otimista)...
    const texto = `Mensagem ao vivo ${Date.now()}`;
    await page.fill('#chat-form input[name="content"]', texto);
    await page.click('#chat-form button[type="submit"]');
    await expect(page.locator('#chat')).toContainText(texto);

    // ...e chega na tela da Carla SEM reload (WebSocket)
    await expect(carlaPage.locator('#chat')).toContainText(texto, { timeout: 5000 });

    // Resposta da Carla chega ao Diego ao vivo
    const resposta = `Resposta ao vivo ${Date.now()}`;
    await carlaPage.fill('#chat-form input[name="content"]', resposta);
    await carlaPage.click('#chat-form button[type="submit"]');
    await expect(page.locator('#chat')).toContainText(resposta, { timeout: 5000 });

    await carlaCtx.close();
  });

  test('badge de notificações incrementa ao vivo fora do chat', async ({ page, browser }) => {
    // Diego fica no feed (fora da room do chat)
    await loginAs(page, 'diego@skillex.com');
    const badge = page.locator('[data-unread]');
    const antes = (await badge.isVisible()) ? Number(await badge.textContent()) : 0;

    // Carla envia uma mensagem na solicitação aceita entre eles
    const carlaCtx = await browser.newContext();
    const carlaPage = await carlaCtx.newPage();
    await loginAs(carlaPage, 'carla@skillex.com');
    await carlaPage.goto('/requests');
    // A troca com Diego está na caixa "Enviadas" da Carla
    await carlaPage.click('#req-seg button[data-box="sent"]');
    await carlaPage.locator('.request-item', { hasText: 'Diego' }).first().click();
    await expect(carlaPage.locator('#chat')).toBeVisible();
    await carlaPage.fill('#chat-form input[name="content"]', `Aviso ${Date.now()}`);
    await carlaPage.click('#chat-form button[type="submit"]');

    // O badge do Diego atualiza sem reload (notification:new → refreshUnread)
    await expect(badge).toHaveText(String(antes + 1), { timeout: 5000 });

    await carlaCtx.close();
  });
});
