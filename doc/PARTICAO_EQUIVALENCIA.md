# Partição de Equivalência (Equivalence Partitioning)

## Objetivo

Definir classes de equivalência para os principais inputs e fluxos deste ambiente de teste, para maximizar cobertura com o mínimo de cenários, mantendo foco em comportamentos inconsistentes e defeitos de UX/segurança.

## Escopo

- Autenticação (login)
- Recuperação de senha (link/fluxo)
- Autorização (acesso direto a rotas internas)
- Navegação principal do Dashboard Campanha

## Convenções

- Credenciais e URLs não devem ser hardcoded; use variáveis de ambiente `BASE_URL`, `APP_EMAIL`, `APP_PASSWORD`.
- Para cada partição, basta 1 caso representativo, a menos que o risco justifique mais (ex.: segurança).

## 1) Login — Email

### Classes de equivalência

- Válido (formato email, cadastrado)
- Válido (formato email, não cadastrado)
- Inválido (formato incorreto)
- Vazio
- Excessivamente longo
- Com espaços no início/fim
- Com caracteres especiais inesperados

### Casos sugeridos (1 por classe)

- Válido/cadastrado: `APP_EMAIL` do ambiente
- Válido/não cadastrado: `nao-cadastrado+e2e@exemplo.com`
- Inválido/formato: `qa@test` ou `qa@`
- Vazio: `""`
- Longo: email > 254 chars
- Espaços: `"  qa@test.com  "`
- Especiais: `"qa+teste@test.com"` (válido) e `"qa\"@test.com"` (inválido)

### Oráculos (esperado)

- Deve validar formato antes de submeter ou retornar erro claro do backend.
- Para email não cadastrado, não deve autenticar e deve apresentar mensagem genérica (sem enumerar usuários).

## 2) Login — Senha

### Classes de equivalência

- Válida (correta)
- Inválida (incorreta)
- Vazia
- Muito curta
- Muito longa
- Com espaços (início/fim)

### Casos sugeridos

- Válida/correta: `APP_PASSWORD` do ambiente
- Inválida: `senha-incorreta`
- Vazia: `""`
- Curta: `"1"` (se o sistema permitir submeter)
- Longa: string > 256 chars
- Espaços: `"  123456  "`

### Oráculos

- Senha incorreta não deve autenticar.
- Mensagens não devem revelar se o usuário existe.

## 3) Recuperação de senha — Link/fluxo

### Classes de equivalência

- Link funciona e navega para rota dedicada
- Link funciona e abre modal/fluxo inline
- Link visível porém inoperante
- Link invisível/inacessível (a11y)

### Oráculos

- Ao clicar, deve ocorrer navegação (mudança de URL) ou abertura de UI de recuperação.
- Deve existir um input (tipicamente email) para iniciar recuperação.

## 4) Autorização — Acesso direto a rota interna

### Classes de equivalência

- Não autenticado (sessão limpa)
- Autenticado (sessão válida)
- Autenticado expirado
- Autorização insuficiente (perfil sem permissão)

### Rotas críticas (mínimo)

- `/dashboard/campanha`
- (Derivadas) `/dashboard/campanha/bancos-de-dados`, `/dashboard/campanha/colmeia-forms`

### Oráculos

- Não autenticado: redirecionar para login ou responder 401/403 com mensagem clara.
- Autenticado: permitir acesso e renderizar conteúdo esperado.

## 5) Navegação — Dashboard Campanha

### Classes de equivalência

- Menus renderizam e navegam para URLs corretas
- Menus renderizam mas navegação falha (rota errada/404)
- Navegação ocorre mas conteúdo principal não carrega (tela vazia)

### Oráculos

- URLs devem corresponder aos links do menu.
- Deve haver conteúdo principal visível (ex.: `main`, heading, tabela ou formulário).
