function sincroniza() {
  return new Promise((resolve) => {
    delay()
      .then((res) => resolve(res))
      .then(() => {
        quebra()
          .then((res) => {
            console.log("Isso não deve aparecer nunca:", res);
          })
          .catch((error) => console.log("Erro capturado:", error.message));
      });
  });
}

function delay() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Esperamos");
    }, 2000);
  });
}

function quebra() {
  return new Promise((resolve, reject) => {
    console.log("Atenção, vamos gerar um erro");

    (async () => {
      a++;
      resolve("Eu nunca deveria ter sido resolvido ...");
    })().catch((error) => reject(error));
  });
}

sincroniza().then((res) => console.log(res));
