// SVG icons — using BEM modifier classes for status
const ICON = {
  pending: `<svg class="edit-queue__item-status edit-queue__item-status--pending" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="3.5" fill="currentColor" opacity="0.35"/>
  </svg>`,

  processing: `<svg class="edit-queue__item-status edit-queue__item-status--spinning" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-opacity="0.25"/>
    <path d="M8 2a6 6 0 0 1 6 6" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  success: `<svg class="edit-queue__item-status edit-queue__item-status--done" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" fill="var(--color-success)" fill-opacity="0.15"/>
    <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="var(--color-success)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  failed: `<svg class="edit-queue__item-status edit-queue__item-status--failed" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" fill="var(--color-error)" fill-opacity="0.15"/>
    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="var(--color-error)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  skipped: `<svg class="edit-queue__item-status edit-queue__item-status--skipped" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" fill="currentColor" fill-opacity="0.15"/>
    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
};

// Human-readable labels for job actions
function jobLabel(job) {
  const action = job?.action ?? '';
  const map = {
    'claim:create':     'Add claim',
    'qualifier:set':    'Set qualifier',
    'reference:set':    'Set reference',
    'sitelink:set':     'Set sitelink',
    'labels:add':       'Add label',
    'lemma:set':        'Set lemma',
    'lemma:edit':       'Edit lemma',
    'lemma:remove':     'Remove lemma',
    'description:set':  'Set description',
    'entity:create':    'Create entity',
    'resolver:add':     'Add URL match',
  };
  return map[action] ?? action;
}

// Job meta info (entity/property details)
function jobMeta(job) {
  const parts = [];
  if (job?.entity && job.entity !== 'LAST') parts.push(job.entity);
  if (job?.id && job.id !== 'LAST') parts.push(job.id);
  if (job?.property) parts.push(job.property);
  if (job?.language) parts.push(job.language);
  if (job?.instance) parts.push(job.instance);
  return parts.join(' · ');
}

// Track whether user is hovering or has focus inside popup
let userIsInteracting = false;

document.addEventListener('mouseover', () => { userIsInteracting = true; });
document.addEventListener('mouseout', () => { userIsInteracting = false; });
document.addEventListener('focusin', () => { userIsInteracting = true; });
document.addEventListener('focusout', () => { userIsInteracting = false; });

// Render the queue into the DOM
function renderQueue(queue) {
  const list = document.getElementById('job-list');
  const emptyState = document.getElementById('empty-state');
  const progressBar = document.getElementById('progress-bar');
  const progressContainer = document.getElementById('progress-container');
  const statusEl = document.getElementById('popup-status');
  const clearBtn = document.getElementById('clear-btn');

  if (!queue || queue.length === 0) {
    list.innerHTML = '';
    emptyState.classList.remove('edit-queue--hidden');
    progressContainer.classList.add('edit-queue--hidden');
    statusEl.textContent = '';
    clearBtn.classList.add('edit-queue--hidden');
    return;
  }

  emptyState.classList.add('edit-queue--hidden');

  const total = queue.length;
  const done = queue.filter(q => q.status === 'success' || q.status === 'skipped').length;
  const failed = queue.filter(q => q.status === 'failed').length;
  const processing = queue.find(q => q.status === 'processing');
  const pending = queue.filter(q => q.status === 'pending').length;

  // Progress bar
  progressBar.setAttribute('max', total);
  progressBar.setAttribute('value', done);
  progressContainer.classList.remove('edit-queue--hidden');

  // Status text
  if (failed > 0 && pending === 0 && !processing) {
    statusEl.textContent = `${done} of ${total} done · ${failed} failed`;
  } else if (done === total) {
    statusEl.textContent = `All ${total} edits complete`;
  } else {
    statusEl.textContent = `${done} of ${total} done`;
  }

  // Show clear button when there are successes
  if (done > 0) {
    clearBtn.classList.remove('edit-queue--hidden');
  } else {
    clearBtn.classList.add('edit-queue--hidden');
  }

  // Render job items — update in place to avoid flicker
  queue.forEach((queueEntry, index) => {
    const { job, status, error } = queueEntry;
    const label = jobLabel(job);
    const meta = jobMeta(job);

    let item = list.querySelector(`.edit-queue__item[data-index="${index}"]`);
    if (!item) {
      item = document.createElement('li');
      item.className = 'edit-queue__item';
      item.dataset.index = index;
      list.appendChild(item);
    }

    const retryBtn = status === 'failed'
      ? `<div class="edit-queue__item-actions"><button class="edit-queue__button edit-queue__button--danger edit-queue__button--retry" data-index="${index}">Retry</button></div>`
      : '';

    const errorMsg = error
      ? `<div class="edit-queue__item-error">${error}</div>`
      : '';

    item.innerHTML = `
      <div class="edit-queue__item-icon">${ICON[status] || ICON.pending}</div>
      <div class="edit-queue__item-details">
        <div class="edit-queue__item-label">${label}</div>
        ${meta ? `<div class="edit-queue__item-meta">${meta}</div>` : ''}
        ${errorMsg}
      </div>
      ${retryBtn}
    `;
  });

  // Remove any excess items
  const allItems = list.querySelectorAll('.edit-queue__item');
  allItems.forEach((item, i) => {
    if (i >= queue.length) item.remove();
  });
}

// Handle retry clicks via event delegation
document.getElementById('job-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('.edit-queue__button--retry');
  if (!btn) return;
  const index = parseInt(btn.dataset.index, 10);
  btn.disabled = true;
  btn.textContent = 'Retrying…';
  await browser.runtime.sendMessage({ type: 'retry_job', index });
});

// Handle clear completed
document.getElementById('clear-btn').addEventListener('click', async () => {
  await browser.runtime.sendMessage({ type: 'clear_completed_edits' });
});

// Listen for live updates from the background
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'update_edit_queue_progress') {
    renderQueue(message.queue);
  }
});

// When popup unloads, clear the queue if all jobs succeeded and user wasn't interacting
window.addEventListener('unload', () => {
  if (!userIsInteracting) {
    browser.runtime.sendMessage({ type: 'get_edit_queue' }).then(response => {
      if (!response?.queue?.length) return;
      const allDone = response.queue.every(q => q.status === 'success' || q.status === 'skipped');
      const hasFailed = response.queue.some(q => q.status === 'failed');
      if (allDone && !hasFailed) {
        browser.runtime.sendMessage({ type: 'clear_completed_edits' });
      }
    }).catch(() => {});
  }
});

// Initial fetch on popup open — poll briefly since the popup may open before
// the background has had time to process the add_to_edit_queue message.
(async () => {
  const MAX_ATTEMPTS = 15; // poll for up to 3s
  const INTERVAL_MS = 200;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const response = await browser.runtime.sendMessage({ type: 'get_edit_queue' });
      if (response?.queue?.length > 0) {
        renderQueue(response.queue);
        return;
      }
    } catch (e) {
      console.error('Failed to get edit queue:', e);
      return;
    }
    // Still empty — wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
  }
  // After polling, if still empty just leave the empty state
})();
