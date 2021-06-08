const getDadosAPI = require("./getDadosAPI");

module.exports = async function getRefsCommit(
  gitlabUrl,
  token,
  idRepositorio,
  commitId,
  type
) {
  const endpointURL = `https://${gitlabUrl}/api/v4/projects/${idRepositorio}/repository/commits/${commitId}/refs/${
    type ? `?type=${type}` : ""
  }`;
  return await getDadosAPI(endpointURL, token);
};
