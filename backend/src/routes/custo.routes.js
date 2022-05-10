const controller = require("../controllers/custo.controller");

function load(routes) {
  routes.get("/custo/produto/customedio", controller.custoMedio);
}

module.exports = load;
