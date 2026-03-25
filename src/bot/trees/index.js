/**
 * Conversation Trees Index
 * Load all trees from the trees folder
 * Each tree is in its own file for easy maintenance
 */
import { ConversationEngine } from '../../core/ConversationTree.js';

// Import all trees
import { ventasTree } from './ventas.js';
import { asistenciaTree } from './asistencia.js';
import { mainMenuTree } from './mainMenu.js';

/**
 * Load all conversation trees into an engine
 * @returns {ConversationEngine} Engine with all trees registered
 */
export function loadAllTrees() {
    const engine = new ConversationEngine();
    
    // Register all trees - ORDER MATTERS!
    // Main menu must be registered first as it's the entry point
    engine.registerTree(mainMenuTree);
    engine.registerTree(ventasTree);
    engine.registerTree(asistenciaTree);
    
    return engine;
}

/**
 * Get list of available tree names
 * @returns {string[]} Array of tree names
 */
export function getTreeNames() {
    return ['main', 'ventas', 'asistencia'];
}

/**
 * Get tree by name
 * @param {string} name - Tree name
 * @param {ConversationEngine} engine - Engine instance
 * @returns {Object|null} Tree or null
 */
export function getTree(name, engine) {
    return engine.getTree(name);
}

export default { loadAllTrees, getTreeNames, getTree };
