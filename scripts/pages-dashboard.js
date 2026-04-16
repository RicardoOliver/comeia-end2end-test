const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resetDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function firstExistingPath(paths) {
  for (const p of paths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function safeCopyDir(from, to) {
  if (!fs.existsSync(from)) return false;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  return true;
}

function safeCopyFile(from, to) {
  if (!fs.existsSync(from)) return false;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  return true;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function computeCucumberSummary(cucumberJson) {
  if (!Array.isArray(cucumberJson)) return null;
  let scenarios = 0;
  let passed = 0;
  let failed = 0;
  const failedScenarios = [];

  for (const feature of cucumberJson) {
    const elements = Array.isArray(feature?.elements) ? feature.elements : [];
    for (const scenario of elements) {
      if (!scenario || scenario.type !== 'scenario') continue;
      scenarios += 1;
      const steps = Array.isArray(scenario.steps) ? scenario.steps : [];
      const statuses = steps.map((s) => s?.result?.status).filter(Boolean);
      const ok = statuses.length > 0 && statuses.every((s) => s === 'passed');
      if (ok) passed += 1;
      else {
        failed += 1;
        failedScenarios.push({
          name: scenario.name || 'Sem nome',
          feature: feature?.name || 'Sem feature',
        });
      }
    }
  }

  return { scenarios, passed, failed, failedScenarios };
}

function htmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildIndexHtml({ runInfo, reports, cucumberSummary }) {
  const runUrl =
    runInfo.serverUrl && runInfo.repo && runInfo.runId
      ? `${runInfo.serverUrl}/${runInfo.repo}/actions/runs/${runInfo.runId}`
      : null;
  const shaUrl =
    runInfo.serverUrl && runInfo.repo && runInfo.sha
      ? `${runInfo.serverUrl}/${runInfo.repo}/commit/${runInfo.sha}`
      : null;

  const gate = reports.gate || {};
  const bugs = reports.bugs || {};
  const security = reports.security || {};

  const kpiBdd =
    cucumberSummary && cucumberSummary.gate
      ? `<div class="kpi">
           <div class="kpi-title">BDD (Gate)</div>
           <div class="kpi-value">${cucumberSummary.gate.passed}<span class="kpi-sub">/${cucumberSummary.gate.scenarios}</span></div>
           <div class="kpi-foot">${cucumberSummary.gate.failed} com falha</div>
         </div>`
      : `<div class="kpi">
           <div class="kpi-title">BDD (Gate)</div>
           <div class="kpi-value">—</div>
           <div class="kpi-foot">Sem dados</div>
         </div>`;

  const kpiBugs =
    cucumberSummary && cucumberSummary.bugs
      ? `<div class="kpi">
           <div class="kpi-title">BDD (@bug)</div>
           <div class="kpi-value">${cucumberSummary.bugs.passed}<span class="kpi-sub">/${cucumberSummary.bugs.scenarios}</span></div>
           <div class="kpi-foot">${cucumberSummary.bugs.failed} com falha</div>
         </div>`
      : `<div class="kpi">
           <div class="kpi-title">BDD (@bug)</div>
           <div class="kpi-value">—</div>
           <div class="kpi-foot">Sem dados</div>
         </div>`;

  const bddFailDetails =
    cucumberSummary?.bugs?.failedScenarios?.length
      ? `<details class="details">
           <summary>Falhas do BDD (@bug) (${cucumberSummary.bugs.failedScenarios.length})</summary>
           <ul class="list">
             ${cucumberSummary.bugs.failedScenarios
               .slice(0, 25)
               .map(
                 (f) =>
                   `<li><span class="mono">${htmlEscape(f.feature)}</span> — ${htmlEscape(f.name)}</li>`,
               )
               .join('')}
           </ul>
           ${cucumberSummary.bugs.failedScenarios.length > 25 ? '<div class="muted">Lista truncada.</div>' : ''}
         </details>`
      : '';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>QA Dashboard</title>
    <style>
      :root {
        --bg: #0b1020;
        --panel: rgba(255,255,255,0.06);
        --text: rgba(255,255,255,0.92);
        --muted: rgba(255,255,255,0.65);
        --border: rgba(255,255,255,0.12);
        --accent: #6aa8ff;
        --ok: #39d98a;
        --bad: #ff5c7a;
        --warn: #ffcc66;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        color: var(--text);
        background: radial-gradient(1000px 700px at 20% -10%, rgba(106,168,255,0.25), transparent 60%),
                    radial-gradient(800px 600px at 80% 0%, rgba(57,217,138,0.18), transparent 60%),
                    var(--bg);
      }
      a { color: var(--accent); text-decoration: none; }
      a:hover { text-decoration: underline; }
      .wrap { max-width: 1100px; margin: 0 auto; padding: 28px 18px 40px; }
      .top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }
      .title { font-size: 28px; font-weight: 700; letter-spacing: 0.2px; }
      .subtitle { color: var(--muted); margin-top: 6px; line-height: 1.4; }
      .meta {
        border: 1px solid var(--border);
        background: var(--panel);
        padding: 12px 14px;
        border-radius: 14px;
        min-width: 280px;
      }
      .meta-row { display: flex; gap: 8px; align-items: baseline; margin: 4px 0; }
      .meta-k { color: var(--muted); width: 88px; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 12.5px; }
      .grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; margin-top: 16px; }
      .card {
        grid-column: span 4;
        border: 1px solid var(--border);
        background: var(--panel);
        border-radius: 16px;
        padding: 14px 14px 16px;
      }
      .card h3 { margin: 0; font-size: 16px; }
      .card p { margin: 8px 0 12px; color: var(--muted); line-height: 1.45; }
      .card .tag { display:inline-flex; align-items:center; gap:6px; font-size:11px; padding: 3px 8px; border-radius: 999px; border: 1px solid var(--border); color: var(--muted); margin-left: 8px; }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 12px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: rgba(0,0,0,0.18);
        color: var(--text);
      }
      .btnrow { display:flex; flex-wrap: wrap; gap: 10px; }
      .btn.disabled { opacity: 0.4; pointer-events: none; }
      .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
      .panel {
        border: 1px solid var(--border);
        background: var(--panel);
        border-radius: 16px;
        padding: 14px;
      }
      .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; }
      .kpi { border: 1px solid var(--border); border-radius: 14px; padding: 12px 12px 10px; background: rgba(0,0,0,0.18); }
      .kpi-title { color: var(--muted); font-size: 12px; }
      .kpi-value { font-size: 22px; font-weight: 700; margin-top: 6px; }
      .kpi-sub { font-size: 13px; color: var(--muted); font-weight: 500; margin-left: 6px; }
      .kpi-foot { margin-top: 4px; color: var(--muted); font-size: 12px; }
      .details { margin-top: 10px; }
      .details summary { cursor: pointer; color: var(--text); }
      .list { margin: 10px 0 0; padding-left: 18px; color: var(--muted); }
      .muted { color: var(--muted); margin-top: 6px; }
      @media (max-width: 900px) {
        .card { grid-column: span 12; }
        .row { grid-template-columns: 1fr; }
        .meta { min-width: unset; width: 100%; }
        .top { flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="top">
        <div>
          <div class="title">Relatórios e Artefatos</div>
          <div class="subtitle">
            Central de evidências do pipeline: execução gate, caça-bugs, relatórios e varreduras de segurança.
          </div>
        </div>
        <div class="meta">
          <div class="meta-row"><div class="meta-k">Branch</div><div class="mono">${htmlEscape(runInfo.refName || '-')}</div></div>
          <div class="meta-row"><div class="meta-k">SHA</div><div class="mono">${shaUrl ? `<a href="${shaUrl}">${htmlEscape(runInfo.sha?.slice(0, 12) || '-')}</a>` : htmlEscape(runInfo.sha?.slice(0, 12) || '-')}</div></div>
          <div class="meta-row"><div class="meta-k">Run</div><div class="mono">${runUrl ? `<a href="${runUrl}">#${htmlEscape(runInfo.runNumber || runInfo.runId || '-') }</a>` : htmlEscape(runInfo.runNumber || runInfo.runId || '-')}</div></div>
          <div class="meta-row"><div class="meta-k">Repo</div><div class="mono">${htmlEscape(runInfo.repo || '-')}</div></div>
        </div>
      </div>

      <div class="grid">
        <div class="card" style="grid-column: span 6;">
          <h3>Relatório principal <span class="tag">Recomendado</span></h3>
          <p>Visão consolidada da execução com anexos e categorias.</p>
          <div class="btnrow">
            <a class="btn ${gate.allure ? '' : 'disabled'}" href="${gate.allure ? './gate/allure/' : '#'}">Abrir Allure (Gate)</a>
            <a class="btn ${bugs.allure ? '' : 'disabled'}" href="${bugs.allure ? './bugs/allure/' : '#'}">Abrir Allure (@bug)</a>
          </div>
        </div>
        <div class="card" style="grid-column: span 6;">
          <h3>Relatórios HTML</h3>
          <p>Relatórios Playwright com evidências (screenshot/vídeo/trace).</p>
          <div class="btnrow">
            <a class="btn ${gate.playwright ? '' : 'disabled'}" href="${gate.playwright ? './gate/playwright/' : '#'}">Abrir Playwright (Gate)</a>
            <a class="btn ${bugs.playwright ? '' : 'disabled'}" href="${bugs.playwright ? './bugs/playwright/' : '#'}">Abrir Playwright (@bug)</a>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="panel">
          <div style="display:flex; align-items:baseline; justify-content:space-between; gap:10px;">
            <div style="font-weight:700;">Resumo</div>
            <div class="muted">Gate e caça-bugs</div>
          </div>
          <div class="kpis">
            ${kpiBdd}
            ${kpiBugs}
            <div class="kpi">
              <div class="kpi-title">Inconsistências</div>
              <div class="kpi-value" style="color: var(--warn);">1</div>
              <div class="kpi-foot"><a href="./docs/INCONSISTENCIAS_REGISTRADAS.md">Ver registro</a></div>
            </div>
          </div>
          ${bddFailDetails}
        </div>

        <div class="panel">
          <div style="font-weight:700;">Artefatos e segurança</div>
          <div class="muted" style="margin-top:10px; line-height:1.8;">
            <div><a class="${gate.cucumber ? '' : 'disabled'}" href="${gate.cucumber ? './gate/cucumber/' : '#'}">BDD (Gate): JSON/JUnit</a></div>
            <div><a class="${bugs.cucumber ? '' : 'disabled'}" href="${bugs.cucumber ? './bugs/cucumber/' : '#'}">BDD (@bug): JSON/JUnit</a></div>
            <div><a class="${security.owasp ? '' : 'disabled'}" href="${security.owasp ? './security/owasp/' : '#'}">OWASP Dependency-Check (HTML)</a></div>
            <div><a class="${security.trivy ? '' : 'disabled'}" href="${security.trivy ? './security/trivy/trivy-results.sarif' : '#'}">Trivy (SARIF)</a></div>
            <div><a href="./docs/">Docs do projeto</a></div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

function main() {
  const root = process.cwd();
  const siteDir = path.join(root, 'site');
  resetDir(siteDir);

  const artifactsDir = path.resolve(root, process.env.ARTIFACTS_DIR || 'artifacts');
  const gateDir = path.join(artifactsDir, 'gate');
  const bugsDir = path.join(artifactsDir, 'bugs');
  const securityDir = path.join(artifactsDir, 'security');

  const gatePlaywrightFrom = firstExistingPath([path.join(gateDir, 'playwright-report'), path.join(root, 'playwright-report')]);
  const gateAllureFrom = firstExistingPath([path.join(gateDir, 'allure-report'), path.join(root, 'allure-report')]);
  const gateCucumberFrom = firstExistingPath([path.join(gateDir, 'cucumber'), path.join(root, 'reports')]);

  const bugsPlaywrightFrom = firstExistingPath([path.join(bugsDir, 'playwright-report')]);
  const bugsAllureFrom = firstExistingPath([path.join(bugsDir, 'allure-report')]);
  const bugsCucumberFrom = firstExistingPath([path.join(bugsDir, 'reports')]);

  const owaspFrom = firstExistingPath([path.join(securityDir, 'owasp')]);
  const trivySarifFrom = firstExistingPath([path.join(securityDir, 'trivy', 'trivy-results.sarif')]);

  const hasGatePlaywright = gatePlaywrightFrom
    ? safeCopyDir(gatePlaywrightFrom, path.join(siteDir, 'gate', 'playwright'))
    : false;
  const hasGateAllure = gateAllureFrom ? safeCopyDir(gateAllureFrom, path.join(siteDir, 'gate', 'allure')) : false;

  const hasBugsPlaywright = bugsPlaywrightFrom
    ? safeCopyDir(bugsPlaywrightFrom, path.join(siteDir, 'bugs', 'playwright'))
    : false;
  const hasBugsAllure = bugsAllureFrom ? safeCopyDir(bugsAllureFrom, path.join(siteDir, 'bugs', 'allure')) : false;

  const gateCucumberDir = path.join(siteDir, 'gate', 'cucumber');
  ensureDir(gateCucumberDir);
  const hasGateCucumber =
    (gateCucumberFrom &&
      (safeCopyFile(path.join(gateCucumberFrom, 'cucumber-report.json'), path.join(gateCucumberDir, 'cucumber-report.json')) ||
        safeCopyFile(path.join(gateCucumberFrom, 'cucumber-junit.xml'), path.join(gateCucumberDir, 'cucumber-junit.xml')))) ||
    false;
  safeCopyFile(path.join(gateCucumberFrom || '', 'cucumber-junit.xml'), path.join(gateCucumberDir, 'cucumber-junit.xml'));

  const bugsCucumberDir = path.join(siteDir, 'bugs', 'cucumber');
  ensureDir(bugsCucumberDir);
  const hasBugsCucumber =
    (bugsCucumberFrom &&
      (safeCopyFile(path.join(bugsCucumberFrom, 'cucumber-report.json'), path.join(bugsCucumberDir, 'cucumber-report.json')) ||
        safeCopyFile(path.join(bugsCucumberFrom, 'cucumber-junit.xml'), path.join(bugsCucumberDir, 'cucumber-junit.xml')))) ||
    false;
  safeCopyFile(path.join(bugsCucumberFrom || '', 'cucumber-junit.xml'), path.join(bugsCucumberDir, 'cucumber-junit.xml'));

  const hasOwasp = owaspFrom ? safeCopyDir(owaspFrom, path.join(siteDir, 'security', 'owasp')) : false;
  const hasTrivy = trivySarifFrom ? safeCopyFile(trivySarifFrom, path.join(siteDir, 'security', 'trivy', 'trivy-results.sarif')) : false;

  safeCopyDir(path.join(root, 'doc'), path.join(siteDir, 'docs'));

  const gateCucumberJson = readJsonIfExists(path.join(gateCucumberDir, 'cucumber-report.json'));
  const bugsCucumberJson = readJsonIfExists(path.join(bugsCucumberDir, 'cucumber-report.json'));
  const cucumberSummary = {
    gate: computeCucumberSummary(gateCucumberJson),
    bugs: computeCucumberSummary(bugsCucumberJson),
  };

  const runInfo = {
    serverUrl: process.env.GITHUB_SERVER_URL,
    repo: process.env.GITHUB_REPOSITORY,
    runId: process.env.GITHUB_RUN_ID,
    runNumber: process.env.GITHUB_RUN_NUMBER,
    sha: process.env.GITHUB_SHA,
    refName: process.env.GITHUB_REF_NAME,
  };

  const indexHtml = buildIndexHtml({
    runInfo,
    reports: {
      gate: { playwright: hasGatePlaywright, allure: hasGateAllure, cucumber: hasGateCucumber },
      bugs: { playwright: hasBugsPlaywright, allure: hasBugsAllure, cucumber: hasBugsCucumber },
      security: { owasp: hasOwasp, trivy: hasTrivy },
    },
    cucumberSummary,
  });

  fs.writeFileSync(path.join(siteDir, 'index.html'), indexHtml, 'utf8');
}

main();
