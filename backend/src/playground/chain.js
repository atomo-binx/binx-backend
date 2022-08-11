async function func1() {
  await tempo();
  // return "ok";
  throw Error("Opa, falhamos");
}

async function tempo() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Olá");
    }, 2000);
  });
}

func1()
  .then((res) => {
    console.log(res);
  })
  .catch((error) => {
    console.log(error.message);
  });
