/**
 * Nexus Productivity Dashboard
 * Vanilla JavaScript Implementation with state-driven rendering and JS Router
 */

// --- STATE MANAGEMENT ---
// Default sample tasks if none exist in localStorage
const defaultTasks = [
    { id: '1', title: 'Design Dashboard Layout', date: new Date().toISOString().split('T')[0], status: 'done' },
    { id: '2', title: 'Implement JS Router', date: new Date().toISOString().split('T')[0], status: 'pending' },
    { id: '3', title: 'User Testing Session', date: '2026-07-15', status: 'pending' },
    { id: '4', title: 'Update Design System', date: '2026-07-20', status: 'pending' }
];

let state = {
    tasks: JSON.parse(localStorage.getItem('nexus_tasks')) || defaultTasks,
    currentView: 'dashboard', // default view
    currentFilter: 'all', // used in To-Do list
    editingTaskId: null
};

// --- DOM ELEMENTS ---
const mainWorkspace = document.getElementById('mainWorkspace');
const navLinks = document.querySelectorAll('.nav-link');
const modalOverlay = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');

// --- INITIALIZATION ---
function init() {
    setupRouter();
    renderCurrentView();
}

// --- ROUTER (State-Driven View Rendering) ---
function setupRouter() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Update active state in sidebar
            navLinks.forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // Update state and render
            state.currentView = e.currentTarget.dataset.view;
            renderCurrentView();
        });
    });
}

function renderCurrentView() {
    // Fade out effect (optional polish)
    mainWorkspace.style.opacity = '0';
    
    setTimeout(() => {
        switch (state.currentView) {
            case 'dashboard':
                mainWorkspace.innerHTML = generateDashboardHTML();
                break;
            case 'todo':
            case 'pending':
            case 'upcoming':
                // We reuse the list view but enforce filters
                mainWorkspace.innerHTML = generateListViewHTML(state.currentView);
                attachFilterEvents();
                break;
            case 'calendar':
                mainWorkspace.innerHTML = generateCalendarHTML();
                break;
            default:
                mainWorkspace.innerHTML = `<h2>View Not Found</h2>`;
        }
        mainWorkspace.style.opacity = '1';
        mainWorkspace.style.transition = 'opacity 0.3s ease';
    }, 150);
}

// --- VIEW GENERATORS ---

function generateDashboardHTML() {
    const pendingCount = state.tasks.filter(t => t.status === 'pending').length;
    const doneCount = state.tasks.filter(t => t.status === 'done').length;
    
    // Get 4 most recent pending tasks
    const recentTasks = state.tasks
        .filter(t => t.status === 'pending')
        .slice(0, 4);

    return `
        <div class="workspace-header">
            <div>
                <h1>Welcome back, Shreyansh</h1>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">Here's your productivity overview.</p>
            </div>
            <button class="btn-primary" onclick="openTaskModal()"><i class="fa-solid fa-plus"></i> New Task</button>
        </div>
        
        <div class="stats-container">
            <div class="stat-card">
                <span class="stat-title">Total Tasks</span>
                <span class="stat-value">${state.tasks.length}</span>
            </div>
            <div class="stat-card">
                <span class="stat-title">Pending</span>
                <span class="stat-value" style="color: var(--status-pending)">${pendingCount}</span>
            </div>
            <div class="stat-card">
                <span class="stat-title">Completed</span>
                <span class="stat-value" style="color: var(--status-done)">${doneCount}</span>
            </div>
        </div>

        <h3 style="margin-bottom: 1.5rem; font-weight: 500;">Recent Pending Tasks</h3>
        <div class="task-grid">
            ${recentTasks.length > 0 ? recentTasks.map(task => generateTaskCard(task)).join('') : '<p style="color: var(--text-secondary)">No pending tasks!</p>'}
        </div>
    `;
}

function generateListViewHTML(viewType) {
    let title = "To-Do List";
    if (viewType === 'pending') { title = "Pending Work"; state.currentFilter = 'pending'; }
    else if (viewType === 'upcoming') { title = "Upcoming Events"; state.currentFilter = 'upcoming'; }
    else { state.currentFilter = 'all'; } // default for 'todo' view

    return `
        <div class="workspace-header">
            <h1>${title}</h1>
            <button class="btn-primary" onclick="openTaskModal()"><i class="fa-solid fa-plus"></i> New Task</button>
        </div>
        
        ${viewType === 'todo' ? `
        <div class="filter-tabs">
            <button class="filter-tab active" data-filter="all">All Tasks</button>
            <button class="filter-tab" data-filter="pending">Pending</button>
            <button class="filter-tab" data-filter="done">Completed</button>
        </div>
        ` : ''}

        <div class="task-grid" id="taskGridContainer">
            ${renderTasksForList()}
        </div>
    `;
}

function renderTasksForList() {
    let filtered = state.tasks;
    
    if (state.currentFilter === 'pending') {
        filtered = state.tasks.filter(t => t.status === 'pending');
    } else if (state.currentFilter === 'done') {
        filtered = state.tasks.filter(t => t.status === 'done');
    } else if (state.currentFilter === 'upcoming') {
        // Simple logic: tasks with dates after today
        const todayStr = new Date().toISOString().split('T')[0];
        filtered = state.tasks.filter(t => t.date > todayStr);
    }
    
    if (filtered.length === 0) return `<p style="color: var(--text-secondary); grid-column: 1/-1;">No tasks found.</p>`;
    
    // Sort by date (nearest first)
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return filtered.map(task => generateTaskCard(task)).join('');
}

function attachFilterEvents() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            state.currentFilter = e.currentTarget.dataset.filter;
            // Update just the grid
            document.getElementById('taskGridContainer').innerHTML = renderTasksForList();
        });
    });
}

function generateCalendarHTML() {
    // Generate a simple generic month view for visual purposes
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let headerHTML = days.map(day => `<div class="cal-header-day">${day}</div>`).join('');
    
    let cellsHTML = '';
    const todayDate = new Date().getDate();
    
    // Fill 35 cells (5 weeks)
    for (let i = 1; i <= 35; i++) {
        // Dummy logic to map dates roughly
        const dateNum = i <= 31 ? i : '';
        const isToday = i === todayDate ? 'today' : '';
        
        // Check if any tasks fall on this "date" (dummy match for visuals)
        const dateString = `2026-07-${i.toString().padStart(2, '0')}`;
        const tasksOnDay = state.tasks.filter(t => t.date === dateString);
        
        let dotsHTML = '';
        if (tasksOnDay.length > 0) {
            dotsHTML = `<div class="cal-dots">${tasksOnDay.map(() => '<div class="cal-dot"></div>').join('')}</div>`;
        }

        cellsHTML += `
            <div class="cal-cell ${isToday}">
                <span class="cal-date">${dateNum}</span>
                ${dotsHTML}
            </div>
        `;
    }

    return `
        <div class="workspace-header">
            <h1>Calendar</h1>
            <button class="btn-primary" onclick="openTaskModal()"><i class="fa-solid fa-plus"></i> Add Event</button>
        </div>
        <div class="calendar-wrapper">
            <div class="calendar-header-row">${headerHTML}</div>
            <div class="calendar-grid">${cellsHTML}</div>
        </div>
    `;
}

function generateTaskCard(task) {
    const isDone = task.status === 'done';
    
    // Formatting date
    const dateObj = new Date(task.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
        <div class="task-card">
            <div class="task-header">
                <h3 class="task-title" style="${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHTML(task.title)}</h3>
                <span class="status-badge status-${task.status}">${task.status}</span>
            </div>
            <div class="task-footer">
                <div class="task-date">
                    <i class="fa-regular fa-calendar"></i> ${dateStr !== 'Invalid Date' ? dateStr : 'No Date'}
                </div>
                <div class="task-actions">
                    <button class="btn-icon" onclick="toggleTaskStatus('${task.id}')" title="Toggle Status">
                        <i class="fa-solid ${isDone ? 'fa-rotate-left' : 'fa-check'}"></i>
                    </button>
                    <button class="btn-icon" onclick="editTask('${task.id}')" title="Edit">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteTask('${task.id}')" title="Delete">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// --- TASK ACTIONS & MODAL LOGIC ---

window.openTaskModal = (taskId = null) => {
    state.editingTaskId = taskId;
    
    const titleEl = document.getElementById('modalTitle');
    const inputTitle = document.getElementById('taskTitle');
    const inputDate = document.getElementById('taskDate');
    const inputStatus = document.getElementById('taskStatus');
    
    if (taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        titleEl.textContent = 'Edit Task';
        inputTitle.value = task.title;
        inputDate.value = task.date;
        inputStatus.value = task.status;
    } else {
        titleEl.textContent = 'Create New Task';
        taskForm.reset();
        // default date to today
        inputDate.value = new Date().toISOString().split('T')[0];
    }
    
    modalOverlay.classList.add('active');
    inputTitle.focus();
};

window.closeTaskModal = () => {
    modalOverlay.classList.remove('active');
    state.editingTaskId = null;
};

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const date = document.getElementById('taskDate').value;
    const status = document.getElementById('taskStatus').value;
    
    if (!title) return;
    
    if (state.editingTaskId) {
        // Update
        state.tasks = state.tasks.map(t => 
            t.id === state.editingTaskId ? { ...t, title, date, status } : t
        );
    } else {
        // Create
        state.tasks.push({
            id: Date.now().toString(),
            title, date, status
        });
    }
    
    saveTasks();
    closeTaskModal();
    renderCurrentView(); // re-render to reflect changes
});

window.deleteTask = (id) => {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasks();
    renderCurrentView();
};

window.toggleTaskStatus = (id) => {
    state.tasks = state.tasks.map(t => {
        if (t.id === id) {
            return { ...t, status: t.status === 'pending' ? 'done' : 'pending' };
        }
        return t;
    });
    saveTasks();
    renderCurrentView();
};

window.editTask = (id) => {
    openTaskModal(id);
};

// --- UTILS ---
function saveTasks() {
    localStorage.setItem('nexus_tasks', JSON.stringify(state.tasks));
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Boot application
init();
