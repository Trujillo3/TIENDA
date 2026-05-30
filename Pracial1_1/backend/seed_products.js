const http = require('http');

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Productos de prueba
const products = [
  {
    name: 'Hamburguesa Clásica',
    description: 'Hamburguesa de carne con queso, lechuga y tomate.',
    price: 8.99,
    stock: 20,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop'
  },
  {
    name: 'Pizza Margarita',
    description: 'Pizza artesanal con salsa de tomate, mozzarella y albahaca.',
    price: 12.5,
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=200&fit=crop'
  }
];

async function seedProducts() {
  try {
    // Login como admin
    console.log('Haciendo login como admin...');
    const loginRes = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginRes.status !== 200) {
      throw new Error(`Error en login: ${loginRes.data.message}`);
    }
    
    const token = loginRes.data.token;
    console.log('✓ Login exitoso');

    // Limpiar productos existentes
    console.log('\nLimpiando productos existentes...');
    const existingProducts = await makeRequest('GET', '/products');
    if (existingProducts.status === 200 && existingProducts.data.length > 0) {
      for (const product of existingProducts.data) {
        try {
          const deleteRes = await makeRequest('DELETE', `/products/${product.id}`, null, token);
          if (deleteRes.status === 200) {
            console.log(`✓ Eliminado: ${product.name}`);
          } else {
            console.log(`✗ Error eliminando ${product.name}: ${deleteRes.data.message}`);
          }
        } catch (error) {
          console.log(`✗ Error eliminando ${product.name}:`, error.message);
        }
      }
    } else {
      console.log('✓ No hay productos para limpiar');
    }

    // Crear productos
    console.log('\nCreando productos...');
    for (const product of products) {
      try {
        const res = await makeRequest('POST', '/products', product, token);
        if (res.status === 201) {
          console.log(`✓ ${product.name} creado (ID: ${res.data.id})`);
        } else {
          console.log(`✗ Error al crear ${product.name}: ${res.data.message}`);
        }
      } catch (error) {
        console.log(`✗ Error al crear ${product.name}:`, error.message);
      }
    }

    // Listar productos finales
    console.log('\nListando todos los productos...');
    const productsRes = await makeRequest('GET', '/products');
    console.log(`\n✓ Total de productos en la base de datos: ${productsRes.data.length}`);
    productsRes.data.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} - $${p.price} (Stock: ${p.stock})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedProducts();
