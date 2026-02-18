import { escapeHtml, formatDate } from '../utils.js';

export function renderTasks(containerId, tasks, callbacks = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { onEdit, onDelete, onToggle } = callbacks;
  const fragment = document.createDocumentFragment();

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div class="task-item">
        <div class="task-main">
          <div class="task-title">Belum ada task yang cocok</div>
          <div class="task-detail">Coba kata kunci lain atau tambah task baru.</div>
        </div>
      </div>
    `;
    return;
  }

  tasks.forEach((task) => {
    const div = document.createElement('div');
    div.className = 'task-item';
    if (task.status === 'Completed') div.classList.add('is-done');

    // Safe DOM construction
    const main = document.createElement('div');
    main.className = 'task-main';
    
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title; // TextContent is safe against XSS
    
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    
    // Add side/project pill if exists
    if (task.side) {
        const sidePill = document.createElement('span');
        sidePill.className = 'task-pill';
        sidePill.textContent = task.side;
        meta.appendChild(sidePill);
    }
    
    // Add deadline
    if (task.deadline) {
        const deadlineSpan = document.createElement('span');
        deadlineSpan.textContent = ` • ${formatDate(task.deadline)}`;
        meta.appendChild(deadlineSpan);
    }

    main.appendChild(title);
    main.appendChild(meta);
    
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    
    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon';
    editBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    editBtn.onclick = () => onEdit && onEdit(task);
    
    actions.appendChild(editBtn);
    div.appendChild(main);
    div.appendChild(actions);

    fragment.appendChild(div);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}
