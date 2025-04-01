document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const name = form.name.value.trim();
    const price = parseFloat(form.price.value);
    const image = form.image.value.trim();
    const description = form.description.value.trim();
    const errorMessage = document.getElementById('errorMessage');
    const submitButton = form.querySelector('button[type="submit"]');
    const buttonText = submitButton.querySelector('.button-text');
    const buttonLoading = submitButton.querySelector('.button-loading');

    if (!name || price < 0) {
        errorMessage.textContent = 'Please fill in all required fields correctly.';
        errorMessage.classList.remove('hidden');
        return;
    }

    try {
        buttonText.classList.add('hidden');
        buttonLoading.classList.remove('hidden');
        submitButton.disabled = true;
        errorMessage.classList.add('hidden');

        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, price, image, description })
        });

        if (response.ok) {
            alert('Product added successfully!');
            form.reset();
        } else {
            const data = await response.json();
            errorMessage.textContent = data.message || 'Failed to add product.';
            errorMessage.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Error:', err);
        errorMessage.textContent = 'An error occurred. Please try again.';
        errorMessage.classList.remove('hidden');
    } finally {
        buttonText.classList.remove('hidden');
        buttonLoading.classList.add('hidden');
        submitButton.disabled = false;
    }
});
