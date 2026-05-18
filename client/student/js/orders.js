const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadMyOrders();
});

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

function showAlert(message, type = 'success') {
    const alertEl = document.getElementById('alertMessage');
    alertEl.textContent = message;
    alertEl.className = `mb-4 p-4 rounded-lg text-sm font-medium shadow-sm ${
        type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`;
    alertEl.classList.remove('hidden');
    setTimeout(() => alertEl.classList.add('hidden'), 4000);
}

async function loadMyOrders() {
    const container = document.getElementById('ordersContainer');

    try {
        const response = await fetch(`${API_URL}/orders/my-orders`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('checklist_token')}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) logout();
            throw new Error('Failed to load orders');
        }

        const orders = await response.json();

        container.innerHTML = '';

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                    <i class="fa-solid fa-box-open text-5xl text-gray-300 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900">No orders yet</h3>
                    <p class="text-gray-500 mt-1">When you purchase items from the store, they will appear here.</p>
                    <a href="store.html" class="mt-4 inline-block px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition">Go to Store</a>
                </div>
            `;
            return;
        }

        orders.forEach(order => {
            let statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Pending
            if (order.status === 'Approved') statusColor = 'bg-green-100 text-green-800 border-green-200';
            if (order.status === 'Cancelled') statusColor = 'bg-red-100 text-red-800 border-red-200';

            const itemsHtml = order.items.map(item => {
                const img = item.image ? `http://localhost:5000${item.image}` : '../shared/assets/images/placeholder.png';
                return `
                    <div class="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-gray-50 rounded border flex-shrink-0 flex items-center justify-center p-1">
                                <img src="${img}" class="w-full h-full object-contain">
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-900">${item.product_name}</p>
                                <p class="text-xs text-gray-500">Qty: ${item.quantity} x ₱${parseFloat(item.price_at_purchase).toFixed(2)}</p>
                            </div>
                        </div>
                        <span class="text-sm font-medium text-gray-900">₱${(item.quantity * item.price_at_purchase).toFixed(2)}</span>
                    </div>
                `;
            }).join('');

            container.innerHTML += `
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <p class="text-sm text-gray-500">Order ID: <span class="font-medium text-gray-900">#${order.id}</span></p>
                            <p class="text-sm text-gray-500">Date: <span class="font-medium text-gray-900">${new Date(order.created_at).toLocaleString()}</span></p>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="text-right">
                                <p class="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total Amount</p>
                                <p class="text-lg font-bold text-gray-900">₱${parseFloat(order.total_amount).toFixed(2)}</p>
                            </div>
                            <span class="px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${statusColor}">${order.status}</span>
                        </div>
                    </div>
                    <div class="px-6 py-2">
                        ${itemsHtml}
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        showAlert('Error connecting to the server to fetch your orders.', 'error');
        container.innerHTML = '<p class="text-red-500 text-center">Failed to load orders.</p>';
    }
}
