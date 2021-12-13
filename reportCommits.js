const getRepositorios = require("./getRepositorios");
const salvaObjToCSV = require("./salvaObjToCSV");
const getCommits = require("./getCommits");

module.exports = async function reportCommits(gitlabUrl, token, filtroGrupo) {
  const dados = await report(gitlabUrl, token, filtroGrupo);
  console.table(dados);
  salvaObjToCSV(dados, "reportCommitsRepos.csv");
};

async function report(gitlabUrl, token, filtroGrupo) {
  const retorno = {};

  const repos = await getRepositorios(gitlabUrl, token, filtroGrupo);
  await Promise.all(
    repos.map(async (r) => {
      await pushRepoInfo(retorno, r, gitlabUrl, token);
    })
  );

  return retorno;
}

/**
 * Com base nos dados do repositório {r} e informações sobre ele que serão solicitadas
 * à API Gitlab, inclui no objeto {retorno} informações sumarizadas de commits no repositório
 *
 * @param {*} retorno Objeto onde será inserida dados do repositório
 * @param {*} r Objeto repositório retornado pela API Gitlab
 */
async function pushRepoInfo(retorno, r, gitlabUrl, token) {
  const commits = await getCommits(gitlabUrl, token, r.id, null);
  /*for (let x of commits) {
    console.log(r.path_with_namespace, x.created_at, x.committer_email);
  }*/
  if (!retorno[r.path_with_namespace]) retorno[r.path_with_namespace] = {};
  retorno[r.path_with_namespace].qtdCommits = commits.length;
}
