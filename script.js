const API_URL =
  "https://script.google.com/macros/s/AKfycbykjXTpUxdxYITQEBdRW91HUC6Cj42HxSpZ9ossmbdl8hJdqq_5IPR9rrBE848y7ifJxg/exec";

// TEST: Check if script is loading
console.log("=== SCRIPT.JS LOADED ===");

/* ===============================
   DOM
================================ */
const productGrid = document.getElementById("products");
const cartPanel = document.getElementById("cartPanel");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const cartButton = document.getElementById("cartButton");
const checkoutBtn = document.getElementById("checkoutBtn");

const checkoutSection = document.getElementById("checkout");
const checkoutForm = document.getElementById("checkoutForm");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const locationInput = document.getElementById("location");
const noteInput = document.getElementById("note");

const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");

const floatingCart = document.getElementById("floatingCart");
const floatingCartCount = document.getElementById("floatingCartCount");

const placeOrderBtn = checkoutForm.querySelector("button[type='submit']");

console.log("DOM elements loaded");

/* ===============================
   STATE
================================ */
let cart = {};
let cartTotal = 0;
let allProducts = [];

/* ===============================
   LOAD PRODUCTS
================================ */
function loadProducts() {
  console.log("loadProducts() called");
  fetch(API_URL)
    .then(res => {
      console.log("Response received:", res);
      return res.json();
    })
    .then(products => {
      console.log("Products loaded:", products);
      allProducts = products;
      renderProducts(products);
    })
    .catch(err => console.error("Error loading products:", err));
}

/* ===============================
   RENDER PRODUCTS
================================ */
function renderProducts(products) {
  console.log("renderProducts() called with", products.length, "products");
  const grid = document.getElementById("products");
  grid.innerHTML = "";

  const search = searchInput.value.toLowerCase();
  const category = categorySelect.value;

  const filtered = products.filter(
    p =>
      p.name.toLowerCase().includes(search) &&
      (category === "all" || p.category === category)
  );

  console.log("Filtered products:", filtered.length);

  filtered.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";

    // Handle the discountPrice column with trailing space
    const originalPrice = Number(p.price) || 0;
    const discountPrice = Number(p["discountPrice "] || p.discountPrice || 0) || 0;
    const hasDiscount = discountPrice > 0;

    console.log(`Rendering: ${p.name}, ID: ${p.id}, Original: ${originalPrice}, Discount: ${discountPrice}`);

    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/260x300?text=Image+Not+Found'">
      <h3>${p.name}</h3>
      <p class="price">
        ${
          hasDiscount
            ? `<span class="old-price">GHS ${originalPrice.toFixed(2)}</span>
               <span class="new-price">GHS ${discountPrice.toFixed(2)}</span>`
            : `<span class="new-price">GHS ${originalPrice.toFixed(2)}</span>`
        }
      </p>
      <button class="add-to-cart-btn" type="button">Add to Cart</button>
    `;

    // Get the button and attach click handler IMMEDIATELY
    const addBtn = card.querySelector(".add-to-cart-btn");
    addBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("===== ADD TO CART CLICKED =====");
      console.log("Product ID:", p.id);
      console.log("Product:", p);
      addToCart(p);
      return false;
    };

    grid.appendChild(card);
  });

  console.log("All products rendered and event handlers attached");
}

/* ===============================
   CART LOGIC
================================ */
function addToCart(p) {
  console.log("===== ADDING TO CART =====");
  console.log("Product:", p);

  const originalPrice = Number(p.price) || 0;
  const discountPrice = Number(p["discountPrice "] || p.discountPrice || 0) || 0;
  
  const finalPrice = discountPrice > 0 ? discountPrice : originalPrice;

  console.log("Original Price:", originalPrice);
  console.log("Discount Price:", discountPrice);
  console.log("Final Price:", finalPrice);

  if (cart[p.id]) {
    cart[p.id].qty++;
    console.log("Item already in cart, incrementing qty to:", cart[p.id].qty);
  } else {
    cart[p.id] = {
      id: p.id,
      name: p.name,
      price: finalPrice,
      qty: 1
    };
    console.log("Added new item to cart");
  }

  console.log("Cart state:", cart);
  updateCartUI();
}

function changeQty(id, delta) {
  console.log("changeQty called:", id, delta);
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  updateCartUI();
}

function removeItem(id) {
  console.log("removeItem called:", id);
  delete cart[id];
  updateCartUI();
}

function updateCartUI() {
  console.log("=== UPDATING CART UI ===");
  cartItemsEl.innerHTML = "";
  cartTotal = 0;
  let count = 0;

  Object.values(cart).forEach(item => {
    const subtotal = item.qty * item.price;
    cartTotal += subtotal;
    count += item.qty;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <span>${item.name}</span>
      <div class="cart-controls">
        <button onclick="changeQty('${item.id}', -1)">−</button>
        <span>${item.qty}</span>
        <button onclick="changeQty('${item.id}', 1)">+</button>
        <button onclick="removeItem('${item.id}')">❌</button>
      </div>
      <span>GHS ${subtotal.toFixed(2)}</span>
    `;
    cartItemsEl.appendChild(row);
  });

  cartTotalEl.textContent = cartTotal.toFixed(2);
  cartCountEl.textContent = count;
  if (floatingCartCount) floatingCartCount.textContent = count;

  console.log("Cart count:", count, "Cart total:", cartTotal);

  // Only show floating cart when items are in cart
  if (floatingCart) floatingCart.style.display = count ? "flex" : "none";

  renderCheckoutCart();
}

/* ===============================
   CHECKOUT CART
================================ */
function renderCheckoutCart() {
  const box = document.getElementById("checkoutCart");
  if (!box) return;

  box.innerHTML = "";
  Object.values(cart).forEach(item => {
    const row = document.createElement("div");
    row.className = "checkout-item";
    row.innerHTML = `
      <span>${item.name}</span>
      <span>${item.qty} × GHS ${item.price.toFixed(2)}</span>
    `;
    box.appendChild(row);
  });
}

/* ===============================
   CHECKOUT
================================ */
checkoutForm.onsubmit = e => {
  e.preventDefault();

  if (!Object.keys(cart).length) {
    alert("Your cart is empty");
    return;
  }

  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Processing your luxury order...";

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      name: nameInput.value,
      phone: phoneInput.value,
      location: locationInput.value,
      note: noteInput.value,
      cart,
      total: cartTotal
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const orderSuccessModal = document.getElementById("orderSuccess");
        orderSuccessModal.classList.add("show");
        checkoutSection.style.display = "none";

        cart = {};
        updateCartUI();
        checkoutForm.reset();
      }

      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
    })
    .catch(() => {
      alert("Something went wrong.");
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
    });
};

/* ===============================
   INIT
================================ */
console.log("Setting up event listeners");
searchInput.oninput = loadProducts;
categorySelect.onchange = loadProducts;

console.log("Loading products...");
loadProducts();

/* ===============================
   CART PANEL TOGGLES
================================ */

// Toggle cart panel when cart button (navbar) is clicked
cartButton.onclick = () => {
  cartPanel.style.display = cartPanel.style.display === "none" ? "block" : "none";
};

// Toggle cart panel when floating cart is clicked
floatingCart.onclick = () => {
  cartPanel.style.display = cartPanel.style.display === "none" ? "block" : "none";
};

// Close cart panel and show checkout when checkout button is clicked
checkoutBtn.onclick = () => {
  if (!Object.keys(cart).length) return alert("Your cart is empty");

  cartPanel.style.display = "none"; // Close the cart panel
  checkoutSection.style.display = "block";
  checkoutSection.scrollIntoView({ behavior: "smooth" });
};

/* ===============================
   FADE IN ANIMATION
================================ */
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".fade-in").forEach(el => {
  observer.observe(el);
});

console.log("=== SCRIPT.JS INITIALIZATION COMPLETE ===");