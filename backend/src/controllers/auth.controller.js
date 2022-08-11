const LoginBusiness = require("../business/auth/login.business");

const validation = require("../modules/validation");

const EmailValidator = require("../validators/usuario/email.rules");
const PasswordValidator = require("../validators/usuario/password.rules");

module.exports = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const rules = [
        [email, EmailValidator, { required: true }],
        [password, PasswordValidator, { required: true }],
      ];

      const validationResult = validation.run(rules);

      if (validationResult["status"] === "error") {
        return res.status(400).json(validationResult);
      }

      const response = await LoginBusiness.login(email, password);

      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      next(error);
    }
  },
};
