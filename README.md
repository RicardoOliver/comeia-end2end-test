# Comeia E2E Test (Playwright + BDD + Allure)

Este repositório é uma base de automação de testes end-to-end com quality gates, suíte separada para caça-bugs, relatórios ricos com evidências e um pipeline com varreduras OWASP.

O ambiente alvo possui comportamentos propositalmente inconsistentes. O objetivo principal é explorar o sistema, identificar comportamentos inesperados e registrar problemas com clareza (cenário, passos de reprodução, observado vs. esperado).

## Visão geral (o que você encontra aqui)

- E2E com Playwright (rápido, resiliente e com evidências automáticas)
- BDD com Gherkin (Cucumber) em PT-BR (`# language: pt`)
- Padrão de projeto: Page Object (pages em `features/pages/`)
- Relatórios:
  - Playwright HTML (`playwright-report/`)
  - Allure (`allure-report/`, `allure-results/`)
  - Cucumber JSON + JUnit (`reports/`)
- Pipeline GitHub Actions:
  - Quality gate (executa só cenários “gate” e falha em regressões)
  - Bug Hunt (executa cenários marcados como bug e não quebra o gate)
  - OWASP Dependency-Check (SCA) + Trivy (container scan)

## Requisitos

- Node.js 18+ (recomendado 20+)
- Navegadores do Playwright (instalados via `npx playwright install`)
- (Opcional) Docker, para execução em container

## Configuração

As execuções usam variáveis de ambiente para não hardcodear credenciais:

- `BASE_URL` (ex.: `https://teste-colmeia-qa.colmeia-corp.com`)
- `APP_EMAIL`
- `APP_PASSWORD`

## Instalação

```bash
npm ci
npx playwright install
```

## Como rodar (Playwright)

### Quality gate (não executa cenários marcados como bug)

```bash
npm run test:e2e:gate
```

### Rodar tudo (inclui bugs)

```bash
npm run test:e2e
```

### Rodar só caça-bugs

```bash
npm run test:e2e:bugs
```

### Abrir relatório HTML do Playwright

```bash
npm run test:e2e:report
```

## Como rodar (BDD / Cucumber)

### Quality gate (não executa cenários @bug)

```bash
npm run test:bdd
```

### Rodar só caça-bugs (@bug)

```bash
npm run test:bdd:bugs
```

Relatórios gerados:

- `reports/cucumber-report.json`
- `reports/cucumber-junit.xml`

## Allure (relatório avançado)

### 1) Executar testes com Allure habilitado

```bash
npm run test:e2e:allure
```

Isso gera `allure-results/` com metadados:

- `environment.properties` (ex.: BASE_URL e contexto da execução)
- `executor.json` (origem da execução)
- `categories.json` (agrupamento de falhas)

### 2) Gerar e abrir o relatório

```bash
npm run allure:generate
npm run allure:open
```

## Evidências (como provar o bug)

Quando um cenário falha, o projeto coleta evidências automaticamente:

- Playwright: screenshot/vídeo/trace em `test-results/` e consolidado em `playwright-report/`
- BDD: screenshot/trace em `test-results-bdd/` e relatórios em `reports/`
- Allure: consolida anexos e categoriza falhas no `allure-report/`

Além disso, alguns testes anexaram um “bug report” em markdown como attachment (cenário, passos, observado vs. esperado, impacto) para ficar fácil de consumir em review técnico.

## Estratégia de tags (gate vs bug hunt)

- `@bug`: cenário conhecido como inconsistente/defeito encontrado. Não deve quebrar o quality gate.
- `@smoke`: fluxo mínimo para validação rápida.

## Estrutura do projeto

- `tests/`: testes Playwright (E2E tradicional)
- `features/`: BDD (Gherkin)
  - `features/pages/`: Page Objects
  - `features/steps/`: steps do Cucumber
  - `features/support/`: hooks/world (browser, evidências, tracing)
- `doc/`: documentação do desafio
  - `PARTICAO_EQUIVALENCIA.md`
  - `INCONSISTENCIAS_REGISTRADAS.md`
- `.github/workflows/ci.yml`: pipeline CI

## Documentação do desafio

- Partição de equivalência: [doc/PARTICAO_EQUIVALENCIA.md](doc/PARTICAO_EQUIVALENCIA.md)
- Inconsistências registradas: [doc/INCONSISTENCIAS_REGISTRADAS.md](doc/INCONSISTENCIAS_REGISTRADAS.md)

## Pipeline (resumo técnico)

Arquivo: `.github/workflows/ci.yml`

- Job `test`:
  - Executa gates:
    - Playwright gate (sem `@bug`)
    - Cucumber gate (sem `@bug`)
  - Gera e publica artefatos (Playwright report, Allure report/results, Cucumber reports)
- Job `bug-hunt`:
  - Executa apenas `@bug`
  - `continue-on-error: true` para registrar inconsistências sem quebrar gate
- Jobs de segurança:
  - OWASP Dependency-Check (falha se CVSS >= 7)
  - Trivy no container (falha em HIGH/CRITICAL)

## Executar via Docker (opcional)

```bash
docker build -t comeia-e2e .
docker run --rm -e BASE_URL="https://teste-colmeia-qa.colmeia-corp.com" -e APP_EMAIL="..." -e APP_PASSWORD="..." comeia-e2e
```

