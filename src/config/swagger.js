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
                url: process.env.BACKEND_DOMAIN || 'http://localhost:8000',
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
                },
                UserResponse: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'user@example.com'
                        },
                        name: {
                            type: 'string',
                            example: 'John Doe'
                        },
                        roles: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            example: ['507f1f77bcf86cd799439012']
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        metadata: {
                            type: 'object',
                            example: { phone: '+1234567890' }
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                RoleResponse: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439012'
                        },
                        name: {
                            type: 'string',
                            example: 'admin'
                        },
                        description: {
                            type: 'string',
                            example: 'Administrator role'
                        },
                        permissions: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            example: ['507f1f77bcf86cd799439013']
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                PermissionResponse: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439013'
                        },
                        name: {
                            type: 'string',
                            example: 'users:read'
                        },
                        description: {
                            type: 'string',
                            example: 'Read user data'
                        },
                        resource: {
                            type: 'string',
                            example: 'users'
                        },
                        action: {
                            type: 'string',
                            example: 'read'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object'
                            }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                page: {
                                    type: 'integer',
                                    example: 1
                                },
                                limit: {
                                    type: 'integer',
                                    example: 20
                                },
                                total: {
                                    type: 'integer',
                                    example: 100
                                },
                                totalPages: {
                                    type: 'integer',
                                    example: 5
                                },
                                hasNext: {
                                    type: 'boolean',
                                    example: true
                                },
                                hasPrev: {
                                    type: 'boolean',
                                    example: false
                                }
                            }
                        }
                    }
                },
                SessionStatusResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'object',
                            properties: {
                                exists: {
                                    type: 'boolean',
                                    example: true
                                },
                                fileCount: {
                                    type: 'integer',
                                    example: 15
                                },
                                files: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    },
                                    example: ['creds.json', 'session-123.json']
                                }
                            }
                        }
                    }
                },
                WhatsAppStatusResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'object',
                            properties: {
                                isConnected: {
                                    type: 'boolean',
                                    example: true
                                },
                                provider: {
                                    type: 'string',
                                    example: 'baileys'
                                },
                                status: {
                                    type: 'string',
                                    example: 'connected'
                                }
                            }
                        }
                    }
                },
                SendMessageRequest: {
                    type: 'object',
                    required: ['jid', 'text'],
                    properties: {
                        jid: {
                            type: 'string',
                            example: '5491112345678@s.whatsapp.net',
                            description: 'Recipient WhatsApp JID'
                        },
                        text: {
                            type: 'string',
                            example: 'Hello!',
                            description: 'Message text'
                        }
                    }
                },
                SendMessageResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        messageId: {
                            type: 'string',
                            example: 'msg_123456'
                        },
                        error: {
                            type: 'string',
                            example: 'Error message'
                        }
                    }
                },
                ConnectionResponse: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        name: {
                            type: 'string',
                            example: 'WhatsApp Business'
                        },
                        provider: {
                            type: 'string',
                            enum: ['baileys', 'business-api'],
                            example: 'baileys'
                        },
                        phoneNumber: {
                            type: 'string',
                            example: '+1234567890'
                        },
                        webhookUrl: {
                            type: 'string',
                            example: 'https://example.com/webhook'
                        },
                        status: {
                            type: 'string',
                            enum: ['connected', 'disconnected', 'connecting', 'error'],
                            example: 'connected'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        metadata: {
                            type: 'object',
                            example: { "key": "value" }
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                ConnectionStatsResponse: {
                    type: 'object',
                    properties: {
                        connected: {
                            type: 'integer',
                            example: 5
                        },
                        disconnected: {
                            type: 'integer',
                            example: 10
                        },
                        connecting: {
                            type: 'integer',
                            example: 2
                        },
                        error: {
                            type: 'integer',
                            example: 1
                        },
                        total: {
                            type: 'integer',
                            example: 18
                        }
                    }
                },
                VehicleResponse: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        placa: {
                            type: 'string',
                            example: 'ABC123'
                        },
                        tipo: {
                            type: 'string',
                            enum: ['moto', 'auto', 'camioneta', 'bicicleta', 'camion', 'otro'],
                            example: 'moto'
                        },
                        marca: {
                            type: 'string',
                            example: 'Honda'
                        },
                        modelo: {
                            type: 'string',
                            example: 'CB190R'
                        },
                        color: {
                            type: 'string',
                            example: 'Negro'
                        },
                        capacidad: {
                            type: 'number',
                            example: 50
                        },
                        anio: {
                            type: 'number',
                            example: 2023
                        },
                        repartidor_id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011'
                        },
                        observaciones: {
                            type: 'string',
                            example: 'Vehículo en buen estado'
                        },
                        isActive: {
                            type: 'boolean',
                            example: true
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js', './src/server.js', './src/apiservices/users/routes/*.js', './src/apiservices/roles/routes/*.js', './src/apiservices/permissions/routes/*.js', './src/apiservices/products/routes/*.js', './src/apiservices/repartidores/routes/*.js', './src/apiservices/vehicles/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
