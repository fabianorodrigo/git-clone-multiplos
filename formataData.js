module.exports = function formataData(dt) {
  return dt
    .getFullYear()
    .toString()
    .concat(
      "-",
      String(dt.getMonth() + 1).padStart(2, "0"),
      "-",
      String(dt.getDate()).padStart(2, "0") /*,
      " [",
      dt.getDay(),
      "]"*/
    );
};
