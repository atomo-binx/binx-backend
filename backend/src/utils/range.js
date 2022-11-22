module.exports = {
  inRange(number, start, end) {
    return number >= Math.min(start, end) && number < Math.max(start, end);
  },
};
