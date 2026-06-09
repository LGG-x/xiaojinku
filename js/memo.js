// ============ 备忘录本 CRUD ============

function getCurrentMemoBook() {
  return (appData.memoBooks || []).find(b => b.id === appData.currentMemoBookId) || null;
}

function getCurrentMemos() {
  const book = getCurrentMemoBook();
  return book ? (book.memos || []) : [];
}

function ensureMemoBook() {
  if (!appData.memoBooks) appData.memoBooks = [];
  // fix missing backgrounds
  appData.memoBooks.forEach(b => { if (!b.background) b.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'; });

  if (appData.memoBooks.length === 0) {
    const b = { id: 'memo_' + Date.now(), name: '我的备忘', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', memos: [] };
    appData.memoBooks.push(b);
    appData.currentMemoBookId = b.id;
    saveData();
    return b;
  }
  const curr = getCurrentMemoBook();
  if (!curr) { appData.currentMemoBookId = appData.memoBooks[0].id; saveData(); return appData.memoBooks[0]; }
  return curr;
}

function addMemoBook() {
  const name = prompt('请输入新备忘本名称：', '新备忘');
  if (!name || !name.trim()) return;
  const book = { id: 'memo_' + Date.now(), name: name.trim().substring(0, 20), background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', memos: [] };
  appData.memoBooks.push(book);
  appData.currentMemoBookId = book.id;
  saveData();
  renderMemoBookTabs();
  renderMemoHeader();
  renderMemos();
}

function switchMemoBook(bookId) {
  if (appData.currentMemoBookId === bookId) return;
  appData.currentMemoBookId = bookId;
  saveData();
  renderMemoBookTabs();
  renderMemoHeader();
  renderMemos();
}

function deleteCurrentMemoBook() {
  if (appData.memoBooks.length <= 1) { alert('至少需要保留一个备忘本，无法删除。'); return; }
  const book = getCurrentMemoBook();
  if (!book) return;
  if (!confirm(`确定要删除"${book.name}"及其所有备忘吗？此操作不可恢复。`)) return;
  const idx = appData.memoBooks.findIndex(b => b.id === book.id);
  if (idx >= 0) appData.memoBooks.splice(idx, 1);
  appData.currentMemoBookId = appData.memoBooks[0].id;
  closeMemoSettings();
  saveData();
  renderMemoBookTabs();
  renderMemoHeader();
  renderMemos();
}

function renderMemoHeader() {
  const book = getCurrentMemoBook();
  if (!book) return;
  const header = document.getElementById('appHeader');
  const bookTitle = document.getElementById('bookTitle');
  bookTitle.innerHTML = `${escapeHtml(book.name)} <span style="font-size:12px;opacity:0.7">⚙</span>`;
  bookTitle.onclick = showMemoSettings;

  header.style.background = '';
  header.style.backgroundImage = '';
  header.style.backgroundSize = '';
  header.style.backgroundPosition = '';
  const bg = book.background || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
  if (bg.startsWith('http://') || bg.startsWith('https://')) {
    header.style.backgroundImage = `url(${bg})`;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
  } else {
    header.style.background = bg;
  }
}

function renderMemoBookTabs() {
  const bar = document.getElementById('memoBookTabsBar');
  const addBtn = bar.querySelector('.book-tab-add');
  bar.innerHTML = '';
  bar.appendChild(addBtn);
  (appData.memoBooks || []).forEach(book => {
    const tab = document.createElement('button');
    tab.className = 'book-tab' + (book.id === appData.currentMemoBookId ? ' active' : '');
    tab.textContent = book.name;
    tab.title = book.name;
    tab.addEventListener('click', () => switchMemoBook(book.id));
    bar.insertBefore(tab, addBtn);
  });
}

// ============ 备忘录 CRUD ============

function addMemo() {
  const titleEl = document.getElementById('memoTitleInput');
  const title = titleEl.value.trim();
  if (!title) { titleEl.focus(); return; }

  const book = getCurrentMemoBook();
  if (!book) { ensureMemoBook(); }

  book.memos.push({
    id: Date.now(),
    title: title.substring(0, 50),
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  titleEl.value = '';
  saveData();
  renderMemos();
}

function deleteMemo(id) {
  if (!confirm('确定要删除这条备忘录吗？')) return;
  const book = getCurrentMemoBook();
  if (!book) return;
  book.memos = book.memos.filter(m => m.id !== id);
  saveData();
  renderMemos();
}

function startEditMemo(id) {
  editingMemoId = id;
  renderMemos();
}

function toggleMemoPin(id) {
  const book = getCurrentMemoBook();
  if (!book) return;
  const memo = book.memos.find(m => m.id === id);
  if (!memo) return;
  memo.pinned = !memo.pinned;
  saveData();
  renderMemos();
}

function toggleMemoCollapse(id) {
  const book = getCurrentMemoBook();
  if (!book) return;
  const memo = book.memos.find(m => m.id === id);
  if (!memo) return;
  memo.collapsed = !memo.collapsed;
  saveData();
  renderMemos();
}

function cancelEditMemo() {
  editingMemoId = null;
  renderMemos();
}

function saveEditMemo(id) {
  const titleInput = document.getElementById('memoEditTitle');
  const textarea = document.getElementById('memoEditTextarea');
  if (!textarea) return;
  const book = getCurrentMemoBook();
  if (!book) return;
  const memo = book.memos.find(m => m.id === id);
  if (!memo) return;
  if (titleInput) memo.title = titleInput.value.trim().substring(0, 50) || memo.title;
  memo.content = textarea.value;
  // 保存背景
  if (_memoBgTemp[id] !== undefined) {
    memo.background = _memoBgTemp[id] || null;
    delete _memoBgTemp[id];
  }
  memo.updatedAt = new Date().toISOString();
  editingMemoId = null;
  saveData();
  renderMemos();
}

function renderMemos() {
  const listEl = document.getElementById('memoList');
  const emptyEl = document.getElementById('memoEmpty');
  const book = getCurrentMemoBook();
  const memosArr = book ? (book.memos || []) : [];

  // 按当前查看月份筛选
  const monthMemos = memosArr.filter(m => {
    const d = new Date(m.updatedAt);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  // 置顶优先，然后按更新时间排序
  const memos = [...monthMemos].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  listEl.innerHTML = '';

  if (memos.length === 0) {
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';

    memos.forEach(m => {
      const li = document.createElement('li');
      li.className = 'memo-item';

      if (editingMemoId === m.id) {
        const memoBg = m.background || null;
        const memoBgColor = memoBg && memoBg.type === 'color' ? memoBg.value : '';
        const memoBgImage = memoBg && memoBg.type === 'image' ? memoBg.value : '';
        const MEMO_BG_COLORS = [
          '#fff','#fce4ec','#f3e5f5','#e8f5e9','#e3f2fd','#fff3e0','#ffebee',
          'linear-gradient(135deg, #ffecd2, #fcb69f)',
          'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
          'linear-gradient(135deg, #d4fc79, #96e6a1)',
          'linear-gradient(135deg, #fbc2eb, #a18cd1)',
          'linear-gradient(135deg, #fccb90, #d57eeb)'
        ];
        const bgDots = MEMO_BG_COLORS.map((val, i) => {
          const sel = memoBgColor === val ? ' selected' : '';
          return `<div class="memo-bg-dot${sel}" style="background:${val}" onclick="setMemoBgColor('${val.replace(/'/g, "\\'")}', this)" title="预设 ${i + 1}"></div>`;
        }).join('');

        li.innerHTML = `
          <input type="text" id="memoEditTitle" value="${escapeHtml(m.title)}" maxlength="50" style="width:100%;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:15px;font-weight:600;outline:none;margin-bottom:8px">
          <div class="memo-edit-area">
            <textarea id="memoEditTextarea" rows="4">${escapeHtml(m.content)}</textarea>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
              <button class="memo-bg-toggle" onclick="toggleMemoBgEditor(${m.id})">🎨 背景</button>
              <span style="font-size:11px;color:#aaa">${memoBg ? (memoBg.type === 'image' ? '已设图片' : '已设颜色') : ''}</span>
            </div>
            <div class="memo-bg-editor" id="memoBgEditor_${m.id}" style="display:none">
              <div style="font-size:11px;color:#888;margin-bottom:4px">选择颜色（点空白格清除）</div>
              <div class="memo-bg-row">
                ${bgDots}
                <div class="memo-bg-dot clear-bg${!memoBg ? ' selected' : ''}" onclick="clearMemoBg(${m.id})" title="清除背景">✕</div>
              </div>
              <div style="font-size:11px;color:#888;margin-top:8px;margin-bottom:2px">或输入图片链接</div>
              <input type="url" id="memoBgImage_${m.id}" placeholder="https://..." value="${escapeHtml(memoBgImage)}" onchange="setMemoBgImage(${m.id}, this.value)">
            </div>
            <div class="memo-edit-actions">
              <button class="memo-edit-cancel" onclick="cancelEditMemo()">取消</button>
              <button class="memo-edit-save" onclick="saveEditMemo(${m.id})">保存</button>
            </div>
          </div>
        `;
        setTimeout(() => {
          const ta = document.getElementById('memoEditTextarea');
          if (ta) { ta.focus(); ta.selectionStart = ta.value.length; }
        }, 100);
      } else {
        const hasContent = m.content.trim().length > 0;
        // 应用单条备忘录背景
        let bgStyle = '';
        if (m.background) {
          if (m.background.type === 'image') {
            bgStyle = `background-image:url(${escapeHtml(m.background.value)});background-size:cover;background-position:center;`;
          } else {
            bgStyle = `background:${m.background.value};`;
          }
        } else {
          bgStyle = 'background:#fff;';
        }
        const isCollapsed = m.collapsed === true;
        li.style = bgStyle + ';position:relative;';
        li.innerHTML = `
          <div class="memo-title" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center">
            <span onclick="toggleMemoCollapse(${m.id})" style="flex:1">${isCollapsed ? '▶' : '▼'} ${escapeHtml(m.title)}</span>
            <span onclick="toggleMemoPin(${m.id})" style="cursor:pointer;font-size:16px;flex-shrink:0" title="${m.pinned ? '取消置顶' : '置顶'}">${m.pinned ? '📌' : '📍'}</span>
          </div>
          <div class="memo-collapse-body" style="display:${isCollapsed ? 'none' : 'block'}">
            ${hasContent ? `<div class="memo-content">${escapeHtml(m.content)}</div>` : '<div class="memo-content" style="color:#ccc;font-style:italic">点击编辑添加内容...</div>'}
            <div class="memo-time">${formatDate(m.updatedAt)}</div>
          </div>
          <div class="memo-actions">
            <button onclick="startEditMemo(${m.id})">✏ 编辑</button>
            <button class="memo-del-btn" onclick="deleteMemo(${m.id})">🗑 删除</button>
          </div>
          <button onclick="exportSingleMemo(${m.id})" style="position:absolute;bottom:12px;right:12px;padding:5px 12px;border-radius:8px;background:#4facfe;color:#fff;border:none;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.15)" title="导出图片">☑ 导出</button>
        `;
      }

      listEl.appendChild(li);
    });
  }
}

// ============ 单条备忘录背景编辑 ============

let _memoBgTemp = {}; // 编辑中暂存的背景 { id: {type, value} }

function toggleMemoBgEditor(id) {
  const editor = document.getElementById('memoBgEditor_' + id);
  if (editor) editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
}

function setMemoBgColor(value, el) {
  // 根据 value 找到对应的 memo，暂存颜色背景
  const editor = el.closest('.memo-bg-editor');
  if (!editor) return;
  editor.querySelectorAll('.memo-bg-dot').forEach(d => d.classList.remove('selected'));
  el.classList.add('selected');
  // 存储到临时变量
  const id = parseInt(editor.id.replace('memoBgEditor_', ''));
  _memoBgTemp[id] = { type: 'color', value: value };
  // 清除图片输入
  const imgInput = document.getElementById('memoBgImage_' + id);
  if (imgInput) imgInput.value = '';
}

function clearMemoBg(id) {
  _memoBgTemp[id] = null;
  const editor = document.getElementById('memoBgEditor_' + id);
  if (editor) {
    editor.querySelectorAll('.memo-bg-dot').forEach(d => d.classList.remove('selected'));
    editor.querySelector('.clear-bg')?.classList.add('selected');
  }
  const imgInput = document.getElementById('memoBgImage_' + id);
  if (imgInput) imgInput.value = '';
}

function setMemoBgImage(id, value) {
  if (!value || !value.trim()) return;
  _memoBgTemp[id] = { type: 'image', value: value.trim() };
  const editor = document.getElementById('memoBgEditor_' + id);
  if (editor) {
    editor.querySelectorAll('.memo-bg-dot').forEach(d => d.classList.remove('selected'));
  }
}

// ============ 备忘录本设置弹窗 ============

let memoSettingsBgType = 'color';

function showMemoSettings() {
  if (currentMode !== 'memo') return;
  const book = getCurrentMemoBook();
  if (!book) return;
  const bg = book.background || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
  const isImage = bg.startsWith('http://') || bg.startsWith('https://');
  memoSettingsBgType = isImage ? 'image' : 'color';

  const overlay = document.getElementById('memoSettingsOverlay');
  document.getElementById('memoBookName').value = book.name;

  document.querySelectorAll('#memoBgTypeToggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === memoSettingsBgType);
  });
  document.getElementById('memoBgColorField').style.display = memoSettingsBgType === 'color' ? 'block' : 'none';
  document.getElementById('memoBgImageField').style.display = memoSettingsBgType === 'image' ? 'block' : 'none';

  if (memoSettingsBgType === 'color') {
    document.getElementById('memoBgCustom').value = isImage ? '' : bg;
  } else {
    document.getElementById('memoBgImage').value = isImage ? bg : '';
  }

  renderMemoColorPresets();
  overlay.style.display = 'flex';

  const onKey = (e) => { if (e.key === 'Escape') closeMemoSettings(); };
  document.addEventListener('keydown', onKey, { once: false });
  overlay._keyHandler = onKey;
}

function closeMemoSettings() {
  const overlay = document.getElementById('memoSettingsOverlay');
  overlay.style.display = 'none';
  if (overlay._keyHandler) {
    document.removeEventListener('keydown', overlay._keyHandler);
    overlay._keyHandler = null;
  }
}

function switchMemoBgTypeUI(type) {
  memoSettingsBgType = type;
  document.querySelectorAll('#memoBgTypeToggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  document.getElementById('memoBgColorField').style.display = type === 'color' ? 'block' : 'none';
  document.getElementById('memoBgImageField').style.display = type === 'image' ? 'block' : 'none';
}

function renderMemoColorPresets() {
  const container = document.getElementById('memoColorPresets');
  const curVal = document.getElementById('memoBgCustom').value;
  container.innerHTML = COLOR_PRESETS.map((val, i) => {
    const isSelected = curVal === val;
    return `<div class="color-preset${isSelected ? ' selected' : ''}"
      style="background:${val}"
      onclick="selectMemoColorPreset('${val.replace(/'/g, "\\'")}', this)"
      title="预设 ${i + 1}"></div>`;
  }).join('');
}

function selectMemoColorPreset(value, el) {
  document.getElementById('memoBgCustom').value = value;
  document.querySelectorAll('#memoColorPresets .color-preset').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
}

function saveMemoSettings() {
  const book = getCurrentMemoBook();
  if (!book) return;

  const newName = document.getElementById('memoBookName').value.trim();
  if (!newName) { alert('备忘本名称不能为空'); return; }
  book.name = newName.substring(0, 20);

  let val;
  if (memoSettingsBgType === 'image') {
    val = document.getElementById('memoBgImage').value.trim();
    if (!val) { closeMemoSettings(); return; }
  } else {
    val = document.getElementById('memoBgCustom').value.trim();
    if (!val) { closeMemoSettings(); return; }
  }

  book.background = val;
  closeMemoSettings();
  saveData();
  renderMemoHeader();
  renderMemoBookTabs();
}

