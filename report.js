const fs = require("fs");
const path = require("path");
const readlineSync = require("readline-sync");
const shell = require("shelljs");
const getBranches = require("./getBranches");
const getTags = require("./getTags");
const getRepositorios = require("./getRepositorios");
const salvaObjToCSV = require("./salvaObjToCSV");

(async function () {
  const gitlabUrl = process.env.GITLAB_URL
    ? process.env.GITLAB_URL
    : readlineSync.question(`Domínio git/gitlab (URL sem o protocolo): `);
  const username = process.env.GITLAB_USERNAME
    ? process.env.GITLAB_USERNAME
    : readlineSync.question(`Username em ${gitlabUrl}: `);
  const token = process.env.GITLAB_TOKEN
    ? process.env.GITLAB_TOKEN
    : readlineSync.question(`Informe o token do ${gitlabUrl}: `, {
        hideEchoBack: true, // The typed text on screen is hidden by `*` (default).
      });
  const filtroGrupo = readlineSync.question(`Filtrar projetos com path: `);

  const protocol = "https://";
  const domain = `${gitlabUrl}/api/v4/projects?search=${filtroGrupo}&access_token=${token}&per_page=100&page=`; //máximo do per_page é 100
  let pageNumber = 1;

  const dados = await report(gitlabUrl, token, filtroGrupo);
  console.table(dados);
  salvaObjToCSV(dados, "reportRepos.csv");
})();

async function report(gitlabUrl, token, filtroGrupo) {
  const retorno = {};

  const repos = await getRepositorios(gitlabUrl, token, filtroGrupo);

  for (const r of repos) {
    const obj = {};
    await pushTagData(obj, "develop", gitlabUrl, token, r.id);
    const branchesMaster = await pushTagData(
      obj,
      "master",
      gitlabUrl,
      token,
      r.id
    );
    if (obj.develop != null || obj.master != null) {
      retorno[r.path_with_namespace] = obj;
      //tags
      const tags = await getTags(gitlabUrl, token, r.id);
      obj.ultimaTag = tags.length > 0 ? tags[0].name : undefined;
      const tagFinal = getUltimaTagFinal(tags);
      obj.ultimaTagFinal = tagFinal ? tagFinal.name : undefined;
      obj.mesmoCommitMaster =
        tagFinal && branchesMaster.length > 0
          ? tagFinal.commitId == branchesMaster[0].commit.id
          : undefined;
      const tagRC = getUltimaTagRC(tags);
      obj.ultimaTagRC = tagRC ? tagRC.name : undefined;
    }
  }

  return retorno;
}

async function pushTagData(obj, tagName, gitlabUrl, token, id) {
  const branches = await getBranches(gitlabUrl, token, id, tagName);
  if (branches.length == 0) obj[tagName] = null;
  else if (branches.length == 1) {
    obj[tagName] = branches[0].protected ? "protegida" : "NÃO protegida";
  } else {
    obj[tagName] = branches.length;
  }
  return branches;
}

function getUltimaTagFinal(tags) {
  for (let i = 0; i < tags.length; i++) {
    if (tags[i].name.indexOf("RC") == -1 && tags[i].name.indexOf(".") > -1) {
      return { i, name: tags[i].name, commitId: tags[i].commit.id };
    }
  }
}

function getUltimaTagRC(tags) {
  for (let i = 0; i < tags.length; i++) {
    if (tags[i].name.indexOf("RC") != -1 && tags[i].name.indexOf(".") > -1) {
      return { i, name: tags[i].name, commitId: tags[i].commit.id };
    }
  }
}
