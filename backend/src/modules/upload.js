const path = require("path");
const multer = require("multer");

// Helper de Storage para configuração do Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../.."));
  },
  filename: function (req, file, cb) {
    cb(null, "orders.csv");
  },
});

const upload = multer({ storage: storage });

module.exports = { upload };
