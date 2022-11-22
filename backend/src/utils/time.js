module.exports = {
  elapsedTime(start) {
    return new Date(new Date() - start).toISOString().slice(11, -1);
  },

  monthDiff(dateFrom, dateTo) {
    const diff =
      dateTo.getMonth() - dateFrom.getMonth() + 12 * (dateTo.getFullYear() - dateFrom.getFullYear());

    return diff || 1;
  },
};
