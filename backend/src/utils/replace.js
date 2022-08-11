function replaceAll(str, find, replace) {
  if (str !== null && str !== undefined) {
    return str.replace(new RegExp(find, "g"), replace);
  } else return "";
}

function manterApenasNumeros(str) {
  if (str !== null && str !== undefined) {
    return replaceAll(str, /[^0-9]+/, "");
  } else return "";
}

module.exports = {
  replaceAll,
  manterApenasNumeros,
};
