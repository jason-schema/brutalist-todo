// Global state management
let untitledCount = 1;
let todoData = JSON.parse(localStorage.getItem('brutalistTodoData')) || {};
let currentDate = new Date();
let currentWeekOffset = 0;

// Drag and drop state
let draggedElement = null;
let dragGhost = null;
let originalParent = null;
let originalIndex = null;

// Utility functions
const saveToLocalStorage = () => {
  localStorage.setItem('brutalistTodoData', JSON.stringify(todoData));
};

const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Date formatting utilities
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const formatDisplayDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const getRelativeDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset + (currentWeekOffset * 7));
  return date;
};

// Create a date section
const createDateSection = (date) => {
  const dateKey = formatDate(date);
  const displayDate = formatDisplayDate(date);
  
  const section = document.createElement('section');
  section.className = 'date-section';
  section.dataset.date = dateKey;
  
  section.innerHTML = `
    <div class="date-header">
      <h2>${displayDate}</h2>
      <button class="add-card-btn" title="Add Card">+</button>
    </div>
    <div class="card-container"></div>
  `;
  
  // Add event listener to the new add button
  const addBtn = section.querySelector('.add-card-btn');
  addBtn.addEventListener('click', () => addCardToSection(section));
  
  return section;
};

// Create a checkable todo item
const createTodoItem = (text, isCompleted = false, todoId = null) => {
  const li = document.createElement('li');
  if (isCompleted) li.classList.add('done');
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'todo-checkbox';
  checkbox.checked = isCompleted;
  checkbox.addEventListener('change', (e) => {
    li.classList.toggle('done', e.target.checked);
    
    // Reorder the list to put completed items at the bottom
    const todoList = li.closest('.todo-list');
    if (todoList) {
      const items = Array.from(todoList.children).filter(item => !item.classList.contains('new-todo-input-container'));
      items.sort((a, b) => {
        const aDone = a.classList.contains('done');
        const bDone = b.classList.contains('done');
        if (aDone === bDone) return 0;
        return aDone ? 1 : -1;
      });
      
      // Reinsert items in correct order, keeping input at top
      const inputContainer = todoList.querySelector('.new-todo-input-container');
      if (inputContainer) {
        todoList.insertBefore(inputContainer, todoList.firstChild);
      }
      
      items.forEach(item => todoList.appendChild(item));
    }
    
    // Update localStorage if we have the todoId
    if (todoId) {
      updateTodoInStorage(todoId, { completed: e.target.checked });
    }
  });

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.className = 'todo-text-input';
  textInput.value = text;
  textInput.addEventListener('blur', () => {
    if (todoId) {
      updateTodoInStorage(todoId, { text: textInput.value });
    }
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'todo-delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.title = 'Delete todo';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTodoItem(li, todoId);
  });

  li.appendChild(checkbox);
  li.appendChild(textInput);
  li.appendChild(deleteBtn);
  
  // Add drag and drop functionality
  setupDragAndDrop(li);
  
  return li;
};

// Create new todo input container
const createNewTodoInput = (cardId, dateKey) => {
  const inputContainer = document.createElement('li');
  inputContainer.className = 'new-todo-input-container';
  inputContainer.style.listStyle = 'none';
  inputContainer.style.padding = '0';
  inputContainer.style.margin = '0';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'new-todo-input';
  input.placeholder = 'New to-do...';
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const todoId = generateUniqueId();
      const todoItem = createTodoItem(input.value.trim(), false, todoId);
      todoItem.dataset.todoId = todoId;
      
      // Insert after the input container (as second item)
      const todoList = inputContainer.closest('.todo-list');
      todoList.insertBefore(todoItem, inputContainer.nextSibling);
      
      // Save to localStorage
      if (!todoData[dateKey]) todoData[dateKey] = [];
      const existingCard = todoData[dateKey].find(c => c.id === cardId);
      if (existingCard) {
        existingCard.todos.push({
          id: todoId,
          text: input.value.trim(),
          completed: false
        });
      } else {
        todoData[dateKey].push({
          id: cardId,
          title: 'Untitled Tasks',
          todos: [{
            id: todoId,
            text: input.value.trim(),
            completed: false
          }]
        });
      }
      saveToLocalStorage();
      
      input.value = '';
      input.focus();
    }
  });
  
  inputContainer.appendChild(input);
  return inputContainer;
};

// Update todo in localStorage
const updateTodoInStorage = (todoId, updates) => {
  Object.keys(todoData).forEach(dateKey => {
    if (todoData[dateKey]) {
      todoData[dateKey].forEach(card => {
        if (card.todos) {
          const todo = card.todos.find(t => t.id === todoId);
          if (todo) {
            Object.assign(todo, updates);
            saveToLocalStorage();
          }
        }
      });
    }
  });
};

// Delete todo item
const deleteTodoItem = (li, todoId) => {
  if (todoId) {
    Object.keys(todoData).forEach(dateKey => {
      if (todoData[dateKey]) {
        todoData[dateKey].forEach(card => {
          if (card.todos) {
            const index = card.todos.findIndex(t => t.id === todoId);
            if (index !== -1) {
              card.todos.splice(index, 1);
              saveToLocalStorage();
            }
          }
        });
      }
    });
  }
  li.remove();
};

// Delete card
const deleteCard = (card, cardId) => {
  const dateSection = card.closest('.date-section');
  const dateKey = dateSection.dataset.date;
  
  if (dateKey && todoData[dateKey]) {
    const index = todoData[dateKey].findIndex(c => c.id === cardId);
    if (index !== -1) {
      todoData[dateKey].splice(index, 1);
      saveToLocalStorage();
    }
  }
  
  card.remove();
};

// Setup drag and drop for todo items
const setupDragAndDrop = (li) => {
  li.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
      return; // Don't start drag if clicking on input or button
    }
    
    e.preventDefault();
    startDrag(e, li);
  });
};

// Start drag operation
const startDrag = (e, li) => {
  if (li.classList.contains('done')) return; // Don't drag completed items
  
  draggedElement = li;
  originalParent = li.parentNode;
  originalIndex = Array.from(originalParent.children).indexOf(li);
  
  // Create ghost element
  dragGhost = li.cloneNode(true);
  dragGhost.classList.add('drag-ghost');
  dragGhost.style.position = 'fixed';
  dragGhost.style.left = e.clientX + 'px';
  dragGhost.style.top = e.clientY + 'px';
  dragGhost.style.width = li.offsetWidth + 'px';
  document.body.appendChild(dragGhost);
  
  // Add dragging class to original
  li.classList.add('dragging');
  
  // Add event listeners
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  
  // Prevent text selection
  document.body.style.userSelect = 'none';
};

// Handle drag movement
const onDragMove = (e) => {
  if (!dragGhost) return;
  
  dragGhost.style.left = e.clientX + 'px';
  dragGhost.style.top = e.clientY + 'px';
  
  // Find drop target
  const target = findDropTarget(e.clientX, e.clientY);
  if (target && target !== draggedElement) {
    highlightDropZone(target);
  } else {
    clearDropZones();
  }
};

// Handle drag end
const onDragEnd = (e) => {
  if (!draggedElement || !dragGhost) return;
  
  const target = findDropTarget(e.clientX, e.clientY);
  if (target && target !== draggedElement) {
    moveTodoItem(draggedElement, target);
  }
  
  cleanupDrag();
};

// Find drop target
const findDropTarget = (x, y) => {
  const elements = document.elementsFromPoint(x, y);
  for (const element of elements) {
    if (element.classList.contains('todo-list') || 
        (element.tagName === 'LI' && element.classList.contains('todo-list'))) {
      return element;
    }
  }
  return null;
};

// Highlight drop zone
const highlightDropZone = (target) => {
  clearDropZones();
  if (target.classList.contains('todo-list')) {
    target.classList.add('drop-zone', 'active');
  }
};

// Clear drop zones
const clearDropZones = () => {
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.classList.remove('active');
  });
};

// Move todo item
const moveTodoItem = (draggedItem, targetList) => {
  const todoId = draggedItem.dataset.todoId;
  const newDateSection = targetList.closest('.date-section');
  const newDateKey = newDateSection.dataset.date;
  const newCard = targetList.closest('.CARD-Task');
  const newCardId = newCard.dataset.cardId;
  
  // Remove from original location
  const originalDateSection = draggedItem.closest('.date-section');
  const originalDateKey = originalDateSection.dataset.date;
  const originalCard = draggedItem.closest('.CARD-Task');
  const originalCardId = originalCard.dataset.cardId;
  
  if (originalDateKey && todoData[originalDateKey]) {
    const originalCardData = todoData[originalDateKey].find(c => c.id === originalCardId);
    if (originalCardData && originalCardData.todos) {
      const todoIndex = originalCardData.todos.findIndex(t => t.id === todoId);
      if (todoIndex !== -1) {
        const todoData = originalCardData.todos.splice(todoIndex, 1)[0];
        
        // Add to new location
        if (!todoData[newDateKey]) todoData[newDateKey] = [];
        const newCardData = todoData[newDateKey].find(c => c.id === newCardId);
        if (newCardData) {
          if (!newCardData.todos) newCardData.todos = [];
          newCardData.todos.push(todoData);
        }
        
        saveToLocalStorage();
      }
    }
  }
  
  // Move DOM element
  targetList.appendChild(draggedItem);
  
  // Reorder completed items
  const items = Array.from(targetList.children).filter(item => !item.classList.contains('new-todo-input-container'));
  items.sort((a, b) => {
    const aDone = a.classList.contains('done');
    const bDone = b.classList.contains('done');
    if (aDone === bDone) return 0;
    return aDone ? 1 : -1;
  });
  
  // Reinsert items in correct order, keeping input at top
  const inputContainer = targetList.querySelector('.new-todo-input-container');
  if (inputContainer) {
    targetList.insertBefore(inputContainer, targetList.firstChild);
  }
  
  items.forEach(item => targetList.appendChild(item));
};

// Cleanup drag operation
const cleanupDrag = () => {
  if (dragGhost) {
    dragGhost.remove();
    dragGhost = null;
  }
  
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
    draggedElement = null;
  }
  
  clearDropZones();
  
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.body.style.userSelect = '';
  
  originalParent = null;
  originalIndex = null;
};

// Add card to a specific section
const addCardToSection = (dateSection) => {
  const dateKey = dateSection.dataset.date;
  const cardContainer = dateSection.querySelector('.card-container');
  if (!cardContainer) return;

  const cardId = generateUniqueId();
  const card = document.createElement('div');
  card.className = 'CARD-Task';
  card.dataset.cardId = cardId;

  // Create delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'card-delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.title = 'Delete card';
  deleteBtn.addEventListener('click', () => deleteCard(card, cardId));

  // Create title input
  const titleInput = document.createElement('input');
  titleInput.className = 'card-title-input';
  titleInput.placeholder = 'Enter card name...';

  // Handle Enter key behavior
  titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (!titleInput.value.trim()) {
        titleInput.value = `Untitled Tasks ${String(untitledCount).padStart(3, '0')}`;
        untitledCount++;
      }
      titleInput.blur();
      // Focus on the new todo input
      const newTodoInput = card.querySelector('.new-todo-input');
      if (newTodoInput) {
        newTodoInput.focus();
      }
    }
  });

  // Save title to localStorage on blur
  titleInput.addEventListener('blur', () => {
    if (!todoData[dateKey]) todoData[dateKey] = [];
    const existingCard = todoData[dateKey].find(c => c.id === cardId);
    if (existingCard) {
      existingCard.title = titleInput.value;
    } else {
      todoData[dateKey].push({
        id: cardId,
        title: titleInput.value,
        todos: []
      });
    }
    saveToLocalStorage();
  });

  // Create empty todo list
  const todoList = document.createElement('ul');
  todoList.className = 'todo-list';

  // Add new todo input container as first item
  const newTodoInputContainer = createNewTodoInput(cardId, dateKey);
  todoList.appendChild(newTodoInputContainer);

  // Add everything to card
  card.appendChild(deleteBtn);
  card.appendChild(titleInput);
  card.appendChild(todoList);

  // Insert card at the top of the container
  cardContainer.prepend(card);

  // Focus on the title field
  titleInput.focus();
};

// Initialize calendar with multiple date sections
const initializeCalendar = () => {
  const calendar = document.getElementById('calendar');
  if (!calendar) return;

  // Clear existing content
  calendar.innerHTML = '';

  // Create date sections for current week
  for (let i = 0; i < 7; i++) {
    const date = getRelativeDate(i);
    const section = createDateSection(date);
    calendar.appendChild(section);
  }

  // Load existing data
  loadSavedData();
  
  // Update current week display
  updateCurrentWeekDisplay();
};

// Update current week display
const updateCurrentWeekDisplay = () => {
  const currentWeekElement = document.querySelector('.current-week p');
  if (currentWeekElement) {
    const startDate = getRelativeDate(0);
    const endDate = getRelativeDate(6);
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    currentWeekElement.textContent = `${startFormatted} - ${endFormatted}`;
  }
};

// Load saved data from localStorage
const loadSavedData = () => {
  Object.keys(todoData).forEach(dateKey => {
    const dateSection = document.querySelector(`[data-date="${dateKey}"]`);
    if (dateSection && todoData[dateKey]) {
      const cardContainer = dateSection.querySelector('.card-container');
      
      todoData[dateKey].forEach(cardData => {
        const card = document.createElement('div');
        card.className = 'CARD-Task';
        card.dataset.cardId = cardData.id;

        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'card-delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete card';
        deleteBtn.addEventListener('click', () => deleteCard(card, cardData.id));

        // Create title input
        const titleInput = document.createElement('input');
        titleInput.className = 'card-title-input';
        titleInput.value = cardData.title;
        titleInput.addEventListener('blur', () => {
          cardData.title = titleInput.value;
          saveToLocalStorage();
        });

        // Create todo list
        const todoList = document.createElement('ul');
        todoList.className = 'todo-list';

        // Add new todo input container as first item
        const newTodoInputContainer = createNewTodoInput(cardData.id, dateKey);
        todoList.appendChild(newTodoInputContainer);

        // Add existing todos (sorted by completion status)
        if (cardData.todos) {
          const sortedTodos = [...cardData.todos].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
          });
          
          sortedTodos.forEach(todo => {
            const todoItem = createTodoItem(todo.text, todo.completed, todo.id);
            todoItem.dataset.todoId = todo.id;
            todoList.appendChild(todoItem);
          });
        }

        card.appendChild(deleteBtn);
        card.appendChild(titleInput);
        card.appendChild(todoList);
        cardContainer.appendChild(card);
      });
    }
  });
};

// Filter functionality
const filterTasks = (filterType) => {
  const cards = document.querySelectorAll('.CARD-Task');
  const today = formatDate(new Date());
  
  cards.forEach(card => {
    const dateSection = card.closest('.date-section');
    const dateKey = dateSection.dataset.date;
    const todos = card.querySelectorAll('.todo-list li:not(.new-todo-input-container)');
    let shouldShow = true;
    
    switch (filterType) {
      case 'today':
        shouldShow = dateKey === today;
        break;
      case 'completed':
        const hasCompletedTodos = Array.from(todos).some(todo => todo.classList.contains('done'));
        shouldShow = hasCompletedTodos;
        break;
      case 'all':
      default:
        shouldShow = true;
        break;
    }
    
    card.style.display = shouldShow ? 'block' : 'none';
  });
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  initializeCalendar();
  
  // Navigation event listeners
  const prevWeekBtn = document.getElementById('prev-week');
  const nextWeekBtn = document.getElementById('next-week');
  
  if (prevWeekBtn) {
    prevWeekBtn.addEventListener('click', () => {
      currentWeekOffset--;
      initializeCalendar();
    });
  }
  
  if (nextWeekBtn) {
    nextWeekBtn.addEventListener('click', () => {
      currentWeekOffset++;
      initializeCalendar();
    });
  }
  
  // Filter navigation
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      
      // Add active class to clicked link
      link.classList.add('active');
      
      // Apply filter
      const filterType = link.dataset.filter;
      filterTasks(filterType);
    });
  });
  
  // Set "All Tasks" as default active
  const allTasksLink = document.querySelector('[data-filter="all"]');
  if (allTasksLink) {
    allTasksLink.classList.add('active');
  }
});

// Search functionality
const searchInput = document.getElementById('search-input');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.CARD-Task');
    
    cards.forEach(card => {
      const title = card.querySelector('.card-title-input').value.toLowerCase();
      const todos = Array.from(card.querySelectorAll('.todo-text-input'))
        .map(input => input.value.toLowerCase());
      
      const matches = title.includes(searchTerm) || 
                     todos.some(todo => todo.includes(searchTerm));
      
      card.style.display = matches || !searchTerm ? 'block' : 'none';
    });
  });
}