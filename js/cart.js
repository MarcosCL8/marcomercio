/**
 * js/cart.js
 * Cerebro del Carrito de Compras, Catálogo Dinámico y Filtros por Categoría
 */

const WHATSAPP_NUMBER = "523411057485";

// Datos de productos con imágenes reales de Unsplash de alta calidad
const INITIAL_PRODUCTS = [
  {
    id: "PER-001",
    sku: "PER-001",
    name: "Perfume Black Platinum 100ml",
    category: "Perfumería",
    price: 1350.00,
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80",
    status: "Disponible"
  },
  {
    id: "PER-002",
    sku: "PER-002",
    name: "Fragancia Sauvage Intense",
    category: "Perfumería",
    price: 1590.00,
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80",
    status: "Disponible"
  },
  {
    id: "ORO-001",
    sku: "ORO-001",
    name: "Cadena Tejido Chino 14k Oro Laminado",
    category: "Oro Laminado",
    price: 890.00,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
    status: "Disponible"
  },
  {
    id: "ORO-002",
    sku: "ORO-002",
    name: "Esclava Grumet 10mm Oro Laminado",
    category: "Oro",
    price: 1120.00,
    image: "https://images.unsplash.com/photo-1611591475225-83e9b04f7572?auto=format&fit=crop&w=600&q=80",
    status: "Disponible"
  },
  {
    id: "GOR-001",
    sku: "GOR-001",
    name: "Gorra Snapback Urban Legend",
    category: "Gorras",
    price: 450.00,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80",
    status: "Disponible"

  },
  {
    id: "GOR-002",
    sku: "GOR-002",
    name: "Gorra Deportiva Minimal Black",
    category: "Gorras",
    price: 390.00,
    image: "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?auto=format&fit=crop&w=600&q=80",
    status: "Disponible"
  },
  {
    id: "SPO-001",
    sku: "SPO-001",
    name: "Playera Dry-Fit Stealth Black",
    category: "Ropa/Sport",
    price: 380.00,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
    status: "Disponible"
  },
  {
    id: "SPO-002",
    sku: "SPO-002",
    name: "Short Deportivo Running Pro",
    category: "Ropa/Sport",
    price: 420.00,
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
    status: "Disponible"
  }
];

let products = [];
let cart = [];

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

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadCartFromStorage();
  renderProducts('all');
  updateCartUI();
  setupEventListeners();
});

function loadProducts() {
  const stored = localStorage.getItem('marcomercios_products');
  if (stored) {
    products = JSON.parse(stored);
  } else {
    products = INITIAL_PRODUCTS;
    localStorage.setItem('marcomercios_products', JSON.stringify(products));
  }
}

function renderProducts(categoryFilter = 'all') {
  if (!productsGrid) return;
  productsGrid.innerHTML = '';

  const filtered = categoryFilter === 'all' 
    ? products 
    : products.filter(p => p.category === categoryFilter);

  if (filtered.length === 0) {
    productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem 0;">No hay productos disponibles en esta categoría por el momento.</p>`;
    return;
  }

  filtered.forEach(product => {
    const isAvailable = product.status === 'Disponible';
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <div class="card-img-placeholder" style="background-image: url('${product.image}'); background-size: cover;"></div>
      <div class="card-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span class="stock-badge ${isAvailable ? 'disponible' : 'agotado'}">${product.status}</span>
          <small style="color: var(--text-muted); font-size: 0.75rem;">SKU: ${product.sku}</small>
        </div>
        <h3>${product.name}</h3>
        <p style="color: var(--accent-gold); font-size: 1.2rem; font-weight: 800; margin-bottom: 1rem;">
          $${Number(product.price).toFixed(2)} MXN
        </p>
        <button 
          class="btn-primary add-to-cart-btn" 
          style="width: 100%; padding: 0.6rem;" 
          data-sku="${product.sku}" 
          ${!isAvailable ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          ${isAvailable ? 'Añadir al Carrito' : 'Agotado'}
        </button>
      </div>
    `;

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
      if (e.target.classList.contains('add-to-cart-btn')) {
        const sku = e.target.dataset.sku;
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
    cartItemsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">Tu carrito está vacío.</p>`;
  } else {
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      count += item.quantity;

      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>$${Number(item.price).toFixed(2)} MXN</p>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQuantity('${item.sku}', -1)">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" onclick="changeQuantity('${item.sku}', 1)">+</button>
          </div>
        </div>
        <button style="background:none; border:none; color: #ff4d4d; cursor:pointer;" onclick="changeQuantity('${item.sku}', -${item.quantity})">🗑️</button>
      `;
      cartItemsContainer.appendChild(itemEl);
    });
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