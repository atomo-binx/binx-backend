module.exports = {
  elapsedTime(start) {
    return new Date(new Date() - start).toISOString().slice(11, -1);
  },
};
