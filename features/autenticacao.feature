# language: pt

Funcionalidade: Autenticação e Autorização
  Como QA
  Quero validar autenticação e autorização
  Para identificar comportamentos inesperados e riscos

  @smoke
  Cenário: Login com credenciais válidas
    Dado que estou na tela de login
    Quando realizo login com credenciais válidas
    Então devo ver o título "Campanha" no dashboard

  @bug @seguranca
  Cenário: Acesso direto ao dashboard sem login deve exigir autenticação
    Dado que não estou autenticado
    Quando acesso diretamente o caminho "/dashboard/campanha"
    Então devo ser redirecionado para a tela de login
