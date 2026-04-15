const fs = require('fs');
const path = require('path');
const { BeforeAll, AfterAll, Before, After, Status, setDefaultTimeout } = require('@cucumber/cucumber');
const { chromium } = require('playwright');

let browser;

setDefaultTimeout(60 * 1000);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeFileName(value) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').slice(0, 150);
}

BeforeAll(async function () {
  ensureDir(path.resolve(process.cwd(), 'reports'));
  ensureDir(path.resolve(process.cwd(), 'test-results-bdd'));
  ensureDir(path.resolve(process.cwd(), 'allure-results'));
  browser = await chromium.launch({
    headless: process.env.HEADED === '1' ? false : true,
    args: ['--disable-dev-shm-usage'],
  });
});

AfterAll(async function () {
  if (browser) {
    await browser.close();
  }
});

Before(async function () {
  this.browser = browser;
  this.context = await browser.newContext();
  await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  this.page = await this.context.newPage();
});

After(async function (scenario) {
  const scenarioName = sanitizeFileName(scenario.pickle.name);
  const failed = scenario.result?.status && scenario.result.status !== Status.PASSED;

  if (failed) {
    const screenshot = await this.page?.screenshot({ fullPage: true }).catch(() => null);
    if (screenshot) {
      await this.attach(screenshot, 'image/png');
    }

    const tracePath = path.join('test-results-bdd', `${scenarioName}-trace.zip`);
    await this.context?.tracing.stop({ path: tracePath }).catch(() => null);
    if (fs.existsSync(tracePath)) {
      await this.attach(fs.readFileSync(tracePath), 'application/zip');
    }

    await this.attach(
      [
        '## Cenário',
        scenario.pickle.name,
        '',
        '## Resultado observado',
        'Falha no teste automatizado. Ver anexos (screenshot/trace) para evidências.',
        '',
        '## Resultado esperado',
        'Comportamento consistente com os critérios de aceite do fluxo.',
      ].join('\n'),
      'text/markdown',
    );
  } else {
    await this.context?.tracing.stop().catch(() => null);
  }

  if (this.context) {
    await this.context.close();
  }
});
