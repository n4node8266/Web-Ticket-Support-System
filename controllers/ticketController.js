const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/db');
const path = require('path');

const generateTicketId = (tickets) => {
    if (tickets.length === 0) return 1000;
    const maxId = Math.max(...tickets.map(t => parseInt(t.ticketId)));
    return maxId + 1;
};

const createTicket = (req, res) => {
    const { category, priority, subject, description } = req.body;
    let attachment = null;

    if (req.file) {
        attachment = '/uploads/' + req.file.filename;
    }

    if (!category || !priority || !subject || !description) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const tickets = readData('tickets');
    const newTicket = {
        id: uuidv4(),
        ticketId: generateTicketId(tickets).toString(),
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.username,
        category,
        priority, 
        status: 'Open', 
        subject,
        description,
        attachment,
        assignedTo: null, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [] 
    };

    tickets.push(newTicket);
    writeData('tickets', tickets);

    res.status(201).json(newTicket);
};

const getTickets = (req, res) => {
    let tickets = readData('tickets');

  
    if (req.user.role === 'user') {
        tickets = tickets.filter(t => t.userId === req.user.id);
    } else {
    
        const { status, priority, category, assignedTo, owned } = req.query;
        if (status) tickets = tickets.filter(t => t.status === status);
        if (priority) tickets = tickets.filter(t => t.priority === priority);
        if (category) tickets = tickets.filter(t => t.category === category);
        if (assignedTo === 'me') tickets = tickets.filter(t => t.assignedTo === req.user.id);
        if (owned === 'true') tickets = tickets.filter(t => t.userId === req.user.id);
    }

  
    tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(tickets);
};

const getTicket = (req, res) => {
    const tickets = readData('tickets');
    const ticket = tickets.find(t => t.id === req.params.id);

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (req.user.role === 'user' && ticket.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
    }


    if (ticket.assignedTo) {
        const users = readData('users');
        const tasks = users.find(u => u.id === ticket.assignedTo);
        if (tasks) {
            ticket.assignedToName = tasks.username;
        }
    }

    res.json(ticket);
};

const updateTicket = (req, res) => {
    const { status, priority, assignedTo } = req.body;
    const tickets = readData('tickets');
    const ticketIndex = tickets.findIndex(t => t.id === req.params.id);

    if (ticketIndex === -1) return res.status(404).json({ message: 'Ticket not found' });


    if (req.user.role === 'user') {

        if (status === 'Closed' && tickets[ticketIndex].userId === req.user.id) {
      
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }
    }

    const ticket = tickets[ticketIndex];
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedTo) ticket.assignedTo = assignedTo;

    ticket.updatedAt = new Date().toISOString();

    tickets[ticketIndex] = ticket;
    writeData('tickets', tickets);

  
    if (ticket.assignedTo) {
        const users = readData('users');
        const tasks = users.find(u => u.id === ticket.assignedTo);
        if (tasks) ticket.assignedToName = tasks.username;
    }

    res.json(ticket);
};

const addMessage = (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message cannot be empty' });

    const tickets = readData('tickets');
    const ticketIndex = tickets.findIndex(t => t.id === req.params.id);

    if (ticketIndex === -1) return res.status(404).json({ message: 'Ticket not found' });

    const ticket = tickets[ticketIndex];

    if (req.user.role === 'user' && ticket.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
    }


    if (ticket.status === 'Closed' && req.user.role === 'user') {
        return res.status(403).json({ message: 'Ticket is closed. You cannot reply.' });
    }

    const newMessage = {
        id: uuidv4(),
        senderId: req.user.id,
        senderRole: req.user.role,
        senderName: req.user.username,
        message,
        timestamp: new Date().toISOString()
    };

    ticket.messages.push(newMessage);
    ticket.updatedAt = new Date().toISOString();

 

    tickets[ticketIndex] = ticket;
    writeData('tickets', tickets);


    if (ticket.assignedTo) {
        const users = readData('users');
        const tasks = users.find(u => u.id === ticket.assignedTo);
        if (tasks) ticket.assignedToName = tasks.username;
    }

    res.json(ticket);
};

const updateMessage = (req, res) => {
    const { message } = req.body;
    const { ticketId, messageId } = req.params;

    const tickets = readData('tickets');
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);

    if (ticketIndex === -1) return res.status(404).json({ message: 'Ticket not found' });

    const ticket = tickets[ticketIndex];
    const msgIndex = ticket.messages.findIndex(m => m.id === messageId);

    if (msgIndex === -1) return res.status(404).json({ message: 'Message not found' });

    const msg = ticket.messages[msgIndex];

    if (req.user.role === 'user' && msg.senderId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
    }

    msg.message = message;
    ticket.messages[msgIndex] = msg;
    writeData('tickets', tickets);

    res.json(ticket);
};

const deleteMessage = (req, res) => {
    const { ticketId, messageId } = req.params;

    const tickets = readData('tickets');
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);

    if (ticketIndex === -1) return res.status(404).json({ message: 'Ticket not found' });

    const ticket = tickets[ticketIndex];

    if (req.user.role === 'user') {
        return res.status(403).json({ message: 'Access denied' });
    }

    ticket.messages = ticket.messages.filter(m => m.id !== messageId);
    writeData('tickets', tickets);

    res.json(ticket);
};

const deleteTicket = (req, res) => {

    let tickets = readData('tickets');
    const ticket = tickets.find(t => t.id === req.params.id);

    if (ticket) {
        const transcripts = readData('transcripts') || [];
        transcripts.push({
            ...ticket,
            deletedAt: new Date().toISOString(),
            deletedBy: req.user.id
        });
        writeData('transcripts', transcripts);
    }

    const newTickets = tickets.filter(t => t.id !== req.params.id);
    writeData('tickets', newTickets);
    res.json({ message: 'Ticket deleted and archived' });
};

const addAttachment = (req, res) => {
    const tickets = readData('tickets');
    const ticketIndex = tickets.findIndex(t => t.id === req.params.id);

    if (ticketIndex === -1) return res.status(404).json({ message: 'Ticket not found' });

    const ticket = tickets[ticketIndex];
    if (req.user.role === 'user' && ticket.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
    }

    if (req.file) {
 
        const newMessage = {
            id: uuidv4(),
            senderId: req.user.id,
            senderRole: req.user.role,
            senderName: req.user.username,
            message: req.file.originalname,
            attachment: '/uploads/' + req.file.filename,
            timestamp: new Date().toISOString()
        };
        ticket.messages.push(newMessage);
        ticket.updatedAt = new Date().toISOString();
        tickets[ticketIndex] = ticket;
        writeData('tickets', tickets);
        res.json(ticket);
    } else {
        res.status(400).json({ message: 'No file uploaded' });
    }
};

module.exports = { createTicket, getTickets, getTicket, updateTicket, addMessage, updateMessage, deleteMessage, deleteTicket, addAttachment };
