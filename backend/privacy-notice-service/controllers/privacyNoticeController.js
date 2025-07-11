const PrivacyNotice = require('../models/PrivacyNotice');
const { generateUUID, logger, createAuditLog } = require('../../shared/utils');
const semver = require('semver');

class PrivacyNoticeController {
  // Create new privacy notice
  async createPrivacyNotice(req, res) {
    try {
      const noticeData = {
        id: generateUUID(),
        version: req.body.version || '1.0.0',
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
        contentType: req.body.contentType || 'text/plain',
        category: req.body.category,
        purposes: req.body.purposes || [],
        legalBasis: req.body.legalBasis,
        dataCategories: req.body.dataCategories || [],
        recipients: req.body.recipients || [],
        retentionPeriod: req.body.retentionPeriod,
        rights: req.body.rights || [],
        contactInfo: req.body.contactInfo,
        effectiveDate: req.body.effectiveDate || new Date(),
        expirationDate: req.body.expirationDate,
        status: req.body.status || 'draft',
        language: req.body.language || 'en',
        geoScope: req.body.geoScope || [],
        productScope: req.body.productScope || [],
        parentNoticeId: req.body.parentNoticeId,
        metadata: {
          createdBy: req.user.uid,
          tags: req.body.tags || [],
        },
      };

      const notice = new PrivacyNotice(noticeData);
      await notice.save();

      // Create audit log
      await createAuditLog(
        'CREATE_PRIVACY_NOTICE',
        req.user.uid,
        'privacy-notice-service',
        { noticeId: notice.id, version: notice.version }
      );

      logger.info(`Privacy notice created: ${notice.id} v${notice.version}`);
      res.status(201).json(notice);
    } catch (error) {
      logger.error('Error creating privacy notice:', error);
      res.status(500).json({ error: 'Failed to create privacy notice' });
    }
  }

  // Get all privacy notices with filtering and pagination
  async getPrivacyNotices(req, res) {
    try {
      const { 
        category, 
        status, 
        language, 
        effectiveDate,
        limit = 10, 
        offset = 0,
        tags,
        search
      } = req.query;

      const filter = {};
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (language) filter.language = language;
      if (effectiveDate) {
        filter.effectiveDate = { $lte: new Date(effectiveDate) };
      }
      if (tags) {
        filter['metadata.tags'] = { $in: tags.split(',') };
      }
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
        ];
      }

      const notices = await PrivacyNotice.find(filter)
        .sort({ effectiveDate: -1, version: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .select('-content'); // Exclude content for list view

      const total = await PrivacyNotice.countDocuments(filter);

      res.json({
        notices,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total,
        },
      });
    } catch (error) {
      logger.error('Error fetching privacy notices:', error);
      res.status(500).json({ error: 'Failed to fetch privacy notices' });
    }
  }

  // Get privacy notice by ID
  async getPrivacyNoticeById(req, res) {
    try {
      const { id } = req.params;
      const { includeContent = true } = req.query;

      let selectFields = '';
      if (includeContent === 'false') {
        selectFields = '-content';
      }

      const notice = await PrivacyNotice.findOne({ id }).select(selectFields);

      if (!notice) {
        return res.status(404).json({ error: 'Privacy notice not found' });
      }

      res.json(notice);
    } catch (error) {
      logger.error('Error fetching privacy notice:', error);
      res.status(500).json({ error: 'Failed to fetch privacy notice' });
    }
  }

  // Get active privacy notice by category
  async getActiveNoticeByCategory(req, res) {
    try {
      const { category } = req.params;
      const { language = 'en', productId, geoLocation } = req.query;

      const filter = {
        category,
        status: 'active',
        language,
        effectiveDate: { $lte: new Date() },
        $or: [
          { expirationDate: { $exists: false } },
          { expirationDate: { $gt: new Date() } }
        ]
      };

      // Add product scope filter if provided
      if (productId) {
        filter.$or = [
          { productScope: { $size: 0 } },
          { productScope: productId }
        ];
      }

      // Add geo scope filter if provided
      if (geoLocation) {
        filter.$or = [
          { geoScope: { $size: 0 } },
          { geoScope: geoLocation }
        ];
      }

      const notice = await PrivacyNotice.findOne(filter)
        .sort({ effectiveDate: -1, version: -1 });

      if (!notice) {
        return res.status(404).json({ error: 'Active privacy notice not found' });
      }

      res.json(notice);
    } catch (error) {
      logger.error('Error fetching active privacy notice:', error);
      res.status(500).json({ error: 'Failed to fetch active privacy notice' });
    }
  }

  // Update privacy notice
  async updatePrivacyNotice(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const notice = await PrivacyNotice.findOne({ id });
      if (!notice) {
        return res.status(404).json({ error: 'Privacy notice not found' });
      }

      // Check if user can update this notice
      if (req.user.role !== 'admin' && notice.metadata.createdBy !== req.user.uid) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const previousVersion = notice.version;
      
      // Handle version update
      if (updateData.version) {
        if (!semver.valid(updateData.version)) {
          return res.status(400).json({ error: 'Invalid version format' });
        }
        
        if (semver.lte(updateData.version, notice.version)) {
          return res.status(400).json({ error: 'New version must be greater than current version' });
        }
      }

      // Add change log entry
      if (updateData.changeLog) {
        notice.changeLog.push({
          version: updateData.version || notice.version,
          changes: updateData.changeLog,
          author: req.user.uid,
          date: new Date(),
        });
      }

      // Update fields
      Object.assign(notice, updateData);
      notice.metadata.lastModifiedBy = req.user.uid;

      await notice.save();

      // Create audit log
      await createAuditLog(
        'UPDATE_PRIVACY_NOTICE',
        req.user.uid,
        'privacy-notice-service',
        { 
          noticeId: notice.id, 
          previousVersion,
          newVersion: notice.version
        }
      );

      logger.info(`Privacy notice updated: ${notice.id} v${notice.version}`);
      res.json(notice);
    } catch (error) {
      logger.error('Error updating privacy notice:', error);
      res.status(500).json({ error: 'Failed to update privacy notice' });
    }
  }

  // Create new version of privacy notice
  async createVersion(req, res) {
    try {
      const { id } = req.params;
      const { version, changes } = req.body;

      const originalNotice = await PrivacyNotice.findOne({ id });
      if (!originalNotice) {
        return res.status(404).json({ error: 'Privacy notice not found' });
      }

      // Validate version
      if (!semver.valid(version)) {
        return res.status(400).json({ error: 'Invalid version format' });
      }

      if (semver.lte(version, originalNotice.version)) {
        return res.status(400).json({ error: 'New version must be greater than current version' });
      }

      // Create new version
      const newNotice = new PrivacyNotice({
        ...originalNotice.toObject(),
        _id: undefined,
        id: generateUUID(),
        version,
        parentNoticeId: originalNotice.id,
        status: 'draft',
        approvalStatus: {
          status: 'pending',
        },
        metadata: {
          ...originalNotice.metadata,
          createdBy: req.user.uid,
          lastModifiedBy: req.user.uid,
        },
        changeLog: [
          ...originalNotice.changeLog,
          {
            version,
            changes,
            author: req.user.uid,
            date: new Date(),
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await newNotice.save();

      // Create audit log
      await createAuditLog(
        'CREATE_PRIVACY_NOTICE_VERSION',
        req.user.uid,
        'privacy-notice-service',
        { 
          originalNoticeId: originalNotice.id,
          newNoticeId: newNotice.id,
          version: newNotice.version
        }
      );

      logger.info(`New privacy notice version created: ${newNotice.id} v${newNotice.version}`);
      res.status(201).json(newNotice);
    } catch (error) {
      logger.error('Error creating privacy notice version:', error);
      res.status(500).json({ error: 'Failed to create privacy notice version' });
    }
  }

  // Approve privacy notice
  async approvePrivacyNotice(req, res) {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const notice = await PrivacyNotice.findOne({ id });
      if (!notice) {
        return res.status(404).json({ error: 'Privacy notice not found' });
      }

      notice.approvalStatus = {
        status: 'approved',
        approvedBy: req.user.uid,
        approvedAt: new Date(),
        comments,
      };

      await notice.save();

      // Create audit log
      await createAuditLog(
        'APPROVE_PRIVACY_NOTICE',
        req.user.uid,
        'privacy-notice-service',
        { noticeId: notice.id, version: notice.version }
      );

      logger.info(`Privacy notice approved: ${notice.id} v${notice.version}`);
      res.json(notice);
    } catch (error) {
      logger.error('Error approving privacy notice:', error);
      res.status(500).json({ error: 'Failed to approve privacy notice' });
    }
  }

  // Activate privacy notice
  async activatePrivacyNotice(req, res) {
    try {
      const { id } = req.params;
      const { effectiveDate } = req.body;

      const notice = await PrivacyNotice.findOne({ id });
      if (!notice) {
        return res.status(404).json({ error: 'Privacy notice not found' });
      }

      if (notice.approvalStatus.status !== 'approved') {
        return res.status(400).json({ error: 'Privacy notice must be approved before activation' });
      }

      // Deactivate previous version if exists
      if (notice.parentNoticeId) {
        await PrivacyNotice.findOneAndUpdate(
          { id: notice.parentNoticeId },
          { status: 'inactive' }
        );
      }

      notice.status = 'active';
      if (effectiveDate) {
        notice.effectiveDate = new Date(effectiveDate);
      }

      await notice.save();

      // Create audit log
      await createAuditLog(
        'ACTIVATE_PRIVACY_NOTICE',
        req.user.uid,
        'privacy-notice-service',
        { noticeId: notice.id, version: notice.version }
      );

      logger.info(`Privacy notice activated: ${notice.id} v${notice.version}`);
      res.json(notice);
    } catch (error) {
      logger.error('Error activating privacy notice:', error);
      res.status(500).json({ error: 'Failed to activate privacy notice' });
    }
  }

  // Get version history
  async getVersionHistory(req, res) {
    try {
      const { id } = req.params;

      const notice = await PrivacyNotice.findOne({ id });
      if (!notice) {
        return res.status(404).json({ error: 'Privacy notice not found' });
      }

      // Get all versions including parent and children
      const allVersions = await PrivacyNotice.find({
        $or: [
          { id: id },
          { parentNoticeId: id },
          { id: notice.parentNoticeId },
          { parentNoticeId: notice.parentNoticeId }
        ]
      })
      .sort({ version: -1 })
      .select('-content');

      res.json(allVersions);
    } catch (error) {
      logger.error('Error fetching version history:', error);
      res.status(500).json({ error: 'Failed to fetch version history' });
    }
  }
}

module.exports = new PrivacyNoticeController();
