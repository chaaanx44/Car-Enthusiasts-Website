const token = localStorage.getItem('token');
const productContainer = document.getElementById('productContainer');

// Helper function to format currency (simple example)
const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function loadProducts() {
    try {
        showLoading();
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to load products (${response.status})`);
        }

        const products = await response.json();
        if (!Array.isArray(products) || products.length === 0) {
            showMessage('No products available at the moment.');
            return;
        }

        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products. Please try refreshing the page.');
    }
}

function showLoading() {
    if (!productContainer) return;
    productContainer.innerHTML = `
        <div class="col-span-full text-center py-10 text-gray-500">
            <i class="fas fa-spinner fa-spin text-3xl mb-4"></i>
            <p>Loading products...</p>
        </div>
    `;
}

function showError(message) {
     if (!productContainer) return;
    productContainer.innerHTML = `
        <div class="col-span-full alert alert-error justify-center">
             <i class="fas fa-exclamation-circle alert-icon"></i>
            ${message}
        </div>
    `;
}

function showMessage(message) {
     if (!productContainer) return;
    productContainer.innerHTML = `
        <div class="col-span-full text-center py-10 text-gray-500">
            <i class="fas fa-info-circle text-3xl mb-4"></i>
             <p>${message}</p>
        </div>
    `;
}

function displayProducts(products) {
    if (!productContainer) return;
    productContainer.innerHTML = products.map(product => {
        // Basic validation for product data
        const name = product.name || 'Unnamed Product';
        const description = product.description || 'No description available.';
        const price = typeof product.price === 'number' ? product.price : 0;
        const image = product.image || '/images/placeholder.png'; // Provide a placeholder image path
        const id = product._id;

        if (!id) return ''; // Skip if product ID is missing

        return `
            <div class="card card-hover flex flex-col overflow-hidden animate-fade-in">
                <img src="${image}" alt="${name}" class="w-full h-48 object-cover" onerror="this.onerror=null;this.src='/images/placeholder.png';"> <!-- Add image placeholder fallback -->
                <div class="p-6 flex flex-col flex-grow">
                    <h3 class="text-lg font-semibold text-primary-700 mb-2">${name}</h3>
                    <p class="text-sm text-gray-600 mb-4 flex-grow">${description}</p>
                    <p class="text-xl font-bold text-gray-800 mb-4">${formatCurrency(price)}</p>
                    <div class="mt-auto flex space-x-2">
                        <button class="btn btn-secondary flex-1 text-sm" onclick="contactSeller('${id}')">Contact Us</button>
                        <button class="btn btn-primary flex-1 text-sm" onclick="addToCart('${id}', this)"> <!-- Pass button element -->
                             <span class="button-text"><i class="fas fa-cart-plus mr-1"></i>Add to Cart</span>
                             <span class="button-loading" style="display: none;"><i class="fas fa-spinner fa-spin"></i></span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function addToCart(productId, buttonElement) {
    const buttonText = buttonElement.querySelector('.button-text');
    const buttonLoading = buttonElement.querySelector('.button-loading');

    // Show loading state
    if (buttonText) buttonText.style.display = 'none';
    if (buttonLoading) buttonLoading.style.display = 'inline-block';
    buttonElement.disabled = true;

    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        if (!response.ok) {
             // Provide more specific error feedback if possible
            const errorData = await response.json().catch(() => ({})); // Try to get error message
            throw new Error(errorData.message || `Failed to add to cart (${response.status})`);
        }

        // alert('Product added to cart!'); // Consider a less intrusive notification
        showTemporarySuccess(buttonElement, buttonText);
        await updateCartBadge(); // Update badge after successful add

    } catch (error) {
        console.error('Error adding to cart:', error);
        alert(`Failed to add product to cart: ${error.message}`); // Show error message
    } finally {
        // Reset button state after a delay (unless success animation handles it)
        setTimeout(() => {
            if (buttonText && buttonText.textContent !== 'Added!') { // Avoid resetting if success state is active
                 buttonText.style.display = 'inline-block';
                 if (buttonLoading) buttonLoading.style.display = 'none';
                 buttonElement.disabled = false;
            }
        }, 1500); // Adjust delay as needed
    }
}

// Function to show temporary success state on button
function showTemporarySuccess(buttonElement, originalTextElement) {
    const currentText = originalTextElement.innerHTML;
    originalTextElement.innerHTML = '<i class="fas fa-check mr-1"></i> Added!';
    originalTextElement.style.display = 'inline-block';

    const buttonLoading = buttonElement.querySelector('.button-loading');
    if (buttonLoading) buttonLoading.style.display = 'none';

    // Revert after a short period
    setTimeout(() => {
        originalTextElement.innerHTML = currentText;
        buttonElement.disabled = false;
    }, 1500); // Match delay in finally block or adjust
}

function contactSeller(productId) {
    // Implement contact seller functionality (e.g., open mailto link or modal)
    alert('Contact seller functionality coming soon for product: ' + productId);
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);
