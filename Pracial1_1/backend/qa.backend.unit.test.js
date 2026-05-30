const chai = require('chai');
const jwt = require('jsonwebtoken');

const app = require('./server');

const { expect } = chai;
const { authenticate, isAdmin, SECRET_KEY } = app;

function createMockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe('Pruebas unitarias backend - middlewares de autorización', () => {
  it('authenticate debe adjuntar req.user y llamar next() con un token válido', () => {
    const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
    const req = {
      header: (name) => (name === 'Authorization' ? `Bearer ${token}` : undefined)
    };
    const res = createMockRes();
    let nextCalled = false;

    authenticate(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).to.equal(true);
    expect(req.user).to.include({ id: 1, username: 'admin', role: 'admin' });
    expect(res.statusCode).to.equal(null);
  });

  it('isAdmin debe responder 403 cuando el rol no es admin', () => {
    const req = { user: { role: 'client' } };
    const res = createMockRes();
    let nextCalled = false;

    isAdmin(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).to.equal(false);
    expect(res.statusCode).to.equal(403);
    expect(res.body).to.deep.equal({ message: 'Requiere permisos de administrador' });
  });
});
