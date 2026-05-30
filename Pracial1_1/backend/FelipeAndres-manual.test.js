const fetch = require('node-fetch'); // necesitas instalar node-fetch si no lo tienes: npm i node-fetch@2

async function testDeleteProduct() {
console.log('=== INICIO PRUEBA MANUAL - ELIMINAR PRODUCTO ===');

  const productId = 1;                        // ¡Cambia por un ID real que exista!
  const token = 'TU_TOKEN_DE_ADMIN_AQUÍ';     // Obténlo logueándote como admin

    try {
    const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
    method: 'DELETE',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
    });

    const data = await response.json();

    console.log('Status recibido:', response.status);

    if (response.status === 200) {
      console.log('ÉXITO ✅ Producto eliminado correctamente');
      console.log('Respuesta:', data);
    } else if (response.status === 403) {
      console.log('FALLO ❌ No eres administrador');
    } else if (response.status === 401) {
      console.log('FALLO ❌ Token inválido o no enviado');
    } else if (response.status === 500) {
      console.log('FALLO ❌ Error en el servidor:', data.error);
    } else {
      console.log('FALLO ❌ Estado inesperado:', response.status, data);
    }
  } catch (err) {
    console.error('ERROR EN LA PRUEBA:', err.message);
  }

  console.log('=== FIN PRUEBA MANUAL ===');
}

testDeleteProduct();