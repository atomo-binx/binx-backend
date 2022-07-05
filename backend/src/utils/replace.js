function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, "g"), replace);
}

function manterApenasNumeros(str) {
  return replaceAll(str, /[^0-9]+/, "");
}

module.exports = {
  replaceAll,
  manterApenasNumeros,
};
