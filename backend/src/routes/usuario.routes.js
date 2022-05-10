const controller = require("../controllers/usuario.controller");
const { protectedRoute } = require("../middleware/auth");

function load(routes) {
  routes.post("/usuario", controller.cadastrarUsuario); // Criação de novo usuário
  routes.get("/usuario/:id", controller.lerUsuario); // Leitura de um usuário específico
  routes.put("/usuario", controller.atualizarUsuario);
  routes.get("/usuario", controller.listarUsuarios); // Lista todos os usuários
}

module.exports = load;
