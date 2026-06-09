// ===================== 数据加载 & 保存 & 旧版迁移 =====================

function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      appData = JSON.parse(raw);
      if (!appData.books || !Array.isArray(appData.books)) appData.books = [];
      if (!appData.currentBookId) appData.currentBookId = null;
      if (!appData.customEmojis) appData.customEmojis = [];
      // 迁移旧备忘录数据
      if (appData.memos && Array.isArray(appData.memos) && appData.memos.length > 0 && !appData.memoBooks) {
        const oldBg = appData.memoBackground || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        appData.memoBooks = [{ id: 'memo_' + Date.now(), name: '我的备忘', background: oldBg, memos: appData.memos }];
        appData.currentMemoBookId = appData.memoBooks[0].id;
        delete appData.memos;
        delete appData.memoBackground;
      }
      if (!appData.memoBooks) appData.memoBooks = [];
      if (!appData.currentMemoBookId) appData.currentMemoBookId = null;
      if (!appData.anniversaries) appData.anniversaries = [];
      if (!appData.anniBackground) appData.anniBackground = 'linear-gradient(135deg, #667eea, #764ba2)';
      if (!appData.schedule) appData.schedule = getDefaultSchedule();
      if (!appData.periodicBooks) {
        // 迁移旧格式
        if (appData.periodicNotes && appData.periodicNotes.entries && appData.periodicNotes.entries.length > 0) {
          appData.periodicBooks = [{ id: 'peri_' + Date.now(), name: '我的记事', entries: appData.periodicNotes.entries }];
          appData.currentPeriodicBookId = appData.periodicBooks[0].id;
          delete appData.periodicNotes;
        } else {
          appData.periodicBooks = [];
        }
      }
      if (!appData.currentPeriodicBookId) appData.currentPeriodicBookId = null;
      return true;
    }
  } catch { /* corrupted, fall through */ }
  appData = { books: [], currentBookId: null, customEmojis: [], memoBooks: [], currentMemoBookId: null };
  return false;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function migrateOldData() {
  const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
  if (!oldRaw) return false;
  let oldRecords = [];
  try { oldRecords = JSON.parse(oldRaw); } catch { oldRecords = []; }
  if (!Array.isArray(oldRecords) || oldRecords.length === 0) return false;
  const defaultBook = {
    id: 'book_' + Date.now(),
    name: '我的账本',
    background: { type: 'color', value: COLOR_PRESETS[0] },
    records: oldRecords,
    createdAt: new Date().toISOString()
  };
  appData.books = [defaultBook];
  appData.currentBookId = defaultBook.id;
  saveData();
  localStorage.removeItem(OLD_STORAGE_KEY);
  return true;
}

// ============ 账本 CRUD ============

function getCurrentBook() {
  return appData.books.find(b => b.id === appData.currentBookId) || null;
}

function getCurrentRecords() {
  const book = getCurrentBook();
  return book ? book.records : [];
}

function ensureBook() {
  // 修复所有缺少 background 字段的账本
  appData.books.forEach(b => {
    if (!b.background || !b.background.type) {
      b.background = { type: 'color', value: COLOR_PRESETS[0] };
    }
  });

  if (appData.books.length === 0) {
    const b = {
      id: 'book_' + Date.now(),
      name: '我的账本',
      background: { type: 'color', value: COLOR_PRESETS[0] },
      records: [],
      createdAt: new Date().toISOString()
    };
    appData.books.push(b);
    appData.currentBookId = b.id;
    saveData();
    return b;
  }
  const curr = getCurrentBook();
  if (!curr) {
    appData.currentBookId = appData.books[0].id;
    saveData();
    return appData.books[0];
  }
  return curr;
}

function addBook() {
  const name = prompt('请输入新账本名称：', '新账本');
  if (!name || !name.trim()) return;
  const book = {
    id: 'book_' + Date.now(),
    name: name.trim().substring(0, 20),
    background: { type: 'color', value: COLOR_PRESETS[0] },
    records: [],
    createdAt: new Date().toISOString()
  };
  appData.books.push(book);
  appData.currentBookId = book.id;
  saveData();
  render();
}

function switchBook(bookId) {
  if (appData.currentBookId === bookId) return;
  appData.currentBookId = bookId;
  saveData();
  render();
}

function deleteCurrentBook() {
  if (appData.books.length <= 1) {
    alert('至少需要保留一个账本，无法删除。');
    return;
  }
  const book = getCurrentBook();
  if (!book) return;
  if (!confirm(`确定要删除"${book.name}"及其所有记录吗？此操作不可恢复。`)) return;
  const idx = appData.books.findIndex(b => b.id === book.id);
  if (idx >= 0) appData.books.splice(idx, 1);
  appData.currentBookId = appData.books[0].id;
  closeBookSettings();
  saveData();
  render();
}

// ============ 账本设置弹窗 ============

let settingsBgType = 'color';

function showBookSettings() {
  if (currentMode !== 'book') return;
  const book = getCurrentBook();
  if (!book) return;
  const overlay = document.getElementById('settingsOverlay');
  document.getElementById('settingsBookName').value = book.name;
  settingsBgType = book.background.type;

  document.querySelectorAll('#bgTypeToggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === settingsBgType);
  });
  document.getElementById('bgColorField').style.display = settingsBgType === 'color' ? 'block' : 'none';
  document.getElementById('bgImageField').style.display = settingsBgType === 'image' ? 'block' : 'none';

  if (settingsBgType === 'color') {
    document.getElementById('settingsBgColor').value = book.background.value;
  } else {
    document.getElementById('settingsBgImage').value = book.background.value;
  }

  renderColorPresets();
  overlay.style.display = 'flex';

  const onKey = (e) => { if (e.key === 'Escape') closeBookSettings(); };
  document.addEventListener('keydown', onKey, { once: false });
  overlay._keyHandler = onKey;
}

function closeBookSettings() {
  const overlay = document.getElementById('settingsOverlay');
  overlay.style.display = 'none';
  if (overlay._keyHandler) {
    document.removeEventListener('keydown', overlay._keyHandler);
    overlay._keyHandler = null;
  }
}

function switchBgType(type) {
  settingsBgType = type;
  document.querySelectorAll('#bgTypeToggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  document.getElementById('bgColorField').style.display = type === 'color' ? 'block' : 'none';
  document.getElementById('bgImageField').style.display = type === 'image' ? 'block' : 'none';
}

function renderColorPresets() {
  const container = document.getElementById('colorPresets');
  const book = getCurrentBook();
  const curVal = settingsBgType === 'color' ? (document.getElementById('settingsBgColor').value || book?.background?.value) : '';
  container.innerHTML = COLOR_PRESETS.map((val, i) => {
    const isSelected = curVal === val;
    return `<div class="color-preset${isSelected ? ' selected' : ''}"
      style="background:${val}"
      onclick="selectColorPreset('${val.replace(/'/g, "\\'")}', this)"
      title="预设 ${i + 1}"></div>`;
  }).join('');
}

function selectColorPreset(value, el) {
  document.getElementById('settingsBgColor').value = value;
  document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
}

function saveBookSettings() {
  const book = getCurrentBook();
  if (!book) return;
  const newName = document.getElementById('settingsBookName').value.trim();
  if (!newName) { alert('账本名称不能为空'); return; }
  book.name = newName.substring(0, 20);

  if (settingsBgType === 'color') {
    const colorVal = document.getElementById('settingsBgColor').value.trim();
    book.background = { type: 'color', value: colorVal || COLOR_PRESETS[0] };
  } else {
    const imageVal = document.getElementById('settingsBgImage').value.trim();
    book.background = { type: 'image', value: imageVal || '' };
  }

  closeBookSettings();
  saveData();
  render();
}

// ============ 类型切换 ============

function switchType(type) {
  currentType = type;
  const incomeBtn = document.querySelector('.income-btn');
  const expenseBtn = document.querySelector('.expense-btn');
  const submitBtn = document.getElementById('submitBtn');
  incomeBtn.classList.toggle('active', type === 'income');
  expenseBtn.classList.toggle('active', type === 'expense');
  if (type === 'income') {
    submitBtn.textContent = '添加收入';
    submitBtn.className = 'submit-btn income-submit';
  } else {
    submitBtn.textContent = '添加支出';
    submitBtn.className = 'submit-btn expense-submit';
  }
}

// ============ 月份导航 ============

function goToPrevMonth() {
  viewMonth--;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  if (currentMode === 'memo') { renderMonthNav(); renderMemos(); }
  else render();
}

function goToNextMonth() {
  viewMonth++;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  if (currentMode === 'memo') { renderMonthNav(); renderMemos(); }
  else render();
}

function goToCurrentMonth() {
  viewAllMonths = false;
  const curr = getCurrentYearMonth();
  viewYear = curr.year;
  viewMonth = curr.month;
  if (currentMode === 'memo') { renderMonthNav(); renderMemos(); }
  else render();
}

function toggleViewAll() {
  viewAllMonths = !viewAllMonths;
  renderMonthNav();
  if (currentMode === 'memo') renderMemos();
  else render();
}

function isViewingCurrentMonth() {
  const curr = getCurrentYearMonth();
  return viewYear === curr.year && viewMonth === curr.month;
}

// ============ 年月选择器 ============

function showPicker() {
  const existing = document.querySelector('.picker-overlay');
  if (existing) existing.remove();

  const curr = getCurrentYearMonth();
  const startYear = 2020;
  const endYear = curr.year + 1;

  const yearOpts = [];
  for (let y = startYear; y <= endYear; y++) {
    const sel = y === viewYear ? ' selected' : '';
    yearOpts.push(`<option value="${y}"${sel}>${y} 年</option>`);
  }

  const monthOpts = [];
  for (let m = 0; m < 12; m++) {
    const sel = m === viewMonth ? ' selected' : '';
    monthOpts.push(`<option value="${m}"${sel}>${m + 1} 月</option>`);
  }

  const overlay = document.createElement('div');
  overlay.className = 'picker-overlay';
  overlay.innerHTML = `
    <div class="picker-panel" onclick="event.stopPropagation()">
      <h3>📅 选择年月</h3>
      <div class="picker-row">
        <select id="pickerYear">${yearOpts.join('')}</select>
        <select id="pickerMonth">${monthOpts.join('')}</select>
      </div>
      <div class="picker-actions">
        <button class="btn-cancel" onclick="closePicker()">取消</button>
        <button class="btn-confirm" onclick="confirmPicker()">确定</button>
      </div>
    </div>
  `;

  const onKey = (e) => {
    if (e.key === 'Escape') { closePicker(); }
    if (e.key === 'Enter') { confirmPicker(); }
  };
  document.addEventListener('keydown', onKey, { once: false });
  overlay._removeKeyHandler = () => document.removeEventListener('keydown', onKey);

  overlay.addEventListener('click', closePicker);
  document.body.appendChild(overlay);
}

function closePicker() {
  const overlay = document.querySelector('.picker-overlay');
  if (overlay) {
    if (overlay._removeKeyHandler) overlay._removeKeyHandler();
    overlay.remove();
  }
}

function confirmPicker() {
  const yearEl = document.getElementById('pickerYear');
  const monthEl = document.getElementById('pickerMonth');
  if (yearEl && monthEl) {
    viewYear = parseInt(yearEl.value);
    viewMonth = parseInt(monthEl.value);
  }
  closePicker();
  if (currentMode === 'memo') { renderMonthNav(); renderMemos(); }
  else render();
}

// ============ 记录操作 ============

function getMonthRecords() {
  const records = getCurrentRecords();
  if (viewAllMonths) return records;
  return records.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });
}

function addRecord() {
  const itemEl = document.getElementById('itemInput');
  const amountEl = document.getElementById('amountInput');
  const noteEl = document.getElementById('noteInput');

  const item = itemEl.value.trim();
  if (!item) { itemEl.focus(); return; }

  const amount = parseFloat(amountEl.value);
  if (!amount || amount <= 0) {
    amountEl.focus();
    amountEl.style.borderColor = '#e74c3c';
    setTimeout(() => amountEl.style.borderColor = '#ddd', 1500);
    return;
  }

  const book = getCurrentBook();
  if (!book) { ensureBook(); }

  let icon;
  if (currentIconMode === 'photo') {
    const photoUrl = document.getElementById('photoUrlInput').value.trim();
    icon = photoUrl || null;
  } else {
    icon = selectedEmoji;
  }

  let recordDate;
  if (!isViewingCurrentMonth()) {
    const d = new Date(viewYear, viewMonth, Math.min(new Date().getDate(), new Date(viewYear, viewMonth + 1, 0).getDate()));
    recordDate = d.toISOString();
  } else {
    recordDate = new Date().toISOString();
  }

  getCurrentBook().records.push({
    id: Date.now(),
    type: currentType,
    amount: Math.round(amount * 100) / 100,
    item: item.substring(0, 30),
    note: noteEl.value.trim(),
    icon: icon,
    date: recordDate
  });

  itemEl.value = '';
  amountEl.value = '';
  noteEl.value = '';
  const photoEl = document.getElementById('photoUrlInput');
  if (photoEl) photoEl.value = '';

  saveData();
  render();
  amountEl.focus();
}

// ============ 记录编辑 ============

function startEditRecord(id) {
  editingRecordId = id;
  renderRecords();
}

function cancelEditRecord() {
  editingRecordId = null;
  renderRecords();
}

function saveEditRecord(id) {
  const book = getCurrentBook();
  if (!book) return;
  const rec = book.records.find(r => r.id === id);
  if (!rec) return;

  const itemEl = document.getElementById('editItem_' + id);
  const amountEl = document.getElementById('editAmount_' + id);
  const noteEl = document.getElementById('editNote_' + id);
  const iconEl = document.getElementById('editIcon_' + id);
  const dateEl = document.getElementById('editDate_' + id);

  const amount = parseFloat(amountEl?.value);
  if (!amount || amount <= 0) { amountEl?.focus(); return; }

  rec.item = itemEl ? itemEl.value.trim().substring(0, 30) : '';
  rec.amount = Math.round(amount * 100) / 100;
  rec.note = noteEl ? noteEl.value.trim() : '';
  if (iconEl) rec.icon = iconEl.value || null;
  if (dateEl && dateEl.value) {
    // 只有日期被修改了才更新，否则保留原时间
    const origDateStr = rec.date.substring(0, 10); // YYYY-MM-DD
    if (dateEl.value !== origDateStr) {
      const parts = dateEl.value.split('-');
      const d = new Date(+parts[0], +parts[1] - 1, +parts[2], 12, 0, 0);
      rec.date = d.toISOString();
    }
  }

  editingRecordId = null;
  saveData();
  renderRecords();
}

function toggleEditEmojiPopup(id, e) {
  e.stopPropagation();
  const existing = document.querySelector('.emoji-popup');
  if (existing) { existing.remove(); return; }

  const allEmojis = getAllEmojis();
  const btn = document.getElementById('editEmojiBtn_' + id);
  const popup = document.createElement('div');
  popup.className = 'emoji-popup';
  popup.innerHTML = allEmojis.map(em =>
    `<span onclick="selectEditEmoji(${id},'${em}',event)">${em}</span>`
  ).join('') + `<span onclick="addEditEmojiPopup(${id},event)" style="color:#4facfe;font-weight:bold;font-size:24px" title="添加">＋</span>`;
  btn.parentElement.appendChild(popup);

  setTimeout(() => {
    document.addEventListener('click', function closeEmoji() {
      popup.remove();
      document.removeEventListener('click', closeEmoji);
    }, { once: true });
  }, 0);
}

function selectEditEmoji(id, emoji, e) {
  e.stopPropagation();
  document.getElementById('editIcon_' + id).value = emoji;
  document.getElementById('editEmojiBtn_' + id).textContent = emoji;
  document.querySelector('.emoji-popup')?.remove();
}

function addEditEmojiPopup(id, e) {
  e.stopPropagation();
  const input = prompt('输入或粘贴一个 emoji：');
  if (!input || !input.trim()) return;
  const emoji = [...input.trim()][0];
  if (!emoji) return;
  if (!appData.customEmojis) appData.customEmojis = [];
  if (!getAllEmojis().includes(emoji)) {
    appData.customEmojis.push(emoji);
    saveData();
  }
  document.getElementById('editIcon_' + id).value = emoji;
  const btn = document.getElementById('editEmojiBtn_' + id);
  if (btn) btn.textContent = emoji;
  document.querySelector('.emoji-popup')?.remove();
}

function toggleRecordType(id) {
  const book = getCurrentBook();
  if (!book) return;
  const rec = book.records.find(r => r.id === id);
  if (!rec) return;
  rec.type = rec.type === 'income' ? 'expense' : 'income';
  saveData();
  render();
}

function deleteRecord(id) {
  if (!confirm('确定要删除这条记录吗？')) return;
  const book = getCurrentBook();
  if (!book) return;
  book.records = book.records.filter(r => r.id !== id);
  saveData();
  render();
}

function clearAll() {
  const book = getCurrentBook();
  if (!book) return;
  const monthRecords = getMonthRecords();
  if (monthRecords.length === 0) return;
  const monthName = `${viewYear} 年 ${viewMonth + 1} 月`;
  const label = isViewingCurrentMonth() ? '本月' : monthName;
  if (!confirm(`确定要清空${label}全部 ${monthRecords.length} 条记录吗？此操作不可恢复。`)) return;
  const ids = new Set(monthRecords.map(r => r.id));
  book.records = book.records.filter(r => !ids.has(r.id));
  saveData();
  render();
}

// ============ 格式化 ============

function formatAmount(amount) {
  return '¥' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoStr) {
  const d = new Date(isoStr);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${mi}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============ 渲染 ============

function render() {
  if (currentMode !== 'book') return;
  ensureBook();
  renderHeader();
  renderBookTabs();
  renderMonthNav();
  renderSummary();
  renderRecords();
}

function renderHeader() {
  const book = getCurrentBook();
  if (!book) return;
  const header = document.getElementById('appHeader');
  const bookTitle = document.getElementById('bookTitle');
  bookTitle.innerHTML = `${escapeHtml(book.name)} <span style="font-size:12px;opacity:0.7;margin-left:4px">⚙</span>`;
  bookTitle.onclick = showBookSettings;
  bookTitle.title = '点击设置账本名称和背景';
  bookTitle.style.cursor = 'pointer';

  // 先清除所有背景样式，避免简写属性互相覆盖
  header.style.background = '';
  header.style.backgroundImage = '';

  if (book.background.type === 'color') {
    header.style.background = book.background.value;
  } else if (book.background.type === 'image' && book.background.value) {
    header.style.backgroundImage = `url(${book.background.value})`;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
  } else {
    header.style.background = COLOR_PRESETS[0];
  }
}

function onSortChange() {
  currentSort = document.getElementById('sortSelect').value;
  renderRecords();
}

function onFilterChange() {
  currentFilter = document.getElementById('filterSelect').value;
  renderRecords();
}

