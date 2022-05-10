const controller = require("../controllers/email.controller");

function load(routes) {
  routes.get("/email/debug", controller.emailDebug);
}

module.exports = load;
