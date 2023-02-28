function routine(obj) {
  return new Promise(() => {
    function emulateError() {
      obj.notExistent();

      throw new Error("validation-error");
    }

    emulateError();
  });
}

routine().then(console.log).catch(handleError);

function handleError(error) {
  if (error.message === "validation-error") {
    console.log("Error capturado");
    console.log(error.stack);
  }

  if (error.message === "incorrect-parameter") {
    console.log("Blá blá blá");
    console.log(error.stac);
  }

  console.log("Erro desconhecido:", error.message);
  console.log(error.stack);
}
