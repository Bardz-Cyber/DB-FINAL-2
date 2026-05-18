const API_URL = 'http://localhost:5000/api';
let allProducts = [];
let cart = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProducts();
    loadCartFromStorage();
});

// Authentication Check
function checkAuth() {
    const token = localStorage.getItem('checklist_token');
    const user = JSON.parse(localStorage.getItem('checklist_user'));

    if (!token || !user) {
        window.location.href = '../auth/login.html';
        return;
    }

    if (user.role !== 'student') {
        window.location.href = '../admin/dashboard.html';
        return;
    }

    document.getElementById('userGreeting').textContent = `Hello, ${user.first_name}`;
}

function logout() {
    localStorage.removeItem('checklist_token');
    localStorage.removeItem('checklist_user');
    window.location.href = '../auth/login.html';
}

function toggleUserDropdown() {
    const menu = document.getElementById('userDropdownMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Close dropdown if clicking outside
document.addEventListener('click', function(event) {
    const isClickInside = event.target.closest('.relative');
    const menu = document.getElementById('userDropdownMenu');
    if (menu && !isClickInside && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
    }
});

// UI Utilities
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastMessage.textContent = message;

    if (type === 'success') {
        toast.className = 'fixed bottom-5 right-5 z-50 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 bg-green-100 text-green-800 transition-all duration-300 transform translate-y-0 opacity-100';
        toastIcon.className = 'fa-solid fa-circle-check text-xl text-green-600';
    } else {
        toast.className = 'fixed bottom-5 right-5 z-50 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 bg-red-100 text-red-800 transition-all duration-300 transform translate-y-0 opacity-100';
        toastIcon.className = 'fa-solid fa-circle-exclamation text-xl text-red-600';
    }

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-full', 'opacity-0');
    }, 3000);
}

// Fetch Products
async function loadProducts() {
    const grid = document.getElementById('productsGrid');

    // Show Skeleton loader
    grid.innerHTML = Array(8).fill(`
        <div class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <div class="h-48 skeleton w-full"></div>
            <div class="p-4 space-y-3">
                <div class="h-4 skeleton rounded w-3/4"></div>
                <div class="h-3 skeleton rounded w-1/2"></div>
                <div class="pt-4 flex justify-between items-center">
                    <div class="h-5 skeleton rounded w-1/4"></div>
                    <div class="h-8 skeleton rounded w-20"></div>
                </div>
            </div>
        </div>
    `).join('');

    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('checklist_token')}` }
        });

        if (response.ok) {
            allProducts = await response.json();

            // Extract unique categories for dynamic filters
            const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
            renderCategoryFilters(categories);

            renderProducts(allProducts);
        } else {
            if(response.status === 401 || response.status === 403) logout();
            throw new Error('Failed to fetch products');
        }
    } catch (error) {
        console.error(error);
        showToast('Error loading products', 'error');
        grid.innerHTML = '';
    }
}

function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');

    grid.innerHTML = '';

    if (products.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    products.forEach(product => {
        const isOutOfStock = product.quantity <= 0;
        const imageUrl = product.image ? `http://localhost:5000${product.image}` : '../shared/assets/images/placeholder.png';

        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col';
        card.innerHTML = `
            <div class="relative h-48 overflow-hidden bg-gray-100 flex items-center justify-center p-4">
                <img src="${imageUrl}" alt="${product.name}" class="h-full object-contain group-hover:scale-105 transition-transform duration-300">
                ${isOutOfStock ? `<div class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
                                    <span class="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200 shadow-sm">OUT OF STOCK</span>
                                  </div>` : ''}
            </div>
            <div class="p-4 flex flex-col flex-grow">
                <div class="flex justify-between items-start mb-1">
                    <h3 class="font-semibold text-gray-800 line-clamp-1" title="${product.name}">${product.name}</h3>
                </div>
                <p class="text-xs text-gray-500 mb-2">${product.category || 'Uncategorized'}</p>

                <div class="mt-auto pt-4 flex flex-col gap-2 border-t border-gray-50">
                    <span class="font-bold text-gray-900 text-lg">₱${parseFloat(product.price).toFixed(2)}</span>
                    <div class="flex gap-2">
                        <button onclick="addToCart(${product.id})" class="flex-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 font-medium hover:bg-blue-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Add to Cart" ${isOutOfStock ? 'disabled' : ''}>
                            <i class="fa-solid fa-cart-plus"></i>
                        </button>
                        <button onclick="buyNow(${product.id})" class="flex-1 px-3 py-1.5 rounded-lg bg-blue-800 text-white font-medium hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" ${isOutOfStock ? 'disabled' : ''}>
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Search and Filter
document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
    );
    renderProducts(filtered);
});

function renderCategoryFilters(categories) {
    const container = document.getElementById('categoryFilters');
    container.innerHTML = `<button class="px-4 py-1.5 rounded-full bg-blue-800 text-white text-sm font-medium whitespace-nowrap" onclick="filterCategory(event, '')">All</button>`;

    categories.forEach(cat => {
        container.innerHTML += `<button class="px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium whitespace-nowrap" onclick="filterCategory(event, '${cat}')">${cat}</button>`;
    });
}

function filterCategory(event, category) {
    // Update active button styling
    const buttons = document.getElementById('categoryFilters').children;
    for(let btn of buttons) {
        btn.className = "px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium whitespace-nowrap";
    }

    if(event && event.target) {
        event.target.className = "px-4 py-1.5 rounded-full bg-blue-800 text-white text-sm font-medium whitespace-nowrap";
    }

    if (!category) {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderProducts(filtered);
    }
}

// Cart Logic
function loadCartFromStorage() {
    const saved = localStorage.getItem('checklist_cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCartUI();
    }
}

function saveCartToStorage() {
    localStorage.setItem('checklist_cart', JSON.stringify(cart));
    updateCartUI();
}

function buyNow(productId) {
    addToCart(productId, true); // true indicates silent add
    openCartModal();
}

function addToCart(productId, silent = false) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.product_id === productId);

    if (existingItem) {
        if (existingItem.quantity + 1 > product.quantity) {
            showToast('Cannot add more than available stock', 'error');
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.push({
            product_id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
            max_quantity: product.quantity
        });
    }

    saveCartToStorage();
    if (!silent) {
        showToast(`${product.name} added to cart`);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    saveCartToStorage();
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;

    const newQty = item.quantity + change;

    if (newQty <= 0) {
        removeFromCart(productId);
    } else if (newQty > item.max_quantity) {
        showToast('Not enough stock available', 'error');
    } else {
        item.quantity = newQty;
        saveCartToStorage();
    }
}

function updateCartUI() {
    // Update badge
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;

    // Update modal list
    const list = document.getElementById('cartItemsList');
    const emptyMsg = document.getElementById('emptyCartMessage');
    const checkoutBtn = document.getElementById('checkoutBtn');
    let total = 0;

    list.innerHTML = '';

    if (cart.length === 0) {
        emptyMsg.classList.remove('hidden');
        checkoutBtn.disabled = true;
    } else {
        emptyMsg.classList.add('hidden');
        checkoutBtn.disabled = false;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const imageUrl = item.image ? `http://localhost:5000${item.image}` : '../shared/assets/images/placeholder.png';

            const li = document.createElement('li');
            li.className = 'py-6 flex';
            li.innerHTML = `
                <div class="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center p-1">
                    <img src="${imageUrl}" alt="${item.name}" class="w-full h-full object-contain">
                </div>
                <div class="ml-4 flex-1 flex flex-col">
                    <div>
                        <div class="flex justify-between text-base font-medium text-gray-900">
                            <h3 class="line-clamp-1" title="${item.name}">${item.name}</h3>
                            <p class="ml-4">₱${itemTotal.toFixed(2)}</p>
                        </div>
                        <p class="mt-1 text-sm text-gray-500">₱${parseFloat(item.price).toFixed(2)} each</p>
                    </div>
                    <div class="flex-1 flex items-end justify-between text-sm">
                        <div class="flex items-center border rounded-lg border-gray-200">
                            <button onclick="updateQuantity(${item.product_id}, -1)" class="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg"><i class="fa-solid fa-minus text-xs"></i></button>
                            <span class="px-3 font-medium border-x border-gray-200">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.product_id}, 1)" class="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"><i class="fa-solid fa-plus text-xs"></i></button>
                        </div>
                        <div class="flex">
                            <button type="button" onclick="removeFromCart(${item.product_id})" class="font-medium text-red-600 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
            list.appendChild(li);
        });
    }

    document.getElementById('cartTotal').textContent = `₱${total.toFixed(2)}`;
}

// Modal handling
function openCartModal() {
    const modal = document.getElementById('cartModal');
    const overlay = document.getElementById('cartOverlay');
    const panel = document.getElementById('cartPanel');

    modal.classList.remove('hidden');
    // Allow display:block to apply before triggering transition
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        panel.classList.remove('translate-x-full');
        panel.classList.add('translate-x-0');
    }, 10);

    updateCartUI(); // Ensure fresh render
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    const overlay = document.getElementById('cartOverlay');
    const panel = document.getElementById('cartPanel');

    overlay.classList.add('opacity-0');
    panel.classList.remove('translate-x-0');
    panel.classList.add('translate-x-full');

    // Wait for transition to finish before hiding container
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Checkout
async function checkout() {
    if (cart.length === 0) return;

    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Processing...';

    const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
    }));

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('checklist_token')}`
            },
            body: JSON.stringify({ items }) // total_amount and price removed, calculated server-side
        });

        const data = await response.json();

        if (response.ok) {
            cart = []; // Empty cart
            saveCartToStorage();
            closeCartModal();
            showToast('Order placed successfully! Awaiting Admin approval.');
            // Refresh products to show updated stock (though it only deducts on approval, good practice)
            loadProducts();

            setTimeout(() => window.location.href = 'orders.html', 1500);
        } else {
            throw new Error(data.error || 'Failed to checkout');
        }
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Checkout';
    }
}
