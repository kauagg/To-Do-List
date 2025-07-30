// Estado da aplicação
let tasks = [];
let currentFilter = 'all';
let taskIdCounter = 1;

// Elementos DOM
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const taskCounter = document.getElementById('taskCounter');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadTasksFromStorage();
    setupEventListeners();
    updateUI();
});

// Configurar event listeners
function setupEventListeners() {
    // Adicionar tarefa com Enter
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Filtros
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            setFilter(this.dataset.filter);
        });
    });

    // Limpar input quando vazio
    taskInput.addEventListener('input', function() {
        if (this.value.length === 0) {
            this.classList.remove('error');
        }
    });
}

// Adicionar nova tarefa
function addTask() {
    const text = taskInput.value.trim();
    
    if (text === '') {
        showInputError('Por favor, digite uma tarefa!');
        return;
    }

    if (text.length > 200) {
        showInputError('A tarefa deve ter no máximo 200 caracteres!');
        return;
    }

    // Verificar se a tarefa já existe
    if (tasks.some(task => task.text.toLowerCase() === text.toLowerCase())) {
        showInputError('Esta tarefa já existe!');
        return;
    }

    const newTask = {
        id: taskIdCounter++,
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };

    tasks.unshift(newTask); // Adicionar no início da lista
    taskInput.value = '';
    taskInput.classList.remove('error');
    
    saveTasksToStorage();
    updateUI();
    
    // Feedback visual
    showSuccessMessage('Tarefa adicionada com sucesso!');
}

// Mostrar erro no input
function showInputError(message) {
    taskInput.classList.add('error');
    taskInput.focus();
    showErrorMessage(message);
}

// Alternar status da tarefa
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        
        saveTasksToStorage();
        updateUI();
        
        const message = task.completed ? 'Tarefa concluída!' : 'Tarefa reativada!';
        showSuccessMessage(message);
    }
}

// Editar tarefa
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newText = prompt('Editar tarefa:', task.text);
    if (newText === null) return; // Cancelado
    
    const trimmedText = newText.trim();
    if (trimmedText === '') {
        showErrorMessage('A tarefa não pode estar vazia!');
        return;
    }

    if (trimmedText.length > 200) {
        showErrorMessage('A tarefa deve ter no máximo 200 caracteres!');
        return;
    }

    // Verificar se a nova tarefa já existe (exceto a atual)
    if (tasks.some(t => t.id !== id && t.text.toLowerCase() === trimmedText.toLowerCase())) {
        showErrorMessage('Esta tarefa já existe!');
        return;
    }

    task.text = trimmedText;
    saveTasksToStorage();
    updateUI();
    showSuccessMessage('Tarefa editada com sucesso!');
}

// Remover tarefa
function removeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (confirm(`Tem certeza que deseja remover a tarefa "${task.text}"?`)) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasksToStorage();
        updateUI();
        showSuccessMessage('Tarefa removida com sucesso!');
    }
}

// Limpar tarefas concluídas
function clearCompleted() {
    const completedTasks = tasks.filter(t => t.completed);
    
    if (completedTasks.length === 0) {
        showErrorMessage('Não há tarefas concluídas para remover!');
        return;
    }

    if (confirm(`Tem certeza que deseja remover ${completedTasks.length} tarefa(s) concluída(s)?`)) {
        tasks = tasks.filter(t => !t.completed);
        saveTasksToStorage();
        updateUI();
        showSuccessMessage(`${completedTasks.length} tarefa(s) removida(s)!`);
    }
}

// Definir filtro
function setFilter(filter) {
    currentFilter = filter;
    
    // Atualizar botões
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    updateUI();
}

// Filtrar tarefas
function getFilteredTasks() {
    switch (currentFilter) {
        case 'pending':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

// Atualizar interface
function updateUI() {
    renderTasks();
    updateCounter();
    updateEmptyState();
}

// Renderizar tarefas
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    taskList.innerHTML = '';
    
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 onclick="toggleTask(${task.id})"
                 role="checkbox" 
                 aria-checked="${task.completed}"
                 tabindex="0">
            </div>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="task-btn edit-btn" 
                        onclick="editTask(${task.id})"
                        title="Editar tarefa"
                        aria-label="Editar tarefa">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete-btn" 
                        onclick="removeTask(${task.id})"
                        title="Remover tarefa"
                        aria-label="Remover tarefa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        taskList.appendChild(li);
    });
}

// Atualizar contador
function updateCounter() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    let text = '';
    if (total === 0) {
        text = '0 tarefas';
    } else if (total === 1) {
        text = '1 tarefa';
    } else {
        text = `${total} tarefas`;
    }
    
    if (total > 0) {
        text += ` (${pending} pendente${pending !== 1 ? 's' : ''}, ${completed} concluída${completed !== 1 ? 's' : ''})`;
    }
    
    taskCounter.textContent = text;
}

// Atualizar estado vazio
function updateEmptyState() {
    const filteredTasks = getFilteredTasks();
    const isEmpty = filteredTasks.length === 0;
    
    emptyState.classList.toggle('hidden', !isEmpty);
    
    if (isEmpty) {
        let message = '';
        switch (currentFilter) {
            case 'pending':
                message = tasks.length === 0 
                    ? 'Adicione sua primeira tarefa para começar!'
                    : 'Parabéns! Você não tem tarefas pendentes.';
                break;
            case 'completed':
                message = 'Nenhuma tarefa concluída ainda.';
                break;
            default:
                message = 'Adicione sua primeira tarefa para começar a organizar seu dia!';
        }
        
        emptyState.querySelector('p').textContent = message;
    }
}

// Salvar no localStorage
function saveTasksToStorage() {
    try {
        localStorage.setItem('todolist_tasks', JSON.stringify(tasks));
        localStorage.setItem('todolist_counter', taskIdCounter.toString());
    } catch (error) {
        console.error('Erro ao salvar tarefas:', error);
        showErrorMessage('Erro ao salvar tarefas. Verifique o armazenamento do navegador.');
    }
}

// Carregar do localStorage
function loadTasksFromStorage() {
    try {
        const savedTasks = localStorage.getItem('todolist_tasks');
        const savedCounter = localStorage.getItem('todolist_counter');
        
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
        
        if (savedCounter) {
            taskIdCounter = parseInt(savedCounter, 10);
        }
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        showErrorMessage('Erro ao carregar tarefas salvas.');
        tasks = [];
        taskIdCounter = 1;
    }
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mostrar mensagens
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    // Remover mensagens existentes
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    // Estilos inline para a mensagem
    Object.assign(messageDiv.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '1000',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: 'slideInRight 0.3s ease-out',
        backgroundColor: type === 'success' ? '#10b981' : '#ef4444'
    });
    
    document.body.appendChild(messageDiv);
    
    // Remover após 3 segundos
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Adicionar estilos de animação para mensagens
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .task-input.error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
`;
document.head.appendChild(style);

// Adicionar suporte para navegação por teclado
document.addEventListener('keydown', function(e) {
    // Esc para limpar filtros
    if (e.key === 'Escape') {
        if (currentFilter !== 'all') {
            setFilter('all');
        } else {
            taskInput.focus();
        }
    }
    
    // Ctrl/Cmd + A para focar no input
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && e.target !== taskInput) {
        e.preventDefault();
        taskInput.focus();
        taskInput.select();
    }
});

// Adicionar suporte para checkbox com teclado
document.addEventListener('keydown', function(e) {
    if (e.target.classList.contains('task-checkbox') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        e.target.click();
    }
});

// Exportar funções para uso global
window.addTask = addTask;
window.toggleTask = toggleTask;
window.editTask = editTask;
window.removeTask = removeTask;
window.clearCompleted = clearCompleted;
