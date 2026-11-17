/**
 * Authentication Logic for Login/Register
 */

// Check if already authenticated
document.addEventListener('DOMContentLoaded', () => {
    if (api.isAuthenticated()) {
        window.location.href = DASHBOARD_PAGE;
        return;
    }
});

// Tab switching
function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const subtitle = document.getElementById('form-subtitle');
    const title = document.querySelector('h2');

    hideMessages();

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        loginTab.classList.add('bg-white', 'text-indigo-600', 'shadow');
        loginTab.classList.remove('text-gray-500');
        registerTab.classList.remove('bg-white', 'text-indigo-600', 'shadow');
        registerTab.classList.add('text-gray-500');
        subtitle.textContent = 'Sign in to your account';
        title.textContent = 'Student Management System';
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        registerTab.classList.add('bg-white', 'text-indigo-600', 'shadow');
        registerTab.classList.remove('text-gray-500');
        loginTab.classList.remove('bg-white', 'text-indigo-600', 'shadow');
        loginTab.classList.add('text-gray-500');
        subtitle.textContent = 'Create a new account';
        title.textContent = 'Student Management System';
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
}

// Hide messages
function hideMessages() {
    document.getElementById('error-message').classList.add('hidden');
    document.getElementById('success-message').classList.add('hidden');
}

// Fill demo credentials
// These match the accounts created by `python manage.py seed_demo`.
function fillDemo(role) {
    const credentials = {
        director: { email: 'director@sms.com', password: 'director123' },
        teacher: { email: 'teacher@sms.com', password: 'teacher123' },
        student: { email: 'student@sms.com', password: 'student123' },
        parent: { email: 'parent@sms.com', password: 'parent123' }
    };

    const cred = credentials[role];
    document.getElementById('login-email').value = cred.email;
    document.getElementById('login-password').value = cred.password;

    // Switch to login tab if not already there
    switchTab('login');
}

// Login form handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const loginBtn = document.getElementById('login-btn');

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Signing in...
    `;

    try {
        const response = await api.login(email, password);
        
        if (response.success) {
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = DASHBOARD_PAGE;
            }, 500);
        }
    } catch (error) {
        showError(error.message || 'Login failed. Please try again.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign in';
    }
});

// Register form handler
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const password = document.getElementById('reg-password').value;
    const passwordConfirm = document.getElementById('reg-password-confirm').value;

    // Validate passwords match
    if (password !== passwordConfirm) {
        showError('Passwords do not match.');
        return;
    }

    // Validate password length
    if (password.length < 8) {
        showError('Password must be at least 8 characters long.');
        return;
    }

    const userData = {
        email: document.getElementById('reg-email').value,
        username: document.getElementById('reg-username').value,
        first_name: document.getElementById('reg-firstname').value,
        last_name: document.getElementById('reg-lastname').value,
        role: document.getElementById('reg-role').value,
        password: password,
        password_confirm: passwordConfirm,
    };

    const registerBtn = document.getElementById('register-btn');

    // Show loading state
    registerBtn.disabled = true;
    registerBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Creating account...
    `;

    try {
        const response = await api.register(userData);
        
        if (response.success) {
            showSuccess('Account created successfully! Redirecting...');
            setTimeout(() => {
                window.location.href = DASHBOARD_PAGE;
            }, 500);
        }
    } catch (error) {
        showError(error.message || 'Registration failed. Please try again.');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create account';
    }
});
