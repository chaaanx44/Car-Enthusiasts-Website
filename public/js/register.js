document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const username = form.username.value.trim();
    const password = form.password.value.trim();
    const errorMessage = document.getElementById('errorMessage');
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
        showMessage('error', 'Username must be 3-30 characters and contain only letters, numbers, and underscores');
        return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password)) {
        showMessage('error', 'Password must be at least 6 characters and contain at least one letter and one number');
        return;
    }

    try {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        submitButton.disabled = true;
        errorMessage.style.display = 'none';

        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('success', 'Registration successful! Redirecting to login...');
            setTimeout(() => window.location.href = '/login.html', 1500);
        } else {
            showMessage('error', data.message || 'Registration failed');
        }
    } catch (err) {
        console.error('Error:', err);
        showMessage('error', 'An error occurred during registration');
    } finally {
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
});

function showMessage(type, message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.className = type === 'success' ? 'success-message' : 'error-message';
    errorMessage.style.display = 'block';
}
