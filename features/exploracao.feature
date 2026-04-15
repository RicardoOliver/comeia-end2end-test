# language: pt

Funcionalidade: Exploração do sistema
  Como QA
  Quero explorar fluxos principais
  Para registrar inconsistências com clareza

  @smoke
  Cenário: Link "Esqueceu sua senha?" deve funcionar
    Dado que estou na tela de login
    Quando aciono o link "Esqueceu sua senha?"
    Então devo ver um fluxo de recuperação ou navegação correspondente
