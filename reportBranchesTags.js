const fs = require("fs");
const path = require("path");
const colors = require("colors");
const readlineSync = require("readline-sync");
const shell = require("shelljs");
const getBranches = require("./getBranches");
const getTags = require("./getTags");
const getRefsCommit = require("./getRefsCommit");
const getRepositorios = require("./getRepositorios");
const salvaObjToCSV = require("./salvaObjToCSV");

const REGEXP_RC = /^v(\d{1,3})\.(\d{1,3})\.\d{1,4}\-RC\d{1,}$/;
const REGEXP_FINAL = /^v(\d{1,3})\.(\d{1,3})\.\d{1,4}$/;
const REGEXP_RELEASE_BRACH = /^OS(\d{1,3})SP(\d{1,3})$/;

module.exports = async function reportBranchsTags(
  gitlabUrl,
  token,
  filtroGrupo
) {
  const dados = await report(gitlabUrl, token, filtroGrupo);
  console.table(dados);
  salvaObjToCSV(dados, "reportBranchesTagsRepos.csv");
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
 * à API Gitlab, inclui no objeto {retorno} uma chave com o "path_with_namespace" do
 * repositório um compilado das infos obtidas
 * @param {*} retorno Objeto onde será inserida dados do repositório
 * @param {*} r Objeto repositório retornado pela API Gitlab
 */
async function pushRepoInfo(retorno, r, gitlabUrl, token) {
  const obj = {id: r.id};
  await pushTagData(obj, "develop", gitlabUrl, token, r.id);
  const branchesMaster = await pushTagData(
    obj,
    "master",
    gitlabUrl,
    token,
    r.id
  );
  if (r.empty_repo === false && r.archived === false) {
    retorno[r.path_with_namespace] = obj;
    //tags
    const tags = await getTags(gitlabUrl, token, r.id);
    obj.ultimaTag = tags.length > 0 ? tags[0].name : undefined;
    const tagFinal = getUltimaTagFinal(tags);
    obj.ultimaTagFinal = tagFinal ? tagFinal.name : undefined;
    // tag final está no mesmo ponto de commit do master? (esperado: TRUE)
    obj.mesmoCommitMaster =
      tagFinal && branchesMaster.length > 0
        ? tagFinal.commitId == branchesMaster[0].commit.id
        : undefined;
    const tagRC = getUltimaTagRC(tags);
    obj.ultimaTagRC = tagRC ? tagRC.name : undefined;
    // RC mergeada para develop
    obj["RC mergeada p/ 'develop'"] = null;
    // releases branches
    obj["Releases Branches"] = null;
    let refsTagCommitTagRC = null;
    if (tagRC != null) {
      refsTagCommitTagRC = await getRefsCommit(
        gitlabUrl,
        token,
        r.id,
        tagRC.commitId,
        "tag"
      );
      const refsBranchCommitTagRC = await getRefsCommit(
        gitlabUrl,
        token,
        r.id,
        tagRC.commitId,
        "branch"
      );
      obj["RC mergeada p/ 'develop'"] =
        refsBranchCommitTagRC.filter((t) => t.name == "develop").length > 0;
      obj["Releases Branches"] = refsBranchCommitTagRC
        .filter((t) => REGEXP_RELEASE_BRACH.test(t.name))
        .map((t) => t.name)
        ?.join();
    }

    // qual a relação do commit da última tag final com a última tag RC?
    // Quando uma RC corresponde exatamente à tag final, o esperado é que o commit da RC está tanto na RC quanto na tag final.
    // Caso a última tag RC gerada já seja de uma próxima versão a entrar ainda, aí o commit da última tag Final vai estar em ambas
    obj["Final x RC"] = null;
    if (tagFinal != null && tagRC != null) {
      if (
        refsTagCommitTagRC.find((t) => t.name == tagRC.name) &&
        refsTagCommitTagRC.find((t) => t.name == tagFinal.name)
      ) {
        obj["Final x RC"] = "Final contém RC";
      } else {
        const refsCommitTagFinal = await getRefsCommit(
          gitlabUrl,
          token,
          r.id,
          tagFinal.commitId,
          "tag"
        );
        if (
          refsCommitTagFinal.find((t) => t.name == tagFinal.name) &&
          refsCommitTagFinal.find((t) => t.name == tagFinal.name)
        ) {
          obj["Final x RC"] = "RC contém Final";
        } else {
          obj["Final x RC"] = "SEM CONEXÃO!!!";
        }
      }
    }
  } /* else {
    console.log(
      "Repositório sem master ou develop:",
      colors.yellow(r.path_with_namespace)
    );
  }*/
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
    if (REGEXP_FINAL.test(tags[i].name)) {
      return {i, name: tags[i].name, commitId: tags[i].commit.id};
    }
  }
}

function getUltimaTagRC(tags) {
  for (let i = 0; i < tags.length; i++) {
    if (REGEXP_RC.test(tags[i].name)) {
      return {i, name: tags[i].name, commitId: tags[i].commit.id};
    }
  }
}
