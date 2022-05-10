module.exports = {
  async delay(tempo) {
    return new Promise(async (resolve, reject) => {
      setTimeout(resolve, tempo);
    });
  },
};
