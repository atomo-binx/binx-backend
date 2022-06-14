// Express.js Custom Error Handler
module.exports = (err, req, res, next) => {
  console.log(err);

  let file = "";

  if (err.stack.includes("/")) {
    // Unix Based Systemas
    file = err.stack.split("\n")[1].split("/").pop().replace(")", "");
  } else {
    // Windows Based Systems
    file = err.stack.split("\n")[1].split("\\").pop().replace(")", "");
  }

  if (file.includes("node_modules")) file = "Dependency File";

  console.log(file, "-", err.name, "-", err.message);

  return res.status(500).json({
    code: "InternalServerError",
    message: `${err.name}: ${err.message}`,
    file: file,
  });
};
