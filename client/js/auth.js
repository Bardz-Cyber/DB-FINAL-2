const API_URL = 'http://localhost:5000/api/auth';

// Utility: Show Alert Message
function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.textContent = message;
    alertDiv.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');

    if (type === 'error') {
        alertDiv.classList.add('bg-red-100', 'text-red-700');
    } else {
        alertDiv.classList.add('bg-green-100', 'text-green-700');
    }
}

// Utility: Toggle Button Loading State
function setButtonLoading(isLoading) {
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const btn = document.querySelector('button[type="submit"]');

    if (isLoading) {
        btnText.textContent = 'Processing...';
        btnSpinner.classList.remove('hidden');
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        btnText.textContent = 'Sign In';
        btnSpinner.classList.add('hidden');
        btn.disabled = false;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

// Login Form Handling
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const admin_id = document.getElementById('admin_id').value;
        const password = document.getElementById('password').value;

        setButtonLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ admin_id, password })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Login successful! Redirecting...', 'success');
                // Save token
                localStorage.setItem('checklist_token', data.token);
                localStorage.setItem('checklist_user', JSON.stringify(data.user));

                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showAlert(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            showAlert('Cannot connect to server. Please try again.', 'error');
            console.error('Login error:', error);
        } finally {
            setButtonLoading(false);
        }
    });
}
