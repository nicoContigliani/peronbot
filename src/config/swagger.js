/**
 * Swagger Configuration
 * API documentation setup using swagger-jsdoc and swagger-ui-express
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Bototo API',
            version: '1.0.0',
            description: 'WhatsApp Bot API with file processing and Supabase integration',
            contact: {
                name: 'Bototo Support'
            },
            license: {
                name: 'ISC'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                ClerkAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Clerk authentication token. Obtain from Clerk authentication flow.'
                }
            },
            schemas: {
                FileUploadResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'File processed successfully'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                filename: {
                                    type: 'string',
                                    example: 'data.xlsx'
                                },
                                parsed: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean'
                                        },
                                        sheets: {
                                            type: 'array',
                                            items: {
                                                type: 'string'
                                            }
                                        },
                                        data: {
                                            type: 'object'
                                        }
                                    }
                                },
                                uploaded: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean'
                                        },
                                        path: {
                                            type: 'string'
                                        },
                                        publicUrl: {
                                            type: 'string'
                                        },
                                        filename: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                ParseResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'File parsed successfully'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                success: {
                                    type: 'boolean'
                                },
                                sheets: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    }
                                },
                                headers: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    }
                                },
                                data: {
                                    type: 'object'
                                }
                            }
                        }
                    }
                },
                FileListResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string'
                                    },
                                    id: {
                                        type: 'string'
                                    },
                                    updated_at: {
                                        type: 'string'
                                    },
                                    created_at: {
                                        type: 'string'
                                    },
                                    last_accessed_at: {
                                        type: 'string'
                                    },
                                    metadata: {
                                        type: 'object'
                                    }
                                }
                            }
                        }
                    }
                },
                DeleteResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'File deleted successfully'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                success: {
                                    type: 'boolean'
                                },
                                deleted: {
                                    type: 'array',
                                    items: {
                                        type: 'object'
                                    }
                                }
                            }
                        }
                    }
                },
                BatchUploadResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'Processed 3 files successfully'
                        },
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/FileUploadResponse/properties/data'
                            }
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            example: 'Error message'
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js', './src/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
