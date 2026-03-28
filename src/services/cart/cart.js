/**
 * Shopping Cart Service
 * Manages user shopping carts
 */
import { products, getProduct, formatPrice } from '@/services/products/products.js';

// In-memory cart storage (in production, use MongoDB)
const userCarts = new Map();

/**
 * Get cart for a user
 */
export function getCart(userId) {
    if (!userCarts.has(userId)) {
        userCarts.set(userId, []);
    }
    return userCarts.get(userId);
}

/**
 * Add item to cart
 */
export function addToCart(userId, productId, quantity = 1) {
    const cart = getCart(userId);
    const product = getProduct(productId);
    
    if (!product) {
        return { success: false, error: 'Producto no encontrado' };
    }
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            description: product.description,
            unit_price: product.unit_price,
            quantity: quantity
        });
    }
    
    return { success: true, cart };
}

/**
 * Remove item from cart
 */
export function removeFromCart(userId, productId) {
    const cart = getCart(userId);
    const index = cart.findIndex(item => item.id === productId);
    
    if (index > -1) {
        cart.splice(index, 1);
        return { success: true, cart };
    }
    
    return { success: false, error: 'Producto no encontrado en el carrito' };
}

/**
 * Clear cart
 */
export function clearCart(userId) {
    userCarts.set(userId, []);
    return { success: true };
}

/**
 * Get cart total
 */
export function getCartTotal(userId) {
    const cart = getCart(userId);
    return cart.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
}

/**
 * Format cart for display
 */
export function getCartDisplay(userId) {
    const cart = getCart(userId);
    const total = getCartTotal(userId);
    
    if (cart.length === 0) {
        return {
            items: '🛒 Tu carrito está vacío',
            total: formatPrice(0),
            total_numeric: 0
        };
    }
    
    let itemsText = '';
    cart.forEach((item, index) => {
        const itemTotal = item.unit_price * item.quantity;
        itemsText += `${index + 1}. *${item.title}*\n`;
        itemsText += `   Cantidad: ${item.quantity} x ${formatPrice(item.unit_price)}\n`;
        itemsText += `   Subtotal: ${formatPrice(itemTotal)}\n\n`;
    });
    
    return {
        items: itemsText,
        total: formatPrice(total),
        total_numeric: total,
        item_count: cart.length
    };
}

/**
 * Get cart item count
 */
export function getCartItemCount(userId) {
    const cart = getCart(userId);
    return cart.reduce((count, item) => count + item.quantity, 0);
}

/**
 * Has items in cart
 */
export function hasItems(userId) {
    return getCart(userId) > 0;
}

export default {
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartDisplay,
    getCartItemCount,
    hasItems
};
