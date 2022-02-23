const fs = require("fs");
const path = require("path");
const readlineSync = require("readline-sync");
const axios = require("axios");
const shell = require("shelljs");
const colors = require("colors");

const reportBranchsTags = require("./reportBranchesTags");
const reportCommits = require("./reportCommits");

Date.prototype.getWeek = function () {
  // We have to compare against the first monday of the year not the 01/01
  // 60*60*24*1000 = 86400000
  // 'onejan_next_monday_time' reffers to the miliseconds of the next monday after 01/01

  var day_miliseconds = 86400000,
    onejan = new Date(this.getFullYear(), 0, 1, 0, 0, 0),
    onejan_day = onejan.getDay() == 0 ? 7 : onejan.getDay(),
    days_for_next_monday = 8 - onejan_day,
    onejan_next_monday_time =
      onejan.getTime() + days_for_next_monday * day_miliseconds,
    // If one jan is not a monday, get the first monday of the year
    first_monday_year_time =
      onejan_day > 1 ? onejan_next_monday_time : onejan.getTime(),
    this_date = new Date(
      this.getFullYear(),
      this.getMonth(),
      this.getDate(),
      0,
      0,
      0
    ), // This at 00:00:00
    this_time = this_date.getTime(),
    days_from_first_monday = Math.round(
      (this_time - first_monday_year_time) / day_miliseconds
    );

  var first_monday_year = new Date(first_monday_year_time);

  // We add 1 to "days_from_first_monday" because if "days_from_first_monday" is *7,
  // then 7/7 = 1, and as we are 7 days from first monday,
  // we should be in week number 2 instead of week number 1 (7/7=1)
  // We consider week number as 52 when "days_from_first_monday" is lower than 0,
  // that means the actual week started before the first monday so that means we are on the firsts
  // days of the year (ex: we are on Friday 01/01, then "days_from_first_monday"=-3,
  // so friday 01/01 is part of week number 52 from past year)
  // "days_from_first_monday<=364" because (364+1)/7 == 52, if we are on day 365, then (365+1)/7 >= 52 (Math.ceil(366/7)=53) and thats wrong

  return days_from_first_monday >= 0 && days_from_first_monday < 364
    ? Math.ceil((days_from_first_monday + 1) / 7)
    : 52;
};

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
  let pageNumber = 1;
  if (!fs.existsSync("workdir")) {
    fs.mkdirSync("workdir");
  }
  console.clear();
  const filtroGrupo = readlineSync.question(`Filtrar projetos com path: `);
  const protocol = "https://";
  const domain = `${gitlabUrl}/api/v4/projects?search_namespaces=true&search=${filtroGrupo}&access_token=${token}&per_page=100&page=`; //máximo do per_page é 100

  let opcao = null;
  while (opcao != "0") {
    console.clear();
    console.log("Escopo: Repositórios sob o path ", filtroGrupo);
    console.log("\n\n");
    console.log(colors.yellow("1. Clonar repositórios múltiplos"));
    console.log(colors.yellow("2. Relatório branches e tags"));
    console.log(colors.yellow("3. Relatório commits"));
    console.log("");
    console.log(colors.yellow("0. Sair"));

    opcao = readlineSync.question(`Escolha uma opção: `);

    switch (opcao.trim()) {
      case "1":
        await buscaClonaRepositorios(protocol, username, token, domain, 1);
        break;
      case "2": {
        await reportBranchsTags(gitlabUrl, token, filtroGrupo);
        break;
      }
      case "3":
        await reportCommits(gitlabUrl, token, filtroGrupo);
        break;
      default:
        process.exit();
    }
    console.log("\n\n");
    readlineSync.question(`Pressione ENTER para continuar`);
  }
})();

async function buscaClonaRepositorios(
  protocol,
  username,
  token,
  domain,
  numeroPagina
) {
  let url = protocol.concat(domain, numeroPagina);
  console.log("\n\n\n");
  console.log("URL busca repositórios:", url);
  const response = await axios.get(url);
  const obj = response.data; ///JSON.parse(response.data);
  console.log("Repositórios encontrados:", obj.length);
  shell.cd("./workdir");
  obj.forEach(async (prj, i) => {
    console.log(i, prj.path_with_namespace.replace(/\//g, "_"));
    try {
      shell.exec(
        `git clone ${protocol}${username}:${token}@${prj.http_url_to_repo.substr(
          8
        )} ${prj.path_with_namespace.replace(/\//g, "_")}`
      );
    } catch (e) {
      console.error(`Falha ao clonar`, e);
    }
  });
  if (obj.length == 100) {
    buscaClonaRepositorios(protocol, username, token, domain, numeroPagina + 1);
  }
}
