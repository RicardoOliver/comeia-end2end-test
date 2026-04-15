const fs = require('fs');
const path = require('path');

function toEnvProps(env) {
  return Object.entries(env)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${String(value).replace(/\r?\n/g, ' ')}`)
    .join('\n');
}

function writeFileEnsuringDir(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

module.exports = async () => {
  const allureResultsDir = path.resolve(process.cwd(), 'allure-results');
  fs.mkdirSync(allureResultsDir, { recursive: true });

  writeFileEnsuringDir(
    path.join(allureResultsDir, 'environment.properties'),
    toEnvProps({
      BASE_URL: process.env.BASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      CI: process.env.CI,
      GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
      GITHUB_REF: process.env.GITHUB_REF,
      GITHUB_SHA: process.env.GITHUB_SHA,
      GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
      GITHUB_RUN_NUMBER: process.env.GITHUB_RUN_NUMBER,
      GITHUB_ACTOR: process.env.GITHUB_ACTOR,
    }),
  );

  writeFileEnsuringDir(
    path.join(allureResultsDir, 'executor.json'),
    JSON.stringify(
      {
        name: process.env.CI ? 'GitHub Actions' : 'Local',
        type: process.env.CI ? 'github' : 'local',
        buildName: process.env.GITHUB_RUN_NUMBER,
        buildOrder: process.env.GITHUB_RUN_ID,
        reportUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
          ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
          : undefined,
      },
      null,
      2,
    ),
  );

  writeFileEnsuringDir(
    path.join(allureResultsDir, 'categories.json'),
    JSON.stringify(
      [
        {
          name: 'Segurança: Autorização/Autenticação',
          matchedStatuses: ['failed', 'broken'],
          messageRegex: '.*(autentica|autoriz|login).*',
        },
        {
          name: 'Instabilidade: Timeout',
          matchedStatuses: ['failed', 'broken'],
          messageRegex: '.*(Timeout|timeout|timed out).*',
        },
        {
          name: 'Elementos/Seletores',
          matchedStatuses: ['failed', 'broken'],
          messageRegex: '.*(strict mode violation|locator|No node found|waiting for selector).*',
        },
      ],
      null,
      2,
    ),
  );
};
