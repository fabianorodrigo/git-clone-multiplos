const readlineSync = require("readline-sync");
const getRepositorios = require("./getRepositorios");
const salvaObjToCSV = require("./salvaObjToCSV");
const getCommits = require("./getCommits");
const getUltimaSegunda = require("./getUltimaSegunda");
const formataData = require("./formataData");

module.exports = async function reportCommits(
  gitlabUrl,
  token,
  filtroGrupo,
  commiterEmailFilter
) {
  const dados = await report(gitlabUrl, token, filtroGrupo);
  //console.table(dados);
  salvaObjToCSV(dados, "reportCommitsRepos.csv", true);
};

async function report(gitlabUrl, token, filtroGrupo) {
  const retorno = {};

  let since = readlineSync.question(`Since YYYY-MM-DD: `);
  const commiterEmailFilter = readlineSync.question(
    `Filtro por e-mail do commiter (deixe em branco para não filtrar): `
  );

  const repos = await getRepositorios(
    gitlabUrl,
    token,
    filtroGrupo,
    commiterEmailFilter
  );
  await Promise.all(
    repos.map(async (r) => {
      await pushRepoInfo(
        retorno,
        r,
        gitlabUrl,
        token,
        since,
        commiterEmailFilter
      );
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
async function pushRepoInfo(
  retorno,
  r,
  gitlabUrl,
  token,
  since,
  commiterEmailFilter
) {
  const commits = (await getCommits(gitlabUrl, token, r.id, since)).filter(
    (x) =>
      !commiterEmailFilter ||
      x.committer_email.indexOf(commiterEmailFilter) > -1
  );
  if (!retorno[r.path_with_namespace]) {
    retorno[r.path_with_namespace] = {};
    retorno[r.path_with_namespace].id = r.id;
    retorno[r.path_with_namespace].total = 0;
  }
  retorno[r.path_with_namespace].total = commits.length;
  //varrendo os commits para agrupar semanalmente
  for (let x of commits) {
    const data = new Date(x.created_at);
    Intl.DateTimeFormat();
    const semanaAno = formataData(getUltimaSegunda(data));
    if (!retorno[r.path_with_namespace][semanaAno]) {
      retorno[r.path_with_namespace][semanaAno] = 0;
    }
    console.log(semanaAno, x.created_at, data, x.stats.total);
    //retorno[r.path_with_namespace][semanaAno]++;
    retorno[r.path_with_namespace][semanaAno] =
      retorno[r.path_with_namespace][semanaAno] + x.stats.total;
    //console.log(mes, retorno[r.path_with_namespace].commits[mes]);
    /*console.log(
      r.path_with_namespace,
      x.created_at,
      x.committer_email,
      
    );*/
  }
  //varrendo as semanas para identificar as que não tiveram nenhuma atividade
  const dateSince = new Date(since);
  const hoje = new Date();
  let ano = dateSince.getUTCFullYear();
  do {
    let segunda = getPrimeiraSegundaAno(ano);
    let numSemana = 0;
    while (
      segunda.getUTCFullYear() == ano ||
      (numSemana == 0 && segunda.getUTCFullYear() == ano - 1)
    ) {
      const inicioSemana = formataData(segunda);
      if (
        !Object.keys(retorno[r.path_with_namespace]).find((semanaAno) => {
          return semanaAno == inicioSemana;
        })
      ) {
        retorno[r.path_with_namespace][inicioSemana] = 0;
      }
      segunda.setDate(segunda.getDate() + 7);
      numSemana++;
    }
    ano++;
  } while (ano <= hoje.getUTCFullYear());
}

function getPrimeiraSegundaAno(ano) {
  const jan1 = new Date(ano, 0, 1);
  while (jan1.getDay() != 1) {
    jan1.setDate(jan1.getDate() - 1);
  }
  return jan1;
}
