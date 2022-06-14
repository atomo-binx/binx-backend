const controller = require("../controllers/usuario.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.post("/usuario", protectedRoute, controller.cadastrarUsuario); 
  routes.get("/usuario/:id", protectedRoute, controller.lerUsuario); 
  routes.put("/usuario", protectedRoute, controller.atualizarUsuario);
  routes.get("/usuario", protectedRoute, controller.listarUsuarios);
  routes.post("/usuario/sincronizar", protectedRoute, controller.sincronizarUsuarios); 
}

module.exports = load;
