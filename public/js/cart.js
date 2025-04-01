const token = localStorage.getItem('token');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalElement = document.getElementById('cartTotal');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const checkoutArea = document.getElementById('checkoutArea');
const checkoutButton = document.getElementById('checkoutButton');

// Helper function to format currency (reuse if needed)
const formatCurrency = (amount) => {
    // Handle potential non-numeric input gracefully
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
        return '₱ -.--'; // Or some other placeholder
    }
    return `₱${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

async function loadCart() {
    // Clear previous items and show loading/default state
    cartItemsContainer.innerHTML = ''; // Clear previous items
    emptyCartMessage.classList.add('hidden');
    checkoutArea.classList.add('hidden');
    checkoutButton.disabled = true;
    // Optional: Add a loading indicator inside cartItemsContainer
    // cartItemsContainer.innerHTML = '<p class="text-center text-gray-500 py-8"><i class="fas fa-spinner fa-spin mr-2"></i>Loading cart...</p>';

    try {
        const response = await fetch('/api/cart', {
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
            throw new Error(`Failed to load cart (${response.status})`);
        }

        const cart = await response.json();

        // Check if cart and products exist
        if (!cart || !Array.isArray(cart.products) || cart.products.length === 0) {
            displayEmptyCart();
        } else {
            displayCartItems(cart.products);
        }

    } catch (error) {
        console.error('Error loading cart:', error);
        displayError('Failed to load cart. Please try again later.');
    }
}

function displayCartItems(products) {
    cartItemsContainer.innerHTML = ''; // Clear loading/previous state
    emptyCartMessage.classList.add('hidden'); // Hide empty message
    checkoutArea.classList.remove('hidden'); // Show checkout area
    checkoutButton.disabled = false; // Enable checkout button

    let total = 0;
    products.forEach(item => {
        // Validate item structure
        const product = item.productId;
        const quantity = item.quantity || 0;

        if (!product || !product._id) {
            console.warn('Skipping invalid cart item:', item);
            return; // Skip this item if product data is missing
        }

        const name = product.name || 'Unnamed Product';
        const price = typeof product.price === 'number' ? product.price : 0;
        const image = product.image || '/images/placeholder.png';
        const id = product._id;
        const itemTotal = quantity * price;
        total += itemTotal;

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item flex flex-col sm:flex-row items-center border border-gray-200 rounded-lg p-4 gap-4 sm:gap-6 transition-shadow duration-200 hover:shadow-md animate-fade-in';
        itemElement.innerHTML = `
            <img src="${image}" alt="${name}" class="w-24 h-24 object-cover rounded-md flex-shrink-0" onerror="this.onerror=null;this.src='/images/placeholder.png';">
            <div class="flex-grow text-center sm:text-left">
                <h3 class="text-lg font-semibold text-gray-800">${name}</h3>
                <p class="text-gray-600">Price: ${formatCurrency(price)}</p>
                <p class="text-sm text-gray-500">Quantity: ${quantity}</p>
                <p class="text-sm font-medium text-gray-700">Subtotal: ${formatCurrency(itemTotal)}</p>
            </div>
            <div class="mt-4 sm:mt-0">
                <button class="btn btn-danger btn-sm px-3 py-1" data-product-id="${id}">
                    <i class="fas fa-trash-alt mr-1"></i> Remove
                </button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);

        // Add event listener directly to the button
        itemElement.querySelector('button').addEventListener('click', () => {
            removeFromCart(id, itemElement); // Pass itemElement to remove visually
        });
    });

    // Update total in the header
    if (cartTotalElement) {
        cartTotalElement.innerHTML = `Total: <span class="text-primary-600">${formatCurrency(total)}</span>`;
    }
}

function displayEmptyCart() {
    cartItemsContainer.innerHTML = ''; // Clear items
    emptyCartMessage.classList.remove('hidden'); // Show empty message
    checkoutArea.classList.add('hidden'); // Hide checkout area
    checkoutButton.disabled = true; // Disable checkout button
    if (cartTotalElement) {
         cartTotalElement.innerHTML = `Total: <span class="text-primary-600">${formatCurrency(0)}</span>`;
    }
}

function displayError(message) {
    cartItemsContainer.innerHTML = `
        <div class="alert alert-error justify-center">
             <i class="fas fa-exclamation-circle alert-icon"></i>
            ${message}
        </div>
    `;
    emptyCartMessage.classList.add('hidden');
    checkoutArea.classList.add('hidden');
    checkoutButton.disabled = true;
    if (cartTotalElement) {
         cartTotalElement.innerHTML = `Total: <span class="text-primary-600">--.--</span>`; // Indicate error in total
    }
}


async function removeFromCart(productId, itemElement) {
    // Optional: Add visual feedback (e.g., dimming the item)
    if (itemElement) {
        itemElement.style.opacity = '0.5';
        itemElement.style.pointerEvents = 'none';
    }

    try {
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to remove item (${response.status})`);
        }

        // Successfully removed on the server, now update UI
        console.log('Item removed, reloading cart data...');
        await loadCart(); // Reload the entire cart to ensure consistency
        await updateCartBadge(); // Update badge in navbar

    } catch (error) {
        console.error('Error removing item from cart:', error);
        alert(`Failed to remove item: ${error.message}`);
        // Revert visual feedback if itemElement was passed
        if (itemElement) {
            itemElement.style.opacity = '1';
            itemElement.style.pointerEvents = 'auto';
        }
    }
}

// Add event listener for the checkout button
if(checkoutButton) {
    checkoutButton.addEventListener('click', () => {
        // Implement actual checkout logic here (e.g., redirect to payment page)
        alert('Checkout functionality is not implemented yet.');
        // Example: window.location.href = '/checkout';
    });
}

// Initial load of the cart when the page is ready
document.addEventListener('DOMContentLoaded', loadCart);
