const controller = require("../controllers/usuario.controller");
const { protectedRoute } = require("../middlewares/auth");

function load(routes) {
  routes.post("/usuario", protectedRoute, controller.cadastrarUsuario); // Criação de novo usuário
  routes.get("/usuario/:id", protectedRoute, controller.lerUsuario); // Leitura de um usuário específico
  routes.put("/usuario",protectedRoute, controller.atualizarUsuario);
  routes.get("/usuario",protectedRoute, controller.listarUsuarios); // Lista todos os usuários
}

module.exports = load;
