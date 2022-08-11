async function tempo() {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("oi");
      resolve();
    }, 2000);
  });
}

async function tempo2() {
  setTimeout(() => {
    console.log("Olá");
    return Promise.resolve("ok");
  }, 2000);
}
async function rotina() {
  console.log("Primeira mensagem");

  // await tempo();

  await tempo2().then((res) => console.log(res));

  console.log("Segunda mensage");
}

rotina();
