const API_URL = 'http://localhost:5000/api';

// Check Auth
const token = localStorage.getItem('checklist_token');
const userStr = localStorage.getItem('checklist_user');

if (!token || !userStr) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userStr);
document.getElementById('welcomeUser').textContent = `Hi, ${user.name || user.first_name || 'Admin'}`;

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
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${item.category_name || 'N/A'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${item.description || ''}
            </td>
        </tr>
    `).join('');
}


// Initial Load
fetchItems();
