const express = require('express');
const admin = require('../controllers/adminController');
const support = require('../controllers/supportAdminController');
const { protect, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', admin.dashboard);

router.get('/users', admin.listUsers);
router.put('/users/:id/toggle-active', admin.toggleUserActive);

router.get('/collectors', admin.listCollectors);
router.post('/collectors', validateBody(['name', 'email', 'phone', 'password']), admin.createCollector);
router.put('/collectors/:id', admin.updateCollector);

router.get('/pickups', admin.listAllPickups);
router.post('/assign-collector', validateBody(['pickupId', 'collectorId']), admin.assignCollector);

router.post('/scrap-items', validateBody(['categoryId', 'name']), admin.createScrapItem);
router.put('/scrap-items/:id', admin.updateScrapItem);
router.delete('/scrap-items/:id', admin.deleteScrapItem);

router.get('/reports', admin.reports);

// Chat & Support
router.get('/support/conversations', support.listConversations);
router.get('/support/conversations/:id', support.getConversation);
router.put('/support/conversations/:id/resolve', support.resolveConversation);
router.get('/support/tickets', support.listTickets);
router.put('/support/tickets/:ticketId', support.updateTicket);
router.get('/support/analytics', support.chatAnalytics);
router.get('/faqs', support.listFaqs);
router.post('/faqs', validateBody(['question', 'answer', 'topic']), support.createFaq);
router.put('/faqs/:id', support.updateFaq);
router.delete('/faqs/:id', support.deleteFaq);

module.exports = router;
