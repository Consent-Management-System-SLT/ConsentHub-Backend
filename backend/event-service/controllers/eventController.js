const Event = require('../models/Event');
const { generateUUID, logger, createAuditLog } = require('../../shared/utils');
const WebSocket = require('ws');
const axios = require('axios');

class EventController {
  constructor() {
    this.websocketClients = new Map();
    this.eventSubscriptions = new Map();
    this.startEventProcessor();
  }

  // Get all events/audit logs (simplified for dashboard)
  async getAllEvents(req, res) {
    try {
      logger.info('Mock fetching all events/audit logs for dashboard');
      
      const mockEvents = [
        {
          id: 'event-001',
          eventType: 'CONSENT_GRANTED',
          eventTime: '2024-01-01T08:30:00Z',
          title: 'Consent Granted',
          description: 'Marketing consent granted by party-nimal-001',
          priority: 'normal',
          severity: 'info',
          source: 'consent-service',
          domain: 'privacy-consent',
          metadata: {
            partyId: 'party-nimal-001',
            consentType: 'marketing',
            createdBy: 'customer-demo'
          }
        },
        {
          id: 'event-002',
          eventType: 'CONSENT_REVOKED',
          eventTime: '2024-02-15T14:20:00Z',
          title: 'Consent Revoked',
          description: 'Data analytics consent revoked by CSR',
          priority: 'normal',
          severity: 'info',
          source: 'consent-service',
          domain: 'privacy-consent',
          metadata: {
            partyId: 'party-customer-002',
            consentType: 'analytics',
            createdBy: 'csr-demo'
          }
        },
        {
          id: 'event-003',
          eventType: 'DSAR_REQUEST_CREATED',
          eventTime: '2024-02-20T11:45:00Z',
          title: 'DSAR Request Created',
          description: 'Data access request submitted',
          priority: 'high',
          severity: 'major',
          source: 'dsar-service',
          domain: 'data-rights',
          metadata: {
            partyId: 'party-customer-003',
            requestType: 'access',
            createdBy: 'customer-demo'
          }
        }
      ];

      res.status(200).json(mockEvents);
    } catch (error) {
      logger.error('Error fetching all events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  }

  // Create new event
  async createEvent(req, res) {
    try {
      const eventData = {
        id: generateUUID(),
        eventType: req.body.eventType,
        eventTime: req.body.eventTime || new Date(),
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority || 'normal',
        severity: req.body.severity || 'minor',
        source: req.body.source,
        domain: req.body.domain || 'privacy-consent',
        correlationId: req.body.correlationId || generateUUID(),
        parentEventId: req.body.parentEventId,
        event: req.body.event || {},
        entities: req.body.entities || [],
        eventCharacteristic: req.body.eventCharacteristic || [],
        data: req.body.data || {},
        subscriptions: req.body.subscriptions || [],
        metadata: {
          createdBy: req.user?.uid || 'system',
          tags: req.body.tags || [],
          environment: process.env.NODE_ENV || 'development',
          version: '1.0.0',
        },
      };

      const event = new Event(eventData);
      await event.save();

      // Create audit log
      if (req.user) {
        await createAuditLog(
          'CREATE_EVENT',
          req.user.uid,
          'event-service',
          { eventId: event.id, eventType: event.eventType }
        );
      }

      // Process event immediately
      await this.processEvent(event);

      logger.info(`Event created: ${event.id} - ${event.eventType}`);
      res.status(201).json(event);
    } catch (error) {
      logger.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  }

  // Get events with filtering and pagination
  async getEvents(req, res) {
    try {
      const { 
        eventType, 
        source, 
        entityType,
        entityId,
        priority,
        severity,
        processed,
        fromDate,
        toDate,
        correlationId,
        limit = 10, 
        offset = 0 
      } = req.query;

      const filter = {};
      if (eventType) filter.eventType = eventType;
      if (source) filter.source = source;
      if (priority) filter.priority = priority;
      if (severity) filter.severity = severity;
      if (processed !== undefined) filter.processed = processed === 'true';
      if (correlationId) filter.correlationId = correlationId;

      if (entityType || entityId) {
        filter.entities = { $elemMatch: {} };
        if (entityType) filter.entities.$elemMatch.entityType = entityType;
        if (entityId) filter.entities.$elemMatch.entityId = entityId;
      }

      if (fromDate || toDate) {
        filter.eventTime = {};
        if (fromDate) filter.eventTime.$gte = new Date(fromDate);
        if (toDate) filter.eventTime.$lte = new Date(toDate);
      }

      const events = await Event.find(filter)
        .sort({ eventTime: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .select('-data'); // Exclude large data field for list view

      const total = await Event.countDocuments(filter);

      res.json({
        events,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total,
        },
      });
    } catch (error) {
      logger.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  }

  // Get event by ID
  async getEventById(req, res) {
    try {
      const { id } = req.params;
      const event = await Event.findOne({ id });

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(event);
    } catch (error) {
      logger.error('Error fetching event:', error);
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  }

  // Get events by correlation ID
  async getEventsByCorrelation(req, res) {
    try {
      const { correlationId } = req.params;
      const events = await Event.find({ correlationId })
        .sort({ eventTime: 1 });

      res.json(events);
    } catch (error) {
      logger.error('Error fetching correlated events:', error);
      res.status(500).json({ error: 'Failed to fetch correlated events' });
    }
  }

  // Subscribe to events
  async subscribeToEvents(req, res) {
    try {
      const { eventType, callback, query } = req.body;
      const subscriptionId = generateUUID();

      // Store subscription
      const subscription = {
        id: subscriptionId,
        eventType,
        callback,
        query,
        userId: req.user?.uid,
        createdAt: new Date(),
      };

      this.eventSubscriptions.set(subscriptionId, subscription);

      logger.info(`Event subscription created: ${subscriptionId}`);
      res.status(201).json({
        subscriptionId,
        message: 'Subscription created successfully',
      });
    } catch (error) {
      logger.error('Error creating subscription:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  }

  // Unsubscribe from events
  async unsubscribeFromEvents(req, res) {
    try {
      const { subscriptionId } = req.params;

      if (!this.eventSubscriptions.has(subscriptionId)) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      this.eventSubscriptions.delete(subscriptionId);

      logger.info(`Event subscription deleted: ${subscriptionId}`);
      res.json({ message: 'Subscription deleted successfully' });
    } catch (error) {
      logger.error('Error deleting subscription:', error);
      res.status(500).json({ error: 'Failed to delete subscription' });
    }
  }

  // Get event statistics
  async getEventStats(req, res) {
    try {
      const { fromDate, toDate } = req.query;
      const filter = {};

      if (fromDate || toDate) {
        filter.eventTime = {};
        if (fromDate) filter.eventTime.$gte = new Date(fromDate);
        if (toDate) filter.eventTime.$lte = new Date(toDate);
      }

      const stats = await Event.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            processedEvents: { $sum: { $cond: ['$processed', 1, 0] } },
            pendingEvents: { $sum: { $cond: ['$processed', 0, 1] } },
            eventsByType: {
              $push: {
                eventType: '$eventType',
                count: 1,
              },
            },
            eventsBySource: {
              $push: {
                source: '$source',
                count: 1,
              },
            },
            eventsByPriority: {
              $push: {
                priority: '$priority',
                count: 1,
              },
            },
          },
        },
      ]);

      // Group by event type
      const eventTypeStats = await Event.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Group by source
      const sourceStats = await Event.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      res.json({
        summary: stats[0] || {
          totalEvents: 0,
          processedEvents: 0,
          pendingEvents: 0,
        },
        eventTypes: eventTypeStats,
        sources: sourceStats,
      });
    } catch (error) {
      logger.error('Error fetching event statistics:', error);
      res.status(500).json({ error: 'Failed to fetch event statistics' });
    }
  }

  // Process event (internal method)
  async processEvent(event) {
    try {
      // Send to WebSocket clients
      this.broadcastEventToWebSockets(event);

      // Send to HTTP subscribers
      await this.sendEventToSubscribers(event);

      // Mark as processed
      await event.markAsProcessed();

      logger.info(`Event processed: ${event.id}`);
    } catch (error) {
      logger.error(`Error processing event ${event.id}:`, error);
      event.processingError = error.message;
      await event.save();
    }
  }

  // Broadcast event to WebSocket clients
  broadcastEventToWebSockets(event) {
    for (const [clientId, client] of this.websocketClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify({
            type: 'event',
            data: event,
          }));
        } catch (error) {
          logger.error(`Error sending event to WebSocket client ${clientId}:`, error);
          this.websocketClients.delete(clientId);
        }
      } else {
        this.websocketClients.delete(clientId);
      }
    }
  }

  // Send event to HTTP subscribers
  async sendEventToSubscribers(event) {
    for (const [subscriptionId, subscription] of this.eventSubscriptions) {
      try {
        // Check if event matches subscription criteria
        if (subscription.eventType && subscription.eventType !== event.eventType) {
          continue;
        }

        // Send HTTP callback
        await axios.post(subscription.callback, {
          subscriptionId,
          event: event.toObject(),
        }, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        await event.addDeliveryAttempt(subscription.callback, 'success', 200);
      } catch (error) {
        logger.error(`Error sending event to subscriber ${subscriptionId}:`, error);
        await event.addDeliveryAttempt(subscription.callback, 'failed', error.response?.status, error.message);
      }
    }
  }

  // Start background event processor
  startEventProcessor() {
    setInterval(async () => {
      try {
        // Process unprocessed events
        const unprocessedEvents = await Event.find({
          processed: false,
          'delivery.nextAttempt': { $lte: new Date() },
        }).limit(10);

        for (const event of unprocessedEvents) {
          await this.processEvent(event);
        }

        // Retry failed deliveries
        const failedDeliveries = await Event.find({
          'delivery.status': 'pending',
          'delivery.nextAttempt': { $lte: new Date() },
          'delivery.attempts': { $lt: 3 },
        }).limit(5);

        for (const event of failedDeliveries) {
          await this.sendEventToSubscribers(event);
        }
      } catch (error) {
        logger.error('Error in event processor:', error);
      }
    }, 30000); // Run every 30 seconds
  }

  // Handle WebSocket connection
  handleWebSocketConnection(ws, req) {
    const clientId = generateUUID();
    this.websocketClients.set(clientId, ws);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'subscribe') {
          // Handle subscription over WebSocket
          ws.subscriptions = ws.subscriptions || [];
          ws.subscriptions.push(data.subscription);
        }
      } catch (error) {
        logger.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      this.websocketClients.delete(clientId);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      this.websocketClients.delete(clientId);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
    }));
  }
}

module.exports = new EventController();
