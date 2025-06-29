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
let draggedCard = null;
let cardDragGhost = null;
let dropIndicator = null;
let cardDropIndicator = null;

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

// Helper function to get week number (ISO week)
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Get relative date with proper week calculation
const getRelativeDate = (daysOffset) => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the start of the current week (Monday)
  const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - daysToMonday);
  
  // Add the week offset and day offset
  const targetDate = new Date(startOfWeek);
  targetDate.setDate(startOfWeek.getDate() + (currentWeekOffset * 7) + daysOffset);
  
  return targetDate;
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
      <h2 class="date-title">${displayDate}</h2>
      <button class="add-card-btn" title="Add Card">+</button>
    </div>
    <div class="cards-container"></div>
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
  
  // Create drag handle
  const dragHandle = document.createElement('div');
  dragHandle.className = 'todo-drag-handle';
  dragHandle.title = 'Drag to reorder';
  
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

  const textInput = document.createElement('textarea');
  textInput.className = 'todo-text-input';
  textInput.value = text;
  textInput.rows = 1;
  
  // Auto-resize textarea
  const autoResize = () => {
    textInput.style.height = 'auto';
    const scrollHeight = textInput.scrollHeight;
    textInput.style.height = Math.min(scrollHeight, 60) + 'px'; // Max 3 lines
  };
  
  textInput.addEventListener('input', autoResize);
  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      textInput.blur();
    }
  });
  
  textInput.addEventListener('blur', () => {
    if (todoId) {
      updateTodoInStorage(todoId, { text: textInput.value });
    }
  });
  
  // Initial resize
  setTimeout(autoResize, 0);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'todo-delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.title = 'Delete todo';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTodoItem(li, todoId);
  });

  li.appendChild(dragHandle);
  li.appendChild(checkbox);
  li.appendChild(textInput);
  li.appendChild(deleteBtn);
  
  // Add drag and drop functionality
  setupTodoDragAndDrop(li);
  
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
  input.placeholder = 'New to-do';
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
          title: 'Untitled Card',
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
const setupTodoDragAndDrop = (li) => {
  const dragHandle = li.querySelector('.todo-drag-handle');
  
  dragHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    startTodoDrag(e, li);
  });
};

// Setup card header drag and drop
const setupCardDragAndDrop = (card) => {
  const dragHandle = card.querySelector('.card-drag-handle');
  
  dragHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    startCardDrag(e, card);
  });
};

// Start drag operation for todo items
const startTodoDrag = (e, li) => {
  if (li.classList.contains('done')) return; // Don't drag completed items
  
  draggedElement = li;
  originalParent = li.parentNode;
  originalIndex = Array.from(originalParent.children).indexOf(li);
  
  // Create ghost element with better styling
  dragGhost = li.cloneNode(true);
  dragGhost.classList.add('drag-ghost');
  dragGhost.style.position = 'fixed';
  dragGhost.style.left = e.clientX + 'px';
  dragGhost.style.top = e.clientY + 'px';
  dragGhost.style.width = li.offsetWidth + 'px';
  dragGhost.style.pointerEvents = 'none';
  dragGhost.style.zIndex = '10000';
  dragGhost.style.opacity = '0.9';
  dragGhost.style.transform = 'rotate(2deg) scale(1.02)';
  dragGhost.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
  dragGhost.style.borderRadius = '8px';
  dragGhost.style.backgroundColor = 'white';
  dragGhost.style.border = '2px solid #007bff';
  
  // Remove interactive elements from ghost
  const ghostInputs = dragGhost.querySelectorAll('input, textarea, button');
  ghostInputs.forEach(el => el.remove());
  
  document.body.appendChild(dragGhost);
  
  // Add dragging class to original
  li.classList.add('dragging');
  
  // Add event listeners
  document.addEventListener('mousemove', onTodoDragMove);
  document.addEventListener('mouseup', onTodoDragEnd);
  
  // Prevent text selection
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'grabbing';
};

// Start drag operation for cards
const startCardDrag = (e, card) => {
  draggedCard = card;
  originalParent = card.parentNode;
  originalIndex = Array.from(originalParent.children).indexOf(card);
  
  // Create ghost element with better styling
  cardDragGhost = card.cloneNode(true);
  cardDragGhost.classList.add('drag-ghost');
  cardDragGhost.style.position = 'fixed';
  cardDragGhost.style.left = e.clientX + 'px';
  cardDragGhost.style.top = e.clientY + 'px';
  cardDragGhost.style.width = card.offsetWidth + 'px';
  cardDragGhost.style.pointerEvents = 'none';
  cardDragGhost.style.zIndex = '10000';
  cardDragGhost.style.opacity = '0.9';
  cardDragGhost.style.transform = 'rotate(2deg) scale(1.02)';
  cardDragGhost.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.2)';
  cardDragGhost.style.borderRadius = '12px';
  cardDragGhost.style.backgroundColor = 'white';
  cardDragGhost.style.border = '2px solid #007bff';
  
  // Remove interactive elements from ghost
  const ghostInputs = cardDragGhost.querySelectorAll('input, textarea, button');
  ghostInputs.forEach(el => el.remove());
  
  document.body.appendChild(cardDragGhost);
  
  // Add dragging class to original
  card.classList.add('dragging');
  
  // Add event listeners
  document.addEventListener('mousemove', onCardDragMove);
  document.addEventListener('mouseup', onCardDragEnd);
  
  // Prevent text selection
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'grabbing';
};

// Handle drag movement for todo items
const onTodoDragMove = (e) => {
  if (!dragGhost) return;
  
  dragGhost.style.left = e.clientX + 'px';
  dragGhost.style.top = e.clientY + 'px';
  
  // Find drop target and show indicator
  const { target, position, referenceElement } = findTodoDropTarget(e.clientX, e.clientY);
  showTodoDropIndicator(target, position, referenceElement);
};

// Handle drag movement for cards
const onCardDragMove = (e) => {
  if (!cardDragGhost) return;
  
  cardDragGhost.style.left = e.clientX + 'px';
  cardDragGhost.style.top = e.clientY + 'px';
  
  // Find drop target and show indicator
  const { target, position, referenceElement } = findCardDropTarget(e.clientX, e.clientY);
  showCardDropIndicator(target, position, referenceElement);
};

// Handle drag end for todo items
const onTodoDragEnd = (e) => {
  if (!draggedElement || !dragGhost) return;
  
  const { target, position, referenceElement } = findTodoDropTarget(e.clientX, e.clientY);
  if (target && target !== draggedElement) {
    moveTodoItem(draggedElement, target, position, referenceElement);
  }
  
  cleanupTodoDrag();
};

// Handle drag end for cards
const onCardDragEnd = (e) => {
  if (!draggedCard || !cardDragGhost) return;
  
  const { target, position, referenceElement } = findCardDropTarget(e.clientX, e.clientY);
  if (target && target !== draggedCard) {
    moveCard(draggedCard, target, position, referenceElement);
  }
  
  cleanupCardDrag();
};

// Find drop target for todo items with position
const findTodoDropTarget = (x, y) => {
  const elements = document.elementsFromPoint(x, y);
  
  for (const element of elements) {
    // Check if we're over a todo list
    if (element.classList.contains('todo-list')) {
      return { target: element, position: 'end' };
    }
    
    // Check if we're over a todo item
    if (element.tagName === 'LI' && element.closest('.todo-list') && !element.classList.contains('new-todo-input-container')) {
      const todoList = element.closest('.todo-list');
      const rect = element.getBoundingClientRect();
      const position = y < rect.top + rect.height / 2 ? 'before' : 'after';
      return { target: todoList, position, referenceElement: element };
    }
  }
  
  return { target: null, position: null };
};

// Find drop target for cards with position
const findCardDropTarget = (x, y) => {
  const elements = document.elementsFromPoint(x, y);
  
  for (const element of elements) {
    // Check if we're over a card container
    if (element.classList.contains('cards-container')) {
      return { target: element, position: 'end' };
    }
    
    // Check if we're over a card
    if (element.classList.contains('CARD-Task')) {
      const cardContainer = element.closest('.cards-container');
      const rect = element.getBoundingClientRect();
      const position = x < rect.left + rect.width / 2 ? 'before' : 'after';
      return { target: cardContainer, position, referenceElement: element };
    }
  }
  
  return { target: null, position: null };
};

// Show card drop indicator - vertical line
const showCardDropIndicator = (target, position, referenceElement) => {
  clearCardDropIndicators();
  
  if (!target || !position) return;
  
  if (!cardDropIndicator) {
    cardDropIndicator = document.createElement('div');
    cardDropIndicator.className = 'card-drop-indicator';
    document.body.appendChild(cardDropIndicator);
  }
  
  if (position === 'end') {
    const targetRect = target.getBoundingClientRect();
    cardDropIndicator.style.left = (targetRect.right - 1) + 'px';
    cardDropIndicator.style.top = targetRect.top + 'px';
    cardDropIndicator.style.height = targetRect.height + 'px';
  } else if (position === 'before' || position === 'after') {
    const referenceRect = referenceElement.getBoundingClientRect();
    cardDropIndicator.style.left = (position === 'before' ? referenceRect.left : referenceRect.right - 1) + 'px';
    cardDropIndicator.style.top = referenceRect.top + 'px';
    cardDropIndicator.style.height = referenceRect.height + 'px';
  }
  
  cardDropIndicator.classList.add('active');
};

// Show todo drop indicator - horizontal line
const showTodoDropIndicator = (target, position, referenceElement) => {
  clearDropIndicators();
  
  if (!target || !position) return;
  
  if (!dropIndicator) {
    dropIndicator = document.createElement('div');
    dropIndicator.className = 'drop-indicator';
    document.body.appendChild(dropIndicator);
  }
  
  if (position === 'end') {
    const targetRect = target.getBoundingClientRect();
    dropIndicator.style.left = targetRect.left + 'px';
    dropIndicator.style.top = (targetRect.bottom - 1) + 'px';
    dropIndicator.style.width = targetRect.width + 'px';
  } else if (position === 'before' || position === 'after') {
    const referenceRect = referenceElement.getBoundingClientRect();
    dropIndicator.style.left = referenceRect.left + 'px';
    dropIndicator.style.top = (position === 'before' ? referenceRect.top : referenceRect.bottom - 1) + 'px';
    dropIndicator.style.width = referenceRect.width + 'px';
  }
  
  dropIndicator.classList.add('active');
};

// Clear drop indicators
const clearDropIndicators = () => {
  if (dropIndicator) {
    dropIndicator.classList.remove('active');
  }
};

const clearCardDropIndicators = () => {
  if (cardDropIndicator) {
    cardDropIndicator.classList.remove('active');
  }
};

// Move todo item with position
const moveTodoItem = (draggedItem, targetList, position, referenceElement) => {
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
  if (position === 'end') {
    targetList.appendChild(draggedItem);
  } else if (position === 'before') {
    if (referenceElement) {
      targetList.insertBefore(draggedItem, referenceElement);
    } else {
      const inputContainer = targetList.querySelector('.new-todo-input-container');
      if (inputContainer) {
        targetList.insertBefore(draggedItem, inputContainer.nextSibling);
      } else {
        targetList.insertBefore(draggedItem, targetList.firstChild);
      }
    }
  } else if (position === 'after') {
    if (referenceElement) {
      targetList.insertBefore(draggedItem, referenceElement.nextSibling);
    } else {
      const inputContainer = targetList.querySelector('.new-todo-input-container');
      if (inputContainer) {
        targetList.insertBefore(draggedItem, inputContainer.nextSibling);
      } else {
        targetList.appendChild(draggedItem);
      }
    }
  }
  
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

// Move card with position
const moveCard = (draggedCard, targetContainer, position, referenceElement) => {
  const cardId = draggedCard.dataset.cardId;
  const newDateSection = targetContainer.closest('.date-section');
  const newDateKey = newDateSection.dataset.date;
  
  // Remove from original location
  const originalDateSection = draggedCard.closest('.date-section');
  const originalDateKey = originalDateSection.dataset.date;
  
  if (originalDateKey && todoData[originalDateKey]) {
    const cardIndex = todoData[originalDateKey].findIndex(c => c.id === cardId);
    if (cardIndex !== -1) {
      const cardData = todoData[originalDateKey].splice(cardIndex, 1)[0];
      
      // Add to new location
      if (!todoData[newDateKey]) todoData[newDateKey] = [];
      todoData[newDateKey].push(cardData);
      
      saveToLocalStorage();
    }
  }
  
  // Move DOM element
  if (position === 'end') {
    targetContainer.appendChild(draggedCard);
  } else if (position === 'before') {
    if (referenceElement) {
      targetContainer.insertBefore(draggedCard, referenceElement);
    } else {
      targetContainer.insertBefore(draggedCard, targetContainer.firstChild);
    }
  } else if (position === 'after') {
    if (referenceElement) {
      targetContainer.insertBefore(draggedCard, referenceElement.nextSibling);
    } else {
      targetContainer.appendChild(draggedCard);
    }
  }
};

// Cleanup drag operation for todo items
const cleanupTodoDrag = () => {
  if (dragGhost) {
    dragGhost.remove();
    dragGhost = null;
  }
  
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
    draggedElement = null;
  }
  
  clearDropIndicators();
  
  document.removeEventListener('mousemove', onTodoDragMove);
  document.removeEventListener('mouseup', onTodoDragEnd);
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  
  originalParent = null;
  originalIndex = null;
};

// Cleanup drag operation for cards
const cleanupCardDrag = () => {
  if (cardDragGhost) {
    cardDragGhost.remove();
    cardDragGhost = null;
  }
  
  if (draggedCard) {
    draggedCard.classList.remove('dragging');
    draggedCard = null;
  }
  
  clearCardDropIndicators();
  
  document.removeEventListener('mousemove', onCardDragMove);
  document.removeEventListener('mouseup', onCardDragEnd);
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
  
  originalParent = null;
  originalIndex = null;
};

// Update title tooltip for long titles with accessibility
const updateTitleTooltip = (titleInput, isTruncated) => {
  const text = titleInput.value;
  
  if (isTruncated && text.trim()) {
    // Remove existing tooltip
    const existingTooltip = document.querySelector('.custom-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    // Create custom tooltip with ellipses if needed
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.id = `tooltip-${titleInput.closest('.CARD-Task').dataset.cardId}`;
    
    // Show full text with ellipses indication if truncated
    const displayText = text.length > 100 ? text.substring(0, 100) + '...' : text;
    tooltip.textContent = displayText;
    document.body.appendChild(tooltip);
    
    // Position tooltip below the input field
    const rect = titleInput.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.bottom + 8 + 'px'; // Position below the input
    
    // Show tooltip on hover and focus
    const showTooltip = () => {
      tooltip.classList.add('active');
    };
    
    const hideTooltip = () => {
      tooltip.classList.remove('active');
    };
    
    titleInput.addEventListener('mouseenter', showTooltip);
    titleInput.addEventListener('mouseleave', hideTooltip);
    titleInput.addEventListener('focus', showTooltip);
    titleInput.addEventListener('blur', hideTooltip);
  } else {
    // Remove tooltip if no longer needed
    const existingTooltip = document.querySelector('.custom-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
  }
};

// Function to truncate text from the end
const truncateTextFromEnd = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// Add card to a specific section
const addCardToSection = (dateSection) => {
  const dateKey = dateSection.dataset.date;
  const cardContainer = dateSection.querySelector('.cards-container');
  if (!cardContainer) return;

  const cardId = generateUniqueId();
  const card = document.createElement('div');
  card.className = 'CARD-Task';
  card.dataset.cardId = cardId;
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', `Card: Untitled Card`);

  // Create card header container
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';

  // Create drag handle
  const dragHandle = document.createElement('button');
  dragHandle.className = 'card-drag-handle';
  dragHandle.setAttribute('tabindex', '0');
  dragHandle.setAttribute('role', 'button');
  dragHandle.setAttribute('aria-label', 'Drag card to reorder');
  dragHandle.setAttribute('aria-describedby', `tooltip-${cardId}`);

  // Create delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'card-delete-btn';
  deleteBtn.innerHTML = '×';
  deleteBtn.setAttribute('aria-label', 'Delete card');
  deleteBtn.setAttribute('aria-describedby', `tooltip-${cardId}`);
  deleteBtn.addEventListener('click', () => deleteCard(card, cardId));

  // Create title input - no placeholder, empty by default
  const titleInput = document.createElement('textarea');
  titleInput.className = 'card-title-input';
  titleInput.value = '';
  titleInput.placeholder = '';
  titleInput.rows = 1; // Start with 1 row
  titleInput.setAttribute('aria-label', 'Card title');
  titleInput.setAttribute('maxlength', '200');

  // Auto-resize textarea
  const autoResize = () => {
    titleInput.style.height = 'auto';
    const scrollHeight = titleInput.scrollHeight;
    const maxHeight = 44; // Max 2 lines
    const newHeight = Math.min(scrollHeight, maxHeight);
    titleInput.style.height = newHeight + 'px';
    
    // Update card header height to accommodate textarea
    const cardHeader = titleInput.closest('.card-header');
    if (cardHeader) {
      cardHeader.style.minHeight = (newHeight + 16) + 'px'; // Add padding
    }
    
    // Update card height to accommodate content
    const card = titleInput.closest('.CARD-Task');
    if (card) {
      card.style.height = 'auto'; // Allow card to grow naturally
    }
    
    // Check if text is truncated and update tooltip
    const isTruncated = scrollHeight > maxHeight || titleInput.value.length > 100;
    
    // Add/remove truncated class for visual indicator
    if (isTruncated) {
      titleInput.classList.add('truncated');
    } else {
      titleInput.classList.remove('truncated');
    }
    
    updateTitleTooltip(titleInput, isTruncated);
  };
  
  titleInput.addEventListener('input', autoResize);
  
  // Handle focus behavior
  titleInput.addEventListener('focus', () => {
    // If it's empty or "Untitled Card", clear it
    if (!titleInput.value.trim() || titleInput.value === 'Untitled Card') {
      titleInput.value = '';
      titleInput.classList.remove('untitled');
    }
  });

  // Handle blur behavior
  titleInput.addEventListener('blur', () => {
    if (!titleInput.value.trim()) {
      titleInput.value = 'Untitled Card';
      titleInput.classList.add('untitled');
    } else {
      titleInput.classList.remove('untitled');
    }
    
    // Update tooltip for long titles
    updateTitleTooltip(titleInput, false);
    
    // Save to localStorage
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

  // Handle Enter key behavior
  titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      titleInput.blur();
      // Focus on the new todo input
      const newTodoInput = card.querySelector('.new-todo-input');
      if (newTodoInput) {
        newTodoInput.focus();
      }
    }
  });

  // Handle input changes for tooltip
  titleInput.addEventListener('input', () => {
    const isTruncated = titleInput.scrollHeight > 44 || titleInput.value.length > 100;
    updateTitleTooltip(titleInput, isTruncated);
  });

  // Initial resize
  setTimeout(autoResize, 0);

  // Add elements to card header
  cardHeader.appendChild(dragHandle);
  cardHeader.appendChild(titleInput);
  cardHeader.appendChild(deleteBtn);

  // Create empty todo list
  const todoList = document.createElement('ul');
  todoList.className = 'todo-list';
  todoList.setAttribute('role', 'list');
  todoList.setAttribute('aria-label', 'Todo items');

  // Add new todo input container as first item
  const newTodoInputContainer = createNewTodoInput(cardId, dateKey);
  todoList.appendChild(newTodoInputContainer);

  // Add everything to card
  card.appendChild(cardHeader);
  card.appendChild(todoList);

  // Setup card drag and drop
  setupCardDragAndDrop(card);

  // Insert card at the top of the container
  cardContainer.prepend(card);

  // Focus on the title field
  titleInput.focus();
};

// Update calendar with multiple date sections
const updateCalendar = () => {
  const calendar = document.getElementById('calendar-content');
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
  const calendarTitle = document.querySelector('.calendar-title');
  if (calendarTitle) {
    const startDate = getRelativeDate(0);
    const endDate = getRelativeDate(6);
    
    // Get week number using the start date
    const weekNumber = getWeekNumber(startDate);
    const year = startDate.getFullYear();
    
    // Format dates with leading zeros
    const startFormatted = startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit' 
    });
    const endFormatted = endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit' 
    });
    
    calendarTitle.textContent = `Week ${weekNumber.toString().padStart(2, '0')} | ${year} | ${startFormatted} - ${endFormatted}`;
  }
};

// Load saved data from localStorage
const loadSavedData = () => {
  Object.keys(todoData).forEach(dateKey => {
    const dateSection = document.querySelector(`[data-date="${dateKey}"]`);
    if (dateSection && todoData[dateKey]) {
      const cardContainer = dateSection.querySelector('.cards-container');
      
      todoData[dateKey].forEach(cardData => {
        const card = document.createElement('div');
        card.className = 'CARD-Task';
        card.dataset.cardId = cardData.id;
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `Card: ${cardData.title || 'Untitled Card'}`);

        // Create card header container
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';

        // Create drag handle
        const dragHandle = document.createElement('button');
        dragHandle.className = 'card-drag-handle';
        dragHandle.setAttribute('tabindex', '0');
        dragHandle.setAttribute('role', 'button');
        dragHandle.setAttribute('aria-label', 'Drag card to reorder');
        dragHandle.setAttribute('aria-describedby', `tooltip-${cardData.id}`);

        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'card-delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.setAttribute('aria-label', 'Delete card');
        deleteBtn.setAttribute('aria-describedby', `tooltip-${cardData.id}`);
        deleteBtn.addEventListener('click', () => deleteCard(card, cardData.id));

        // Create title input
        const titleInput = document.createElement('textarea');
        titleInput.className = 'card-title-input';
        titleInput.value = cardData.title || '';
        titleInput.setAttribute('aria-label', 'Card title');
        titleInput.setAttribute('placeholder', 'Untitled Card');
        titleInput.setAttribute('maxlength', '200');
        
        // Auto-resize textarea
        const autoResize = () => {
          titleInput.style.height = 'auto';
          const scrollHeight = titleInput.scrollHeight;
          const maxHeight = 44; // Max 2 lines
          const newHeight = Math.min(scrollHeight, maxHeight);
          titleInput.style.height = newHeight + 'px';
          
          // Update card header height to accommodate textarea
          const cardHeader = titleInput.closest('.card-header');
          if (cardHeader) {
            cardHeader.style.minHeight = (newHeight + 16) + 'px'; // Add padding
          }
          
          // Update card height to accommodate content
          const card = titleInput.closest('.CARD-Task');
          if (card) {
            card.style.height = 'auto'; // Allow card to grow naturally
          }
          
          // Check if text is truncated and update tooltip
          const isTruncated = scrollHeight > maxHeight || titleInput.value.length > 100;
          
          // Add/remove truncated class for visual indicator
          if (isTruncated) {
            titleInput.classList.add('truncated');
          } else {
            titleInput.classList.remove('truncated');
          }
          
          updateTitleTooltip(titleInput, isTruncated);
        };
        
        titleInput.addEventListener('input', autoResize);
        
        // Check if it's an untitled card
        if (!cardData.title || cardData.title === 'Untitled Card' || !cardData.title.trim()) {
          titleInput.value = 'Untitled Card';
          titleInput.classList.add('untitled');
        }
        
        // Handle focus behavior
        titleInput.addEventListener('focus', () => {
          // If it's empty or "Untitled Card", clear it
          if (!titleInput.value.trim() || titleInput.value === 'Untitled Card') {
            titleInput.value = '';
            titleInput.classList.remove('untitled');
          }
        });
        
        // Handle blur behavior
        titleInput.addEventListener('blur', () => {
          if (!titleInput.value.trim()) {
            titleInput.value = 'Untitled Card';
            titleInput.classList.add('untitled');
          } else {
            titleInput.classList.remove('untitled');
          }
          
          // Update tooltip for long titles
          updateTitleTooltip(titleInput, false);
          
          // Save to localStorage
          cardData.title = titleInput.value;
          saveToLocalStorage();
        });

        // Handle Enter key behavior
        titleInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            titleInput.blur();
            // Focus on the new todo input
            const newTodoInput = card.querySelector('.new-todo-input');
            if (newTodoInput) {
              newTodoInput.focus();
            }
          }
        });

        // Handle input changes for tooltip
        titleInput.addEventListener('input', () => {
          const isTruncated = titleInput.scrollHeight > 44 || titleInput.value.length > 100;
          updateTitleTooltip(titleInput, isTruncated);
        });

        // Initial resize
        setTimeout(autoResize, 0);

        // Add elements to card header
        cardHeader.appendChild(dragHandle);
        cardHeader.appendChild(titleInput);
        cardHeader.appendChild(deleteBtn);

        // Create todo list
        const todoList = document.createElement('ul');
        todoList.className = 'todo-list';
        todoList.setAttribute('role', 'list');
        todoList.setAttribute('aria-label', 'Todo items');

        // Add new todo input container as first item
        const newTodoInputContainer = createNewTodoInput(cardData.id, dateKey);
        todoList.appendChild(newTodoInputContainer);

        // Add existing todos
        if (cardData.todos && cardData.todos.length > 0) {
          cardData.todos.forEach(todoData => {
            const todoItem = createTodoItem(todoData.text, todoData.completed, todoData.id);
            todoItem.dataset.todoId = todoData.id;
            todoList.appendChild(todoItem);
          });
        }

        // Add everything to card
        card.appendChild(cardHeader);
        card.appendChild(todoList);

        // Setup card drag and drop
        setupCardDragAndDrop(card);

        // Add card to container
        cardContainer.appendChild(card);
        
        // Update tooltip for loaded cards
        updateTitleTooltip(titleInput, false);
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  loadSavedData();
  setupCalendarNavigation();
  updateCalendar();
  updateCurrentWeekDisplay();
  
  // Filter navigation - update to work with new HTML structure
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all buttons
      navButtons.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Apply filter based on button text
      const filterType = button.querySelector('span').textContent.toLowerCase();
      if (filterType === 'today') {
        filterTasks('today');
      } else if (filterType === 'completed') {
        filterTasks('completed');
      } else {
        filterTasks('all');
      }
    });
  });
  
  // Set "All Tasks" as default active
  const allTasksButton = document.querySelector('.nav-btn span');
  if (allTasksButton && allTasksButton.textContent.toLowerCase() === 'today') {
    allTasksButton.parentElement.classList.add('active');
  }
  
  // Expandable search functionality
  const searchToggle = document.querySelector('.search-toggle');
  const searchExpanded = document.querySelector('.search-expanded');
  const searchInput = document.getElementById('search-input');
  
  if (searchToggle && searchExpanded && searchInput) {
    // Toggle search expansion
    searchToggle.addEventListener('click', () => {
      const isExpanded = searchToggle.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        // Collapse search
        searchToggle.setAttribute('aria-expanded', 'false');
        searchExpanded.classList.remove('active');
        searchInput.value = '';
        searchInput.blur();
        // Clear search results
        const cards = document.querySelectorAll('.CARD-Task');
        cards.forEach(card => {
          card.style.display = 'block';
        });
      } else {
        // Expand search
        searchToggle.setAttribute('aria-expanded', 'true');
        searchExpanded.classList.add('active');
        searchInput.focus();
      }
    });
    
    // Close search on escape key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchToggle.setAttribute('aria-expanded', 'false');
        searchExpanded.classList.remove('active');
        searchInput.value = '';
        searchInput.blur();
        // Clear search results
        const cards = document.querySelectorAll('.CARD-Task');
        cards.forEach(card => {
          card.style.display = 'block';
        });
      }
    });
    
    // Close search when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchToggle.contains(e.target) && !searchExpanded.contains(e.target)) {
        searchToggle.setAttribute('aria-expanded', 'false');
        searchExpanded.classList.remove('active');
      }
    });
  }
  
  // Search functionality
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
});

// Calendar navigation
const setupCalendarNavigation = () => {
  const prevBtn = document.querySelector('.calendar-nav button[aria-label="Previous week"]');
  const nextBtn = document.querySelector('.calendar-nav button[aria-label="Next week"]');
  const thisWeekBtn = document.querySelector('.this-week-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentWeekOffset -= 1;
      updateCalendar();
      updateCurrentWeekDisplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentWeekOffset += 1;
      updateCalendar();
      updateCurrentWeekDisplay();
    });
  }

  if (thisWeekBtn) {
    thisWeekBtn.addEventListener('click', () => {
      currentWeekOffset = 0;
      updateCalendar();
      updateCurrentWeekDisplay();
    });
  }
};