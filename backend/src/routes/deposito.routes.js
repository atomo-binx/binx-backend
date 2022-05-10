const controller = require("../controllers/deposito.controller");

function load(routes) {
  routes.get("/deposito", controller.index); // Lista todos os depósitos
  routes.get("/deposito/:id", controller.read); // Lista um depósito específico
}

module.exports = load;
