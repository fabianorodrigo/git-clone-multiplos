module.exports = function getUltimaSegunda(dt, obs) {
  if (dt.getDay() == 1) return dt;
  const deltaDiaSemana = dt.getDay() * -1 + 1; //delta é pra pegar sempre a segunda
  //var d = 1 + (w - 1) * 7 + deltaDiaSemana; // 1st of January + 7 days for each week
  const segunda = new Date(dt.valueOf());
  segunda.setDate(segunda.getDate() + deltaDiaSemana);
  return segunda;
};
