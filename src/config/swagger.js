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
                }
            }
        }
    },
    apis: ['./src/routes/*.js', './src/server.js', './src/users/routes/*.js', './src/roles/routes/*.js', './src/permissions/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
