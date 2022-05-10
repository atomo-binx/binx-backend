module.exports = {
  dictionary(array, chave) {
    let dic = {};
    for (const elemento of array) {
      dic[elemento[chave]] = {
        ...elemento,
      };
    }
    return dic;
  },
};
