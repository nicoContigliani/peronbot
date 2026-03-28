/**
 * Conversation Tree Engine
 * Core module for managing reusable conversation trees
 * Supports multiple trees, conditional flows, and dynamic responses
 */
import pino from 'pino';
import config from '@/config/env.js';

const logger = pino({ level: config.logging.level });

/**
 * Node types available in conversation trees
 */
export const NodeType = {
    TEXT: 'text',           // Simple text response
    MENU: 'menu',           // Multiple choice menu
    INPUT: 'input',         // Request user input
    CONDITION: 'condition', // Conditional branching
    ACTION: 'action',       // Execute an action
    TRANSFER: 'transfer',   // Transfer to another tree
    END: 'end'              // End conversation
};

/**
 * Conversation Tree Builder
 * Create reusable conversation trees with this fluent API
 */
export class ConversationTree {
    constructor(name, description = '') {
        this.name = name;
        this.description = description;
        this.nodes = new Map();
        this.variables = new Map();
        this.rootNode = null;
        this.active = true;
        this.metadata = {};
    }

    /**
     * Add a text response node
     * @param {string} id - Node ID
     * @param {string} text - Response text
     * @param {string} next - Next node ID (optional)
     * @returns {ConversationTree} this
     */
    addTextNode(id, text, next = null) {
        this.nodes.set(id, {
            type: NodeType.TEXT,
            text: this.parseText(text),
            next
        });
        return this;
    }

    /**
     * Add a menu node with options
     * @param {string} id - Node ID
     * @param {string} text - Menu text
     * @param {Object} options - Options map { key: { text, next } }
     * @returns {ConversationTree} this
     */
    addMenuNode(id, text, options) {
        this.nodes.set(id, {
            type: NodeType.MENU,
            text: this.parseText(text),
            options: this.parseOptions(options)
        });
        return this;
    }

    /**
     * Add an input node
     * @param {string} id - Node ID
     * @param {string} text - Prompt text
     * @param {string} variable - Variable name to store input
     * @param {string} next - Next node ID
     * @param {Function} validator - Optional validator function
     * @returns {ConversationTree} this
     */
    addInputNode(id, text, variable, next, validator = null) {
        this.nodes.set(id, {
            type: NodeType.INPUT,
            text: this.parseText(text),
            variable,
            next,
            validator
        });
        return this;
    }

    /**
     * Add a condition node
     * @param {string} id - Node ID
     * @param {string} variable - Variable to check
     * @param {Object} conditions - Conditions { value: nextNodeId, ... }
     * @param {string} defaultNext - Default next node if no condition matches
     * @returns {ConversationTree} this
     */
    addConditionNode(id, variable, conditions, defaultNext = null) {
        this.nodes.set(id, {
            type: NodeType.CONDITION,
            variable,
            conditions,
            defaultNext
        });
        return this;
    }

    /**
     * Add an action node
     * @param {string} id - Node ID
     * @param {Function} action - Action to execute
     * @param {string} next - Next node ID
     * @returns {ConversationTree} this
     */
    addActionNode(id, action, next) {
        this.nodes.set(id, {
            type: NodeType.ACTION,
            action,
            next
        });
        return this;
    }

    /**
     * Add a transfer node
     * @param {string} id - Node ID
     * @param {string} treeName - Target tree name
     * @param {string} nodeId - Target node ID in the new tree
     * @returns {ConversationTree} this
     */
    addTransferNode(id, treeName, nodeId = 'root') {
        this.nodes.set(id, {
            type: NodeType.TRANSFER,
            treeName,
            nodeId
        });
        return this;
    }

    /**
     * Add an end node
     * @param {string} id - Node ID
     * @param {string} text - Final message
     * @returns {ConversationTree} this
     */
    addEndNode(id, text = '') {
        this.nodes.set(id, {
            type: NodeType.END,
            text: this.parseText(text)
        });
        return this;
    }

    /**
     * Set the root node
     * @param {string} id - Root node ID
     * @returns {ConversationTree} this
     */
    setRoot(id) {
        if (!this.nodes.has(id)) {
            throw new Error(`Node "${id}" does not exist`);
        }
        this.rootNode = id;
        return this;
    }

    /**
     * Add a variable to the tree
     * @param {string} name - Variable name
     * @param {*} value - Variable value
     * @returns {ConversationTree} this
     */
    addVariable(name, value) {
        this.variables.set(name, value);
        return this;
    }

    /**
     * Parse text with variable interpolation
     * @param {string} text - Text with {{variable}} placeholders
     * @returns {Function} Function that returns interpolated text
     */
    parseText(text) {
        if (typeof text !== 'string') return () => text;
        return (context = {}) => {
            return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                return context[key] !== undefined ? context[key] : match;
            });
        };
    }

    /**
     * Parse options with text interpolation
     * @param {Object} options - Raw options
     * @returns {Object} Parsed options
     */
    parseOptions(options) {
        const parsed = {};
        for (const [key, value] of Object.entries(options)) {
            parsed[key] = {
                text: typeof value.text === 'function' ? value.text : () => value.text,
                next: value.next
            };
        }
        return parsed;
    }

    /**
     * Get a node by ID
     * @param {string} id - Node ID
     * @returns {Object|null} Node object
     */
    getNode(id) {
        return this.nodes.get(id) || null;
    }

    /**
     * Get the root node
     * @returns {Object|null} Root node
     */
    getRootNode() {
        return this.rootNode ? this.nodes.get(this.rootNode) : null;
    }

    /**
     * Export tree as JSON-serializable object
     * @returns {Object} Exportable tree object
     */
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            nodes: Array.from(this.nodes.entries()).reduce((acc, [key, val]) => {
                // Remove functions for serialization
                acc[key] = { ...val, action: val.action?.toString(), validator: val.validator?.toString() };
                return acc;
            }, {}),
            variables: Object.fromEntries(this.variables),
            rootNode: this.rootNode,
            active: this.active,
            metadata: this.metadata
        };
    }

    /**
     * Build and validate the tree
     * @throws Error if tree is invalid
     */
    build() {
        if (!this.rootNode) {
            throw new Error('Tree must have a root node');
        }

        // Validate all referenced nodes exist
        for (const [id, node] of this.nodes) {
            if (node.next && !this.nodes.has(node.next)) {
                logger.warn(`Node "${id}" references non-existent node "${node.next}"`);
            }
            
            if (node.type === NodeType.MENU && node.options) {
                for (const opt of Object.values(node.options)) {
                    if (opt.next && !this.nodes.has(opt.next)) {
                        logger.warn(`Menu in node "${id}" references non-existent node "${opt.next}"`);
                    }
                }
            }
            
            if (node.type === NodeType.CONDITION && node.conditions) {
                for (const next of Object.values(node.conditions)) {
                    if (next && !this.nodes.has(next)) {
                        logger.warn(`Condition in node "${id}" references non-existent node "${next}"`);
                    }
                }
            }
        }

        logger.info(`✅ Tree "${this.name}" built with ${this.nodes.size} nodes`);
        return this;
    }
}

/**
 * Conversation Engine
 * Manages conversation trees and user states
 */
export class ConversationEngine {
    constructor() {
        this.trees = new Map();
        this.userStates = new Map();
    }

    /**
     * Register a conversation tree
     * @param {ConversationTree} tree - Tree to register
     */
    registerTree(tree) {
        tree.build();
        this.trees.set(tree.name, tree);
        logger.info(`📋 Registered conversation tree: "${tree.name}"`);
    }

    /**
     * Register multiple trees at once
     * @param {ConversationTree[]} trees - Array of trees
     */
    registerTrees(trees) {
        trees.forEach(tree => this.registerTree(tree));
    }

    /**
     * Get a tree by name
     * @param {string} name - Tree name
     * @returns {ConversationTree|null}
     */
    getTree(name) {
        return this.trees.get(name) || null;
    }

    /**
     * List all registered trees
     * @returns {string[]} Array of tree names
     */
    listTrees() {
        return Array.from(this.trees.keys());
    }

    /**
     * Start a conversation for a user
     * @param {string} userId - User identifier
     * @param {string} treeName - Tree name to start
     * @param {string} nodeId - Optional specific node to start from
     * @param {Object} initialContext - Initial context variables
     * @returns {Object} Initial node data
     */
    startConversation(userId, treeName, nodeId = null, initialContext = {}) {
        const tree = this.getTree(treeName);
        if (!tree) {
            throw new Error(`Tree "${treeName}" not found`);
        }

        const startNode = nodeId || tree.rootNode;
        
        this.userStates.set(userId, {
            treeName,
            currentNode: startNode,
            context: { ...initialContext },
            startedAt: new Date(),
            lastActivity: new Date()
        });

        logger.info(`🚀 Started conversation for user ${userId} with tree "${treeName}" at node "${startNode}"`);
        
        return this.processNode(userId, startNode);
    }

    /**
     * Process user input and return next node
     * @param {string} userId - User identifier
     * @param {string} input - User input
     * @returns {Object} Next node data
     */
    async processInput(userId, input) {
        const state = this.userStates.get(userId);
        if (!state) {
            throw new Error(`No active conversation for user ${userId}`);
        }

        const tree = this.getTree(state.treeName);
        if (!tree) {
            throw new Error(`Tree "${state.treeName}" not found`);
        }

        const currentNode = tree.getNode(state.currentNode);
        if (!currentNode) {
            throw new Error(`Node "${state.currentNode}" not found in tree "${state.treeName}"`);
        }

        state.lastActivity = new Date();
        let nextNodeId = null;

        // Process based on node type
        switch (currentNode.type) {
            case NodeType.MENU:
                // Check if input matches an option key (supports numbers and text)
                // First try exact match, then try lowercase
                let option = currentNode.options?.[input];
                if (!option) {
                    option = currentNode.options?.[input.toLowerCase()];
                }
                if (option) {
                    nextNodeId = option.next;
                    // Store the selected option key for conditions
                    state.context.selectedOption = input;
                } else {
                    // Invalid option, stay on current node
                    // Show available options
                    const availableOptions = Object.keys(currentNode.options || {}).join(', ');
                    return {
                        ...currentNode,
                        error: `Opción inválida. Por favor elegí: ${availableOptions}`,
                        retry: true
                    };
                }
                break;

            case NodeType.INPUT:
                // Validate input if validator exists
                if (currentNode.validator) {
                    try {
                        const isValid = await currentNode.validator(input, state.context);
                        if (!isValid) {
                            return {
                                ...currentNode,
                                error: 'Invalid input. Please try again.',
                                retry: true
                            };
                        }
                    } catch (error) {
                        logger.error('Validator error:', error);
                    }
                }
                
                // Store input in context
                state.context[currentNode.variable] = input;
                nextNodeId = currentNode.next;
                break;

            case NodeType.CONDITION:
                // Evaluate condition
                const value = state.context[currentNode.variable];
                nextNodeId = currentNode.conditions[value] || currentNode.defaultNext;
                break;

            case NodeType.ACTION:
                // Execute action
                try {
                    await currentNode.action(state.context, { userId, input });
                } catch (error) {
                    logger.error('Action error:', error);
                }
                nextNodeId = currentNode.next;
                break;

            default:
                nextNodeId = currentNode.next;
        }

        if (!nextNodeId) {
            // End of conversation
            this.endConversation(userId);
            return {
                type: NodeType.END,
                text: 'Conversation ended.'
            };
        }

        // Check if transferring to another tree
        const nextNode = tree.getNode(nextNodeId);
        if (nextNode?.type === NodeType.TRANSFER) {
            return this.startConversation(userId, nextNode.treeName, nextNode.nodeId, state.context);
        }

        // Update state and process next node
        state.currentNode = nextNodeId;
        
        return this.processNode(userId, nextNodeId);
    }

    /**
     * Process a node and return its data
     * @param {string} userId - User identifier
     * @param {string} nodeId - Node ID to process
     * @returns {Object} Node data
     */
    processNode(userId, nodeId) {
        const state = this.userStates.get(userId);
        const tree = this.getTree(state.treeName);
        const node = tree.getNode(nodeId);

        if (!node) {
            throw new Error(`Node "${nodeId}" not found`);
        }

        // Generate text with context
        let text = '';
        if (node.text) {
            text = typeof node.text === 'function' 
                ? node.text(state.context) 
                : node.text;
        }

        return {
            ...node,
            text,
            nodeId
        };
    }

    /**
     * Get current conversation state for a user
     * @param {string} userId - User identifier
     * @returns {Object|null} User state
     */
    getUserState(userId) {
        return this.userStates.get(userId) || null;
    }

    /**
     * Check if user has active conversation
     * @param {string} userId - User identifier
     * @returns {boolean}
     */
    hasActiveConversation(userId) {
        return this.userStates.has(userId);
    }

    /**
     * End conversation for a user
     * @param {string} userId - User identifier
     */
    endConversation(userId) {
        const state = this.userStates.get(userId);
        if (state) {
            logger.info(`👋 Ended conversation for user ${userId} (started ${state.startedAt})`);
            this.userStates.delete(userId);
        }
    }

    /**
     * Reset conversation for a user (start over)
     * @param {string} userId - User identifier
     * @returns {Object|null} New conversation data
     */
    async resetConversation(userId) {
        const state = this.userStates.get(userId);
        if (state) {
            return this.startConversation(userId, state.treeName);
        }
        return null;
    }

    /**
     * Get all active conversations (for monitoring)
     * @returns {Map} User states
     */
    getActiveConversations() {
        return new Map(this.userStates);
    }
}

export default {
    ConversationTree,
    ConversationEngine,
    NodeType
};
