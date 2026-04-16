const { test, expect } = require('playwright/test');

function requireEnv(name) {
  const value = process.env[name];
  expect(value, `Variável de ambiente obrigatória não definida: ${name}`).toBeTruthy();
  return value;
}

async function openLogin(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const email = page.locator('input[type="email"], input[name*="email"], input[placeholder*="Email"]');
  const password = page.locator('input[type="password"], input[name*="password"], input[placeholder*="Senha"]');
  await expect(email.first()).toBeVisible();
  await expect(password.first()).toBeVisible();
  return { email: email.first(), password: password.first() };
}

async function doLogin(page, { email, password }) {
  const { email: emailField, password: passwordField } = await openLogin(page);
  await emailField.fill(email);
  await passwordField.fill(password);
  const loginButton = page.locator('button:has-text("Login"), button:has-text("Entrar"), [type="submit"]');
  await loginButton.first().click();
  await page.waitForLoadState('networkidle');
}

test(
  'UX: link "Esqueceu sua senha?" deve funcionar (navegar ou abrir fluxo de recuperação)',
  { tag: ['@smoke'] },
  async ({ page }) => {
  await openLogin(page);
  const link = page.locator('a:has-text("Esqueceu sua senha"), button:has-text("Esqueceu sua senha")');
  await expect(link.first()).toBeVisible();
  const urlBefore = page.url();
  await link.first().click();
  await page.waitForTimeout(500);
  const urlAfter = page.url();

  const hasRecoveryUi =
    (await page.locator('text=Recuperar, text=Recuperação, text=Esqueci').first().isVisible().catch(() => false)) ||
    (await page.locator('input[type="email"]').first().isVisible().catch(() => false));

  await expect(
    urlAfter !== urlBefore || hasRecoveryUi,
    'Clique em "Esqueceu sua senha?" não alterou a URL e não abriu nenhum fluxo visível de recuperação.',
  ).toBeTruthy();
},
);

test('Segurança: tentativa de login inválido não deve autenticar', async ({ page }) => {
  await doLogin(page, { email: 'invalido+e2e@teste.com', password: 'senha-incorreta' });
  const isDashboardVisible = await page.locator('text=Campanha, text=Bancos de dados, text=Colmeia Forms').first().isVisible().catch(() => false);
  await expect(
    isDashboardVisible,
    'Login inválido aparenta autenticar (ou não exibe feedback e permite acesso). Esperado: permanecer no login e exibir mensagem de erro.',
  ).toBeFalsy();
});

test('Navegação: menus do Dashboard Campanha devem carregar conteúdo sem tela vazia', async ({ page }) => {
  const email = requireEnv('APP_EMAIL');
  const password = requireEnv('APP_PASSWORD');

  await doLogin(page, { email, password });
  await page.goto('/dashboard/campanha', { waitUntil: 'domcontentloaded' });

  const bancos = page.locator('a:has-text("Bancos de dados")');
  await expect(bancos.first()).toBeVisible();
  await bancos.first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page, 'Clique em "Bancos de dados" não navegou para a rota esperada.').toHaveURL(/\/dashboard\/campanha\/bancos-de-dados/);
  const bancosHasContent = await page.locator('main, [role="main"], h1, h2, h3').first().isVisible().catch(() => false);
  await expect(bancosHasContent, 'Tela "Bancos de dados" aparenta estar vazia ou sem conteúdo principal.').toBeTruthy();

  const forms = page.locator('a:has-text("Colmeia Forms")');
  await expect(forms.first()).toBeVisible();
  await forms.first().click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page, 'Clique em "Colmeia Forms" não navegou para a rota esperada.').toHaveURL(/\/dashboard\/campanha\/colmeia-forms/);
  const formsHasContent = await page.locator('main, [role="main"], h1, h2, h3').first().isVisible().catch(() => false);
  await expect(formsHasContent, 'Tela "Colmeia Forms" aparenta estar vazia ou sem conteúdo principal.').toBeTruthy();
});
