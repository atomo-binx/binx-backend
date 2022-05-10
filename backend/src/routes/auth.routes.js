const controller = require("../controllers/auth.controller");

function load(routes) {
  routes.post("/auth/login", controller.login);
}

module.exports = load;
