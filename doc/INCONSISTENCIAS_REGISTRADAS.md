# Inconsistências Registradas

## Objetivo

Centralizar as inconsistências identificadas durante a exploração automatizada do ambiente, com foco em cenário, passos para reprodução e comparação observado vs. esperado.

## Evidências

- Playwright: `playwright-report/` e `test-results/`
- BDD (Cucumber): `reports/` e `test-results-bdd/`
- Allure: `allure-results/` e `allure-report/`

## INC-001 — Acesso ao Dashboard Campanha sem autenticação

### Categoria

Segurança / Autorização

### Severidade

Crítica

### Cenário

Usuário não autenticado acessa diretamente a rota interna do Dashboard Campanha.

### Passos para reprodução

1. Abrir uma sessão limpa (aba anônima ou limpar cookies).
2. Acessar diretamente: `GET /dashboard/campanha` (via navegador).

### Resultado observado

- A aplicação renderiza conteúdo do dashboard, incluindo o heading “Campanha” e itens de menu (“Bancos de dados”, “Colmeia Forms”), sem exigir login.

### Resultado esperado

- Redirecionar para tela de login, ou retornar 401/403 com mensagem clara, impedindo acesso ao conteúdo interno sem autenticação.

### Impacto

- Exposição potencial de informações e funcionalidades internas para usuários não autenticados.
- Viola princípios básicos de controle de acesso (broken access control).

### Automação que evidencia

- Playwright (E2E):
  - Caso com `@bug`: [login.spec.js](file:///c:/Users/Ricardo/Dropbox%20(Vers%C3%A3o%20anterior)/My%20PC%20(LAPTOP-FIRBUB72)/Desktop/comeia-end2end-test/tests/login.spec.js#L30-L75)
  - Evidência adicional anexada no próprio teste (“Bug - Autorização (Acesso sem login)”).
- BDD (Gherkin):
  - Feature: [autenticacao.feature](file:///c:/Users/Ricardo/Dropbox%20(Vers%C3%A3o%20anterior)/My%20PC%20(LAPTOP-FIRBUB72)/Desktop/comeia-end2end-test/features/autenticacao.feature#L14-L18)

### Evidências geradas automaticamente

- Screenshot e trace nas pastas:
  - `test-results/` (Playwright)
  - `test-results-bdd/` (BDD)
- Relatórios:
  - `playwright-report/`
  - `reports/cucumber-report.json`
  - `reports/cucumber-junit.xml`
  - `allure-report/`
