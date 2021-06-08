const axios = require("axios");

module.exports = async function getDadosAPI(endpointURL, token) {
  return await buscaDados(endpointURL, token, 1);
};

async function buscaDados(endpointURL, token, numeroPagina) {
  const url = endpointURL.concat(
    endpointURL.indexOf("?") == -1 ? "?" : "&",
    `access_token=${token}&per_page=100&page=`,
    numeroPagina
  );
  let retorno = [];
  try {
    const response = await axios.get(url);
    retorno = retorno.concat(response.data);
    if (response.data.length == 100) {
      retorno = retorno.concat(
        await buscaDados(endpointURL, token, numeroPagina + 1)
      );
    }
  } catch (e) {
    //se for 404, apenas não encontrou, senão, exibe
    if (e.response == null || e.response.status != 404) {
      console.log(
        "EXCEÇÃO:",
        url,
        e.response ? e.response.message : e.code ? e.code : e
      );
    }
  }
  return retorno;
}
