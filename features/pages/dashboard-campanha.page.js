class DashboardCampanhaPage {
  constructor(page) {
    this.page = page;
    this.headingCampanha = page.locator('h1:has-text("Campanha"), h2:has-text("Campanha"), h3:has-text("Campanha")');
  }

  async goto(baseURL) {
    const url = new URL('/dashboard/campanha', baseURL).toString();
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async isCampanhaVisible() {
    return await this.headingCampanha.first().isVisible().catch(() => false);
  }
}

module.exports = { DashboardCampanhaPage };
