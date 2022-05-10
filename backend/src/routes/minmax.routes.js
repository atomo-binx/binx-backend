const controller = require("../controllers/minmax.controller");

function load(routes) {
  routes.get("/minmax", controller.minmax);
  routes.get("/exportarminmax", controller.exportarMinMax);
  routes.post("/exportarbinxbling", controller.exportarBinxBling);
}

module.exports = load;
