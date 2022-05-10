const fs = require("fs");
const filename = __filename.slice(__dirname.length + 1) + " -";

class Debug {
  constructor() {}

  save(filename, text) {
    this.clearFile("./exports/" + filename);
    this.writeFile("./exports/" + filename, text);
  }

  // Cria/Limpa um arquivo e o prepara para escrita
  clearFile(filename) {
    fs.writeFile(filename, "", (error) => {
      if (error)
        return console.log(
          filename,
          "Erro ao apagar/limpar arquivo.",
          error.message
        );
    });
  }

  // Acrescenta texto ao final do arquivo
  appendFile(filename, text) {
    fs.appendFile(filename, text, function (err) {
      if (err)
        return console.log(
          filename,
          "Erro ao inserir no final do arquivo.",
          error.message
        );
    });
  }

  // Sobrescreve um arquivo
  writeFile(filename, text) {
    fs.writeFile(filename, text, (error) => {
      if (error)
        return console.log(
          filename,
          "Erro ao escrever no arquivo.",
          error.message
        );
    });
  }
}

module.exports = new Debug();
