const express = require('express');
const router = express.Router();
const partyController = require('../controllers/partyController');
const { authenticateToken } = require('../../shared/middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Party:
 *       type: object
 *       required:
 *         - partyType
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the party
 *         href:
 *           type: string
 *           description: Reference to the party resource
 *         partyType:
 *           type: string
 *           enum: [individual, organization]
 *           description: Type of party
 *         name:
 *           type: string
 *           description: Name of the party
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: Current status of the party
 *         statusReason:
 *           type: string
 *           description: Reason for the current status
 *         contactInformation:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ContactInformation'
 *         characteristic:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Characteristic'
 *         relatedParty:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RelatedParty'
 *         validFor:
 *           $ref: '#/components/schemas/TimePeriod'
 *         '@type':
 *           type: string
 *           description: Type indicator for polymorphism
 *         '@baseType':
 *           type: string
 *           description: Base type for inheritance
 *         '@schemaLocation':
 *           type: string
 *           description: Link to schema definition
 *     ContactInformation:
 *       type: object
 *       required:
 *         - contactType
 *         - contactValue
 *       properties:
 *         contactType:
 *           type: string
 *           enum: [email, phone, address, social]
 *           description: Type of contact information
 *         contactValue:
 *           type: string
 *           description: The contact value
 *         isPrimary:
 *           type: boolean
 *           description: Whether this is the primary contact
 *         isVerified:
 *           type: boolean
 *           description: Whether this contact is verified
 *         validFor:
 *           $ref: '#/components/schemas/TimePeriod'
 *         contactMedium:
 *           type: object
 *           properties:
 *             mediumType:
 *               type: string
 *             characteristic:
 *               type: object
 *     Characteristic:
 *       type: object
 *       required:
 *         - name
 *         - value
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the characteristic
 *         value:
 *           type: string
 *           description: Value of the characteristic
 *         valueType:
 *           type: string
 *           description: Type of the value
 *     RelatedParty:
 *       type: object
 *       required:
 *         - id
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           description: Identifier of the related party
 *         href:
 *           type: string
 *           description: Reference to the related party
 *         name:
 *           type: string
 *           description: Name of the related party
 *         role:
 *           type: string
 *           description: Role of the related party
 *         validFor:
 *           $ref: '#/components/schemas/TimePeriod'
 *     TimePeriod:
 *       type: object
 *       properties:
 *         startDateTime:
 *           type: string
 *           format: date-time
 *           description: Start date and time
 *         endDateTime:
 *           type: string
 *           format: date-time
 *           description: End date and time
 */

/**
 * @swagger
 * /api/v1/party/party:
 *   post:
 *     summary: Create a new party
 *     description: Creates a new party following TMF641 Party Management API
 *     tags: [Party Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Party'
 *           example:
 *             partyType: "individual"
 *             name: "John Doe"
 *             contactInformation:
 *               - contactType: "email"
 *                 contactValue: "john@example.com"
 *                 isPrimary: true
 *               - contactType: "phone"
 *                 contactValue: "+94771234567"
 *             characteristic:
 *               - name: "preferredLanguage"
 *                 value: "en"
 *               - name: "customerSegment"
 *                 value: "premium"
 *     responses:
 *       201:
 *         description: Party created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Party'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/party', authenticateToken, partyController.createParty);

/**
 * @swagger
 * /api/v1/party/party/{id}:
 *   get:
 *     summary: Get party by ID
 *     description: Retrieves a specific party by ID
 *     tags: [Party Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *     responses:
 *       200:
 *         description: Party information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Party'
 *       404:
 *         description: Party not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/party/:id', authenticateToken, partyController.getPartyById);

/**
 * @swagger
 * /api/v1/party/party:
 *   get:
 *     summary: List parties with filtering
 *     description: Retrieves a list of parties with optional filtering and pagination
 *     tags: [Party Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of items to return
 *       - in: query
 *         name: partyType
 *         schema:
 *           type: string
 *           enum: [individual, organization]
 *         description: Filter by party type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by status
 *       - in: query
 *         name: characteristic.name
 *         schema:
 *           type: string
 *         description: Filter by characteristic name
 *       - in: query
 *         name: characteristic.value
 *         schema:
 *           type: string
 *         description: Filter by characteristic value
 *     responses:
 *       200:
 *         description: List of parties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCount:
 *                   type: integer
 *                 rangeStart:
 *                   type: integer
 *                 rangeEnd:
 *                   type: integer
 *                 parties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Party'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/party', authenticateToken, partyController.getParties);

/**
 * @swagger
 * /api/v1/party/party/{id}:
 *   patch:
 *     summary: Update party information
 *     description: Updates specific fields of a party
 *     tags: [Party Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *               contactInformation:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ContactInformation'
 *               characteristic:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Characteristic'
 *           example:
 *             name: "John Smith"
 *             contactInformation:
 *               - contactType: "email"
 *                 contactValue: "johnsmith@example.com"
 *                 isPrimary: true
 *     responses:
 *       200:
 *         description: Party updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Party'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Party not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch('/party/:id', authenticateToken, partyController.updateParty);

/**
 * @swagger
 * /api/v1/party/party/{id}:
 *   delete:
 *     summary: Delete/deactivate party
 *     description: Deactivates a party (soft delete)
 *     tags: [Party Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *     responses:
 *       204:
 *         description: Party deactivated successfully
 *       404:
 *         description: Party not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.delete('/party/:id', authenticateToken, partyController.deleteParty);

/**
 * @swagger
 * /api/v1/party/party/{id}/contactInformation:
 *   post:
 *     summary: Add contact information
 *     description: Adds new contact information to a party
 *     tags: [Party Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactInformation'
 *           example:
 *             contactType: "address"
 *             contactValue: "123 Main St, Colombo, Sri Lanka"
 *             isPrimary: false
 *     responses:
 *       201:
 *         description: Contact information added successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Party not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/party/:id/contactInformation', authenticateToken, partyController.addContactInformation);

/**
 * @swagger
 * /api/v1/party/party/{id}/characteristic:
 *   get:
 *     summary: Get party characteristics
 *     description: Retrieves all characteristics for a specific party
 *     tags: [Party Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Party ID
 *     responses:
 *       200:
 *         description: Party characteristics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 partyId:
 *                   type: string
 *                 characteristics:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Characteristic'
 *       404:
 *         description: Party not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/party/:id/characteristic', authenticateToken, partyController.getPartyCharacteristics);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'party-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

module.exports = router;
