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
function setButtonLoading(isLoading, defaultText = 'Submit') {
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const btn = document.querySelector('button[type="submit"]');

    if (isLoading) {
        btnText.textContent = 'Processing...';
        btnSpinner.classList.remove('hidden');
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        btnText.textContent = defaultText;
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

        setButtonLoading(true, 'Sign In');

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

                // Redirect based on role
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = '../admin/dashboard.html';
                    } else {
                        window.location.href = '../student/store.html';
                    }
                }, 1000);
            } else {
                showAlert(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            showAlert('Cannot connect to server. Please try again.', 'error');
            console.error('Login error:', error);
        } finally {
            setButtonLoading(false, 'Sign In');
        }
    });
}

// Register Form Handling
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            student_id: document.getElementById('student_id').value,
            email: document.getElementById('email').value,
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            password: document.getElementById('password').value,
            confirm_password: document.getElementById('confirm_password').value
        };

        if (formData.password !== formData.confirm_password) {
            showAlert('Passwords do not match.', 'error');
            return;
        }

        setButtonLoading(true, 'Register');

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Registration successful! You can now log in.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                showAlert(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            showAlert('Cannot connect to server. Please try again.', 'error');
            console.error('Registration error:', error);
        } finally {
            setButtonLoading(false, 'Register');
        }
    });
}
