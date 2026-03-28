/**
 * Products Service
 * Manages product data and utilities
 */

// Sample products data (in production, this would come from a database)
export const products = [
    {
        id: 1,
        title: 'Producto 1',
        description: 'Descripción del producto 1',
        unit_price: 1000,
        category: 'general'
    },
    {
        id: 2,
        title: 'Producto 2',
        description: 'Descripción del producto 2',
        unit_price: 2000,
        category: 'general'
    },
    {
        id: 3,
        title: 'Producto 3',
        description: 'Descripción del producto 3',
        unit_price: 3000,
        category: 'general'
    }
];

/**
 * Get a product by ID
 * @param {number} productId - The product ID
 * @returns {object|undefined} The product or undefined if not found
 */
export function getProduct(productId) {
    return products.find(product => product.id === productId);
}

/**
 * Format price in Argentine Pesos
 * @param {number} price - The price to format
 * @returns {string} Formatted price string
 */
export function formatPrice(price) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(price);
}

/**
 * Get all products
 * @returns {array} Array of all products
 */
export function getAllProducts() {
    return products;
}

/**
 * Get products by category
 * @param {string} category - The category to filter by
 * @returns {array} Array of products in the category
 */
export function getProductsByCategory(category) {
    return products.filter(product => product.category === category);
}

export default {
    products,
    getProduct,
    formatPrice,
    getAllProducts,
    getProductsByCategory
};
