const { upload } = require("../modules/upload");
const controller = require("../controllers/sincronizastatus.controller");
const { protectedRoute }= require("../middleware/auth");

function load(routes) {
  routes.post("/sincroniza/status", upload.single("orders"), controller.sync);
  routes.post("/sincroniza/alterarstatuspedido", controller.alterarStatusPedido);
  routes.get("/sincronizastatus/aprovacaoautomatica", protectedRoute, controller.aprovacaoAutomatica);
}

module.exports = load;
