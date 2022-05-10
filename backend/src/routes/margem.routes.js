const controller = require("../controllers/margem.controller");

function load(routes) {
  routes.post("/margemproposta/:proposta", controller.margemProposta);
}

module.exports = load;
