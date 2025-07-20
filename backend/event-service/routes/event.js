const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyFirebaseToken, checkRole } = require('../../shared/auth');
const Joi = require('joi');

// Validation schemas
const createEventSchema = Joi.object({
  eventType: Joi.string().required(),
  eventTime: Joi.date().optional(),
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').optional(),
  severity: Joi.string().valid('minor', 'major', 'critical').optional(),
  source: Joi.string().required(),
  domain: Joi.string().optional(),
  correlationId: Joi.string().optional(),
  parentEventId: Joi.string().optional(),
  event: Joi.object().optional(),
  entities: Joi.array().items(Joi.object()).optional(),
  eventCharacteristic: Joi.array().items(Joi.object()).optional(),
  data: Joi.object().optional(),
  subscriptions: Joi.array().items(Joi.object()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

const subscribeSchema = Joi.object({
  eventType: Joi.string().optional(),
  callback: Joi.string().uri().required(),
  query: Joi.string().optional(),
});

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message),
      });
    }
    next();
  };
};

// Simple GET endpoint for dashboard - returns recent events/audit logs
router.get('/event',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  eventController.getAllEvents
);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *               - source
 *             properties:
 *               eventType:
 *                 type: string
 *               source:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *     responses:
 *       201:
 *         description: Event created successfully
 */
router.post('/events',
  validateRequest(createEventSchema),
  eventController.createEvent
);

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get events with filtering
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/events',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  eventController.getEvents
);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 */
router.get('/events/:id',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  eventController.getEventById
);

/**
 * @swagger
 * /events/correlation/{correlationId}:
 *   get:
 *     summary: Get events by correlation ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: correlationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of correlated events
 */
router.get('/events/correlation/:correlationId',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  eventController.getEventsByCorrelation
);

/**
 * @swagger
 * /events/subscribe:
 *   post:
 *     summary: Subscribe to events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - callback
 *             properties:
 *               eventType:
 *                 type: string
 *               callback:
 *                 type: string
 *                 format: uri
 *               query:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subscription created successfully
 */
router.post('/events/subscribe',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  validateRequest(subscribeSchema),
  eventController.subscribeToEvents
);

/**
 * @swagger
 * /events/subscribe/{subscriptionId}:
 *   delete:
 *     summary: Unsubscribe from events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription deleted successfully
 */
router.delete('/events/subscribe/:subscriptionId',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  eventController.unsubscribeFromEvents
);

/**
 * @swagger
 * /events/stats:
 *   get:
 *     summary: Get event statistics
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Event statistics
 */
router.get('/events/stats',
  verifyFirebaseToken,
  checkRole(['csr', 'admin']),
  eventController.getEventStats
);

module.exports = router;
