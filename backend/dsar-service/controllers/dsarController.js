const DSARRequest = require('../models/DSARRequest');
const { generateUUID, logger, createAuditLog } = require('../../shared/utils');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const { Parser } = require('json2csv');
const { PDFDocument, rgb } = require('pdf-lib');

class DSARController {
  // Get all DSAR requests (simplified for dashboard)
  async getAllDsarRequests(req, res) {
    try {
      logger.info('Mock fetching all DSAR requests for dashboard');
      
      const mockDsarRequests = [
        {
          id: 'dsar-001',
          partyId: 'party-nimal-001',
          requestType: 'access',
          status: 'completed',
          submissionDetails: {
            submittedBy: 'nimal@example.com',
            submissionMethod: 'web_portal',
            contactPreference: 'email'
          },
          createdAt: '2024-01-10T09:30:00Z',
          updatedAt: '2024-01-25T14:20:00Z'
        },
        {
          id: 'dsar-002',
          partyId: 'party-customer-002',
          requestType: 'erasure',
          status: 'pending',
          submissionDetails: {
            submittedBy: 'customer2@example.com',
            submissionMethod: 'email',
            contactPreference: 'phone'
          },
          createdAt: '2024-02-05T11:15:00Z',
          updatedAt: '2024-02-05T11:15:00Z'
        },
        {
          id: 'dsar-003',
          partyId: 'party-customer-003',
          requestType: 'portability',
          status: 'in_progress',
          submissionDetails: {
            submittedBy: 'customer3@example.com',
            submissionMethod: 'web_portal',
            contactPreference: 'email'
          },
          createdAt: '2024-02-15T16:45:00Z',
          updatedAt: '2024-02-20T10:30:00Z'
        }
      ];

      res.status(200).json(mockDsarRequests);
    } catch (error) {
      logger.error('Error fetching all DSAR requests:', error);
      res.status(500).json({ error: 'Failed to fetch DSAR requests' });
    }
  }

  // Create new DSAR request
  async createDSARRequest(req, res) {
    try {
      const requestData = {
        id: generateUUID(),
        partyId: req.body.partyId,
        requestType: req.body.requestType,
        requestDetails: req.body.requestDetails,
        submissionDetails: {
          submittedBy: req.user.uid,
          submissionMethod: req.body.submissionMethod || 'web_portal',
          contactPreference: req.body.contactPreference || 'email',
          urgentRequest: req.body.urgentRequest || false,
        },
        compliance: {
          legalBasis: this.getLegalBasis(req.body.requestType),
          responseTimeLimit: req.body.urgentRequest ? 7 : 30,
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          geoLocation: req.body.geoLocation,
          language: req.body.language || 'en',
          jurisdiction: req.body.jurisdiction || 'LK',
        },
      };

      const dsarRequest = new DSARRequest(requestData);
      await dsarRequest.save();

      // Create audit log
      await createAuditLog(
        'CREATE_DSAR_REQUEST',
        req.user.uid,
        'dsar-service',
        { 
          requestId: dsarRequest.id, 
          partyId: dsarRequest.partyId,
          requestType: dsarRequest.requestType 
        }
      );

      // Emit event
      await this.emitDSAREvent('DSARRequestCreated', dsarRequest);

      // Send acknowledgment communication
      await this.sendAcknowledgment(dsarRequest);

      logger.info(`DSAR request created: ${dsarRequest.id}`);
      res.status(201).json(dsarRequest);
    } catch (error) {
      logger.error('Error creating DSAR request:', error);
      res.status(500).json({ error: 'Failed to create DSAR request' });
    }
  }

  // Get DSAR requests by party ID
  async getDSARRequestsByParty(req, res) {
    try {
      const { partyId } = req.params;
      const { status, requestType, limit = 10, offset = 0 } = req.query;

      // Check if user has permission to access this party's requests
      if (req.user.role === 'customer' && partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const filter = { partyId };
      if (status) filter.status = status;
      if (requestType) filter.requestType = requestType;

      const requests = await DSARRequest.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      const total = await DSARRequest.countDocuments(filter);

      res.json({
        requests,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total,
        },
      });
    } catch (error) {
      logger.error('Error fetching DSAR requests:', error);
      res.status(500).json({ error: 'Failed to fetch DSAR requests' });
    }
  }

  // Get DSAR request by ID
  async getDSARRequestById(req, res) {
    try {
      const { id } = req.params;
      const request = await DSARRequest.findOne({ id });

      if (!request) {
        return res.status(404).json({ error: 'DSAR request not found' });
      }

      // Check permissions
      if (req.user.role === 'customer' && request.partyId !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      res.json(request);
    } catch (error) {
      logger.error('Error fetching DSAR request:', error);
      res.status(500).json({ error: 'Failed to fetch DSAR request' });
    }
  }

  // Update DSAR request status
  async updateDSARRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, processingNotes, assignedTo } = req.body;

      const request = await DSARRequest.findOne({ id });
      if (!request) {
        return res.status(404).json({ error: 'DSAR request not found' });
      }

      const previousStatus = request.status;
      request.status = status;
      
      if (processingNotes) {
        request.processingDetails.processingNotes.push(processingNotes);
      }
      
      if (assignedTo) {
        request.processingDetails.assignedTo = assignedTo;
        request.processingDetails.assignedDate = new Date();
      }

      if (status === 'completed') {
        request.processingDetails.actualCompletion = new Date();
      }

      await request.save();

      // Create audit log
      await createAuditLog(
        'UPDATE_DSAR_STATUS',
        req.user.uid,
        'dsar-service',
        { 
          requestId: request.id, 
          previousStatus, 
          newStatus: status,
          assignedTo 
        }
      );

      // Emit event
      await this.emitDSAREvent('DSARRequestStatusChanged', request);

      // Send status update notification
      await this.sendStatusUpdateNotification(request, previousStatus);

      logger.info(`DSAR request status updated: ${request.id} - ${status}`);
      res.json(request);
    } catch (error) {
      logger.error('Error updating DSAR request status:', error);
      res.status(500).json({ error: 'Failed to update DSAR request status' });
    }
  }

  // Process data access request
  async processDataAccessRequest(req, res) {
    try {
      const { id } = req.params;
      const request = await DSARRequest.findOne({ id });

      if (!request) {
        return res.status(404).json({ error: 'DSAR request not found' });
      }

      if (request.requestType !== 'access') {
        return res.status(400).json({ error: 'Invalid request type for data access' });
      }

      // Collect data from all services
      const userData = await this.collectUserData(request.partyId, request.requestDetails);
      
      // Generate response document
      const responseFile = await this.generateDataAccessResponse(request, userData);
      
      // Update request with fulfillment details
      request.fulfillment.dataExtracted = true;
      request.fulfillment.extractionDate = new Date();
      request.fulfillment.dataSize = responseFile.size;
      request.fulfillment.recordCount = userData.totalRecords;
      request.fulfillment.deliveryMethod = 'download_link';
      request.fulfillment.expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      request.status = 'completed';
      request.processingDetails.actualCompletion = new Date();

      await request.save();

      // Create audit log
      await createAuditLog(
        'PROCESS_DATA_ACCESS',
        req.user.uid,
        'dsar-service',
        { 
          requestId: request.id, 
          dataSize: responseFile.size,
          recordCount: userData.totalRecords 
        }
      );

      // Emit event
      await this.emitDSAREvent('DSARDataAccessCompleted', request);

      logger.info(`Data access request processed: ${request.id}`);
      res.json({
        message: 'Data access request processed successfully',
        downloadUrl: responseFile.downloadUrl,
        expiryDate: request.fulfillment.expiryDate,
        dataSize: responseFile.size,
        recordCount: userData.totalRecords,
      });
    } catch (error) {
      logger.error('Error processing data access request:', error);
      res.status(500).json({ error: 'Failed to process data access request' });
    }
  }

  // Process data erasure request
  async processDataErasureRequest(req, res) {
    try {
      const { id } = req.params;
      const { confirmation } = req.body;

      if (!confirmation) {
        return res.status(400).json({ error: 'Confirmation required for data erasure' });
      }

      const request = await DSARRequest.findOne({ id });
      if (!request) {
        return res.status(404).json({ error: 'DSAR request not found' });
      }

      if (request.requestType !== 'erasure') {
        return res.status(400).json({ error: 'Invalid request type for data erasure' });
      }

      // Perform data erasure across all services
      const erasureResults = await this.performDataErasure(request.partyId, request.requestDetails);
      
      // Update request status
      request.status = 'completed';
      request.processingDetails.actualCompletion = new Date();
      request.fulfillment.dataExtracted = true;
      request.fulfillment.extractionDate = new Date();
      request.fulfillment.recordCount = erasureResults.deletedRecords;

      await request.save();

      // Create audit log
      await createAuditLog(
        'PROCESS_DATA_ERASURE',
        req.user.uid,
        'dsar-service',
        { 
          requestId: request.id, 
          deletedRecords: erasureResults.deletedRecords,
          affectedServices: erasureResults.affectedServices 
        }
      );

      // Emit event
      await this.emitDSAREvent('DSARDataErasureCompleted', request);

      logger.info(`Data erasure request processed: ${request.id}`);
      res.json({
        message: 'Data erasure request processed successfully',
        deletedRecords: erasureResults.deletedRecords,
        affectedServices: erasureResults.affectedServices,
      });
    } catch (error) {
      logger.error('Error processing data erasure request:', error);
      res.status(500).json({ error: 'Failed to process data erasure request' });
    }
  }

  // Get all DSAR requests (admin/CSR only)
  async getAllDSARRequests(req, res) {
    try {
      logger.info('Mock fetching all DSAR requests for dashboard (getAllDSARRequests)');
      
      const mockDsarRequests = [
        {
          id: 'dsar-001',
          partyId: 'party-nimal-001',
          requestType: 'access',
          status: 'completed',
          submissionDetails: {
            submittedBy: 'nimal@example.com',
            submissionMethod: 'web_portal',
            contactPreference: 'email'
          },
          createdAt: '2024-01-10T09:30:00Z',
          updatedAt: '2024-01-25T14:20:00Z'
        },
        {
          id: 'dsar-002',
          partyId: 'party-customer-002',
          requestType: 'erasure',
          status: 'pending',
          submissionDetails: {
            submittedBy: 'customer2@example.com',
            submissionMethod: 'email',
            contactPreference: 'phone'
          },
          createdAt: '2024-02-05T11:15:00Z',
          updatedAt: '2024-02-05T11:15:00Z'
        },
        {
          id: 'dsar-003',
          partyId: 'party-customer-003',
          requestType: 'portability',
          status: 'in_progress',
          submissionDetails: {
            submittedBy: 'customer3@example.com',
            submissionMethod: 'web_portal',
            contactPreference: 'email'
          },
          createdAt: '2024-02-15T16:45:00Z',
          updatedAt: '2024-02-20T10:30:00Z'
        }
      ];

      res.json({
        requests: mockDsarRequests,
        pagination: {
          total: mockDsarRequests.length,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      });
    } catch (error) {
      logger.error('Error fetching all DSAR requests:', error);
      res.status(500).json({ error: 'Failed to fetch DSAR requests' });
    }
  }

  // Get DSAR compliance report
  async getComplianceReport(req, res) {
    try {
      const { startDate, endDate, jurisdiction } = req.query;

      const filter = {};
      if (startDate && endDate) {
        filter['submissionDetails.submissionDate'] = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      if (jurisdiction) {
        filter['metadata.jurisdiction'] = jurisdiction;
      }

      const requests = await DSARRequest.find(filter);

      const report = {
        totalRequests: requests.length,
        byStatus: {},
        byType: {},
        byJurisdiction: {},
        averageResponseTime: 0,
        complianceRate: 0,
        overdueRequests: 0,
      };

      let totalResponseTime = 0;
      let completedRequests = 0;
      let compliantRequests = 0;

      requests.forEach(request => {
        // Count by status
        report.byStatus[request.status] = (report.byStatus[request.status] || 0) + 1;
        
        // Count by type
        report.byType[request.requestType] = (report.byType[request.requestType] || 0) + 1;
        
        // Count by jurisdiction
        report.byJurisdiction[request.metadata.jurisdiction] = (report.byJurisdiction[request.metadata.jurisdiction] || 0) + 1;
        
        // Calculate response time for completed requests
        if (request.status === 'completed' && request.processingDetails.actualCompletion) {
          const responseTime = Math.ceil((request.processingDetails.actualCompletion - request.submissionDetails.submissionDate) / (24 * 60 * 60 * 1000));
          totalResponseTime += responseTime;
          completedRequests++;
          
          // Check compliance (within response time limit)
          if (responseTime <= request.compliance.responseTimeLimit) {
            compliantRequests++;
          }
        }
        
        // Count overdue requests
        if (request.daysRemaining < 0 && request.status !== 'completed') {
          report.overdueRequests++;
        }
      });

      if (completedRequests > 0) {
        report.averageResponseTime = Math.round(totalResponseTime / completedRequests);
        report.complianceRate = Math.round((compliantRequests / completedRequests) * 100);
      }

      res.json(report);
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      res.status(500).json({ error: 'Failed to generate compliance report' });
    }
  }

  // Helper methods
  async collectUserData(partyId, requestDetails) {
    const userData = {
      party: null,
      consents: [],
      preferences: [],
      agreements: [],
      events: [],
      totalRecords: 0,
    };

    try {
      // Collect data from each service
      const services = [
        { name: 'party', url: process.env.PARTY_SERVICE_URL || 'http://localhost:3006' },
        { name: 'consent', url: process.env.CONSENT_SERVICE_URL || 'http://localhost:3001' },
        { name: 'preference', url: process.env.PREFERENCE_SERVICE_URL || 'http://localhost:3002' },
        { name: 'agreement', url: process.env.AGREEMENT_SERVICE_URL || 'http://localhost:3004' },
        { name: 'event', url: process.env.EVENT_SERVICE_URL || 'http://localhost:3005' },
      ];

      for (const service of services) {
        try {
          let response;
          switch (service.name) {
            case 'party':
              response = await axios.get(`${service.url}/party/${partyId}`);
              userData.party = response.data;
              userData.totalRecords += 1;
              break;
            case 'consent':
              response = await axios.get(`${service.url}/privacyConsent/party/${partyId}`);
              userData.consents = response.data.consents || [];
              userData.totalRecords += userData.consents.length;
              break;
            case 'preference':
              response = await axios.get(`${service.url}/privacyPreference/party/${partyId}`);
              userData.preferences = [response.data];
              userData.totalRecords += 1;
              break;
            case 'agreement':
              response = await axios.get(`${service.url}/agreement/party/${partyId}`);
              userData.agreements = response.data.agreements || [];
              userData.totalRecords += userData.agreements.length;
              break;
            case 'event':
              response = await axios.get(`${service.url}/events?partyId=${partyId}`);
              userData.events = response.data.events || [];
              userData.totalRecords += userData.events.length;
              break;
          }
        } catch (error) {
          logger.warn(`Failed to collect data from ${service.name} service:`, error.message);
        }
      }

      return userData;
    } catch (error) {
      logger.error('Error collecting user data:', error);
      throw error;
    }
  }

  async generateDataAccessResponse(request, userData) {
    const format = request.requestDetails.format || 'json';
    const filename = `data_export_${request.partyId}_${Date.now()}`;
    const filePath = path.join(__dirname, '../../temp', `${filename}.${format}`);

    // Ensure temp directory exists
    await fs.ensureDir(path.dirname(filePath));

    try {
      switch (format) {
        case 'json':
          await fs.writeJson(filePath, userData, { spaces: 2 });
          break;
        case 'csv':
          const parser = new Parser();
          const csv = parser.parse(this.flattenUserData(userData));
          await fs.writeFile(filePath, csv);
          break;
        case 'pdf':
          await this.generatePDFReport(filePath, userData);
          break;
        default:
          await fs.writeJson(filePath, userData, { spaces: 2 });
      }

      const stats = await fs.stat(filePath);
      
      return {
        path: filePath,
        size: stats.size,
        downloadUrl: `/api/v1/dsar/download/${request.id}`,
      };
    } catch (error) {
      logger.error('Error generating data access response:', error);
      throw error;
    }
  }

  async performDataErasure(partyId, requestDetails) {
    const results = {
      deletedRecords: 0,
      affectedServices: [],
    };

    try {
      const services = [
        { name: 'consent', url: process.env.CONSENT_SERVICE_URL || 'http://localhost:3001' },
        { name: 'preference', url: process.env.PREFERENCE_SERVICE_URL || 'http://localhost:3002' },
        { name: 'agreement', url: process.env.AGREEMENT_SERVICE_URL || 'http://localhost:3004' },
      ];

      for (const service of services) {
        try {
          // This would require implementing delete endpoints in each service
          // For now, we'll mark as deleted or anonymize
          const response = await axios.patch(`${service.url}/anonymize/${partyId}`);
          if (response.status === 200) {
            results.affectedServices.push(service.name);
            results.deletedRecords += response.data.deletedRecords || 0;
          }
        } catch (error) {
          logger.warn(`Failed to erase data from ${service.name} service:`, error.message);
        }
      }

      return results;
    } catch (error) {
      logger.error('Error performing data erasure:', error);
      throw error;
    }
  }

  flattenUserData(userData) {
    const flattened = [];
    
    if (userData.party) {
      flattened.push({
        type: 'party',
        id: userData.party.id,
        name: userData.party.name,
        data: JSON.stringify(userData.party),
      });
    }

    userData.consents.forEach(consent => {
      flattened.push({
        type: 'consent',
        id: consent.id,
        purpose: consent.purpose,
        status: consent.status,
        data: JSON.stringify(consent),
      });
    });

    // Similar for other data types...
    return flattened;
  }

  async generatePDFReport(filePath, userData) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    const { width, height } = page.getSize();
    const fontSize = 12;

    page.drawText('Personal Data Export Report', {
      x: 50,
      y: height - 50,
      size: 18,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Export Date: ${new Date().toISOString()}`, {
      x: 50,
      y: height - 80,
      size: fontSize,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Total Records: ${userData.totalRecords}`, {
      x: 50,
      y: height - 100,
      size: fontSize,
      color: rgb(0, 0, 0),
    });

    // Add more content as needed...

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filePath, pdfBytes);
  }

  getLegalBasis(requestType) {
    const legalBasisMap = {
      'access': 'gdpr_article_15',
      'rectification': 'gdpr_article_16',
      'erasure': 'gdpr_article_17',
      'restriction': 'gdpr_article_18',
      'portability': 'gdpr_article_20',
      'objection': 'gdpr_article_21',
      'withdraw_consent': 'gdpr_article_7',
    };
    return legalBasisMap[requestType] || 'gdpr_article_15';
  }

  async sendAcknowledgment(request) {
    // Implementation for sending acknowledgment
    // This would integrate with your notification system
    logger.info(`Acknowledgment sent for DSAR request: ${request.id}`);
  }

  async sendStatusUpdateNotification(request, previousStatus) {
    // Implementation for sending status update notifications
    logger.info(`Status update notification sent for DSAR request: ${request.id}`);
  }

  async emitDSAREvent(eventType, request) {
    try {
      const eventServiceUrl = process.env.EVENT_SERVICE_URL || 'http://localhost:3005';
      await axios.post(`${eventServiceUrl}/events`, {
        eventType,
        source: 'dsar-service',
        data: {
          requestId: request.id,
          partyId: request.partyId,
          requestType: request.requestType,
          status: request.status,
        },
      });
    } catch (error) {
      logger.error('Failed to emit DSAR event:', error);
    }
  }
}

module.exports = new DSARController();
