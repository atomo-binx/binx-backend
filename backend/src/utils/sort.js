module.exports = {
  ordenaPorChave(array, chave) {
    const comparador = (a, b) => {
      if (a[chave] < b[chave]) return -1;
      if (a[chave] > b[chave]) return 1;
      return 0;
    };

    return array.sort(comparador);
  },
};
