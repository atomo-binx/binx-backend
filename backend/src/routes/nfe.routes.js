const controller = require("../controllers/nfe.controller");

function load(routes) {
  routes.post("/nfe/callback", controller.callback);
}

module.exports = load;
