const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function runAutomation() {
  let driver;
  const results = { success: false, message: '', details: [] };

  try {
    const options = new chrome.Options();
    // options.addArguments('--headless'); // Removido para abrir navegador visible
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    results.details.push('Navegador Chrome iniciado.');

    // Navegar a la página de login
    await driver.get("http://localhost:5174/login");
    results.details.push('Navegado a la página de login.');

    // Esperar a que cargue el formulario
    await driver.wait(until.elementLocated(By.css('input[placeholder="Ej. admin"]')), 10000);
    results.details.push('Formulario de login cargado.');

    // Ingresar usuario
    const usernameInput = await driver.findElement(By.css('input[placeholder="Ej. admin"]'));
    await usernameInput.sendKeys("admin");
    results.details.push('Usuario ingresado: admin');

    // Ingresar contraseña
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    await passwordInput.sendKeys("admin123");
    results.details.push('Contraseña ingresada.');

    // Hacer clic en el botón de login
    const loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();
    results.details.push('Botón de login clickeado.');

    // Esperar a que carguen los productos
    await driver.wait(until.elementLocated(By.css('.products-grid')), 10000);
    results.details.push('Página de productos cargada.');

    // Hacer clic en el primer botón de compra
    const buyButtons = await driver.findElements(By.xpath("//button[contains(., 'Comprar')]"));
    if (buyButtons.length > 0) {
      await buyButtons[0].click();
      results.details.push('Producto comprado.');
    } else {
      throw new Error('No se encontraron botones de compra.');
    }

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
    results.details.push(`Mensaje de confirmación: ${messageText}`);
    results.success = true;
    results.message = 'Automatización completada exitosamente.';

  } catch (error) {
    results.success = false;
    results.message = `Error en la automatización: ${error.message}`;
    results.details.push(`Error: ${error.message}`);
  } finally {
    if (driver) {
      await driver.quit();
      results.details.push('Navegador cerrado.');
    }
  }

  return results;
}

module.exports = { runAutomation };