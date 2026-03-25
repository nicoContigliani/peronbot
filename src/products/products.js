/**
 * Product Catalog
 * Contains all products available for sale
 */

export const products = {
    // Electronics
    'iphone15': {
        id: 'iphone15',
        title: 'iPhone 15 Pro Max',
        description: '256GB, Titanio Negro',
        category: 'electronica',
        unit_price: 120000,
        stock: 10,
        image: 'https://example.com/iphone15.jpg'
    },
    'samsung-s24': {
        id: 'samsung-s24',
        title: 'Samsung Galaxy S24 Ultra',
        description: '512GB, Titanium Gray',
        category: 'electronica',
        unit_price: 110000,
        stock: 15,
        image: 'https://example.com/samsung-s24.jpg'
    },
    'macbook-air': {
        id: 'macbook-air',
        title: 'MacBook Air M3',
        description: '16GB RAM, 512GB SSD',
        category: 'electronica',
        unit_price: 180000,
        stock: 8,
        image: 'https://example.com/macbook.jpg'
    },
    'airpods-pro': {
        id: 'airpods-pro',
        title: 'AirPods Pro 2da Gen',
        description: 'Con USB-C',
        category: 'electronica',
        unit_price: 45000,
        stock: 25,
        image: 'https://example.com/airpods.jpg'
    },
    
    // Clothing
    'remera-nike': {
        id: 'remera-nike',
        title: 'Remera Nike Dri-FIT',
        description: 'Negro, Talle L',
        category: 'ropa',
        unit_price: 15000,
        stock: 50,
        image: 'https://example.com/remera.jpg'
    },
    'zapatillas-adidas': {
        id: 'zapatillas-adidas',
        title: 'Zapatillas Adidas Ultraboost',
        description: 'Blancas, Talle 42',
        category: 'ropa',
        unit_price: 55000,
        stock: 20,
        image: 'https://example.com/zapatillas.jpg'
    },
    'campera-levis': {
        id: 'campera-levis',
        title: 'Campera de Jean Levis',
        description: 'Azul, Talle M',
        category: 'ropa',
        unit_price: 35000,
        stock: 15,
        image: 'https://example.com/campera.jpg'
    },
    
    // Home
    'lampara-led': {
        id: 'lampara-led',
        title: 'Lámpara LED de Mesa',
        description: 'Táctil, 3 niveles de brillo',
        category: 'hogar',
        unit_price: 8500,
        stock: 30,
        image: 'https://example.com/lampara.jpg'
    },
    'espejo-decorativo': {
        id: 'espejo-decorativo',
        title: 'Espejo Decorativo Redondo',
        description: '60cm, Marco Dorado',
        category: 'hogar',
        unit_price: 12000,
        stock: 12,
        image: 'https://example.com/espejo.jpg'
    },
    'set-ollas': {
        id: 'set-ollas',
        title: 'Set de Ollas Antiadherentes',
        description: '6 piezas, Tramontina',
        category: 'hogar',
        unit_price: 25000,
        stock: 18,
        image: 'https://example.com/ollas.jpg'
    }
};

/**
 * Get product by ID
 */
export function getProduct(productId) {
    return products[productId] || null;
}

/**
 * Get products by category
 */
export function getProductsByCategory(category) {
    return Object.values(products).filter(p => p.category === category);
}

/**
 * Get all categories
 */
export function getCategories() {
    return ['electronica', 'ropa', 'hogar'];
}

/**
 * Format price in Argentine Pesos
 */
export function formatPrice(price) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(price);
}

/**
 * Get products formatted for display
 */
export function getProductsFormatted() {
    const formatted = {};
    
    for (const [id, product] of Object.entries(products)) {
        if (!formatted[product.category]) {
            formatted[product.category] = [];
        }
        formatted[product.category].push({
            id,
            title: product.title,
            description: product.description,
            price: formatPrice(product.unit_price),
            unit_price: product.unit_price
        });
    }
    
    return formatted;
}

export default {
    products,
    getProduct,
    getProductsByCategory,
    getCategories,
    formatPrice,
    getProductsFormatted
};
