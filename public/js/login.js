document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const username = form.username.value.trim();
    const password = form.password.value.trim();
    const errorMessage = document.getElementById('errorMessage');
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    if (!username || !password) {
        showMessage('error', 'Please fill in all fields');
        return;
    }

    try {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitButton.disabled = true;
        errorMessage.style.display = 'none';

        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            showMessage('success', 'Login successful! Redirecting...');
            setTimeout(() => window.location.href = '/home.html', 1500);
        } else {
            showMessage('error', data.message || 'Login failed');
        }
    } catch (err) {
        console.error('Error:', err);
        showMessage('error', 'An error occurred during login');
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
