import { supabase } from './supabase.js';

const loginSection = document.getElementById('login-section');
const crudSection = document.getElementById('crud-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const adminError = document.getElementById('admin-error');
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

document.addEventListener('DOMContentLoaded', initializeAdmin);

async function initializeAdmin() {
  setupAdminListeners();

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    showLoginError(`No se pudo verificar la sesión: ${error.message}`);
    return;
  }

  setAdminVisibility(Boolean(data.session));
  if (data.session) {
    await loadAdminProducts();
  }
}

function setAdminVisibility(isAuthenticated) {
  loginSection.style.display = isAuthenticated ? 'none' : 'block';
  crudSection.style.display = isAuthenticated ? 'block' : 'none';
  logoutBtn.style.display = isAuthenticated ? 'inline-block' : 'none';
}

function setupAdminListeners() {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showLoginError('');

    const email = document.getElementById('admin-user').value.trim();
    const password = document.getElementById('admin-password').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showLoginError(`No se pudo iniciar sesión: ${error.message}`);
      return;
    }

    document.getElementById('admin-password').value = '';
    setAdminVisibility(Boolean(data.session));
    await loadAdminProducts();
  });

  logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showAdminError(`No se pudo cerrar sesión: ${error.message}`);
      return;
    }

    productsList = [];
    renderAdminTable();
    showAdminError('');
    setAdminVisibility(false);
  });

  productForm.addEventListener('submit', handleFormSubmit);
  cancelEditBtn.addEventListener('click', resetForm);

  adminTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    if (button.dataset.action === 'edit') {
      editProduct(button.dataset.id);
    } else if (button.dataset.action === 'delete') {
      deleteProduct(button.dataset.id);
    }
  });
}

async function loadAdminProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, sku, name, category, price, image, status')
    .order('created_at', { ascending: true });

  if (error) {
    showAdminError(`No se pudo cargar el catálogo: ${error.message}`);
    return;
  }

  productsList = data;
  showAdminError('');
  renderAdminTable();
}

function renderAdminTable() {
  adminTableBody.replaceChildren();

  productsList.forEach((product) => {
    const row = document.createElement('tr');
    const skuCell = document.createElement('td');
    const imageCell = document.createElement('td');
    const nameCell = document.createElement('td');
    const categoryCell = document.createElement('td');
    const priceCell = document.createElement('td');
    const statusCell = document.createElement('td');
    const actionsCell = document.createElement('td');
    const sku = document.createElement('strong');
    const image = document.createElement('img');
    const status = document.createElement('span');

    sku.textContent = product.sku;
    image.src = product.image;
    image.alt = product.name;
    image.style.cssText = 'width: 40px; height: 40px; object-fit: cover; border-radius: 4px;';
    nameCell.textContent = product.name;
    categoryCell.textContent = product.category;
    priceCell.textContent = `$${Number(product.price).toFixed(2)} MXN`;
    status.className = `stock-badge ${product.status === 'Disponible' ? 'disponible' : 'agotado'}`;
    status.textContent = product.status;

    skuCell.appendChild(sku);
    imageCell.appendChild(image);
    statusCell.appendChild(status);
    actionsCell.append(
      createActionButton('Editar', 'edit', product.id, 'btn-primary'),
      createActionButton('Eliminar', 'delete', product.id, 'btn-danger')
    );
    row.append(skuCell, imageCell, nameCell, categoryCell, priceCell, statusCell, actionsCell);
    adminTableBody.appendChild(row);
  });
}

function createActionButton(label, action, id, className) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  button.style.cssText = 'padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 0.4rem;';
  return button;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  showAdminError('');

  const id = productIdInput.value;
  const product = {
    sku: pSkuInput.value.trim(),
    name: pNameInput.value.trim(),
    category: pCategoryInput.value,
    price: Number(pPriceInput.value),
    image: pImageInput.value.trim(),
    status: pStatusInput.value
  };

  const query = id
    ? supabase.from('products').update(product).eq('id', id)
    : supabase.from('products').insert(product);
  const { error } = await query;

  if (error) {
    showAdminError(`No se pudo guardar el producto: ${error.message}`);
    return;
  }

  resetForm();
  await loadAdminProducts();
}

function editProduct(id) {
  const product = productsList.find((item) => item.id === id);
  if (!product) return;

  productIdInput.value = product.id;
  pSkuInput.value = product.sku;
  pSkuInput.disabled = true;
  pNameInput.value = product.name;
  pCategoryInput.value = product.category;
  pPriceInput.value = product.price;
  pImageInput.value = product.image;
  pStatusInput.value = product.status;

  formSubmitBtn.textContent = 'Actualizar Producto';
  cancelEditBtn.style.display = 'inline-block';
}

async function deleteProduct(id) {
  const product = productsList.find((item) => item.id === id);
  if (!product || !confirm(`¿Estás seguro de que deseas eliminar el producto con SKU: ${product.sku}?`)) {
    return;
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    showAdminError(`No se pudo eliminar el producto: ${error.message}`);
    return;
  }

  await loadAdminProducts();
}

function resetForm() {
  productForm.reset();
  productIdInput.value = '';
  pSkuInput.disabled = false;
  formSubmitBtn.textContent = 'Guardar Producto';
  cancelEditBtn.style.display = 'none';
}

function showLoginError(message) {
  loginError.textContent = message;
}

function showAdminError(message) {
  adminError.textContent = message;
}
