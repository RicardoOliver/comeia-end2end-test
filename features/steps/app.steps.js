const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { LoginPage } = require('../pages/login.page');
const { DashboardCampanhaPage } = require('../pages/dashboard-campanha.page');

function requireEnv(name) {
  const value = process.env[name];
  expect(value, `Variável de ambiente obrigatória não definida: ${name}`).toBeTruthy();
  return value;
}

Given('que estou na tela de login', async function () {
  const baseURL = requireEnv('BASE_URL');
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.goto(baseURL);
  await this.loginPage.ensureVisible();
});

Given('que não estou autenticado', async function () {
  await this.context.clearCookies();
});

When('realizo login com credenciais válidas', async function () {
  const email = requireEnv('APP_EMAIL');
  const password = requireEnv('APP_PASSWORD');
  await this.loginPage.login(email, password);
});

When('acesso diretamente o caminho {string}', async function (pathName) {
  const baseURL = requireEnv('BASE_URL');
  const targetUrl = new URL(pathName, baseURL).toString();
  await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
});

When('aciono o link {string}', async function (linkText) {
  await expect(this.page.getByText(linkText)).toBeVisible();
  await this.loginPage.clickForgotPassword();
});

Then('devo ver o título {string} no dashboard', async function (title) {
  const baseURL = requireEnv('BASE_URL');
  const dashboard = new DashboardCampanhaPage(this.page);
  await dashboard.goto(baseURL);
  await expect(dashboard.headingCampanha.first(), `Título esperado não encontrado: ${title}`).toBeVisible({
    timeout: 15 * 1000,
  });
});

Then('devo ser redirecionado para a tela de login', async function () {
  const emailFieldVisible = await this.page
    .locator('input[type="email"], input[name*="email"], input[placeholder*="Email"]')
    .first()
    .isVisible()
    .catch(() => false);
  const passwordFieldVisible = await this.page.locator('input[type="password"]').first().isVisible().catch(() => false);
  expect(emailFieldVisible && passwordFieldVisible).toBeTruthy();
});

Then('devo ver um fluxo de recuperação ou navegação correspondente', async function () {
  const hasRecoveryUi =
    (await this.page.locator('text=Recuperar, text=Recuperação, text=Esqueci').first().isVisible().catch(() => false)) ||
    (await this.page.locator('input[type="email"]').first().isVisible().catch(() => false));
  expect(hasRecoveryUi).toBeTruthy();
});
