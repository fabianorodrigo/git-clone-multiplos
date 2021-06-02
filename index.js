const fs = require("fs");
const path = require("path");
const readlineSync = require("readline-sync");
const axios = require("axios");
const shell = require("shelljs");

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

if (!fs.existsSync("workdir")) {
  fs.mkdirSync("workdir");
}

buscaClonaRepositorios(1);

function buscaClonaRepositorios(numeroPagina) {
  let url = protocol.concat(domain, numeroPagina);
  axios.get(url).then((response) => {
    const obj = response.data; ///JSON.parse(response.data);
    shell.cd("./workdir");
    obj.forEach(async (prj, i) => {
      console.log(i, prj.name_with_namespace);
      try {
        shell.exec(
          `git clone ${protocol}${username}:${token}@${prj.http_url_to_repo.substr(
            8
          )}`
        );
      } catch (e) {
        console.error(`Falha ao clonar`, e);
      }
    });
    if (obj.length == 100) {
      buscaClonaRepositorios(numeroPagina + 1);
    }
  });
}
