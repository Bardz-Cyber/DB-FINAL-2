const API_URL = 'http://localhost:5000/api';

// Check Auth
const token = localStorage.getItem('checklist_token');
const userStr = localStorage.getItem('checklist_user');

if (!token || !userStr) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userStr);
document.getElementById('welcomeUser').textContent = `Hi, ${user.first_name}`;

function logout() {
    localStorage.removeItem('checklist_token');
    localStorage.removeItem('checklist_user');
    window.location.href = 'login.html';
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

const modal = document.getElementById('itemModal');
const form = document.getElementById('itemForm');
const modalTitle = document.getElementById('modalTitle');

function openModal(item = null) {
    modal.classList.remove('hidden');

    if (item) {
        modalTitle.textContent = 'Edit Item';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemSku').value = item.sku;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemQty').value = item.quantity;
    } else {
        modalTitle.textContent = 'Add New Item';
        form.reset();
        document.getElementById('itemId').value = '';
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
        const response = await fetch(`${API_URL}/inventory`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        itemsList = await response.json();
        renderTable();
    } catch (error) {
        console.error('Error fetching items:', error);
        showAlert('Failed to load inventory', 'error');
    }
}

function renderTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const loading = document.getElementById('tableLoading');
    const empty = document.getElementById('tableEmpty');

    loading.classList.add('hidden');

    if (itemsList.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');

    tbody.innerHTML = itemsList.map(item => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${item.sku}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${item.name}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    ${item.category}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold ${item.quantity <= 5 ? 'text-red-600' : ''}">
                ${item.quantity}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick='openModal(${JSON.stringify(item)})' class="text-blue-600 hover:text-blue-900 mr-3" title="Edit">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="deleteItem(${item.id})" class="text-red-600 hover:text-red-900" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Form Submission (Add/Edit)
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('itemId').value;
    const payload = {
        name: document.getElementById('itemName').value,
        sku: document.getElementById('itemSku').value,
        category: document.getElementById('itemCategory').value,
        quantity: parseInt(document.getElementById('itemQty').value, 10)
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/inventory/${id}` : `${API_URL}/inventory`;

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(id ? 'Item updated successfully' : 'Item added successfully');
            closeModal();
            fetchItems();
        } else {
            showAlert(data.error || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error saving item:', error);
        showAlert('Failed to save item', 'error');
    }
});

// Delete Item
async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        const response = await fetch(`${API_URL}/inventory/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showAlert('Item deleted successfully');
            fetchItems();
        } else {
            const data = await response.json();
            showAlert(data.error || 'Failed to delete item', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showAlert('Failed to delete item', 'error');
    }
}

// Initial Load
fetchItems();