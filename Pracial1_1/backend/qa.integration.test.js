const chai = require('chai');
const request = require('supertest');

const app = require('./server');
const db = require('./database');

const { expect } = chai;

describe('Prueba de integración backend + SQLite', function () {
  this.timeout(10000);

  let adminToken;
  let createdProductId;
  const uniqueProductName = `Producto QA Integracion ${Date.now()}`;

  after((done) => {
    if (!createdProductId) {
      return done();
    }

    db.run('DELETE FROM products WHERE id = ?', [createdProductId], (err) => {
      done(err);
    });
  });

  it('debe autenticar admin, crear producto y persistirlo en la base de datos', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(loginRes.status).to.equal(200);
    expect(loginRes.body).to.have.property('token');
    adminToken = loginRes.body.token;

    const payload = {
      name: uniqueProductName,
      description: 'Producto creado desde prueba de integración',
      price: 19.99,
      stock: 11,
      image_url: 'https://example.com/qa-integracion.jpg'
    };

    const createRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(createRes.status).to.equal(201);
    expect(createRes.body).to.include({ name: payload.name, stock: payload.stock });
    expect(createRes.body).to.have.property('id');
    createdProductId = createRes.body.id;

    const getRes = await request(app).get(`/api/products/${createdProductId}`);
    expect(getRes.status).to.equal(200);
    expect(getRes.body).to.include({ id: createdProductId, name: payload.name, stock: payload.stock });

    const row = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, stock FROM products WHERE id = ?', [createdProductId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    expect(row).to.deep.equal({ id: createdProductId, name: payload.name, stock: payload.stock });
  });
});
