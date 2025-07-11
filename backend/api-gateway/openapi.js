const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ConsentHub API Gateway',
    version: '1.0.0',
    description: 'Unified API Gateway for ConsentHub Microservices - TMF Forum Compliant',
    contact: {
      name: 'SLT Mobitel',
      email: 'api@slt.lk',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      PartyPrivacyProfile: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          partyId: { type: 'string' },
          privacyProfileCharacteristic: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                value: { type: 'string' },
                privacyProfileCharacteristicType: { type: 'string' }
              }
            }
          },
          agreedByParty: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' }
            }
          },
          agreement: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              }
            }
          }
        }
      },
      ServiceConfiguration: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          serviceType: { type: 'string' },
          configuration: {
            type: 'object',
            additionalProperties: true
          }
        }
      },
      PrivacyNotice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          version: { type: 'string' },
          effectiveDate: { type: 'string', format: 'date-time' },
          expiryDate: { type: 'string', format: 'date-time' }
        }
      },
      Agreement: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          version: { type: 'string' },
          agreementType: { type: 'string' },
          status: { type: 'string' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Gateway Health Check',
        description: 'Check the health of the API Gateway and all connected services',
        responses: {
          '200': {
            description: 'Health status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    service: { type: 'string' },
                    status: { type: 'string' },
                    timestamp: { type: 'string' },
                    version: { type: 'string' },
                    services: {
                      type: 'object',
                      additionalProperties: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/services': {
      get: {
        summary: 'Service Discovery',
        description: 'List all available services and their endpoints',
        responses: {
          '200': {
            description: 'Service list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    services: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    endpoints: {
                      type: 'object',
                      additionalProperties: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/consent/privacyConsent': {
      post: {
        summary: 'Create Privacy Consent',
        description: 'TMF632 - Create a new privacy consent record',
        tags: ['Consent Management'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  partyId: { type: 'string' },
                  privacyNoticeId: { type: 'string' },
                  productId: { type: 'string' },
                  purpose: { type: 'string' },
                  status: { type: 'string', enum: ['granted', 'revoked', 'pending'] },
                  geoLocation: { type: 'string' },
                  validityPeriod: {
                    type: 'object',
                    properties: {
                      startDateTime: { type: 'string', format: 'date-time' },
                      endDateTime: { type: 'string', format: 'date-time' }
                    }
                  },
                  consentData: { type: 'object' }
                },
                required: ['partyId', 'purpose']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Privacy consent created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PartyPrivacyProfile' }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/v1/consent/privacyConsent/party/{partyId}': {
      get: {
        summary: 'Get Privacy Consents by Party ID',
        description: 'TMF632 - Retrieve privacy consents for a specific party',
        tags: ['Consent Management'],
        parameters: [
          {
            name: 'partyId',
            in: 'path',
            required: true,
            description: 'Party ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'List of privacy consents',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PartyPrivacyProfile' }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/v1/consent/privacyConsent/{id}': {
      get: {
        summary: 'Get Privacy Consent',
        description: 'TMF632 - Retrieve a specific privacy consent',
        tags: ['Consent Management'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Privacy consent ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Privacy consent details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PartyPrivacyProfile' }
              }
            }
          },
          '404': {
            description: 'Privacy consent not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      patch: {
        summary: 'Update Privacy Consent',
        description: 'TMF632 - Partially update a privacy consent',
        tags: ['Consent Management'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Privacy consent ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['granted', 'revoked', 'pending'] },
                  purpose: { type: 'string' },
                  geoLocation: { type: 'string' },
                  validityPeriod: {
                    type: 'object',
                    properties: {
                      startDateTime: { type: 'string', format: 'date-time' },
                      endDateTime: { type: 'string', format: 'date-time' }
                    }
                  },
                  consentData: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Privacy consent updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PartyPrivacyProfile' }
              }
            }
          },
          '404': {
            description: 'Privacy consent not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/v1/consent/privacyConsent/{id}/revoke': {
      patch: {
        summary: 'Revoke Privacy Consent',
        description: 'TMF632 - Revoke a specific privacy consent',
        tags: ['Consent Management'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Privacy consent ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Privacy consent revoked',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PartyPrivacyProfile' }
              }
            }
          },
          '404': {
            description: 'Privacy consent not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/v1/consent/privacyConsent/expired': {
      get: {
        summary: 'Get Expired Privacy Consents',
        description: 'TMF632 - Retrieve expired privacy consents',
        tags: ['Consent Management'],
        responses: {
          '200': {
            description: 'List of expired privacy consents',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PartyPrivacyProfile' }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/v1/preference/serviceConfiguration': {
      get: {
        summary: 'List Service Configurations',
        description: 'TMF641 - Retrieve list of service configurations',
        tags: ['Preference Management'],
        responses: {
          '200': {
            description: 'List of service configurations',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ServiceConfiguration' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create Service Configuration',
        description: 'TMF641 - Create a new service configuration',
        tags: ['Preference Management'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ServiceConfiguration' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Service configuration created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ServiceConfiguration' }
              }
            }
          }
        }
      }
    },
    '/api/v1/privacy-notice/privacyNotice': {
      get: {
        summary: 'List Privacy Notices',
        description: 'TMF651 - Retrieve list of privacy notices',
        tags: ['Privacy Notice Management'],
        responses: {
          '200': {
            description: 'List of privacy notices',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/PrivacyNotice' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create Privacy Notice',
        description: 'TMF651 - Create a new privacy notice',
        tags: ['Privacy Notice Management'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PrivacyNotice' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Privacy notice created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PrivacyNotice' }
              }
            }
          }
        }
      }
    },
    '/api/v1/agreement/agreement': {
      get: {
        summary: 'List Agreements',
        description: 'TMF669 - Retrieve list of agreements',
        tags: ['Agreement Management'],
        responses: {
          '200': {
            description: 'List of agreements',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Agreement' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create Agreement',
        description: 'TMF669 - Create a new agreement',
        tags: ['Agreement Management'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Agreement' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Agreement created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Agreement' }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Consent Management',
      description: 'TMF632 Party Privacy Profile API operations'
    },
    {
      name: 'Preference Management',
      description: 'TMF641 Service Configuration API operations'
    },
    {
      name: 'Privacy Notice Management',
      description: 'TMF651 Privacy Notice API operations'
    },
    {
      name: 'Agreement Management',
      description: 'TMF669 Party Agreement API operations'
    }
  ]
};

module.exports = openApiSpec;
