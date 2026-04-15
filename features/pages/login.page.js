class LoginPage {
  constructor(page) {
    this.page = page;
    this.email = page.locator('input[type="email"], input[name*="email"], input[placeholder*="Email"]');
    this.password = page.locator('input[type="password"], input[name*="password"], input[placeholder*="Senha"]');
    this.submit = page.locator('button:has-text("Login"), button:has-text("Entrar"), [type="submit"]');
    this.forgotPassword = page.locator('a:has-text("Esqueceu sua senha"), button:has-text("Esqueceu sua senha")');
  }

  async goto(baseURL) {
    await this.page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  }

  async ensureVisible() {
    await this.email.first().waitFor({ state: 'visible' });
    await this.password.first().waitFor({ state: 'visible' });
  }

  async login(email, password) {
    await this.ensureVisible();
    await this.email.first().fill(email);
    await this.password.first().fill(password);
    await this.submit.first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickForgotPassword() {
    await this.forgotPassword.first().waitFor({ state: 'visible' });
    await this.forgotPassword.first().click();
  }
}

module.exports = { LoginPage };
