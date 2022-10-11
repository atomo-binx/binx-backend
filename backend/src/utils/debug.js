const fs = require("fs");
const _filename = __filename.slice(__dirname.length + 1) + " -";

class Debug {
  constructor() {}

  save(filename, text) {
    this.clearFile("./exports/" + filename);
    this.writeFile("./exports/" + filename, text);
  }

  // Cria/Limpa um arquivo e o prepara para escrita
  clearFile(filename) {
    fs.writeFileSync(filename, "", (error) => {
      if (error) return console.log(_filename, "Erro ao apagar/limpar arquivo.", error.message);
    });
  }

  // Acrescenta texto ao final do arquivo
  appendFile(filename, text, breakLine = true) {
    const textToAppend = breakLine ? text + "\n" : text;

    fs.appendFileSync(filename, textToAppend, function (err) {
      if (err) return console.log(_filename, "Erro ao inserir no final do arquivo.", err.message);
    });
  }

  // Sobrescreve um arquivo
  writeFile(filename, text) {
    fs.writeFileSync(filename, text, (error) => {
      if (error) return console.log(_filename, "Erro ao escrever no arquivo.", error.message);
    });
  }
}

module.exports = new Debug();
