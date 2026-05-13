const API_URL = 'http://localhost:5000/api/auth';

// Utility: Toggle Password Visibility
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

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
        const isLogin = document.getElementById('loginForm') !== null;
        btnText.textContent = isLogin ? 'Sign In' : 'Register Account';
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

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        setButtonLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Login successful! Redirecting...', 'success');
                // Save token
                localStorage.setItem('checklist_token', data.token);
                localStorage.setItem('checklist_user', JSON.stringify(data.user));

                // Redirect after short delay
                setTimeout(() => {
                    alert('Redirecting to dashboard... (Dashboard not yet implemented)');
                    // window.location.href = 'dashboard.html';
                }, 1500);
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

// Register Form Handling
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const student_id = document.getElementById('student_id').value;
        const first_name = document.getElementById('first_name').value;
        const last_name = document.getElementById('last_name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirm_password = document.getElementById('confirm_password').value;

        if (password !== confirm_password) {
            showAlert('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            showAlert('Password must be at least 6 characters long', 'error');
            return;
        }

        setButtonLoading(true);

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id,
                    first_name,
                    last_name,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showAlert(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            showAlert('Cannot connect to server. Please try again.', 'error');
            console.error('Register error:', error);
        } finally {
            setButtonLoading(false);
        }
    });
}