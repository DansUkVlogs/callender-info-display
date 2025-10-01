// Todo Tile
class TodoTile {
    constructor() {
        this.todos = this.loadTodos();
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
        
        // Listen for global updates
        window.addEventListener('tileUpdate', () => {
            this.update();
        });
    }

    setupEventListeners() {
        const addTaskBtn = document.querySelector('#todoTile .add-task-btn');
        const todoList = document.getElementById('todoList');
        
        addTaskBtn.addEventListener('click', () => {
            this.showAddTaskDialog();
        });
        
        todoList.addEventListener('click', (e) => {
            if (e.target.classList.contains('todo-checkbox')) {
                const todoId = e.target.closest('.todo-item').dataset.todoId;
                this.toggleTodo(todoId);
            } else if (e.target.classList.contains('todo-edit-btn')) {
                e.stopPropagation(); // Prevent other click handlers
                const todoId = e.target.dataset.todoId;
                this.editTodo(todoId);
            }
        });
        
        // Long press for delete
        todoList.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('todo-item')) {
                const todoId = e.target.dataset.todoId;
                this.showTodoOptions(todoId, e.clientX, e.clientY);
            }
        });
    }

    render() {
        const todoList = document.getElementById('todoList');
        
        if (this.todos.length === 0) {
            todoList.innerHTML = `
                <div class="no-todos">
                    <p>Ready to get organized?</p>
                    <button class="add-first-task">Create your first task</button>
                </div>
            `;
            
            todoList.querySelector('.add-first-task').addEventListener('click', () => {
                this.showAddTaskDialog();
            });
            return;
        }
        
        // Sort todos: incomplete first, then by priority, then by creation date
        const sortedTodos = [...this.todos].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            if (a.priority !== b.priority) {
                const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
        
        todoList.innerHTML = sortedTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-todo-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    ${todo.priority ? `<div class="todo-priority ${todo.priority}"></div>` : ''}
                    ${todo.dueDate ? `<div class="todo-due-date">${this.formatDueDate(todo.dueDate)}</div>` : ''}
                </div>
                <button class="todo-edit-btn" data-todo-id="${todo.id}" title="Edit task">✏️</button>
            </div>
        `).join('');
    }

    showAddTaskDialog() {
        const modal = document.createElement('div');
        modal.className = 'add-todo-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add New Task</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="add-todo-form">
                        <div class="form-group">
                            <label>Task:</label>
                            <input type="text" name="text" placeholder="Enter task description..." required autofocus>
                        </div>
                        <div class="form-group">
                            <label>Priority:</label>
                            <select name="priority">
                                <option value="">No priority</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Due Date:</label>
                            <input type="date" name="dueDate">
                        </div>
                        <div class="form-group">
                            <label>Category:</label>
                            <input type="text" name="category" placeholder="e.g., Work, Personal, Shopping">
                        </div>
                        <div class="form-actions">
                            <button type="submit">Add Task</button>
                            <button type="button" class="cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
            modal.querySelector('input[name="text"]').focus();
        }, 100);
        
        // Function to close modal with animation
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        };

        // Event listeners
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('.cancel-btn').addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        modal.querySelector('.add-todo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const todo = {
                id: Date.now().toString(),
                text: formData.get('text').trim(),
                priority: formData.get('priority') || null,
                dueDate: formData.get('dueDate') || null,
                category: formData.get('category').trim() || null,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            this.addTodo(todo);
            closeModal();
        });
        
        // Enter to submit
        modal.querySelector('input[name="text"]').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                modal.querySelector('.add-todo-form').dispatchEvent(new Event('submit'));
            }
        });
    }

    editTodo(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;
        
        const modal = document.createElement('div');
        modal.className = 'edit-todo-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Edit Task</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="edit-todo-form">
                        <div class="form-group">
                            <label>Task:</label>
                            <input type="text" name="text" value="${this.escapeHtml(todo.text)}" required autofocus>
                        </div>
                        <div class="form-group">
                            <label>Priority:</label>
                            <select name="priority">
                                <option value="">No priority</option>
                                <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>High</option>
                                <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>Low</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Due Date:</label>
                            <input type="date" name="dueDate" value="${todo.dueDate || ''}">
                        </div>
                        <div class="form-group">
                            <label>Category:</label>
                            <input type="text" name="category" value="${todo.category || ''}" placeholder="e.g., Work, Personal, Shopping">
                        </div>
                        <div class="form-actions">
                            <button type="submit">Update Task</button>
                            <button type="button" class="delete-btn">Delete</button>
                            <button type="button" class="cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
            const textInput = modal.querySelector('input[name="text"]');
            textInput.focus();
            textInput.select();
        }, 100);
        
        // Function to close modal with animation
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        };
        
        // Event listeners
        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('.cancel-btn').addEventListener('click', closeModal);
        
        modal.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm('Delete this task?')) {
                this.deleteTodo(todoId);
                closeModal();
            }
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        modal.querySelector('.edit-todo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const updatedTodo = {
                ...todo,
                text: formData.get('text').trim(),
                priority: formData.get('priority') || null,
                dueDate: formData.get('dueDate') || null,
                category: formData.get('category').trim() || null,
                updatedAt: new Date().toISOString()
            };
            
            this.updateTodo(updatedTodo);
            closeModal();
        });
    }

    showTodoOptions(todoId, x, y) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) return;
        
        const menu = document.createElement('div');
        menu.className = 'todo-context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.innerHTML = `
            <div class="context-menu-item" data-action="edit">Edit</div>
            <div class="context-menu-item" data-action="toggle">${todo.completed ? 'Mark Incomplete' : 'Mark Complete'}</div>
            <div class="context-menu-item" data-action="duplicate">Duplicate</div>
            <div class="context-menu-item danger" data-action="delete">Delete</div>
        `;
        
        document.body.appendChild(menu);
        
        // Position menu within viewport
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (y - rect.height) + 'px';
        }
        
        // Event listeners
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            switch (action) {
                case 'edit':
                    this.editTodo(todoId);
                    break;
                case 'toggle':
                    this.toggleTodo(todoId);
                    break;
                case 'duplicate':
                    this.duplicateTodo(todoId);
                    break;
                case 'delete':
                    if (confirm('Delete this task?')) {
                        this.deleteTodo(todoId);
                    }
                    break;
            }
            
            document.body.removeChild(menu);
        });
        
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', () => {
                if (menu.parentNode) {
                    document.body.removeChild(menu);
                }
            }, { once: true });
        }, 0);
    }

    addTodo(todo) {
        this.todos.push(todo);
        this.saveTodos();
        this.render();
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('todoAdded', { detail: todo }));
    }

    updateTodo(updatedTodo) {
        const index = this.todos.findIndex(t => t.id === updatedTodo.id);
        if (index !== -1) {
            this.todos[index] = updatedTodo;
            this.saveTodos();
            this.render();
        }
    }

    toggleTodo(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? new Date().toISOString() : null;
            this.saveTodos();
            this.render();
            
            // Animate the change
            const todoElement = document.querySelector(`[data-todo-id="${todoId}"]`);
            if (todoElement) {
                todoElement.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    todoElement.style.transform = '';
                }, 150);
            }
        }
    }

    duplicateTodo(todoId) {
        const todo = this.todos.find(t => t.id === todoId);
        if (todo) {
            const duplicatedTodo = {
                ...todo,
                id: Date.now().toString(),
                text: todo.text + ' (Copy)',
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            };
            this.addTodo(duplicatedTodo);
        }
    }

    deleteTodo(todoId) {
        this.todos = this.todos.filter(t => t.id !== todoId);
        this.saveTodos();
        this.render();
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('todoDeleted', { detail: { id: todoId } }));
    }

    formatDueDate(dueDate) {
        const date = new Date(dueDate);
        const today = new Date();
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `Overdue by ${Math.abs(diffDays)} day(s)`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else if (diffDays <= 7) {
            return `Due in ${diffDays} days`;
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadTodos() {
        try {
            return JSON.parse(localStorage.getItem('smartDisplayHub_todos')) || this.getDefaultTodos();
        } catch (e) {
            console.warn('Failed to load todos:', e);
            return this.getDefaultTodos();
        }
    }

    saveTodos() {
        try {
            localStorage.setItem('smartDisplayHub_todos', JSON.stringify(this.todos));
        } catch (e) {
            console.warn('Failed to save todos:', e);
        }
    }

    getDefaultTodos() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return [
            {
                id: '1',
                text: 'Welcome to your Smart Display Hub!',
                priority: 'high',
                category: 'Getting Started',
                completed: false,
                createdAt: new Date().toISOString(),
                dueDate: null
            },
            {
                id: '2',
                text: 'Customize your dashboard layout',
                priority: 'medium',
                category: 'Setup',
                completed: false,
                createdAt: new Date().toISOString(),
                dueDate: null
            },
            {
                id: '3',
                text: 'Add your API keys in settings',
                priority: 'low',
                category: 'Configuration',
                completed: false,
                createdAt: new Date().toISOString(),
                dueDate: tomorrow.toISOString().split('T')[0]
            }
        ];
    }

    update() {
        // Check for overdue tasks and update display
        this.render();
    }

    // Integration methods for external todo services
    async syncWithTodoist() {
        // TODO: Implement Todoist API integration
        console.log('Todoist sync not implemented yet');
    }

    async syncWithMicrosoftTodo() {
        // TODO: Implement Microsoft To Do API integration
        console.log('Microsoft To Do sync not implemented yet');
    }

    // Quick add method for external calls (like from phone companion)
    quickAdd(text, priority = null) {
        const todo = {
            id: Date.now().toString(),
            text: text.trim(),
            priority: priority,
            category: null,
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: null
        };
        
        this.addTodo(todo);
        return todo;
    }
}

// Make available globally
window.TodoTile = TodoTile;