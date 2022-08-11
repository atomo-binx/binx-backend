function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, "g"), replace);
}

function manterApenasNumeros(str) {
  if (str !== null && str !== undefined && str.length > 0) {
    return replaceAll(str, /[^0-9]+/, "");
  } else return "";
}

module.exports = {
  replaceAll,
  manterApenasNumeros,
};
