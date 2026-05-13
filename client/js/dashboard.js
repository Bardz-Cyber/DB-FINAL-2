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

// Modals
const modal = document.getElementById('itemModal');
const form = document.getElementById('itemForm');
const modalTitle = document.getElementById('modalTitle');
const deleteModal = document.getElementById('deleteModal');

// Image upload state
let currentImageBase64 = null;
const imageInput = document.getElementById('itemImage');
const imagePreview = document.getElementById('imagePreview');
const imagePlaceholder = document.getElementById('imagePlaceholder');

imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentImageBase64 = event.target.result;
            imagePreview.src = currentImageBase64;
            imagePreview.classList.remove('hidden');
            imagePlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// Category state
let categories = [];

async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        categories = await response.json();

        const catSelect = document.getElementById('itemCategory');
        catSelect.innerHTML = '<option value="">Select Category</option>';

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            catSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

function openModal(itemStr = null) {
    modal.classList.remove('hidden');

    // Reset image
    currentImageBase64 = null;
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
        document.getElementById('itemDesc').value = item.description || '';

        // Show image if exists
        if (item.image) {
            currentImageBase64 = item.image;
            imagePreview.src = item.image;
            imagePreview.classList.remove('hidden');
            imagePlaceholder.classList.add('hidden');
        }

        // Find category ID by name
        const cat = categories.find(c => c.name === item.category_name);
        document.getElementById('itemCategory').value = cat ? cat.id : '';
    } else {
        modalTitle.textContent = 'Add New Product';
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
            ? `<img src="${item.image}" class="h-10 w-10 rounded-full object-cover">`
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
                    ${item.category_name || 'N/A'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${item.description || ''}
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

    const payload = {
        name: document.getElementById('itemName').value,
        sku: document.getElementById('itemSku').value,
        category_id: catVal ? parseInt(catVal, 10) : null,
        description: document.getElementById('itemDesc').value
    };

    // Append image if exists
    if (currentImageBase64) {
        payload.image = currentImageBase64;
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;

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
    productToDeleteId = id;
    deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
    productToDeleteId = null;
    deleteModal.classList.add('hidden');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!productToDeleteId) return;

    try {
        const response = await fetch(`${API_URL}/products/${productToDeleteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showAlert('Product deleted successfully');
            closeDeleteModal();
            fetchItems();
        } else {
            const data = await response.json();
            showAlert(data.error || 'Failed to delete product', 'error');
            closeDeleteModal();
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showAlert('Failed to delete product', 'error');
        closeDeleteModal();
    }
});

// Initial Load
fetchCategories().then(fetchItems);
