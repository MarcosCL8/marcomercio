/**
 * js/cart.js
 * Cerebro del Carrito de Compras, Catálogo Dinámico y Filtros por Categoría
 */

import { supabase } from './supabase.js';

const WHATSAPP_NUMBER = "523411057485";

let products = [];
let cart = [];
let activeCategoryFilter = 'all';

// Elementos del DOM
const productsGrid = document.getElementById('products-grid');
const cartModal = document.getElementById('cart-modal');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartCounter = document.getElementById('cart-counter');
const checkoutWhatsappBtn = document.getElementById('checkout-whatsapp-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const categoryCards = document.querySelectorAll('.category-card');

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  loadCartFromStorage();

  try {
    await loadProducts();
    cart = cart
      .map(item => {
        const currentProduct = products.find(product => product.sku === item.sku);
        return currentProduct ? { ...currentProduct, quantity: item.quantity } : null;
      })
      .filter(Boolean);
    saveCartToStorage();
    renderProducts('all');
    updateCartUI();
  } catch (error) {
    showCatalogError(`No se pudo cargar el catálogo: ${error.message}`);
  }
});

async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, sku, name, category, price, image, status')
    .order('created_at', { ascending: true });

  if (error) throw error;
  products = data;
}

function showCatalogError(message) {
  if (!productsGrid) return;
  const notice = document.createElement('p');
  notice.style.cssText = 'grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem 0;';
  notice.textContent = message;
  productsGrid.replaceChildren(notice);
}

function renderProducts(categoryFilter = 'all') {
  if (!productsGrid) return;
  activeCategoryFilter = categoryFilter;
  productsGrid.innerHTML = '';

  const filtered = categoryFilter === 'all' 
    ? products 
    : products.filter(p => p.category === categoryFilter);

  if (filtered.length === 0) {
    const notice = document.createElement('p');
    notice.style.cssText = 'grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem 0;';
    notice.textContent = 'No hay productos disponibles en esta categoría por el momento.';
    productsGrid.appendChild(notice);
    return;
  }

  filtered.forEach(product => {
    const isAvailable = product.status === 'Disponible';
    const card = document.createElement('div');
    card.className = 'card';

    const imageContainer = document.createElement('div');
    const image = document.createElement('img');
    const content = document.createElement('div');
    const details = document.createElement('div');
    const status = document.createElement('span');
    const sku = document.createElement('small');
    const name = document.createElement('h3');
    const price = document.createElement('p');
    const addButton = document.createElement('button');

    imageContainer.className = 'card-img-placeholder';
    image.src = product.image;
    image.alt = product.name;
    image.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    content.className = 'card-content';
    details.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;';
    status.className = `stock-badge ${isAvailable ? 'disponible' : 'agotado'}`;
    status.textContent = product.status;
    sku.style.cssText = 'color: var(--text-muted); font-size: 0.75rem;';
    sku.textContent = `SKU: ${product.sku}`;
    name.textContent = product.name;
    price.style.cssText = 'color: var(--accent-gold); font-size: 1.2rem; font-weight: 800; margin-bottom: 1rem;';
    price.textContent = `$${Number(product.price).toFixed(2)} MXN`;
    addButton.type = 'button';
    addButton.className = 'btn-primary add-to-cart-btn';
    addButton.style.cssText = 'width: 100%; padding: 0.6rem;';
    addButton.dataset.sku = product.sku;
    addButton.disabled = !isAvailable;
    if (!isAvailable) addButton.style.cssText += 'opacity: 0.5; cursor: not-allowed;';
    addButton.textContent = isAvailable ? 'Añadir al Carrito' : 'Agotado';

    details.append(status, sku);
    content.append(details, name, price, addButton);
    imageContainer.appendChild(image);
    card.append(imageContainer, content);
    productsGrid.appendChild(card);
  });
}

function setupEventListeners() {
  // Filtros de botones tradicionales
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderProducts(e.target.dataset.category);
    });
  });

  // Clic en las tarjetas visuales de categorías superiores
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const selectedCat = card.dataset.category;
      
      // Sincronizar botones de filtro
      filterBtns.forEach(b => {
        if (b.dataset.category === selectedCat) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      // Renderizar y hacer scroll suave hacia la sección del catálogo
      renderProducts(selectedCat);
      document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Agregar al carrito
  if (productsGrid) {
    productsGrid.addEventListener('click', (e) => {
      const button = e.target.closest('.add-to-cart-btn');
      if (button) {
        const sku = button.dataset.sku;
        addToCart(sku);
      }
    });
  }

  if (cartToggleBtn) cartToggleBtn.addEventListener('click', () => cartModal.classList.add('open'));
  if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartModal.classList.remove('open'));
  if (checkoutWhatsappBtn) checkoutWhatsappBtn.addEventListener('click', processWhatsappOrder);
}

function addToCart(sku) {
  const product = products.find(p => p.sku === sku);
  if (!product || product.status !== 'Disponible') return;

  const existingItem = cart.find(item => item.sku === sku);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCartToStorage();
  updateCartUI();
  cartModal.classList.add('open');
}

window.changeQuantity = function(sku, delta) {
  const item = cart.find(i => i.sku === sku);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.sku !== sku);
  }

  saveCartToStorage();
  updateCartUI();
}

function updateCartUI() {
  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = '';

  let total = 0;
  let count = 0;

  if (cart.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.style.cssText = 'text-align: center; color: var(--text-muted); margin-top: 2rem;';
    emptyMessage.textContent = 'Tu carrito está vacío.';
    cartItemsContainer.appendChild(emptyMessage);
  } else {
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      count += item.quantity;

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      const image = document.createElement('img');
      const details = document.createElement('div');
      const name = document.createElement('h4');
      const price = document.createElement('p');
      const quantityControls = document.createElement('div');
      const decreaseButton = createQuantityButton(item.sku, -1, '-');
      const quantity = document.createElement('span');
      const increaseButton = createQuantityButton(item.sku, 1, '+');
      const removeButton = createQuantityButton(item.sku, -item.quantity, '🗑️');

      image.src = item.image;
      image.alt = item.name;
      details.className = 'cart-item-details';
      name.textContent = item.name;
      price.textContent = `$${Number(item.price).toFixed(2)} MXN`;
      quantityControls.className = 'cart-item-qty';
      quantity.textContent = item.quantity;
      removeButton.style.cssText = 'background:none; border:none; color: #ff4d4d; cursor:pointer;';
      quantityControls.append(decreaseButton, quantity, increaseButton);
      details.append(name, price, quantityControls);
      itemEl.append(image, details, removeButton);
      cartItemsContainer.appendChild(itemEl);
    });
  }

  function createQuantityButton(sku, delta, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'qty-btn';
    button.textContent = label;
    button.addEventListener('click', () => changeQuantity(sku, delta));
    return button;
  }

  cartTotalPrice.textContent = `$${total.toFixed(2)} MXN`;
  cartCounter.textContent = count;
}

function saveCartToStorage() {
  localStorage.setItem('marcomercios_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
  const stored = localStorage.getItem('marcomercios_cart');
  if (stored) cart = JSON.parse(stored);
}

function processWhatsappOrder() {
  if (cart.length === 0) {
    alert("Agrega productos al carrito antes de realizar el pedido.");
    return;
  }

  let message = "👋 *Hola Marcomercios! Me gustaría realizar el siguiente pedido:*\n\n";
  let grandTotal = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    grandTotal += subtotal;
    message += `*${index + 1}. ${item.name}*\n`;
    message += `   • SKU: \`${item.sku}\`\n`;
    message += `   • Cantidad: ${item.quantity}\n`;
    message += `   • Precio U.: $${Number(item.price).toFixed(2)} MXN\n`;
    message += `   • Subtotal: $${subtotal.toFixed(2)} MXN\n\n`;
  });

  message += `💰 *TOTAL DEL PEDIDO: $${grandTotal.toFixed(2)} MXN*\n\n`;
  message += "Quedo a la espera para confirmar existencias y coordinar el pago/envío. ¡Gracias!";

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
}