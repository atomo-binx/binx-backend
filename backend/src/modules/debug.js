// Documentação do módulo de Stack da engine V8 do Nodejs
module.exports = {
  log(message) {
    let fileName = this.callsite()[1].getFileName();
    fileName = fileName.split("\\").pop();

    console.log(fileName, "-", message);
  },

  getFileName() {
    const fileName = this.callsite()[1].getFileName();
    return fileName.split("\\").pop();
  },

  callsite() {
    const _prepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack.slice(1);
    Error.prepareStackTrace = _prepareStackTrace;
    return stack;
  },

  fileName() {
    let err = new Error();
    err = err.prepareStackTrace;

    let file = "";

    if (err.stack.includes("/")) {
      // Unix Based Systems
      file = err.stack
        .split("\n")[2]
        .split("/")
        .pop()
        .split(":")[0]
        .replace(")", "");
    } else {
      // Windows Based Systems
      file = err.stack
        .split("\n")[2]
        .split("\\")
        .pop()
        .split(":")[0]
        .replace(")", "");
    }

    return file + "-";
  },
};
