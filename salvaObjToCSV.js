const fs = require("fs");
const path = require("path");

module.exports = function salvaObjToCSV(
  obj,
  nomeArquivo,
  ordenaColunas = false
) {
  let conteudo = "";

  let colunas = [];
  //percorre todos as propriedades (repositorios) para identificar todas as colunas
  for (const repo of Object.keys(obj)) {
    const cols = ordenaColunas
      ? Object.keys(obj[repo]).sort()
      : Object.keys(obj[repo]);
    for (const coluna of cols) {
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
