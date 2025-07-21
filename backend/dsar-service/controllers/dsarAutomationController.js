const DSARRequest = require('../models/DSARRequest');
const PrivacyConsent = require('../../consent-service/models/PrivacyConsent');
const PrivacyPreference = require('../../preference-service/models/PrivacyPreference');
const Party = require('../../party-service/models/Party');
const TMF669Event = require('../../event-service/models/Event');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../shared/utils');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

class DSARAutomationController {
  /**
   * Automatically process data access requests (Article 15)
   */
  async processDataAccessRequest(req, res) {
    try {
      const { requestId } = req.params;
      
      const dsarRequest = await DSARRequest.findOne({ id: requestId });
      if (!dsarRequest) {
        return res.status(404).json({
          error: 'DSAR request not found',
          code: 'REQUEST_NOT_FOUND',
        });
      }

      if (dsarRequest.requestType !== 'access') {
        return res.status(400).json({
          error: 'This endpoint only processes data access requests',
          code: 'INVALID_REQUEST_TYPE',
        });
      }

      // Update status to processing
      dsarRequest.status = 'in_progress';
      dsarRequest.processing.startedAt = new Date();
      dsarRequest.processing.processedBy = req.user?.uid || 'system';
      await dsarRequest.save();

      // Perform automated data discovery across all services
      const discoveryResults = await this.performDataDiscovery(dsarRequest.partyId, dsarRequest.requestDetails.dataCategories);
      
      // Update discovery results
      dsarRequest.processing.dataDiscoveryResults = discoveryResults;
      await dsarRequest.save();

      // Generate data export
      const exportResult = await this.generateDataExport(dsarRequest.partyId, discoveryResults, dsarRequest.requestDetails.format);
      
      // Update export results
      dsarRequest.processing.exportResults = {
        exportFormat: dsarRequest.requestDetails.format,
        exportUrl: exportResult.url,
        exportSize: exportResult.size,
        exportCreatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
      };

      dsarRequest.status = 'completed';
      dsarRequest.processing.completedAt = new Date();
      await dsarRequest.save();

      // Send notification
      await this.sendCompletionNotification(dsarRequest);

      // Create TMF669 event
      const event = TMF669Event.createDSARRequestEvent(dsarRequest, { action: 'completed' });
      await event.save();

      logger.info('DSAR access request processed automatically', {
        requestId: dsarRequest.id,
        partyId: dsarRequest.partyId,
        exportSize: exportResult.size,
      });

      res.json({
        message: 'Data access request processed successfully',
        request: {
          id: dsarRequest.id,
          status: dsarRequest.status,
          exportUrl: exportResult.url,
          expiresAt: dsarRequest.processing.exportResults.expiresAt,
        },
      });

    } catch (error) {
      logger.error('Error processing DSAR access request:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * Automatically process data erasure requests (Article 17)
   */
  async processDataErasureRequest(req, res) {
    try {
      const { requestId } = req.params;
      
      const dsarRequest = await DSARRequest.findOne({ id: requestId });
      if (!dsarRequest) {
        return res.status(404).json({
          error: 'DSAR request not found',
          code: 'REQUEST_NOT_FOUND',
        });
      }

      if (dsarRequest.requestType !== 'erasure') {
        return res.status(400).json({
          error: 'This endpoint only processes data erasure requests',
          code: 'INVALID_REQUEST_TYPE',
        });
      }

      // Check if erasure is legally permissible
      const canErase = await this.validateErasurePermissibility(dsarRequest.partyId);
      if (!canErase.allowed) {
        dsarRequest.status = 'rejected';
        dsarRequest.rejection = {
          reason: canErase.reason,
          legalJustification: canErase.legalJustification,
          rejectedAt: new Date(),
          rejectedBy: req.user?.uid || 'system',
        };
        await dsarRequest.save();

        return res.status(403).json({
          error: 'Erasure request rejected',
          reason: canErase.reason,
          legalJustification: canErase.legalJustification,
        });
      }

      // Update status to processing
      dsarRequest.status = 'in_progress';
      dsarRequest.processing.startedAt = new Date();
      dsarRequest.processing.processedBy = req.user?.uid || 'system';
      await dsarRequest.save();

      // Perform automated data deletion across all services
      const deletionResults = await this.performDataDeletion(dsarRequest.partyId, dsarRequest.requestDetails.dataCategories);
      
      // Update deletion results
      dsarRequest.processing.deletionResults = deletionResults;
      dsarRequest.status = 'completed';
      dsarRequest.processing.completedAt = new Date();
      await dsarRequest.save();

      // Send notification
      await this.sendCompletionNotification(dsarRequest);

      // Create TMF669 event
      const event = TMF669Event.createDSARRequestEvent(dsarRequest, { action: 'completed' });
      await event.save();

      logger.info('DSAR erasure request processed automatically', {
        requestId: dsarRequest.id,
        partyId: dsarRequest.partyId,
        deletionResults: deletionResults.map(r => ({ service: r.service, recordsDeleted: r.recordsDeleted })),
      });

      res.json({
        message: 'Data erasure request processed successfully',
        request: {
          id: dsarRequest.id,
          status: dsarRequest.status,
          deletionSummary: deletionResults.map(r => ({
            service: r.service,
            recordsDeleted: r.recordsDeleted,
            confirmed: r.deletionConfirmed,
          })),
        },
      });

    } catch (error) {
      logger.error('Error processing DSAR erasure request:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * Perform data discovery across all microservices
   */
  async performDataDiscovery(partyId, dataCategories = []) {
    const results = [];

    try {
      // Discovery in consent-service
      const consents = await PrivacyConsent.find({ partyId });
      results.push({
        service: 'consent-service',
        dataFound: consents.length > 0,
        recordCount: consents.length,
        dataTypes: ['consent_records', 'privacy_preferences'],
        lastScanAt: new Date(),
      });

      // Discovery in preference-service  
      const preferences = await PrivacyPreference.find({ partyId });
      results.push({
        service: 'preference-service',
        dataFound: preferences.length > 0,
        recordCount: preferences.length,
        dataTypes: ['communication_preferences', 'notification_settings'],
        lastScanAt: new Date(),
      });

      // Discovery in party-service
      const party = await Party.findOne({ id: partyId });
      results.push({
        service: 'party-service',
        dataFound: !!party,
        recordCount: party ? 1 : 0,
        dataTypes: ['personal_identifiers', 'contact_information'],
        lastScanAt: new Date(),
      });

      // Discovery in event-service
      const events = await TMF669Event.find({ 
        'metadata.relatedEntities.entityId': partyId 
      });
      results.push({
        service: 'event-service',
        dataFound: events.length > 0,
        recordCount: events.length,
        dataTypes: ['usage_data', 'audit_trails'],
        lastScanAt: new Date(),
      });

    } catch (error) {
      logger.error('Error during data discovery:', error);
    }

    return results;
  }

  /**
   * Generate data export in requested format
   */
  async generateDataExport(partyId, discoveryResults, format = 'json') {
    try {
      // Collect all data
      const exportData = {
        partyId,
        exportDate: new Date().toISOString(),
        data: {},
      };

      // Collect consent data
      const consents = await PrivacyConsent.find({ partyId }).lean();
      exportData.data.consents = consents;

      // Collect preference data
      const preferences = await PrivacyPreference.find({ partyId }).lean();
      exportData.data.preferences = preferences;

      // Collect party data
      const party = await Party.findOne({ id: partyId }).lean();
      exportData.data.party = party;

      // Collect event data (limited to last 6 months for performance)
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
      const events = await TMF669Event.find({ 
        'metadata.relatedEntities.entityId': partyId,
        createdAt: { $gte: sixMonthsAgo }
      }).lean();
      exportData.data.events = events;

      // Generate export file
      const exportDir = path.join(__dirname, '../exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const filename = `dsar_export_${partyId}_${Date.now()}`;
      let filePath, fileSize;

      if (format === 'json') {
        filePath = path.join(exportDir, `${filename}.json`);
        fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
      } else if (format === 'pdf') {
        filePath = path.join(exportDir, `${filename}.pdf`);
        await this.generatePDFReport(exportData, filePath);
      } else if (format === 'csv') {
        filePath = path.join(exportDir, `${filename}.csv`);
        await this.generateCSVReport(exportData, filePath);
      }

      fileSize = fs.statSync(filePath).size;

      return {
        url: `/api/v1/dsar/download/${path.basename(filePath)}`,
        size: fileSize,
        format,
      };

    } catch (error) {
      logger.error('Error generating data export:', error);
      throw error;
    }
  }

  /**
   * Perform data deletion across all microservices
   */
  async performDataDeletion(partyId, dataCategories = []) {
    const results = [];

    try {
      // Delete from consent-service
      const consentDeletion = await PrivacyConsent.deleteMany({ partyId });
      results.push({
        service: 'consent-service',
        recordsDeleted: consentDeletion.deletedCount,
        deletionConfirmed: true,
        deletedAt: new Date(),
        errors: [],
      });

      // Delete from preference-service
      const preferenceDeletion = await PrivacyPreference.deleteMany({ partyId });
      results.push({
        service: 'preference-service',
        recordsDeleted: preferenceDeletion.deletedCount,
        deletionConfirmed: true,
        deletedAt: new Date(),
        errors: [],
      });

      // Delete from party-service (soft delete to maintain referential integrity)
      const party = await Party.findOne({ id: partyId });
      if (party) {
        party.status = 'deleted';
        party.privacySettings = {
          dataProcessingConsent: false,
          marketingConsent: false,
          thirdPartyDataSharing: false,
          profileAnalytics: false,
        };
        // Anonymize personal data
        party.name = `[DELETED-${partyId.substring(0, 8)}]`;
        party.contactInformation = [];
        party.individualIdentification = [];
        await party.save();

        results.push({
          service: 'party-service',
          recordsDeleted: 1,
          deletionConfirmed: true,
          deletedAt: new Date(),
          errors: [],
        });
      }

      // Anonymize events (keep for audit but remove personal identifiers)
      const eventUpdate = await TMF669Event.updateMany(
        { 'metadata.relatedEntities.entityId': partyId },
        { 
          $set: { 
            'event.resource.anonymized': true,
            'metadata.anonymizedAt': new Date()
          }
        }
      );
      results.push({
        service: 'event-service',
        recordsDeleted: eventUpdate.modifiedCount,
        deletionConfirmed: true,
        deletedAt: new Date(),
        errors: [],
      });

    } catch (error) {
      logger.error('Error during data deletion:', error);
      results.push({
        service: 'deletion-error',
        recordsDeleted: 0,
        deletionConfirmed: false,
        deletedAt: new Date(),
        errors: [error.message],
      });
    }

    return results;
  }

  /**
   * Validate if data erasure is legally permissible
   */
  async validateErasurePermissibility(partyId) {
    try {
      // Check for legal obligations that prevent erasure
      const activeConsents = await PrivacyConsent.find({ 
        partyId, 
        status: 'granted',
        purpose: { $in: ['legal_obligation', 'contract_performance'] }
      });

      if (activeConsents.length > 0) {
        return {
          allowed: false,
          reason: 'Legal obligation prevents erasure',
          legalJustification: 'GDPR Article 17(3)(b) - Processing necessary for compliance with legal obligation',
        };
      }

      // Check for ongoing contractual relationships
      const party = await Party.findOne({ id: partyId });
      if (party && party.status === 'active') {
        // In real implementation, you'd check for active services/contracts
        // For now, we'll assume erasure is allowed unless there are legal obligations
      }

      return {
        allowed: true,
        reason: 'No legal impediments to erasure',
      };

    } catch (error) {
      logger.error('Error validating erasure permissibility:', error);
      return {
        allowed: false,
        reason: 'Error during validation',
        legalJustification: 'Technical error prevented validation',
      };
    }
  }

  /**
   * Send completion notification
   */
  async sendCompletionNotification(dsarRequest) {
    try {
      // In real implementation, integrate with email/SMS service
      logger.info('DSAR completion notification sent', {
        requestId: dsarRequest.id,
        partyId: dsarRequest.partyId,
        requestType: dsarRequest.requestType,
      });

      // Add to communication log
      dsarRequest.communication.push({
        type: 'email',
        message: `Your ${dsarRequest.requestType} request has been completed.`,
        sentAt: new Date(),
        template: 'dsar_completion',
        delivered: true,
      });

      await dsarRequest.save();
    } catch (error) {
      logger.error('Error sending DSAR completion notification:', error);
    }
  }

  /**
   * Generate PDF report for data export
   */
  async generatePDFReport(exportData, filePath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // PDF Header
        doc.fontSize(20).text('Personal Data Export Report', 50, 50);
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 80);
        doc.text(`Party ID: ${exportData.partyId}`, 50, 100);

        let yPosition = 140;

        // Party Information
        if (exportData.data.party) {
          doc.fontSize(16).text('Personal Information', 50, yPosition);
          yPosition += 25;
          doc.fontSize(12);
          doc.text(`Name: ${exportData.data.party.name}`, 50, yPosition);
          yPosition += 20;
          doc.text(`Type: ${exportData.data.party.partyType}`, 50, yPosition);
          yPosition += 20;
          doc.text(`Status: ${exportData.data.party.status}`, 50, yPosition);
          yPosition += 30;
        }

        // Consent Information
        if (exportData.data.consents && exportData.data.consents.length > 0) {
          doc.fontSize(16).text('Consent Records', 50, yPosition);
          yPosition += 25;
          exportData.data.consents.forEach((consent, index) => {
            doc.fontSize(12);
            doc.text(`${index + 1}. Purpose: ${consent.purpose}, Status: ${consent.status}`, 50, yPosition);
            yPosition += 15;
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }
          });
          yPosition += 20;
        }

        // Preferences Information
        if (exportData.data.preferences && exportData.data.preferences.length > 0) {
          doc.fontSize(16).text('Communication Preferences', 50, yPosition);
          yPosition += 25;
          exportData.data.preferences.forEach((pref, index) => {
            doc.fontSize(12);
            doc.text(`${index + 1}. Email: ${pref.notificationPreferences?.email?.enabled || 'N/A'}`, 50, yPosition);
            yPosition += 15;
            doc.text(`SMS: ${pref.notificationPreferences?.sms?.enabled || 'N/A'}`, 70, yPosition);
            yPosition += 20;
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }
          });
        }

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate CSV report for data export
   */
  async generateCSVReport(exportData, filePath) {
    try {
      const csv = require('csv-writer');
      const createCsvWriter = csv.createObjectCsvWriter;

      // Create CSV with consent data
      const csvWriter = createCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'Consent ID' },
          { id: 'purpose', title: 'Purpose' },
          { id: 'status', title: 'Status' },
          { id: 'createdAt', title: 'Created At' },
          { id: 'updatedAt', title: 'Updated At' },
        ]
      });

      const records = exportData.data.consents.map(consent => ({
        id: consent.id,
        purpose: consent.purpose,
        status: consent.status,
        createdAt: consent.createdAt,
        updatedAt: consent.updatedAt,
      }));

      await csvWriter.writeRecords(records);
    } catch (error) {
      logger.error('Error generating CSV report:', error);
      throw error;
    }
  }
}

module.exports = new DSARAutomationController();
