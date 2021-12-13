const getDadosAPI = require("./getDadosAPI");

module.exports = async function getRepositorios(gitlabUrl, token, filtroGrupo) {
  const endpointURL = `https://${gitlabUrl}/api/v4/projects?search_namespaces=true&search=${filtroGrupo}`;
  const repos = await getDadosAPI(endpointURL, token);
  //filtra só por aqueles cujo path inicial por 'filtroGrupo' e ordena pelo path completo do repositório
  return repos
    .filter((r) => r.path_with_namespace.startsWith(filtroGrupo))
    .sort((a, b) => (a.path_with_namespace > b.path_with_namespace ? 1 : -1));
};
