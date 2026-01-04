const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const authController = require('../controllers/authController');
const ticketController = require('../controllers/ticketController');
const adminController = require('../controllers/adminController');
const { verifyToken, requireAdmin, requireSupport } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});
const upload = multer({ storage });

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', verifyToken, authController.getMe);

router.post('/tickets', verifyToken, upload.single('attachment'), ticketController.createTicket);
router.get('/tickets', verifyToken, ticketController.getTickets);
router.get('/tickets/:id', verifyToken, ticketController.getTicket);
router.put('/tickets/:id', verifyToken, ticketController.updateTicket); 
router.post('/tickets/:id/messages', verifyToken, ticketController.addMessage);
router.put('/tickets/:ticketId/messages/:messageId', verifyToken, ticketController.updateMessage);
router.delete('/tickets/:ticketId/messages/:messageId', verifyToken, ticketController.deleteMessage);
router.delete('/tickets/:id', verifyToken, requireAdmin, ticketController.deleteTicket);


router.get('/admin/stats', verifyToken, requireSupport, adminController.getDashboardStats); 

router.get('/admin/stats', verifyToken, requireAdmin, adminController.getDashboardStats);
router.get('/admin/users', verifyToken, requireAdmin, adminController.getAllUsers);
router.put('/admin/users/role', verifyToken, requireAdmin, adminController.updateUserRole);
router.put('/admin/users/ban', verifyToken, requireAdmin, adminController.toggleBanUser);
router.get('/admin/transcripts', verifyToken, requireAdmin, adminController.getTranscripts);
router.delete('/admin/transcripts', verifyToken, requireAdmin, adminController.deleteTranscripts);
router.get('/admin/export', verifyToken, requireAdmin, adminController.exportTickets);
router.post('/tickets/:id/attachment', verifyToken, upload.single('attachment'), ticketController.addAttachment);

module.exports = router;
