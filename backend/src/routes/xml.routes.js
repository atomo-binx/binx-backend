const controller = require("../controllers/xml.controller");

function load(routes) {
  routes.get("/xml", controller.decodificaProdutos);
}

module.exports = load;
