const controller = require("../controllers/playground.controller");

function load(routes) {
  routes.get("/playground/ultimocusto", controller.ultimocusto);
}

module.exports = load;
