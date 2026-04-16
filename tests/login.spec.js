const { test, expect } = require('playwright/test');

const EMAIL = process.env.APP_EMAIL;
const PASSWORD = process.env.APP_PASSWORD;

function requireEnv(name) {
  const value = process.env[name];
  expect(value, `Variável de ambiente obrigatória não definida: ${name}`).toBeTruthy();
  return value;
}

test(
  'Login com credenciais válidas e navegação para Dashboard Campanha',
  { tag: ['@smoke'] },
  async ({ page }) => {
  requireEnv('APP_EMAIL');
  requireEnv('APP_PASSWORD');
  await page.goto('/');
  const emailLocator = page.locator('input[type="email"], input[name*="email"], input[placeholder*="Email"]');
  const passwordLocator = page.locator('input[type="password"], input[name*="password"], input[placeholder*="Senha"]');
  await expect(emailLocator.first()).toBeVisible();
  await expect(passwordLocator.first()).toBeVisible();
  await emailLocator.first().fill(EMAIL);
  await passwordLocator.first().fill(PASSWORD);
  const loginButton = page.locator('button:has-text("Login"), button:has-text("Entrar"), [type="submit"]');
  await loginButton.first().click();
  await page.waitForLoadState('networkidle');
  await page.goto('/dashboard/campanha', { waitUntil: 'domcontentloaded' });
  const heading = page.locator('h1:has-text("Campanha"), h2:has-text("Campanha"), h3:has-text("Campanha")');
  await expect(heading.first()).toBeVisible();
},
);

test(
  'Segurança: acesso direto a /dashboard/campanha sem login deve redirecionar para autenticação',
  { tag: ['@bug'] },
  async ({ page }, testInfo) => {
  await page.goto('/dashboard/campanha', { waitUntil: 'domcontentloaded' });
  const emailFieldVisible = await page
    .locator('input[type="email"], input[name*="email"], input[placeholder*="Email"]')
    .first()
    .isVisible()
    .catch(() => false);
  const passwordFieldVisible = await page.locator('input[type="password"]').first().isVisible().catch(() => false);
  const isLoginFormVisible = emailFieldVisible && passwordFieldVisible;

  if (!isLoginFormVisible) {
    await testInfo.attach('Bug - Autorização (Acesso sem login)', {
      body: [
        '## Cenário',
        'Acesso direto ao Dashboard Campanha sem autenticação.',
        '',
        '## Passos para reprodução',
        `1. Abrir ${new URL('/dashboard/campanha', page.url()).toString().replace(/\\?$/, '')}`,
        '2. Garantir sessão limpa (nova aba anônima ou limpar cookies).',
        '',
        '## Resultado observado',
        'A página carrega o conteúdo do Dashboard (ex.: heading "Campanha" e menus) sem exigir login.',
        '',
        '## Resultado esperado',
        'Redirecionar para Login (ou retornar 401/403 com mensagem clara), impedindo o acesso ao conteúdo protegido.',
        '',
        '## Impacto',
        'Possível falha de autorização: usuários não autenticados acessam área interna.',
      ].join('\n'),
      contentType: 'text/markdown',
    });

    testInfo.annotations.push({ type: 'categoria', description: 'Segurança' });
    testInfo.annotations.push({ type: 'severidade', description: 'Crítica' });
  }

  await expect(
    isLoginFormVisible,
    'Rota /dashboard/campanha parece acessível sem autenticação (risco de autorização). Esperado: redirecionar para tela de login.',
  ).toBeTruthy();
},
);
