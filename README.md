# 🧾 Brutalist To-Do List Web App

A clean, minimal, and functional to-do list application with a modern design and robust task management features including drag-and-drop functionality.

## ✨ Features

### 📅 **Multi-Day Calendar View**
- View tasks across 7 days (current week)
- Navigate between weeks with Previous/Next buttons
- Each day has its own section for organized task management

### 🎯 **Advanced Task Management**
- **Create Task Cards**: Click the `+` button on any day to add a new task card
- **Default Card State**: New cards start with "Untitled Card" in 50% black text
- **Click to Edit**: Click on "Untitled Card" to start editing the title
- **Delete Cards**: Hover over any card to see the delete button (×) aligned with the title field
- **Editable Titles**: Click on card titles to edit them
- **Checkable Todos**: Each todo item has a custom grey circle checkbox
- **Delete Todos**: Hover over any todo item to see the delete button (×) on the right
- **Persistent Storage**: All data is saved to localStorage automatically
- **Fallback Naming**: Empty titles get auto-generated names (Untitled Tasks 001, 002, etc.)

### 🖱️ **Drag & Drop Functionality**
- **Drag Todo Items**: Click and hold any unchecked todo item to drag it
- **Cross-Card Movement**: Drag items between different cards and days
- **Visual Feedback**: See a ghost element while dragging
- **Smart Positioning**: Completed items automatically move to the bottom
- **Drop Zones**: Visual indicators show where items can be dropped

### 📝 **Refined Todo Input Experience**
- **Always-Available Input**: The first row is always an input field for new todos
- **Clean Input Design**: No bounding box or background - just a subtle underline
- **Proper Alignment**: Input field is indented to align with existing todo items
- **Smart Insertion**: New todos are inserted after the input row, not at the bottom
- **Focus Management**: After creating a card, focus automatically moves to the todo input
- **Visual Hierarchy**: Input field has a subtle underline that highlights on focus

### 🎨 **Custom Checkbox Design**
- **Grey Circle Checkboxes**: Custom circular checkboxes with grey background
- **Hover Effects**: Checkboxes darken slightly on hover
- **Checkmark Icons**: Green background with white checkmark when checked
- **Smooth Transitions**: All state changes have smooth animations
- **Consistent Sizing**: 20px circles for perfect visual balance

### 📊 **Smart Todo Organization**
- **Completion Ordering**: Completed items automatically move to the bottom of their list
- **Visual States**: Completed items are struck through and grayed out
- **Custom Checkbox Styling**: Professional grey circles with green checkmarks
- **Hover Effects**: Delete buttons appear on hover for clean interface

### 🔍 **Search & Filter**
- **Global Search**: Search across all cards and todo items in real-time
- **Quick Filters**: 
  - **Today**: Show only today's tasks
  - **All Tasks**: Show all tasks (default view)
  - **Completed**: Show only cards with completed todos

### 🎨 **Clean, Modern Design**
- Responsive layout that works on desktop and mobile
- Smooth hover effects and transitions
- Clear visual hierarchy and typography
- Accessible design with proper focus states
- Professional color scheme with proper contrast
- Refined spacing and alignment throughout

## 🚀 Getting Started

1. **Clone or download** the project files
2. **Start a local server** in the project directory:
   ```bash
   python3 -m http.server 8000
   # or
   npx serve .
   # or
   php -S localhost:8000
   ```
3. **Open your browser** and navigate to `http://localhost:8000`

## 📁 Project Structure

```
brutalist-todo/
├── index.html         # Main webpage with layout
├── style.css          # Clean, modern styling with refined interactions
├── src/
│   └── app.js         # Core application logic with advanced features
└── README.md          # This file
```

## 🎯 How to Use

### Adding Tasks
1. **Hover over any day section** - you'll see a `+` button appear
2. **Click the `+` button** to create a new task card
3. **New cards start as "Untitled Card"** in muted grey text
4. **Click on "Untitled Card"** to start editing the title
5. **Add todo items** by typing in the "New to-do..." field and pressing Enter
6. **Check off completed items** using the grey circle checkboxes

### Managing Tasks
- **Delete Cards**: Hover over any card and click the × button aligned with the title
- **Delete Todos**: Hover over any todo item and click the × button on the right
- **Edit Todos**: Click on any todo text to edit it directly
- **Complete Todos**: Click the grey circle checkboxes to mark items as done

### Card Title Behavior
- **Default State**: New cards show "Untitled Card" in 50% black text
- **Click to Edit**: Click on the untitled text to start editing
- **Visual Feedback**: Untitled cards have a subtle hover effect
- **Persistence**: Card titles are saved automatically

### Custom Checkboxes
- **Grey Circles**: Unchecked items show grey circular checkboxes
- **Hover Effect**: Checkboxes darken slightly when you hover over them
- **Green Checkmarks**: When checked, circles turn green with white checkmarks
- **Smooth Animations**: All state changes are smoothly animated

### Refined Todo Input
- **Always Ready**: The first row is always an input field for new todos
- **Clean Design**: No boxes or backgrounds - just a subtle underline
- **Smart Placement**: New todos appear right after the input field
- **Proper Alignment**: Input is indented to match existing todo items
- **Focus Flow**: After creating a card, you can immediately start typing todos

### Drag & Drop
- **Start Dragging**: Click and hold on any unchecked todo item (avoid clicking on inputs or buttons)
- **Move Items**: Drag the item to any other card or day
- **Drop Items**: Release to place the item in the new location
- **Visual Feedback**: Watch for drop zone highlights and ghost elements

### Navigating
- **Week Navigation**: Use the Previous/Next Week buttons in the right sidebar
- **Filtering**: Click on "Today", "All Tasks", or "Completed" in the left sidebar
- **Searching**: Use the search bar in the header to find specific tasks

### Data Persistence
- All your tasks are automatically saved to your browser's localStorage
- Data persists between browser sessions
- No account or internet connection required

## 🛠 Technical Details

### Technologies Used
- **HTML5**: Semantic markup and accessibility
- **CSS3**: Modern styling with Flexbox, Grid, and advanced animations
- **Vanilla JavaScript**: No frameworks, pure ES6+ features
- **localStorage**: Client-side data persistence
- **Drag & Drop API**: Native browser drag and drop functionality

### Browser Support
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported (touch events for drag & drop)

### Performance
- Lightweight and fast loading
- Efficient DOM manipulation
- Minimal memory footprint
- Optimized drag and drop with ghost elements

## 🔮 Future Enhancements

The app is designed for incremental development. Potential next steps include:

- [x] **Delete functionality** for cards and todo items ✅
- [x] **Drag and drop** reordering of tasks ✅
- [x] **Refined input experience** with always-available input field ✅
- [x] **Default card state** with "Untitled Card" behavior ✅
- [x] **Custom checkbox design** with grey circles ✅
- [ ] **Categories/themes** for task cards
- [ ] **Export/import** functionality
- [ ] **Keyboard shortcuts** for power users
- [ ] **Dark mode** theme option
- [ ] **Multiple date ranges** (month view, year view)
- [ ] **Undo/redo** functionality
- [ ] **Task priorities** and due dates
- [ ] **Collaborative features** (shared lists)

## 🤝 Contributing

This is a modular project designed for easy modification. Each component can be independently updated:

- **Styling**: Modify `style.css` for visual changes
- **Logic**: Update `src/app.js` for functionality changes
- **Structure**: Edit `index.html` for layout changes

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ for clean, efficient task management**
