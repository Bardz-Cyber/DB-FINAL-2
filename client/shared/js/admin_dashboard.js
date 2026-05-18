const API_URL = 'http://localhost:5000/api';

// Check Auth
const token = localStorage.getItem('checklist_token');
const userStr = localStorage.getItem('checklist_user');

if (!token || !userStr) {
    window.location.href = '../auth/login.html';
}

const user = JSON.parse(userStr);
document.getElementById('welcomeUser').textContent = `Hi, ${user.name || user.first_name || 'Admin'}`;

function logout() {
    localStorage.removeItem('checklist_token');
    localStorage.removeItem('checklist_user');
    window.location.href = '../auth/login.html';
}

// Mobile Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

// Tab Switching logic
function switchTab(tabId, navElement = null) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Show selected tab
    document.getElementById(`${tabId}-tab`).classList.add('active');

    // Update nav styles if provided
    if (navElement) {
        document.querySelectorAll('.nav-link').forEach(el => {
            el.classList.remove('active', 'bg-blue-900', 'text-white');
            el.classList.add('text-gray-600');
        });
        navElement.classList.add('active', 'bg-blue-900', 'text-white');
        navElement.classList.remove('text-gray-600', 'hover:bg-blue-900', 'hover:text-white');
    }

    // Refresh data based on tab
    if (tabId === 'inventory') fetchItems();
    if (tabId === 'analytics') loadAnalytics();
    if (tabId === 'orders') fetchOrders();
    if (tabId === 'transactions') fetchTransactions();

    // Close sidebar on mobile after clicking a tab
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('sidebarOverlay').classList.add('hidden');
    }
}

// Chart Instance
let salesChartInstance = null;

async function loadAnalytics() {
    try {
        const response = await fetch(`${API_URL}/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) { logout(); return; }

        const data = await response.json();

        // Update metrics
        document.getElementById('metric-sales').textContent = `₱${parseFloat(data.metrics.totalSales).toFixed(2)}`;
        document.getElementById('metric-pending').textContent = data.metrics.pendingOrders;
        document.getElementById('metric-products').textContent = data.metrics.totalProducts;

        // Render Chart
        renderSalesChart(data.charts.salesByCategory);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function renderSalesChart(data) {
    const ctx = document.getElementById('salesChart').getContext('2d');

    // Destroy previous instance to avoid hover glitches
    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    const labels = data.map(d => d.category || 'Uncategorized');
    const totals = data.map(d => parseFloat(d.total));

    salesChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
                label: 'Total Sales (₱)',
                data: totals.length ? totals : [0],
                backgroundColor: [
                    'rgba(0, 0, 128, 0.8)', // Navy Blue
                    'rgba(54, 162, 235, 0.8)', // Light Blue
                    'rgba(255, 206, 86, 0.8)', // Yellow
                    'rgba(75, 192, 192, 0.8)', // Teal
                    'rgba(153, 102, 255, 0.8)', // Purple
                    'rgba(255, 159, 64, 0.8)', // Orange
                    'rgba(201, 203, 207, 0.8)' // Grey
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Order Management
async function fetchOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');

        const orders = await response.json();
        renderOrders(orders);
    } catch (error) {
        console.error(error);
        showAlert('Error loading orders', 'error');
    }
}

function escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function renderOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-gray-500"><i class="fa-solid fa-folder-open mb-2 text-2xl"></i><br>No orders found</td></tr>`;
        return;
    }

    orders.forEach(order => {
        let statusBadge = '';
        if (order.status === 'Pending Payment') statusBadge = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>';
        else if (order.status === 'Approved') statusBadge = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Approved</span>';
        else statusBadge = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Cancelled</span>';

        // Escape single quotes for HTML attribute injection
        const orderStr = encodeURIComponent(JSON.stringify(order)).replace(/'/g, "%27");

        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 transition-colors cursor-pointer" onclick="openOrderModal('${orderStr}')">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${escapeHtml(order.first_name)} ${escapeHtml(order.last_name)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(order.created_at).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">₱${parseFloat(order.total_amount).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${statusBadge}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900">View</button>
                </td>
            </tr>
        `;
    });
}

function openOrderModal(orderStr) {
    const order = JSON.parse(decodeURIComponent(orderStr));
    document.getElementById('orderModal').classList.remove('hidden');

    const content = document.getElementById('orderDetailsContent');
    const actions = document.getElementById('orderModalActions');

    let itemsHtml = order.items.map(i => `
        <div class="flex justify-between items-center py-2 border-b border-gray-100">
            <div><p class="font-medium">${i.product_name}</p><p class="text-xs text-gray-500">Qty: ${i.quantity} x ₱${parseFloat(i.price_at_purchase).toFixed(2)}</p></div>
            <p class="font-medium text-gray-900">₱${(i.quantity * i.price_at_purchase).toFixed(2)}</p>
        </div>
    `).join('');

    content.innerHTML = `
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <p><strong>Order ID:</strong> #${order.id}</p>
            <p><strong>Student:</strong> ${escapeHtml(order.first_name)} ${escapeHtml(order.last_name)} (${escapeHtml(order.email)})</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            <p><strong>Status:</strong> <span class="font-bold">${order.status}</span></p>
        </div>
        <h4 class="font-bold text-gray-900 mb-2">Order Items</h4>
        <div class="mb-4">${itemsHtml}</div>
        <div class="flex justify-between font-bold text-lg border-t pt-2"><p>Total</p><p>₱${parseFloat(order.total_amount).toFixed(2)}</p></div>
    `;

    if (order.status === 'Pending Payment') {
        actions.innerHTML = `
            <button onclick="updateOrderStatus(${order.id}, 'Approved')" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm">Approve</button>
            <button onclick="updateOrderStatus(${order.id}, 'Cancelled')" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm">Cancel Order</button>
            <button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-700 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onclick="closeOrderModal()">Close</button>
        `;
    } else {
        actions.innerHTML = `<button type="button" class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-700 sm:w-auto sm:text-sm" onclick="closeOrderModal()">Close</button>`;
    }
}

function closeOrderModal() { document.getElementById('orderModal').classList.add('hidden'); }

// Custom Confirm Modal Logic
let confirmActionCallback = null;

function showConfirmModal(title, message, confirmColorClass, callback) {
    document.getElementById('actionConfirmTitle').textContent = title;
    document.getElementById('actionConfirmMsg').textContent = message;

    const icon = document.getElementById('actionConfirmIcon');
    const iconContainer = icon.parentElement;
    const confirmBtn = document.getElementById('actionConfirmBtn');

    // Reset classes
    iconContainer.className = 'mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10';
    icon.className = 'fa-solid fa-circle-question text-xl';
    confirmBtn.className = 'w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm';

    if (confirmColorClass === 'green') {
        iconContainer.classList.add('bg-green-100');
        icon.classList.add('text-green-600', 'fa-check');
        confirmBtn.classList.add('bg-green-600', 'hover:bg-green-700');
    } else if (confirmColorClass === 'red') {
        iconContainer.classList.add('bg-red-100');
        icon.classList.add('text-red-600', 'fa-triangle-exclamation');
        confirmBtn.classList.add('bg-red-600', 'hover:bg-red-700');
    } else {
        iconContainer.classList.add('bg-blue-100');
        icon.classList.add('text-blue-600');
        confirmBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }

    confirmActionCallback = callback;
    document.getElementById('actionConfirmModal').classList.remove('hidden');
}

function closeActionConfirmModal() {
    document.getElementById('actionConfirmModal').classList.add('hidden');
    confirmActionCallback = null;
}

document.getElementById('actionConfirmBtn').addEventListener('click', () => {
    if (confirmActionCallback) {
        confirmActionCallback();
    }
    closeActionConfirmModal();
});

async function updateOrderStatus(orderId, status) {
    const colorClass = status === 'Approved' ? 'green' : 'red';

    showConfirmModal(`Mark Order as ${status}`, `Are you sure you want to mark order #${orderId} as ${status}?`, colorClass, async () => {
        try {
            const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            if(res.ok) {
                showAlert(`Order ${status} successfully.`);
                closeOrderModal();
                fetchOrders();
                loadAnalytics(); // Refresh analytics
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update status');
            }
        } catch(err) {
            showAlert(err.message || 'Failed to update order status', 'error');
        }
    });
}

// Transactions
async function fetchTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error();
        const txs = await response.json();
        const tbody = document.getElementById('transactionsTableBody');

        if (txs.length === 0) {
             tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-10 text-center text-gray-500">No transactions recorded</td></tr>`;
             return;
        }

        tbody.innerHTML = txs.map(t => `
            <tr>
                <td class="px-6 py-4 text-sm">${new Date(t.created_at).toLocaleString()}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${t.product_name}</td>
                <td class="px-6 py-4 text-sm"><span class="px-2 rounded-full text-xs font-semibold ${t.type==='IN'?'bg-green-100 text-green-800':'bg-blue-100 text-blue-800'}">${t.type}</span></td>
                <td class="px-6 py-4 text-sm text-right font-bold">${t.quantity}</td>
            </tr>
        `).join('');
    } catch(err) {
        showAlert('Error loading transactions', 'error');
    }
}

// UI Utilities
function showAlert(message, type = 'success') {
    const alertEl = document.getElementById('alertMessage');
    alertEl.textContent = message;
    alertEl.className = `mb-4 p-4 rounded-lg text-sm text-center font-medium ${
        type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`;
    alertEl.classList.remove('hidden');

    setTimeout(() => {
        alertEl.classList.add('hidden');
    }, 4000);
}

// Modals
const modal = document.getElementById('itemModal');
const form = document.getElementById('itemForm');
const modalTitle = document.getElementById('modalTitle');
const deleteModal = document.getElementById('deleteModal');

// Image upload state
let currentImageFile = null;
const imageInput = document.getElementById('itemImage');
const imagePreview = document.getElementById('imagePreview');
const imagePlaceholder = document.getElementById('imagePlaceholder');

imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        currentImageFile = file;
        const reader = new FileReader();
        reader.onload = function(event) {
            imagePreview.src = event.target.result;
            imagePreview.classList.remove('hidden');
            imagePlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});

function openModal(itemStr = null) {
    modal.classList.remove('hidden');

    // Reset image
    currentImageFile = null;
    imageInput.value = '';
    imagePreview.classList.add('hidden');
    imagePreview.src = '';
    imagePlaceholder.classList.remove('hidden');

    if (itemStr) {
        const item = JSON.parse(decodeURIComponent(itemStr));
        modalTitle.textContent = 'Edit Product';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemSku').value = item.sku;
        document.getElementById('itemPrice').value = parseFloat(item.price || 0).toFixed(2);
        document.getElementById('itemQuantity').value = item.quantity || 0;
        document.getElementById('itemDesc').value = item.description || '';

        // Show image if exists
        if (item.image) {
            imagePreview.src = `http://localhost:5000${item.image}`;
            imagePreview.classList.remove('hidden');
            imagePlaceholder.classList.add('hidden');
        }

        // Select matching category option
        if (item.category) {
            document.getElementById('itemCategory').value = item.category;
        } else {
            document.getElementById('itemCategory').value = '';
        }
    } else {
        modalTitle.textContent = 'Add New Product';
        form.reset();
        document.getElementById('itemId').value = '';
        document.getElementById('itemPrice').value = '0.00';
        document.getElementById('itemQuantity').value = 0;
        document.getElementById('itemCategory').value = '';
    }
}

function closeModal() {
    modal.classList.add('hidden');
    form.reset();
}

// Fetch and Render Items
let itemsList = [];

async function fetchItems() {
    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const data = await response.json();
        if (Array.isArray(data)) {
            itemsList = data;
        } else {
            console.error('Invalid response format for products:', data);
            itemsList = [];
            showAlert('Invalid response from server', 'error');
            return;
        }

        renderTable();
    } catch (error) {
        console.error('Error fetching products:', error);
        showAlert('Failed to load products', 'error');
    }
}

function renderTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const loading = document.getElementById('tableLoading');
    const empty = document.getElementById('tableEmpty');

    loading.classList.add('hidden');

    if (!Array.isArray(itemsList) || itemsList.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    tbody.innerHTML = itemsList.map(item => {
        const itemStr = encodeURIComponent(JSON.stringify(item));
        const imageHtml = item.image
            ? `<img src="http://localhost:5000${item.image}" class="h-10 w-10 rounded-full object-cover">`
            : `<div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"><i class="fa-solid fa-box text-gray-400"></i></div>`;

        return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
                ${imageHtml}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${item.sku}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${item.name}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${item.category || 'N/A'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">
                ₱${parseFloat(item.price || 0).toFixed(2)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${item.quantity || 0}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="openModal('${itemStr}')" class="text-blue-600 hover:text-blue-900 mr-3" title="Edit">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="confirmDelete(${item.id})" class="text-red-600 hover:text-red-900" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}


// Form Submission (Add/Edit)
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('itemId').value;
    const catVal = document.getElementById('itemCategory').value;

    const formData = new FormData();
    formData.append('name', document.getElementById('itemName').value);
    formData.append('sku', document.getElementById('itemSku').value);
    formData.append('price', document.getElementById('itemPrice').value);
    formData.append('quantity', document.getElementById('itemQuantity').value);
    if (catVal) formData.append('category', catVal);
    formData.append('description', document.getElementById('itemDesc').value);

    // Append image file if selected
    if (currentImageFile) {
        formData.append('image', currentImageFile);
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(id ? 'Product updated successfully' : 'Product added successfully');
            closeModal();
            fetchItems();
        } else {
            showAlert(data.error || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        showAlert('Failed to save product', 'error');
    }
});

// Delete Logic
let productToDeleteId = null;

function confirmDelete(id) {
    showConfirmModal('Delete Product', 'Are you sure you want to delete this product? This action cannot be undone.', 'red', async () => {
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                showAlert('Product deleted successfully');
                fetchItems();
            } else {
                const data = await response.json();
                showAlert(data.error || 'Failed to delete product', 'error');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            showAlert('Failed to delete product', 'error');
        }
    });
}

// Initial Load
loadAnalytics(); // Load default tab data
