let untitledCount = 1;

document.querySelectorAll('.add-card-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const dateSection = btn.closest('.date-section');
    const cardContainer = dateSection.querySelector('.card-container');

    const card = document.createElement('div');
    card.className = 'CARD-Task';

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
        titleInput.blur(); // Remove focus after setting title
        todoInput.focus(); // Move to todo input
      }
    });

    // Create empty todo list
    const todoList = document.createElement('ul');
    todoList.className = 'todo-list';

    // Add default one input line item
    const todoInput = document.createElement('input');
    todoInput.placeholder = 'New to-do...';
    todoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && todoInput.value.trim()) {
        const item = document.createElement('li');
        item.textContent = todoInput.value.trim();
        todoList.appendChild(item);
        todoInput.value = '';
      }
    });

    // Add everything to card
    card.appendChild(titleInput);
    card.appendChild(todoList);
    card.appendChild(todoInput);

    // Insert card at the top of the container
    cardContainer.prepend(card);

    // Focus on the title field
    titleInput.focus();
  });
});