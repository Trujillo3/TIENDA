const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');

describe('Prueba Selenium', function () {

    this.timeout(30000);

    let driver;

    before(async () => {
        driver = await new Builder().forBrowser('chrome').build();
    });

    after(async () => {
        await driver.quit();
    });

    it('Abrirá la web de Google', async () => {

        await driver.get('https://www.google.com');

        const titulo = await driver.getTitle();

        expect(titulo).to.contain('Google');
    });

});
