require("chromedriver");
const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { expect } = require("chai");

describe("Automatización de Login y Compras - E2E", function () {

  let driver;

  this.timeout(30000);

  before(async () => {
    const options = new chrome.Options();
    if (process.env.CI) {
      options.addArguments("--headless", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu");
    }

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it("Debe iniciar sesión y hacer compras", async () => {
    // Navegar a la página de login
    await driver.get("http://localhost:5173/login");

    // Esperar a que cargue el formulario
    await driver.wait(until.elementLocated(By.css('input[placeholder="Ej. admin"]')), 10000);

    // Ingresar usuario
    const usernameInput = await driver.findElement(By.css('input[placeholder="Ej. admin"]'));
    await usernameInput.sendKeys("admin");

    // Ingresar contraseña
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await passwordInput.sendKeys("admin123");

    // Hacer clic en el botón de login
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();

    // Esperar a que carguen los productos
    await driver.wait(until.elementLocated(By.css('.products-grid')), 10000);

    // Hacer clic en el primer botón de compra
    const buyButtons = await driver.findElements(By.xpath("//button[contains(., 'Comprar')]") );
    expect(buyButtons.length).to.be.above(0);
    await buyButtons[0].click();

    // Verificar mensaje de compra
    const purchaseMessage = await driver.wait(
      until.elementLocated(By.id('purchase-message')),
      10000
    );
    await driver.wait(
      until.elementTextContains(purchaseMessage, 'Comprado:'),
      5000
    );

    const messageText = await purchaseMessage.getText();
    expect(messageText).to.include('Comprado:');

    console.log("Login y compra simulada exitosamente");
  });

});