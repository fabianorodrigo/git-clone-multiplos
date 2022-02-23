const getDadosAPI = require("./getDadosAPI");

/**
 * Busca lista de commits do repositório a partir de {since}
 *
 * @param {*} gitlabUrl URL gitlab
 * @param {*} token Token usado para autenticação
 * @param {*} idRepositorio identificador do repositório
 * @param {*} since Data no formato ISO 8601 YYYY-MM-DDTHH:MM:SSZ a partir da qual será buscados os commits
 * @returns
 */
module.exports = async function getCommits(
  gitlabUrl,
  token,
  idRepositorio,
  since
) {
  const endpointURL = `https://${gitlabUrl}/api/v4/projects/${idRepositorio}/repository/commits/?all=true&with_stats=true${
    since ? `&since=${since}` : ""
  }`;
  const commits = await getDadosAPI(endpointURL, token);
  return commits.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
};
