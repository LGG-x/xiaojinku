// ============ 选择导出 ============

function toggleSelectMode() {
  selectMode = !selectMode;
  if (!selectMode) {
    selectedRecordIds.clear();
    const selectAllCheck = document.getElementById('selectAllCheck');
    if (selectAllCheck) selectAllCheck.checked = false;
  }
  const exportBar = document.getElementById('exportBar');
  exportBar.style.display = selectMode ? 'flex' : 'none';
  const btn = document.getElementById('btnSelectExport');
  btn.textContent = selectMode ? '✕ 取消' : '☑ 导出';
  btn.style.color = selectMode ? '#e74c3c' : '#4facfe';
  renderRecords();
}

function toggleSelectAll() {
  const allChecked = document.getElementById('selectAllCheck').checked;
  const monthRecords = getMonthRecords();
  let filtered = monthRecords;
  if (currentFilter === 'income') filtered = monthRecords.filter(r => r.type === 'income');
  else if (currentFilter === 'expense') filtered = monthRecords.filter(r => r.type === 'expense');

  if (allChecked) {
    filtered.forEach(r => selectedRecordIds.add(r.id));
  } else {
    filtered.forEach(r => selectedRecordIds.delete(r.id));
  }
  updateExportCount();
  renderRecords();
}

function toggleRecordSelect(id) {
  if (selectedRecordIds.has(id)) selectedRecordIds.delete(id);
  else selectedRecordIds.add(id);
  updateExportCount();
  // 同步全选框状态
  const monthRecords = getMonthRecords();
  let filtered = monthRecords;
  if (currentFilter === 'income') filtered = monthRecords.filter(r => r.type === 'income');
  else if (currentFilter === 'expense') filtered = monthRecords.filter(r => r.type === 'expense');
  const allSel = filtered.length > 0 && filtered.every(r => selectedRecordIds.has(r.id));
  const selectAllCheck = document.getElementById('selectAllCheck');
  if (selectAllCheck) selectAllCheck.checked = allSel;
}

function updateExportCount() {
  const countEl = document.getElementById('exportCount');
  if (countEl) countEl.textContent = '已选 ' + selectedRecordIds.size + ' 条';

  const sel = document.getElementById('moveTargetBook');
  if (sel && selectMode && appData.books) {
    const curId = appData.currentBookId;
    sel.innerHTML = '<option value="">移动到…</option>' +
      appData.books.filter(b => b.id !== curId).map(b =>
        `<option value="${b.id}">${escapeHtml(b.name)}</option>`
      ).join('');
  }
}

function moveSelectedRecords() {
  if (selectedRecordIds.size === 0) { alert('请先选择要移动的记录'); return; }
  const targetId = document.getElementById('moveTargetBook').value;
  if (!targetId) { alert('请选择目标账本'); return; }
  const target = appData.books.find(b => b.id === targetId);
  if (!target) return;
  const src = getCurrentBook();
  if (!src) return;
  const toMove = src.records.filter(r => selectedRecordIds.has(r.id));
  if (!confirm(`确定将 ${toMove.length} 条记录移动到"${target.name}"吗？`)) return;
  target.records.push(...toMove);
  src.records = src.records.filter(r => !selectedRecordIds.has(r.id));
  selectedRecordIds.clear();
  saveData();
  render();
}

function exportAsImage() {
  if (selectedRecordIds.size === 0) { alert('请先选择要导出的记录'); return; }

  const book = getCurrentBook();
  if (!book) return;

  const monthName = `${viewYear} 年 ${viewMonth + 1} 月`;
  const records = book.records.filter(r => selectedRecordIds.has(r.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let totalIn = 0, totalOut = 0;
  records.forEach(r => { if (r.type === 'income') totalIn += r.amount; else totalOut += r.amount; });

  // 绘制 Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const W = 400;
  const rowH = 42;
  const topH = 110;
  const bottomH = 70;
  const H = topH + bottomH + records.length * rowH + 20;
  canvas.width = W;
  canvas.height = H;

  // 背景
  ctx.fillStyle = '#e3f2fd';
  ctx.fillRect(0, 0, W, H);

  // 头部卡片
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.roundRect(16, 16, W - 32, topH - 16, 12); ctx.fill();

  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText('沐沐小账本 - ' + book.name, 32, 46);

  ctx.fillStyle = '#999';
  ctx.font = '13px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(monthName, 32, 70);

  ctx.font = '12px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(`共 ${records.length} 条  |  收入 ¥${totalIn.toFixed(2)}  |  支出 ¥${totalOut.toFixed(2)}`, 32, 90);

  // 记录列表
  let y = topH + 10;
  records.forEach((r, i) => {
    const isIncome = r.type === 'income';
    ctx.fillStyle = i % 2 === 0 ? '#fafafa' : '#fff';
    ctx.beginPath(); ctx.roundRect(16, y, W - 32, rowH, 8); ctx.fill();

    const icon = r.icon || (isIncome ? '💰' : '💸');
    ctx.font = '18px sans-serif';
    ctx.fillText(icon, 28, y + 28);

    ctx.fillStyle = '#333';
    ctx.font = '14px "PingFang SC","Microsoft YaHei",sans-serif';
    const label = r.note || (isIncome ? '收入' : '支出');
    ctx.fillText(label.length > 12 ? label.substring(0, 11) + '…' : label, 52, y + 22);

    ctx.fillStyle = '#bbb';
    ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillText(formatDate(r.date), 52, y + 36);

    ctx.fillStyle = isIncome ? '#27ae60' : '#e74c3c';
    ctx.font = 'bold 14px "PingFang SC","Microsoft YaHei",sans-serif';
    const amt = (isIncome ? '+' : '-') + '¥' + r.amount.toFixed(2);
    ctx.textAlign = 'right';
    ctx.fillText(amt, W - 28, y + 28);
    ctx.textAlign = 'left';

    y += rowH;
  });

  // 底部
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.roundRect(16, y + 6, W - 32, bottomH - 16, 12); ctx.fill();

  ctx.fillStyle = '#333';
  ctx.font = 'bold 15px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText('结余：¥' + (totalIn - totalOut).toFixed(2), 32, y + 36);

  ctx.fillStyle = '#bbb';
  ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText('来自 沐沐小账本 · ' + new Date().toLocaleDateString('zh-CN'), 32, y + 54);

  // 导出
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    // 尝试分享（移动端）
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], '账单_' + monthName + '.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: '账单导出' }).catch(() => downloadImage(url));
        return;
      }
    }
    downloadImage(url);
  }, 'image/png');
}

function exportSingleMemo(id) {
  const book = getCurrentMemoBook();
  if (!book) return;
  const m = book.memos.find(mm => mm.id === id);
  if (!m) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const W = 400;
  const pad = 24;
  const contentW = W - pad * 2;
  const titleH = 50;
  const contentY = pad + titleH;
  let y = contentY;
  const lineH = 22;

  // Calculate height
  const contentLines = m.content ? m.content.split('\n').reduce((sum, line) => {
    return sum + Math.ceil(ctx.measureText(line).width / (contentW - 32)) || 1;
  }, 0) : 0;
  const H = contentY + contentLines * lineH + 60;
  canvas.width = W;
  canvas.height = Math.max(H, 200);

  // Background
  ctx.fillStyle = '#fce4ec';
  ctx.fillRect(0, 0, W, H);

  // Card
  ctx.fillStyle = m.background && m.background.type === 'color' ? m.background.value : '#fff';
  ctx.beginPath(); ctx.roundRect(12, 12, W - 24, H - 24, 14); ctx.fill();

  // Title
  ctx.fillStyle = '#333';
  ctx.font = 'bold 18px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText((m.pinned ? '📌 ' : '') + m.title, pad, pad + 30);

  // Divider
  ctx.strokeStyle = '#eee';
  ctx.beginPath(); ctx.moveTo(pad, contentY - 4); ctx.lineTo(W - pad, contentY - 4); ctx.stroke();

  // Content
  if (m.content) {
    ctx.fillStyle = '#555';
    ctx.font = '14px "PingFang SC","Microsoft YaHei",sans-serif';
    const lines = m.content.split('\n');
    for (const line of lines) {
      const wrapped = wrapText(ctx, line, contentW - 32);
      for (const w of wrapped) {
        ctx.fillText(w, pad + 16, y + 18);
        y += lineH;
      }
    }
  }

  // Footer
  ctx.fillStyle = '#bbb';
  ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif';
  ctx.fillText(formatDate(m.updatedAt), pad + 16, H - 28);
  ctx.textAlign = 'right';
  ctx.fillText('来自 沐沐小账本 · ' + book.name, W - pad - 16, H - 28);
  ctx.textAlign = 'left';

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], '备忘_' + m.title + '.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: m.title }).catch(() => downloadImage(url));
        return;
      }
    }
    downloadImage(url);
  }, 'image/png');
}

function wrapText(ctx, text, maxWidth) {
  const words = [];
  let current = '';
  for (const ch of text) {
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      words.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) words.push(current);
  return words.length ? words : [''];
}

function downloadImage(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = '账单_' + viewYear + '年' + (viewMonth + 1) + '月.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderBookTabs() {
  const bar = document.getElementById('bookTabsBar');
  const addBtn = bar.querySelector('.book-tab-add');
  bar.innerHTML = '';
  bar.appendChild(addBtn);
  appData.books.forEach(book => {
    const tab = document.createElement('button');
    tab.className = 'book-tab' + (book.id === appData.currentBookId ? ' active' : '');
    tab.textContent = book.name;
    tab.title = book.name;
    tab.addEventListener('click', () => switchBook(book.id));
    bar.insertBefore(tab, addBtn);
  });
}

function renderMonthNav() {
  const label = viewAllMonths ? '全部日期' : `${viewYear} 年 ${viewMonth + 1} 月`;
  document.getElementById('monthLabel').textContent = label;

  // 三角颜色按模式区分
  const arrowColor = currentMode === 'memo' ? '#e91e63' : '#27ae60';
  document.querySelectorAll('.month-nav button:first-child, .month-nav button:last-child').forEach(b => {
    if (b.textContent === '◀' || b.textContent === '▶') b.style.color = arrowColor;
  });

  // 记账本的月份导航
  const navTitle = document.getElementById('navTitle');
  if (navTitle) navTitle.textContent = label;
  const navToday = document.getElementById('navToday');
  if (navToday) navToday.style.display = (isViewingCurrentMonth() || viewAllMonths) ? 'none' : 'inline';
  const navAll = document.getElementById('navAll');
  if (navAll) {
    navAll.textContent = viewAllMonths ? '按月' : '全部';
    navAll.style.fontWeight = viewAllMonths ? '600' : 'normal';
  }

  // 备忘录的月份导航
  const memoNavTitle = document.getElementById('memoNavTitle');
  if (memoNavTitle) memoNavTitle.textContent = label;
  const memoNavToday = document.getElementById('memoNavToday');
  if (memoNavToday) memoNavToday.style.display = (isViewingCurrentMonth() || viewAllMonths) ? 'none' : 'inline';
  const memoNavAll = document.getElementById('memoNavAll');
  if (memoNavAll) {
    memoNavAll.textContent = viewAllMonths ? '按月' : '全部';
    memoNavAll.style.fontWeight = viewAllMonths ? '600' : 'normal';
  }
}

function renderSummary() {
  const monthRecords = getMonthRecords();
  let totalIncome = 0, totalExpense = 0;
  monthRecords.forEach(r => {
    if (r.type === 'income') totalIncome += r.amount;
    else totalExpense += r.amount;
  });
  const bal = totalIncome - totalExpense;
  document.getElementById('totalIncome').textContent = formatAmount(totalIncome);
  document.getElementById('totalExpense').textContent = formatAmount(totalExpense);
  const balanceEl = document.getElementById('balance');
  balanceEl.textContent = formatAmount(bal);
  balanceEl.style.color = bal >= 0 ? '#27ae60' : '#e74c3c';
}

function renderRecords() {
  const monthRecords = getMonthRecords();
  const viewingCurrent = isViewingCurrentMonth();
  const monthName = `${viewYear} 年 ${viewMonth + 1} 月`;

  document.getElementById('recordsTitle').textContent =
    '📋 ' + (viewAllMonths ? '全部记录' : (viewingCurrent ? '本月记录' : monthName + ' 记录'));

  // 更新筛选数目
  const totalCount = monthRecords.length;
  const incomeCount = monthRecords.filter(r => r.type === 'income').length;
  const expenseCount = monthRecords.filter(r => r.type === 'expense').length;
  const filterSelect = document.getElementById('filterSelect');
  if (filterSelect) {
    filterSelect.options[0].textContent = `全部 (${totalCount})`;
    filterSelect.options[1].textContent = `收入 (${incomeCount})`;
    filterSelect.options[2].textContent = `支出 (${expenseCount})`;
  }

  const listEl = document.getElementById('recordList');
  const emptyEl = document.getElementById('emptyState');
  const clearEl = document.getElementById('clearBar');

  listEl.innerHTML = '';

  if (monthRecords.length === 0) {
    emptyEl.style.display = 'block';
    clearEl.style.display = 'none';
  } else {
    emptyEl.style.display = 'none';
    clearEl.style.display = 'block';
    clearEl.querySelector('.clear-btn').textContent =
      '清空' + (viewingCurrent ? '本月' : monthName) + '记录';

    // 筛选
    let filtered = monthRecords;
    if (currentFilter === 'income') filtered = monthRecords.filter(r => r.type === 'income');
    else if (currentFilter === 'expense') filtered = monthRecords.filter(r => r.type === 'expense');

    // 排序
    let sorted;
    switch (currentSort) {
      case 'date-asc':
        sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'amount-desc':
        sorted = [...filtered].sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        sorted = [...filtered].sort((a, b) => a.amount - b.amount);
        break;
      default:
        sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    sorted.forEach(r => {
      const li = document.createElement('li');
      li.className = 'record-item' + (selectMode ? ' show-check' : '');
      const isEditing = editingRecordId === r.id;

      if (isEditing) {
        const curIcon = r.icon || (r.type === 'income' ? '💰' : '💸');
        const isImgIcon = curIcon && (curIcon.startsWith('http://') || curIcon.startsWith('https://'));

        li.innerHTML = `
          <div style="width:100%">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <span style="font-weight:600;font-size:14px">编辑记录</span>
              <span style="font-size:12px;color:#999">${r.type === 'income' ? '收入' : '支出'}</span>
            </div>
            <div class="record-edit-row">
              <div style="position:relative">
                <button class="edit-emoji-btn" id="editEmojiBtn_${r.id}" onclick="toggleEditEmojiPopup(${r.id}, event)">${isImgIcon ? '🖼' : curIcon}</button>
              </div>
              <input type="text" id="editItem_${r.id}" value="${escapeHtml(r.item || '')}" placeholder="项目" maxlength="30" style="max-width:90px">
              <input type="number" id="editAmount_${r.id}" value="${r.amount}" step="0.01" min="0.01" placeholder="金额" style="max-width:100px">
              <input type="hidden" id="editIcon_${r.id}" value="${isImgIcon ? escapeHtml(curIcon) : curIcon}">
            </div>
            <div class="record-edit-row" style="margin-top:6px">
              <input type="date" id="editDate_${r.id}" value="${r.date.substring(0, 10)}" style="font-size:15px">
            </div>
            <textarea id="editNote_${r.id}" placeholder="备注" maxlength="500" rows="2" style="margin-top:6px;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:15px;outline:none;resize:vertical;min-height:40px;font-family:inherit;width:100%">${escapeHtml(r.note || '')}</textarea>
            <div class="record-edit-actions">
              <button class="rec-edit-save" onclick="saveEditRecord(${r.id})">保存</button>
              <button class="rec-edit-cancel" onclick="cancelEditRecord()">取消</button>
            </div>
          </div>
        `;
        if (selectMode) {
          const check = document.createElement('input');
          check.type = 'checkbox';
          check.className = 'record-check';
          check.checked = selectedRecordIds.has(r.id);
          check.addEventListener('change', () => toggleRecordSelect(r.id));
          li.insertBefore(check, li.firstChild);
        }
        listEl.appendChild(li);
        return;
      }
      const typeSign = r.type === 'income' ? '+' : '-';
      const amountClass = r.type === 'income' ? 'income-text' : 'expense-text';
      const iconClass = r.type === 'income' ? 'income' : 'expense';
      const iconEmoji = r.icon || (r.type === 'income' ? '💰' : '💸');
      const isImageIcon = iconEmoji && (iconEmoji.startsWith('http://') || iconEmoji.startsWith('https://'));
      const itemText = r.item || r.note || (r.type === 'income' ? '收入' : '支出');
      const noteSub = r.item ? r.note : ''; // 有项目时，备注作为小字
      const oppositeType = r.type === 'income' ? '支出' : '收入';

      li.innerHTML = `
        <div class="record-left">
          ${isImageIcon
            ? `<img class="record-icon-img" src="${escapeHtml(iconEmoji)}" alt="" onerror="this.style.opacity='0.2'">`
            : `<div class="record-icon ${iconClass}">${iconEmoji}</div>`
          }
          <div class="record-info">
            <div class="record-label">${escapeHtml(itemText)}</div>
            ${noteSub ? `<div class="note">${escapeHtml(noteSub)}</div>` : ''}
            <div class="date">${formatDate(r.date)}</div>
          </div>
        </div>
        <div class="record-right">
          <span class="record-amount ${amountClass}">${typeSign}${formatAmount(r.amount)}</span>
          <button class="edit-btn" title="编辑">✎</button>
          <button class="delete-btn switch-type-btn switch-to-${r.type === 'income' ? 'expense' : 'income'}" title="改为${oppositeType}" style="font-size:10px">⇄</button>
          <button class="delete-btn" title="删除">×</button>
        </div>
      `;

      li.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        startEditRecord(r.id);
      });
      li.querySelector('.switch-type-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleRecordType(r.id);
      });
      li.querySelector('.delete-btn:not(.switch-type-btn)').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteRecord(r.id);
      });

      // 选择模式下在 innerHTML 之后插入复选框
      if (selectMode) {
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.className = 'record-check';
        check.checked = selectedRecordIds.has(r.id);
        check.addEventListener('change', () => toggleRecordSelect(r.id));
        li.insertBefore(check, li.firstChild);
      }

      listEl.appendChild(li);
    });
  }
}

