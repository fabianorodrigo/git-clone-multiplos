const getDadosAPI = require("./getDadosAPI");

module.exports = async function getTags(
  gitlabUrl,
  token,
  idRepositorio,
  filtro
) {
  const endpointURL = `https://${gitlabUrl}/api/v4/projects/${idRepositorio}/repository/tags/${
    filtro ? `?search=${filtro}` : ""
  }`;
  return await getDadosAPI(endpointURL, token);
};
