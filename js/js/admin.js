/**
 * js/admin.js
 * Panel de Administración CRUD y Autenticación para Marcomercios
 */

// Credenciales para la simulación de Login (Estructura desacoplada)
const ADMIN_CREDENTIALS = {
  user: "admin",
  password: "123"
};

// Referencias del DOM
const loginSection = document.getElementById('login-section');
const crudSection = document.getElementById('crud-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const pSkuInput = document.getElementById('p-sku');
const pNameInput = document.getElementById('p-name');
const pCategoryInput = document.getElementById('p-category');
const pPriceInput = document.getElementById('p-price');
const pImageInput = document.getElementById('p-image');
const pStatusInput = document.getElementById('p-status');
const formSubmitBtn = document.getElementById('form-submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const adminTableBody = document.getElementById('admin-table-body');

let productsList = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAuthSession();
  setupAdminListeners();
});

// Control de Sesión
function checkAuthSession() {
  const isAuth = sessionStorage.getItem('marcomercios_admin_auth');
  if (isAuth === 'true') {
    loginSection.style.display = 'none';
    crudSection.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    loadAdminProducts();
  } else {
    loginSection.style.display = 'block';
    crudSection.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
}

// Escuchadores de eventos para el Panel de Admin
function setupAdminListeners() {
  // Login
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = document.getElementById('admin-user').value.trim();
      const p = document.getElementById('admin-password').value.trim();

      if (u === ADMIN_CREDENTIALS.user && p === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('marcomercios_admin_auth', 'true');
        loginError.textContent = '';
        checkAuthSession();
      } else {
        loginError.textContent = 'Credenciales incorrectas. Inténtalo de nuevo.';
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('marcomercios_admin_auth');
      checkAuthSession();
    });
  }

  // Guardar/Actualizar Producto
  if (productForm) {
    productForm.addEventListener('submit', handleFormSubmit);
  }

  // Cancelar Edición
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', resetForm);
  }
}

// Cargar lista de productos desde LocalStorage
function loadAdminProducts() {
  const stored = localStorage.getItem('marcomercios_products');
  productsList = stored ? JSON.parse(stored) : [];
  renderAdminTable();
}

// Renderizar la Tabla del CRUD
function renderAdminTable() {
  if (!adminTableBody) return;
  adminTableBody.innerHTML = '';

  productsList.forEach((product) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${product.sku}</strong></td>
      <td><img src="${product.image}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>$${Number(product.price).toFixed(2)} MXN</td>
      <td><span class="stock-badge ${product.status === 'Disponible' ? 'disponible' : 'agotado'}">${product.status}</span></td>
      <td>
        <button class="btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="editProduct('${product.sku}')">Editar</button>
        <button class="btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="deleteProduct('${product.sku}')">Eliminar</button>
      </td>
    `;
    adminTableBody.appendChild(tr);
  });
}

// Guardar (Crear / Actualizar) Producto
function handleFormSubmit(e) {
  e.preventDefault();

  const id = productIdInput.value;
  const newProduct = {
    id: id || pSkuInput.value.trim(),
    sku: pSkuInput.value.trim(),
    name: pNameInput.value.trim(),
    category: pCategoryInput.value,
    price: parseFloat(pPriceInput.value),
    image: pImageInput.value.trim(),
    status: pStatusInput.value
  };

  if (id) {
    // Modo Edición
    const index = productsList.findIndex(p => p.id === id);
    if (index !== -1) {
      productsList[index] = newProduct;
    }
  } else {
    // Modo Creación (Validar SKU único)
    if (productsList.some(p => p.sku === newProduct.sku)) {
      alert('Error: Ya existe un producto registrado con ese SKU.');
      return;
    }
    productsList.push(newProduct);
  }

  saveProductsToStorage();
  resetForm();
  renderAdminTable();
}

// Cargar Producto en el Formulario para Editar
window.editProduct = function(sku) {
  const product = productsList.find(p => p.sku === sku);
  if (!product) return;

  productIdInput.value = product.id;
  pSkuInput.value = product.sku;
  pSkuInput.disabled = true; // El SKU actúa como identificador único
  pNameInput.value = product.name;
  pCategoryInput.value = product.category;
  pPriceInput.value = product.price;
  pImageInput.value = product.image;
  pStatusInput.value = product.status;

  formSubmitBtn.textContent = 'Actualizar Producto';
  cancelEditBtn.style.display = 'inline-block';
};

// Eliminar Producto
window.deleteProduct = function(sku) {
  if (confirm(`¿Estás seguro de que deseas eliminar el producto con SKU: ${sku}?`)) {
    productsList = productsList.filter(p => p.sku !== sku);
    saveProductsToStorage();
    renderAdminTable();
  }
};

// Resetear Formulario
function resetForm() {
  productForm.reset();
  productIdInput.value = '';
  pSkuInput.disabled = false;
  formSubmitBtn.textContent = 'Guardar Producto';
  cancelEditBtn.style.display = 'none';
}

// Persistir en LocalStorage
function saveProductsToStorage() {
  localStorage.setItem('marcomercios_products', JSON.stringify(productsList));
}