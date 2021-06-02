# git-clone-multiplos

Script Nodejs que executa clone em múltiplos repositórios Git

1. npm install (só a primeira vez e nunca mais)

2. node .

De forma interativa, informar o domínio do git/gitlab cujos repositórios serão clonados, o nome de usuário e um token com direito de acesso a API e leitura de repositórios. Esses mesmos dados não serão questionados se as seguintes variáveis de ambiente estiverem setadas: GITLAB_URL, GITLAB_URSERNAME e GITLAB_TOKEN.

Informar um filtro opcional a ser aplicado no path dos repositórios
