const fs = require("fs");
const path = require("path");

module.exports = function salvaObjToCSV(obj, nomeArquivo) {
  let conteudo = "";

  let colunas = [];
  //percorre todos as propriedades (repositorios) para identificar todas as colunas
  for (const repo of Object.keys(obj)) {
    for (const coluna of Object.keys(obj[repo])) {
      if (!colunas.includes(coluna)) {
        colunas.push(coluna);
      }
    }
  }
  ////montando o conteúdo
  //cabeçalho
  conteudo += "repositorio";
  for (const coluna of colunas) {
    conteudo += ";".concat(coluna);
  }
  conteudo += "\n";

  for (const repo of Object.keys(obj)) {
    conteudo += repo;
    for (const coluna of colunas) {
      conteudo += ";";
      if (obj[repo][coluna] != null) {
        conteudo += obj[repo][coluna];
      }
    }
    conteudo += "\n";
  }
  const filePath = path.join(
    path.dirname(require.main.filename),
    "workdir",
    nomeArquivo
  );
  fs.writeFileSync(filePath, conteudo);
  console.log(`Arquivo salvo com sucesso: ${filePath}`);
};
