
const state = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    currentTicketId: null,
    pollingInterval: null,
    theme: localStorage.getItem('theme') || 'dark'
};

if (state.theme === 'light') document.body.classList.add('light-theme');

const showModal = (title, message, icon = 'info-circle') => {
    return new Promise(resolve => {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-text').innerHTML = message;
        document.getElementById('modal-icon').innerHTML = `<i class="fas fa-${icon}"></i>`;

        const actions = document.getElementById('modal-actions');
        actions.innerHTML = '';

        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.innerText = 'OK';
        btn.onclick = () => {
            overlay.classList.remove('active');
            resolve();
        };
        actions.appendChild(btn);

        overlay.classList.add('active');
    });
};

const hideModal = () => {
    document.getElementById('modal-overlay').classList.remove('active');
   
    const container = document.querySelector('.modal-container');
    if (container) {
        container.style.maxWidth = '400px';
        container.style.width = '90%';
        container.style.maxHeight = '';
        container.style.overflowY = '';
        container.style.textAlign = 'center';
    }
};

document.getElementById('modal-overlay').onclick = (e) => {
    if (e.target.id === 'modal-overlay') hideModal();
};

const showConfirm = (title, message, onConfirm) => {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-text').innerText = message;
    document.getElementById('modal-icon').innerHTML = `<i class="fas fa-question-circle"></i>`;

    const actions = document.getElementById('modal-actions');
    actions.innerHTML = '';

    const cancel = document.createElement('button');
    cancel.className = 'btn btn-secondary';
    cancel.innerText = 'Cancel';
    cancel.onclick = hideModal;

    const confirm = document.createElement('button');
    confirm.className = 'btn btn-primary';
    confirm.innerText = 'Confirm';
    confirm.onclick = () => {
        hideModal();
        if (onConfirm) onConfirm();
    };

    actions.appendChild(cancel);
    actions.appendChild(confirm);

    overlay.classList.add('active');

};

const toggleTheme = () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', state.theme);
};


const api = async (endpoint, method = 'GET', body = null, isFormData = false) => {
    const headers = {};
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const options = { method, headers };
    if (body) options.body = isFormData ? body : JSON.stringify(body);

    const res = await fetch(`/api${endpoint}`, options);
    if (res.status === 401) {
        logout();
        return null;
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'API Error');
        return data;
    } else {
       
        const text = await res.text();
        console.error('Non-JSON Response:', text);
        throw new Error(`Server returned an unexpected response (Status: ${res.status}). This usually means the server needs to be restarted.`);
    }
};

const showLogin = () => {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
};

const showRegister = () => {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
};

const login = async (e) => {
    e.preventDefault();
    console.log('Login attempt started...');
    const form = e.target;
    const body = { email: form.email.value, password: form.password.value };
    try {
        const data = await api('/auth/login', 'POST', body);
        console.log('Login successful:', data.user.email);
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('token', state.token);
        localStorage.setItem('user', JSON.stringify(state.user));
        initApp();
    } catch (err) {
        console.error('Login failed:', err);
        showModal('Login Failed', err.message, 'exclamation-circle');
    }
};

const register = async (e) => {
    e.preventDefault();
    const form = e.target;
    const body = { username: form.username.value, email: form.email.value, password: form.password.value };
    try {
        const data = await api('/auth/register', 'POST', body);
        await showModal('Success', 'Registered! Please login.', 'check-circle');
        showLogin();
    } catch (err) {
        showModal('Error', err.message, 'exclamation-circle');
    }
};

const logout = () => {

    api('/auth/logout', 'POST').catch(() => { });
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.reload();
};

document.getElementById('loginForm').addEventListener('submit', login);
document.getElementById('registerForm').addEventListener('submit', register);


const initApp = () => {
    if (!state.token) {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        return;
    }

    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

 
    document.getElementById('user-role-display').innerText = state.user.role.toUpperCase();
    if (state.user.role === 'admin') {
        document.getElementById('admin-links').classList.remove('hidden');
    }

    navigate('dashboard');
};

const navigate = (page, param = null) => {

    if (state.pollingInterval) clearInterval(state.pollingInterval);


    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));


    const content = document.getElementById('page-content');
    content.innerHTML = '';

    const tpl = document.getElementById(`tpl-${page === 'ticket-view' ? 'ticket-view' : page.replace('users', 'users')}`);


    let templateId = `tpl-${page}`;
    if (page === 'create-ticket') templateId = 'tpl-create-ticket';

    const template = document.getElementById(templateId);
    if (!template) return;

    content.appendChild(template.content.cloneNode(true));

    if (page === 'dashboard') loadDashboard();
    if (page === 'tickets') loadTickets();
    if (page === 'create-ticket') setupCreateTicket();
    if (page === 'ticket-view') loadTicketView(param);
    if (page === 'admin-stats') loadAdminStats();
    if (page === 'users') loadUsers();
    if (page === 'transcripts') loadTranscripts();
};



const loadDashboard = async () => {
    document.getElementById('dash-username').innerText = state.user.username;


    const tickets = await api('/tickets?owned=true');

    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    const closed = tickets.filter(t => t.status === 'Closed').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-open').innerText = open;
    document.getElementById('stat-closed').innerText = closed;


    const recent = tickets.slice(0, 5);
    const list = document.getElementById('recent-tickets-list');
    if (recent.length === 0) list.innerHTML = '<p class="text-secondary">No tickets found.</p>';
    recent.forEach(t => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-4 border-b border-gray-700';
        div.innerHTML = `
            <div>
                <div class="font-bold">#${t.ticketId} ${t.subject}</div>
                <div class="text-sm text-secondary">${new Date(t.createdAt).toLocaleString()}</div>
            </div>
            <span class="badge badge-${t.status === 'Open' ? 'open' : 'closed'}">${t.status}</span>
        `;
        div.style.cursor = 'pointer';
        div.onclick = () => navigate('ticket-view', t.id);
        list.appendChild(div);
    });
};

const setupCreateTicket = () => {
    document.getElementById('createTicketForm').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            await api('/tickets', 'POST', formData, true);
            await showModal('Success', 'Ticket Created Successfully', 'check-circle');
            navigate('tickets');
        } catch (err) {
            showModal('Error', err.message, 'exclamation-triangle');
        }
    };
};

const loadTickets = async (mode) => {
    const statusFilter = document.getElementById('filter-status') ? document.getElementById('filter-status').value : '';
    const searchText = document.getElementById('search-tickets') ? document.getElementById('search-tickets').value.toLowerCase() : '';

    let url = '/tickets?owned=true';
    if (mode === 'me') url = '/tickets?assignedTo=me';

    let tickets = await api(url);

    if (statusFilter) {
        tickets = tickets.filter(t => t.status === statusFilter);
    }

    if (searchText) {
        tickets = tickets.filter(t => t.subject.toLowerCase().includes(searchText) || t.ticketId.toString().includes(searchText));
    }

    const tbody = document.getElementById('tickets-table-body');
    tbody.innerHTML = '';

    tickets.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-700 hover:bg-gray-800 cursor-pointer';
        tr.onclick = () => navigate('ticket-view', t.id);
        tr.innerHTML = `
            <td class="p-4">#${t.ticketId}</td>
            <td class="p-4 font-bold text-white">${t.subject}</td>
            <td class="p-4">${t.category}</td>
            <td class="p-4"><span class="badge badge-${t.status === 'Open' ? 'open' : 'closed'}">${t.status}</span></td>
            <td class="p-4 text-sm">${new Date(t.updatedAt).toLocaleDateString()}</td>
            <td class="p-4"><button class="btn btn-sm btn-secondary">View</button></td>
        `;
        tbody.appendChild(tr);
    });
};

const loadTicketView = async (id) => {
    state.currentTicketId = id;
    const ticket = await api(`/tickets/${id}`);
    state.currentTicket = ticket; 

    document.getElementById('tv-subject').innerText = ticket.subject;

    document.getElementById('tv-id-badge').innerText = `#${ticket.ticketId}`;
    document.getElementById('tv-status-badge').innerText = ticket.status;
    document.getElementById('tv-status-badge').className = `badge badge-${ticket.status === 'Open' ? 'open' : 'closed'}`;

    document.getElementById('tv-category-badge').innerText = ticket.category;
    document.getElementById('tv-priority-badge').innerText = ticket.priority;
    document.getElementById('tv-date').innerText = new Date(ticket.createdAt).toLocaleString();

    document.getElementById('tv-desc').innerText = ticket.description;


    document.getElementById('tv-assigned').innerText = ticket.assignedToName || (ticket.assignedTo ? 'Assigned' : 'Unassigned');
    document.getElementById('tv-user').innerText = ticket.userName;


    const chatInput = document.getElementById('chat-input-wrapper');
    const closedMsg = document.getElementById('closed-message');



    if (ticket.status === 'Closed' && state.user.role === 'user') {
        chatInput.style.display = 'none';
        closedMsg.style.display = 'block';
    } else {
        chatInput.style.display = 'flex'; 
        closedMsg.style.display = 'none';
    }

    const attachmentContainer = document.getElementById('tv-attachment');
    attachmentContainer.innerHTML = '';

    if (ticket.attachment) {

        if (ticket.attachment.match(/\.(jpeg|jpg|gif|png)$/i)) {
            const img = document.createElement('img');
            img.src = ticket.attachment;
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            img.style.borderRadius = '8px';
            img.style.cursor = 'pointer';
            img.style.marginBottom = '0.5rem';
            img.onclick = () => window.open(ticket.attachment, '_blank');
            attachmentContainer.appendChild(img);
        } else {
            const link = document.createElement('a');
            link.href = ticket.attachment;
            link.target = '_blank';
            link.innerText = '📎 View Attachment';
            link.className = 'text-primary block text-sm';
            attachmentContainer.appendChild(link);
        }
    }


    const actions = document.getElementById('ticket-actions');
    actions.innerHTML = '';
    if (state.user.role === 'admin' || state.user.role === 'support') {

        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.innerText = ticket.status === 'Open' ? 'Close Ticket' : 'Reopen Ticket';
        btn.onclick = async () => {
            const newStatus = ticket.status === 'Open' ? 'Closed' : 'Open';
            await api(`/tickets/${id}`, 'PUT', { status: newStatus });
            loadTicketView(id);
        };


        const prioSelect = document.createElement('select');
        prioSelect.className = 'input';
        prioSelect.style.padding = '0.4rem';
        ['Low', 'Medium', 'High', 'Urgent'].forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.text = p;
            if (ticket.priority === p) opt.selected = true;
            prioSelect.appendChild(opt);
        });
        prioSelect.onchange = async () => {
            await api(`/tickets/${id}`, 'PUT', { priority: prioSelect.value });
            loadTicketView(id);
        };
        actions.appendChild(prioSelect);

        actions.appendChild(btn);

        if (state.user.role === 'admin' || state.user.role === 'support') {
            const users = await api('/admin/users');
            const staff = users.filter(u => u.role === 'support' || u.role === 'admin');

            const select = document.createElement('select');
            select.className = 'input';
            select.style.padding = '0.4rem';
            let defOpt = document.createElement('option');
            defOpt.value = '';
            defOpt.text = 'Assign Staff...';
            select.appendChild(defOpt);

            staff.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.text = s.username;
                if (ticket.assignedTo === s.id) opt.selected = true;
                select.appendChild(opt);
            });

            select.onchange = async () => {
                const val = select.value;
                await api(`/tickets/${id}`, 'PUT', { assignedTo: val });
                showModal('Assigned', 'Staff member assigned successfully.', 'check-circle');
                loadTicketView(id);
            };
            actions.appendChild(select);
        }

        if (state.user.role === 'admin') {
            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-danger';
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.title = 'Delete Ticket';
            delBtn.onclick = async () => {
                showConfirm('Delete Ticket?', 'Are you sure you want to delete this ticket? This action cannot be undone.', async () => {
                    await api(`/tickets/${id}`, 'DELETE');
                    navigate('transcripts');
                });
            };
            actions.appendChild(delBtn);
        }
    }

  
    document.getElementById('tv-assigned').innerText = ticket.assignedToName || (ticket.assignedTo ? 'Assigned' : 'Unassigned');


    const replyBox = document.getElementById('reply-message');
    replyBox.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    renderMessages(ticket.messages);

    state.pollingInterval = setInterval(async () => {
        if (state.currentTicketId !== id) return;
        const fresh = await api(`/tickets/${id}`);
        if (fresh.messages.length !== ticket.messages.length || fresh.messages[fresh.messages.length - 1]?.id !== ticket.messages[ticket.messages.length - 1]?.id) {
            ticket.messages = fresh.messages;
            state.currentTicket = ticket; 
            renderMessages(fresh.messages);
        }
    }, 3000);
};

const renderMessages = (messages) => {
    const chat = document.getElementById('tv-chat');
    chat.innerHTML = '';
    messages.forEach(m => {
        const isMe = m.senderId === state.user.id;
        const isAdminOrSupport = state.user.role === 'admin' || state.user.role === 'support';
        const canEdit = isMe;
        const canDelete = isAdminOrSupport;

        const div = document.createElement('div');
        div.className = `message ${isMe ? 'own' : ''}`;

        let actions = '';
        if (canEdit || canDelete) {
            actions += `<div style="text-align:right; margin-bottom:4px; opacity:0.6; font-size:0.8em;">`;
          
            if (canEdit) actions += `<i class="fas fa-pen" style="cursor:pointer; margin-right:8px;" onclick="editMessage('${m.id}')"></i>`;
            if (canDelete) actions += `<i class="fas fa-trash" style="cursor:pointer;" onclick="deleteMessage('${m.id}')"></i>`;
            actions += `</div>`;
        }

        let attachmentHtml = '';
        if (m.attachment) {
            if (m.attachment.match(/\.(jpeg|jpg|gif|png)$/i)) {
      
                attachmentHtml = `<div style="margin-top: 5px; margin-bottom: 5px;">
                                    <img src="${m.attachment}" style="max-width: 100%; max-height: 200px; border-radius: 8px; cursor: pointer;" onclick="window.open('${m.attachment}', '_blank')">
                                  </div>`;
            } else {
               
                attachmentHtml = `<div style="margin-top: 5px; margin-bottom: 5px;">
                                    <a href="${m.attachment}" target="_blank" style="color: inherit; text-decoration: underline; font-weight: bold;">
                                        <i class="fas fa-paperclip"></i> View Attachment
                                    </a>
                                  </div>`;
            }
        }

        div.innerHTML = `
            ${actions}
            ${attachmentHtml}
            <div>${m.message}</div>
            <span class="message-meta">${m.senderName} • ${new Date(m.timestamp).toLocaleTimeString()}</span>
        `;
        chat.appendChild(div);
    });
    chat.scrollTop = chat.scrollHeight;
};




window.editMessage = async (msgId) => {

    const msg = state.currentTicket.messages.find(m => m.id === msgId);
    if (!msg) return;
    const currentText = msg.message;


    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').innerText = 'Edit Message';
    document.getElementById('modal-text').innerText = '';
    document.getElementById('modal-icon').innerHTML = `<i class="fas fa-pen"></i>`;


    const input = document.createElement('textarea');
    input.className = 'modal-input';
    input.value = currentText;

    input.rows = 4;

    const container = document.getElementById('modal-text');
    container.innerHTML = '';
    container.appendChild(input);

    const actions = document.getElementById('modal-actions');
    actions.innerHTML = '';

    const cancel = document.createElement('button');
    cancel.className = 'btn btn-secondary';
    cancel.innerText = 'Cancel';
    cancel.onclick = () => overlay.classList.remove('active');

    const save = document.createElement('button');
    save.className = 'btn btn-primary';
    save.innerText = 'Save Changes';
    save.onclick = async () => {
        const newText = input.value;
        if (newText && newText !== currentText) {
            overlay.classList.remove('active');
            try {
                await api(`/tickets/${state.currentTicketId}/messages/${msgId}`, 'PUT', { message: newText });
                loadTicketView(state.currentTicketId);
            } catch (err) {
                showModal('Error', err.message, 'times-circle');
            }
        }
    };

    actions.appendChild(cancel);
    actions.appendChild(save);
    overlay.classList.add('active');
};


window.deleteMessage = async (msgId) => {
    showConfirm('Delete Message', 'Are you sure you want to delete this message?', async () => {
        try {
            await api(`/tickets/${state.currentTicketId}/messages/${msgId}`, 'DELETE');
            loadTicketView(state.currentTicketId);
        } catch (err) {
            showModal('Error', err.message, 'times-circle');
        }
    });
};

const sendMessage = async () => {
    const txt = document.getElementById('reply-message');
    if (!txt.value.trim()) return;
    try {
        await api(`/tickets/${state.currentTicketId}/messages`, 'POST', { message: txt.value });
        txt.value = '';
        const t = await api(`/tickets/${state.currentTicketId}`);
        renderMessages(t.messages);
    } catch (err) {
        showModal('Error', err.message, 'times-circle');
    }
};

const loadAdminStats = async () => {
    const stats = await api('/admin/stats');
    document.getElementById('adm-total').innerText = stats.totalTickets;
    document.getElementById('adm-online').innerText = stats.staffOnline;


    const statusFilter = document.getElementById('admin-filter-status') ? document.getElementById('admin-filter-status').value : '';
    const searchText = document.getElementById('admin-search-tickets') ? document.getElementById('admin-search-tickets').value.toLowerCase() : '';

    let tickets = await api('/tickets'); 

    if (statusFilter) tickets = tickets.filter(t => t.status === statusFilter);
    if (searchText) tickets = tickets.filter(t => t.subject.toLowerCase().includes(searchText) || t.ticketId.includes(searchText) || t.userName.toLowerCase().includes(searchText));

    const tbody = document.getElementById('admin-tickets-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-secondary">No tickets found in database.</td></tr>';
        return;
    }

    tickets.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-700 hover:bg-white/5 cursor-pointer';
        tr.onclick = () => navigate('ticket-view', t.id);
        tr.innerHTML = `
            <td class="p-4 text-accent font-mono">#${t.ticketId}</td>
            <td class="p-4 font-bold text-white">${t.userName}</td>
            <td class="p-4">${t.subject}</td>
            <td class="p-4">
                <span style="font-size: 0.8rem; padding: 2px 8px; border-radius: 4px; background: rgba(255,255,255,0.05);">
                    ${t.category}
                </span>
            </td>
            <td class="p-4"><span class="badge badge-${t.status === 'Open' ? 'open' : 'closed'}">${t.status}</span></td>
            <td class="p-4"><button class="btn btn-sm btn-secondary">Manage</button></td>
        `;
        tbody.appendChild(tr);
    });
};

const exportData = async () => {
    const data = await api('/admin/export'); 

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets-export.json';
    a.click();
};

const loadUsers = async () => {
    const users = await api('/admin/users');
    const searchText = document.getElementById('user-search') ? document.getElementById('user-search').value.toLowerCase() : '';

    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    let filtered = users;
    if (searchText) {
        filtered = users.filter(u => u.username.toLowerCase().includes(searchText) || u.email.toLowerCase().includes(searchText));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-secondary">No users found.</td></tr>';
        return;
    }

    filtered.forEach(u => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-700';

        let roleSelect = '';
        if (state.user.id !== u.id) {
            roleSelect = `<select class="input" style="padding: 0.2rem; width: auto;" onchange="changeUserRole('${u.id}', this.value)">
                <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                <option value="support" ${u.role === 'support' ? 'selected' : ''}>Support Staff</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
             </select>`;
        } else {
            roleSelect = `<span class="badge badge-closed">${u.role}</span>`;
        }

        tr.innerHTML = `
            <td class="p-4">${u.username}</td>
            <td class="p-4">${u.email}</td>
            <td class="p-4">${roleSelect}</td>
            <td class="p-4">${u.banned ? '<span class="text-danger font-bold">BANNED</span>' : '<span class="text-success">Active</span>'}</td>
            <td class="p-4">
                ${state.user.id !== u.id ? `<button class="btn btn-sm ${u.banned ? 'btn-secondary' : 'btn-danger'}" onclick="banUser('${u.id}')">${u.banned ? 'Unban' : 'Ban'}</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.filterUsers = () => {
    loadUsers();
};

const changeUserRole = async (userId, newRole) => {
    try {
        await api('/admin/users/role', 'PUT', { userId, role: newRole });
        showModal('Success', 'User role updated successfully.', 'check-circle');
    } catch (err) {
        showModal('Error', err.message, 'times-circle');
        loadUsers(); 
    }
};

const loadTranscripts = async () => {
    try {
        const transcripts = await api('/admin/transcripts');
        const searchText = document.getElementById('transcript-search') ? document.getElementById('transcript-search').value.toLowerCase() : '';

        const tbody = document.getElementById('transcripts-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        let filtered = transcripts;
        if (searchText) {
            filtered = transcripts.filter(t =>
                t.ticketId.includes(searchText) ||
                t.subject.toLowerCase().includes(searchText) ||
                t.category.toLowerCase().includes(searchText)
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-secondary">No transcripts found.</td></tr>';
            return;
        }

        filtered.forEach(t => {
            const tr = document.createElement('tr');
            tr.className = `transcript-row border-b border-gray-700 hover:bg-white/5 transition-colors ${selectedTranscripts.has(t.id) ? 'selected' : ''}`;
            const deletedBy = (t.deletedBy === state.user.id) ? 'You' : 'Admin';

            tr.innerHTML = `
            <td class="p-4">
                <input type="checkbox" class="transcript-checkbox checkbox-custom" data-id="${t.id}" ${selectedTranscripts.has(t.id) ? 'checked' : ''} onclick="toggleTranscriptSelection('${t.id}', this); event.stopPropagation();">
            </td>
            <td class="p-4 font-mono text-accent">#${t.ticketId}</td>
            <td class="p-4 font-bold text-white">${t.subject}</td>
            <td class="p-4"><span class="deleted-badge">${deletedBy}</span></td>
            <td class="p-4 text-sm text-secondary">${new Date(t.deletedAt).toLocaleString()}</td>
            <td class="p-4"><button class="btn btn-sm btn-secondary" onclick='viewTranscript(${JSON.stringify(t.id)})'>View History</button></td>
        `;
            tbody.appendChild(tr);
        });
        updateBulkUI();
    } catch (err) {
        console.error('Error loading transcripts:', err);
    }
};

window.viewTranscript = async (tid) => {
    try {
        const transcripts = await api('/admin/transcripts');
        const t = transcripts.find(x => x.id === tid);
        if (!t) return showModal('Error', 'Transcript not found', 'times-circle');


        let contentHtml = `<div class="transcript-detail-view" style="text-align: left;">
            <div class="card p-4 mb-4" style="background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 12px;">
                <h3 class="font-bold text-lg mb-2" style="color: var(--primary);">${t.subject}</h3>
                <div class="flex gap-4 text-xs text-secondary mb-3">
                    <span><i class="fas fa-tag"></i> ${t.category}</span>
                    <span><i class="far fa-clock"></i> ${new Date(t.createdAt).toLocaleString()}</span>
                    <span><i class="fas fa-hashtag"></i> ${t.ticketId}</span>
                </div>
                <div class="text-sm p-3 rounded bg-black/30 border border-white/5 text-gray-200">
                    ${t.description}
                </div>
            </div>
            
            <h4 class="font-bold text-sm uppercase text-secondary mb-3 ml-1">Conversation History</h4>
            <div class="chat-container" id="transcript-chat-container" style="max-height: 450px; overflow-y: auto; background: var(--bg-dark); border: 1px solid var(--glass-border); border-radius: 16px; padding: 1.25rem;">`;

        if (t.messages && t.messages.length > 0) {
            t.messages.forEach(m => {
                const isStaff = (m.senderRole === 'admin' || m.senderRole === 'support');

                let attachmentHtml = '';
                if (m.attachment) {
                    const isImg = m.attachment.match(/\.(jpeg|jpg|gif|png)$/i);
                    if (isImg) {
                        attachmentHtml = `<div class="mt-2 text-center"><img src="${m.attachment}" style="max-width:100\%; border-radius:8px; border: 1px solid rgba(255,255,255,0.1);"></div>`;
                    } else {
                        attachmentHtml = `<div class="mt-2 text-center"><a href="${m.attachment}" target="_blank" class="btn btn-sm btn-secondary" style="font-size: 0.75rem; width:100\%;"><i class="fas fa-paperclip"></i> View Attachment</a></div>`;
                    }
                }

                contentHtml += `
                <div class="mb-4 p-3 rounded-xl ${isStaff ? 'bg-primary/10 ml-8 border border-primary/20' : 'bg-gray-700/20 mr-8 border border-gray-600/30'}">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-xs ${isStaff ? 'text-blue-400' : 'text-accent'}">${m.senderName} (${m.senderRole})</span>
                        <span class="text-xs text-secondary opacity-70">${new Date(m.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div class="text-sm text-gray-100">${m.message}</div>
                    ${attachmentHtml}
                </div>`;
            });
        } else {
            contentHtml += `<div class="text-center text-secondary py-6 italic">No messages in history.</div>`;
        }

        contentHtml += `</div>
            <div class="text-xs text-secondary mt-4 pt-4 border-t border-white/5 text-center">
                Permanently archived and deleted at ${new Date(t.deletedAt).toLocaleString()}
            </div>
        </div>`;


        const modalContainer = document.querySelector('.modal-container');
        if (modalContainer) {
            modalContainer.style.maxWidth = '600px';
            modalContainer.style.width = '90%';
            modalContainer.style.maxHeight = '85vh';
            modalContainer.style.overflowY = 'auto';
            modalContainer.style.textAlign = 'left';
        }

        showModal(`Transcript History`, contentHtml, 'file-contract');
    } catch (e) {
        showModal('Error', e.message, 'times-circle');
    }
};


const banUser = async (id) => {
    showConfirm('Ban User', 'Toggle ban status for this user?', async () => {
        await api('/admin/users/ban', 'PUT', { userId: id });
        loadUsers();
    });
};

window.triggerAttachment = () => {
    document.getElementById('new-attachment-input').click();
};

window.uploadAttachment = async (input) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('attachment', file);

        try {
            await api(`/tickets/${state.currentTicketId}/attachment`, 'POST', formData, true);
            loadTicketView(state.currentTicketId);
        } catch (err) {
            showModal('Upload Failed', err.message, 'times-circle');
        }
        input.value = ''; 
    }
};

const clearCache = () => {
    if ('caches' in window) {
        caches.keys().then((names) => {
            names.forEach((name) => {
                caches.delete(name);
            });
        });
    }
    window.location.reload(true);
};


window.addEventListener('load', () => {
    if (state.token) {
        initApp();
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
    }
});


window.toggleSettingsMenu = (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const dropdown = document.getElementById('settings-dropdown');

    btn.classList.toggle('active');
    dropdown.classList.toggle('show');
};

const selectedTranscripts = new Set();

window.toggleTranscriptSelection = (id, checkbox) => {
    if (checkbox.checked) {
        selectedTranscripts.add(id);
        checkbox.closest('tr').classList.add('selected');
    } else {
        selectedTranscripts.delete(id);
        checkbox.closest('tr').classList.remove('selected');
    }
    updateBulkUI();
};

window.toggleSelectAllTranscripts = (mainCheckbox) => {
    const checkboxes = document.querySelectorAll('.transcript-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = mainCheckbox.checked;
        const id = cb.getAttribute('data-id');
        if (mainCheckbox.checked) {
            selectedTranscripts.add(id);
            cb.closest('tr').classList.add('selected');
        } else {
            selectedTranscripts.delete(id);
            cb.closest('tr').classList.remove('selected');
        }
    });
    updateBulkUI();
};

const updateBulkUI = () => {
    const info = document.getElementById('bulk-selection-info');
    const deleteBtn = document.getElementById('bulk-delete-transcripts');
    const countSpan = document.getElementById('selected-count');

    if (selectedTranscripts.size > 0) {
        info.classList.remove('hidden');
        deleteBtn.classList.remove('hidden');
        countSpan.innerText = `${selectedTranscripts.size} items selected`;
    } else {
        info.classList.add('hidden');
        deleteBtn.classList.add('hidden');
    }
};

window.deselectAllTranscripts = () => {
    selectedTranscripts.clear();
    const main = document.getElementById('select-all-transcripts');
    if (main) main.checked = false;
    document.querySelectorAll('.transcript-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.transcript-row').forEach(tr => tr.classList.remove('selected'));
    updateBulkUI();
};

window.filterTranscripts = () => {
    loadTranscripts();
};

window.bulkDeleteTranscripts = async () => {
    if (selectedTranscripts.size === 0) return;

    showConfirm('Delete Transcripts', `Are you sure you want to permanently delete ${selectedTranscripts.size} transcripts? This cannot be undone.`, async () => {
        try {
            await api('/admin/transcripts', 'DELETE', { ids: Array.from(selectedTranscripts) });
            selectedTranscripts.clear();
            loadTranscripts();
        } catch (err) {
            showModal('Error', err.message, 'times-circle');
        }
    });
};


window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('settings-dropdown');
    const btn = document.querySelector('.settings-btn');
    if (dropdown && dropdown.classList.contains('show')) {
        if (!e.target.closest('.settings-menu')) {
            dropdown.classList.remove('show');
            if (btn) btn.classList.remove('active');
        }
    }
});
