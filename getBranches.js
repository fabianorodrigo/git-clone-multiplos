const getDadosAPI = require("./getDadosAPI");

module.exports = async function getBranches(
  gitlabUrl,
  token,
  idRepositorio,
  filtro
) {
  const endpointURL = `https://${gitlabUrl}/api/v4/projects/${idRepositorio}/repository/branches/${filtro}`;
  return await getDadosAPI(endpointURL, token);
};
