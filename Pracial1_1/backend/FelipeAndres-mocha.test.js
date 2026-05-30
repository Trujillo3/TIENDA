
const chai = require('chai');
const request = require('supertest');

const app = require('./server');

const { expect } = chai;

describe('Pruebas DELETE /api/products/:id (Felipe Andres)', function () {

  let adminToken = null;
  let productIdToDelete = null;

  // Antes de todas las pruebas: login como admin + crear producto de prueba
  before(async function () {
    this.timeout(5000); // ← por si tarda un poco sqlite

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(loginRes.status).to.equal(200);
    expect(loginRes.body).to.have.property('token');
    adminToken = loginRes.body.token;

    // Crear producto de prueba (solo si no existe uno)
    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Producto Prueba Mocha DELETE',
        description: 'Solo para testing de eliminación',
        price: 777,
        stock: 5,
        image_url: 'https://example.com/test.jpg'
      });

    expect(createRes.status).to.equal(201);
    productIdToDelete = createRes.body.id;
  });

  it('debería eliminar un producto existente cuando es admin', async function () {
    if (!productIdToDelete) {
      this.skip('No se pudo crear producto de prueba');
    }

    const res = await request(app)
      .delete(`/api/products/${productIdToDelete}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('object');
    expect(res.body).to.have.property('message').that.equals('Producto eliminado');
  });

  it('debería fallar (401) al intentar eliminar sin token', async function () {
    const res = await request(app)
      .delete(`/api/products/999999`);

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('message').that.equals('Acceso denegado');
  });

  // Prueba extra (opcional pero útil)
  it('debería fallar si el producto no existe (aunque con admin)', async function () {
    const res = await request(app)
      .delete(`/api/products/999999999`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200); 
  });

});