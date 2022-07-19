const fs = require("fs");
const s3 = require("../aws/s3");

const randomUseragent = require("random-useragent");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const filename = __filename.slice(__dirname.length + 1) + " -";

// Constantes para serem utilziadas nos options dentro dos selects
const options = {
  dlog: "65776",
  correios: "63272",
  PAC: "8899727307",
  sedex: "8899727306",
};

module.exports = {
  async removePopUp(page) {
    page.setDefaultTimeout(15000);

    try {
      await page.waitForXPath(
        `//span[@class='menu-username hidden-xs hidden-sm']`,
        {
          visible: true,
        }
      );

      const popUpButton = await page.$x(
        "//button[contains(text(), 'Não mostrar novamente')]"
      );

      await popUpButton[0].click();

      console.log(filename, "Botão de remover Pop Up acionado.");
    } catch (error) {
      console.log(filename, `O popup já foi removido ou não foi encontrado`);
    }
    page.setDefaultTimeout(100000);
  },

  async alterarTransportadora(pedido, metodo) {
    // Cria uma nova instância do navegador
    try {
      // Tenta iniciar uma nova instância do navegador
      const browser = await puppeteer.launch({
        headless: false,
        args: [`--window-size=1024,720`, "--no-sandbox", "--no-zygote"],
        defaultViewport: {
          width: 1024 + Math.floor(Math.random() * 100),
          height: 720 + Math.floor(Math.random() * 100),
        },
      });

      // A instância foi iniciada com sucesso, prosseguir
      try {
        // Tempo de inicio da operação
        let tempoInicio = new Date();

        // Novo objeto de manipulação de página
        const page = await browser.newPage();

        // Randomização
        const userAgent = randomUseragent.getRandom();

        const customUserAgent =
          // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36";
          "Chrome/97.0.4692.71 (Windows NT 10.0; Win64; x64)";

        await page.setUserAgent(customUserAgent);

        // Pula verificações

        //Skip images/styles/fonts loading for performance
        // await page.setRequestInterception(true);
        // page.on("request", (req) => {
        //   if (
        //     req.resourceType() == "stylesheet" ||
        //     req.resourceType() == "font" ||
        //     req.resourceType() == "image"
        //   ) {
        //     req.abort();
        //   } else {
        //     req.continue();
        //   }
        // });

        await page.evaluateOnNewDocument(() => {
          // Pass webdriver check
          Object.defineProperty(navigator, "webdriver", {
            get: () => false,
          });
        });

        await page.evaluateOnNewDocument(() => {
          // Pass chrome check
          window.chrome = {
            runtime: {},
            // etc.
          };
        });

        await page.evaluateOnNewDocument(() => {
          //Pass notifications check
          const originalQuery = window.navigator.permissions.query;
          return (window.navigator.permissions.query = (parameters) =>
            parameters.name === "notifications"
              ? Promise.resolve({ state: Notification.permission })
              : originalQuery(parameters));
        });

        await page.evaluateOnNewDocument(() => {
          // Overwrite the `plugins` property to use a custom getter.
          Object.defineProperty(navigator, "plugins", {
            // This just needs to have `length > 0` for the current test,
            // but we could mock the plugins too if necessary.
            get: () => [1, 2, 3, 4, 5],
          });
        });

        await page.evaluateOnNewDocument(() => {
          // Overwrite the `languages` property to use a custom getter.
          Object.defineProperty(navigator, "languages", {
            get: () => ["en-US", "en"],
          });
        });

        // Altera o timeout padrão da página
        page.setDefaultTimeout(100000);

        // Realiza Login
        console.log(
          filename,
          `Pedido de Venda: ${pedido} -`,
          "Realizando Login"
        );
        await page.goto("https://www.bling.com.br/login");

        let port = process.env.PORT;
        if (port) {
          //Rodando na AWS
          // Debug
          const screenshot = await page.screenshot({
            path: "exports/puppeteer/screenshot.png",
          });
          const file = "exports/puppeteer/screenshot.png";
          const fileStream = fs.createReadStream(file);
          await s3.enviarObjeto(fileStream);
        }

        await page.waitForSelector("#username", { visible: true });
        await page.waitForSelector("#senha", { visible: true });

        await page.type("#username", process.env.BLING_USER);
        await page.type("#senha", process.env.BLING_PASSWORD);
        await page.click("button[name=enviar]");

        // Aguarda a homepage após login estar navegável

        // Versão antiga:
        // await page.waitForNavigation();

        // Nova versão:
        // Para isso, aguardamos aparecer na tela o indicador do nome do usuario
        await page.waitForXPath(
          `//span[@class='menu-username hidden-xs hidden-sm']`,
          {
            visible: true,
          }
        );

        // Navegar para tela de pedidos
        console.log(
          filename,
          `Pedido de Venda: ${pedido} -`,
          "Navegando para tela de pedidos"
        );
        await page.goto("https://www.bling.com.br/vendas.php#list");
        await page.waitForSelector("#pesquisa-mini", { visible: true });

        // No dia 28/06/2022 o Bling alterou a tela de pedidos e passou a exibir um popup
        // É necessário clicar no botão de "Não mostrar novamente" para não exibi-lo definitivamente
        await this.removePopUp(page);
        //button[contains(text(), 'Não mostrar novamente')]

        // Buscar pelo pedido
        console.log(
          filename,
          `Pedido de Venda: ${pedido} -`,
          "Iniciando busca pelo pedido"
        );
        await page.type("#pesquisa-mini", pedido);
        await page.click("#btn-mini-search");

        // Limpar tag de filtro em aberto
        console.log(
          filename,
          `Pedido de Venda: ${pedido} -`,
          "Limpando filtro em aberto"
        );
        await page.waitForSelector(".clear-tag", { visible: true });
        await page.click(".clear-tag");
        await page.waitForSelector(".clear-tag", { visible: true });

        // Agora aguarda para verificar se a tabela de resultados apareceu
        await page.waitForSelector("#datatable");

        // Adquirir Url do Pedido
        console.log(
          filename,
          `Pedido de Venda: ${pedido} -`,
          "Adquirindo URL do Pedido"
        );

        //Aguarda pela visibilidade de um checkbox seguido do número do pedido que queremos alterar
        await page.waitForXPath(
          `//span[contains(text(), '${pedido}')]/ancestor::tr//td[@class='checkbox-item']//div[@class='input-checkbox']//input`,
          { visible: true }
        );

        // Adquire o elemento correspondente ao checkbox seguido do número do pedido que queremos alterar
        const idElementHandler = await page.$x(
          `//span[contains(text(), '${pedido}')]/ancestor::tr//td[@class='checkbox-item']//div[@class='input-checkbox']//input`
        );

        const idValue = await page.evaluate(
          (x) => x.value,
          idElementHandler[0]
        );
        console.log(
          filename,
          `Pedido de Venda: ${pedido} -`,
          "ID para a URL: " + idValue
        );
        const targetUrl = `https://www.bling.com.br/vendas.php#edit/${idValue}`;

        // Navegando para a página do pedido
        await page.goto(targetUrl);

        // Aguarda a página de pedido ter sido realmente carregada

        // Aguarda aparecer um Option, dentro de um select que contenha o campo "Matriz"
        await page.waitForXPath(
          "//select[@id='idConfUnidadeNegocio']//option[contains(text(), 'Matriz')]"
        );

        // // Verifica se foi aberto o pedido correto
        await page.waitForXPath("//input[@name='numeroPedido']", {
          visible: true,
        });

        const numeroPedidoElement = await page.$("#numeroPedido");

        const numeroPedido = await page.evaluate(
          (x) => x.value,
          numeroPedidoElement
        );
        console.log(
          filename,
          `Pedido de Venda: ${pedido} -`,
          `Página do pedido de venda aberto:`,
          numeroPedido
        );

        await this.removePopUp(page);

        if (numeroPedido != pedido) {
          console.log(
            filename,
            `Pedido de Venda: ${pedido} -`,
            "Erro: o pedido aberto não é o mesmo que deve ser alterado."
          );

          return false;
        }

        // Aguarda pelo select de integração logística estar visível e populado de opções
        await page.waitForSelector("#integracaoLogistica", { visible: true });
        await page.waitForXPath(
          "//select[@id='integracaoLogistica']//option[@value='-1']"
        );
        await page.mainFrame().hover("#integracaoLogistica");
        // await this.delay(500);

        switch (metodo) {
          case "dlog": {
            // Caso 1 - DLOG
            console.log(
              filename,
              `Pedido de Venda: ${pedido} -`,
              "Alterando para: DLOG"
            );
            await page.select("select#integracaoLogistica", options.dlog);
            await this.delay(500);
            break;
          }

          case "pac": {
            // Caso 2 - Correios PAC
            console.log(
              filename,
              `Pedido de Venda: ${pedido} -`,
              "Alterando para: Correios PAC"
            );
            await page.select("select#integracaoLogistica", options.correios);
            await this.delay(500);

            // Aguarda e posiciona no novo select que será renderizado
            await page.waitForXPath(
              "//select[@name='servicosLogistica[]']//option[@value='-1']"
            );
            const selectHoverPac = await page.waitForXPath(
              "//select[@name='servicosLogistica[]']"
            );
            await selectHoverPac.hover();

            // Seleciona o serviço
            await page.select(
              "select[name='servicosLogistica[]']",
              options.PAC
            );
            await this.delay(500);
            break;
          }

          case "sedex": {
            // Caso 2 - Correios sedex
            console.log(
              filename,
              `Pedido de Venda: ${pedido} -`,
              "Alterando para: Correios sedex"
            );
            await page.select("select#integracaoLogistica", options.correios);
            await this.delay(500);

            // Aguarda e posiciona no novo select que será renderizado
            await page.waitForXPath(
              "//select[@name='servicosLogistica[]']//option[@value='-1']"
            );
            const selectHoversedex = await page.waitForXPath(
              "//select[@name='servicosLogistica[]']"
            );
            await selectHoversedex.hover();

            // Seleciona o serviço
            await page.select(
              "select[name='servicosLogistica[]']",
              options.sedex
            );
            await this.delay(500);

            break;
          }
          default:
            console.log(
              filename,
              `Pedido de Venda: ${pedido} -`,
              "Erro ao alterar integração logística: não foi recebido um tipo válido de integração."
            );
            return false;
        }

        // await page.screenshot({ path: "./example.png" });

        // Salvar pedido e fechar o browser
        await page.click("#botaoSalvar");

        // Aguarda voltar para a tela de busca novamente antes de fechar o browser
        await page.waitForSelector("#pesquisa-mini", { visible: true });

        // Fecha a página aberta
        await page.close();

        // Debug de tempo gasto na execução da alterçaão
        let tempoFinal = new Date();
        let tempoGasto = new Date(tempoFinal - tempoInicio)
          .toISOString()
          .slice(11, -1);
        console.log(
          filename,
          `Pedido de Venda: ${pedido} -`,
          "Tempo gasto na alteração de transporadora: ",
          tempoGasto
        );

        return true;
      } catch (error) {
        console.log(
          filename,
          `Pedido de Venda: ${pedido} -`,
          "Erro durante procedimento de alteração de transportadora no bling:",
          error.message
        );

        return false;
      } finally {
        console.log(
          filename,
          `Pedido de Venda: ${pedido} -`,
          "Procedimento finalizado no Puppeteer, fechando navegador"
        );
        // Procedimento finalizado com sucesso, fechar o navegador
        await browser.close();

        // Inicia verificação para checar se o processo do browser foi finalizado corretamente
        // if (browser && browser.process() != null) browser.process().kill("SIGINT");
        if (browser && browser.process() != null)
          browser.process().kill("SIGKILL");
      }
    } catch (error) {
      // O serviço não conseguiu iniciar uma nova instância do navegador
      console.log(
        filename,
        `Pedido de Venda: ${pedido} -`,
        "Erro ao iniciar instância do navegador pelo puppeteer:",
        error.message
      );
      return false;
    }
  },

  // async alterarTransportadoraMulti(pedidos) {
  //   // Realizar Login apenas uma vez
  //   // Percorrer cada um dos pedidos e alterar a transportadora
  //   // Erros durante a alteração de um pedido não devem comprometer outros pedidos
  //   // Finalizar o browser
  //   // O Browser é finalizado apenas ao final da execução

  //   try {
  //     const browser = await puppeteer.launch({
  //       headless: false,
  //       args: [`--window-size=1024,720`, "--no-sandbox", "--no-zygote"],
  //       defaultViewport: {
  //         width: 1024 + Math.floor(Math.random() * 100),
  //         height: 720 + Math.floor(Math.random() * 100),
  //       },
  //     });

  //     // A instância foi iniciada com sucesso, prosseguir
  //     try {
  //       // Manusear a página aqui

  //       // Tempo de inicio da operação
  //       let tempoInicio = new Date();
  //     } catch (error) {
  //       // Erro durante o manuseio de um pedido em específico
  //       console.log(
  //         filename,
  //         "Erro durante o manuseio da página:",
  //         error.message
  //       );

  //       // Se o navegador não fechou, podemos iniciar o procedimento do próximo pedido
  //       // ...
  //     } finally {
  //       console.log(
  //         filename,
  //         "Procedimento finalizado no Puppeteer, fechando navegador"
  //       );
  //       await browser.close();
  //       if (browser && browser.process() != null)
  //         browser.process().kill("SIGKILL");
  //     }
  //   } catch (error) {
  //     console.log(
  //       filename,
  //       "Erro durante a abertura do navegador:",
  //       error.message
  //     );
  //   }
  // },

  async delay(tempo) {
    return new Promise((resolve) => {
      setTimeout(resolve, tempo);
    });
  },
};
