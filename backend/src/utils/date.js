module.exports = {
  dateToFilename() {
    function replaceAll(str, find, replace) {
      return str.replace(new RegExp(find, "g"), replace);
    }

    let filename = new Date().toLocaleString();

    filename = replaceAll(filename, "/", "-");
    filename = replaceAll(filename, " ", "-");
    filename = replaceAll(filename, ":", "-");

    return filename;
  },
};
