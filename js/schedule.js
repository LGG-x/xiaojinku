// ============ 课表 ============

function getDefaultSchedule() {
  return {
    periods: [
      { label: '1', time: '08:00~08:45' },
      { label: '2', time: '08:55~09:40' },
      { label: '3', time: '10:20~11:05' },
      { label: '4', time: '11:15~12:00' },
      { label: '5', time: '13:30~14:15' },
      { label: '6', time: '14:25~15:10' },
      { label: '7', time: '15:30~16:15' },
      { label: '8', time: '16:25~17:10' },
      { label: '9', time: '18:30~19:15' },
      { label: '10', time: '19:25~20:10' },
      { label: '11', time: '20:20~21:05' }
    ],
    classes: {}
  };
}

function resetSchedule() {
  if (!confirm('确定重置课表？所有数据将丢失。')) return;
  appData.schedule = getDefaultSchedule();
  saveData();
  renderSchedule();
}

function addSchedulePeriod() {
  const label = prompt('课时（如：1-2）：');
  if (!label || !label.trim()) return;
  const time = prompt('时间（如：08:00~09:40）：', '');
  if (!appData.schedule) appData.schedule = getDefaultSchedule();
  appData.schedule.periods.push({ label: label.trim(), time: time.trim() });
  saveData();
  renderSchedule();
}

function removeSchedulePeriod() {
  if (!appData.schedule || appData.schedule.periods.length <= 1) { alert('至少保留1个课时'); return; }
  const idx = appData.schedule.periods.length - 1;
  if (!confirm('删除最后一个课时"' + appData.schedule.periods[idx].label + '"？')) return;
  appData.schedule.periods.pop();
  const newClasses = {};
  Object.keys(appData.schedule.classes).forEach(k => {
    const [d, p] = k.split('-').map(Number);
    if (p < appData.schedule.periods.length) newClasses[k] = appData.schedule.classes[k];
  });
  appData.schedule.classes = newClasses;
  saveData();
  renderSchedule();
}

function editPeriodLabel(idx) {
  const p = appData.schedule.periods[idx];
  const label = prompt('课时名：', p.label);
  if (label === null) return;
  if (!label.trim()) return;
  p.label = label.trim();
  saveData();
  renderSchedule();
}

function editPeriodTime(idx) {
  const p = appData.schedule.periods[idx];
  const time = prompt('时间：', p.time);
  if (time === null) return;
  p.time = time.trim();
  saveData();
  renderSchedule();
}

function importSchedule() {
  const input = document.getElementById('scheduleFileInput');
  input.click();
}

function handleScheduleFile(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    // 也支持粘贴文本
    parseScheduleCSV(text);
  };
  reader.readAsText(file);
  fileInput.value = '';
}

function parseScheduleCSV(text) {
  const lines = text.trim().split(/[\r\n]+/);
  if (lines.length < 2) { alert('格式不正确'); return; }

  // 解析第一行表头：课时,周一...,周二...,...
  const headers = lines[0].split(',');
  // 第一列是"课时"，后面7列是周一到周日
  const dayCount = Math.min(headers.length - 1, 7);

  const newPeriods = [];
  const newClasses = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    // 第一列：如 "1-2 08:00~09:40" 或 "1-208:00~09:40"
    const firstCol = cols[0].trim();
    const match = firstCol.match(/^(\d+-\d+)\s*(\d{2}:\d{2}[~～]\d{2}:\d{2})/);
    if (match) {
      newPeriods.push({ label: match[1], time: match[2].replace(/～/g, '~') });
    } else {
      // fallback: just use as label
      newPeriods.push({ label: firstCol, time: '' });
    }

    const pi = i - 1;
    for (let d = 0; d < dayCount && d + 1 < cols.length; d++) {
      const course = cols[d + 1].trim();
      if (course && course !== '无' && !course.startsWith('【非本周】')) {
        newClasses[d + '-' + pi] = course.replace(/\n/g, '\\n');
      }
    }
  }

  appData.schedule = { periods: newPeriods, classes: newClasses };
  saveData();
  renderSchedule();
  alert('导入成功！共 ' + newPeriods.length + ' 个课时');
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else current += ch;
  }
  result.push(current);
  return result;
}

function deletePeriod(idx) {
  if (!confirm('删除该课时？')) return;
  appData.schedule.periods.splice(idx, 1);
  // 清理对应的课程
  const newClasses = {};
  Object.keys(appData.schedule.classes).forEach(k => {
    const [d, p] = k.split('-').map(Number);
    if (p === idx) return;
    if (p > idx) newClasses[d + '-' + (p - 1)] = appData.schedule.classes[k];
    else newClasses[k] = appData.schedule.classes[k];
  });
  appData.schedule.classes = newClasses;
  saveData();
  renderSchedule();
}

function editScheduleCell(dayIdx, periodIdx) {
  const key = dayIdx + '-' + periodIdx;
  const current = (appData.schedule.classes[key] || '').replace(/\\n/g, '\n');
  const val = prompt('课程内容（换行用\\n）：', current);
  if (val === null) return;
  if (val.trim()) {
    appData.schedule.classes[key] = val.replace(/\n/g, '\\n');
  } else {
    delete appData.schedule.classes[key];
  }
  saveData();
  renderSchedule();
}

const COURSE_COLORS = [
  '#FFE0E0','#FFECD2','#FFF3CD','#E0F0FF','#E0FFE0',
  '#F0E0FF','#FFE0F0','#E0FFF0','#FFF0E0','#E0E0FF',
  '#FFD6D6','#FFE8C8','#FFF9C4','#C8E0FF','#C8FFC8'
];

function getCourseColor(courseName) {
  if (!courseName) return '#fff';
  let hash = 0;
  for (const ch of courseName) hash = ((hash << 5) - hash) + ch.charCodeAt(0);
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

function renderSchedule() {
  if (!appData.schedule) appData.schedule = getDefaultSchedule();
  const { periods, classes } = appData.schedule;
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // 表头 - WakeUp 风格
  // 计算本周日期
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  // 表头：天
  const monthLabel = (today.getMonth() + 1) + '月';
  let headHtml = '<tr><th style="padding:6px 4px;color:#999;font-weight:400;font-size:11px;width:48px;text-align:center;border-bottom:1px solid #eee;background:#e8f4fd">' + monthLabel + '</th>';
  days.forEach((d, idx) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + idx);
    const dateStr = (date.getMonth() + 1) + '.' + date.getDate();
    const dateMatchesToday = date.toDateString() === today.toDateString();
    const isWeekend = d === '周六' || d === '周日';
    headHtml += `<th style="padding:6px 4px;color:${isWeekend ? '#aaa' : '#555'};font-weight:${dateMatchesToday?'700':'500'};font-size:12px;text-align:center;border-bottom:1px solid #eee;background:#e8f4fd">${d}<div style="font-size:9px;color:#bbb;font-weight:400">${dateStr}</div></th>`;
  });
  headHtml += '</tr>';
  document.getElementById('scheduleHead').innerHTML = headHtml;

  let bodyHtml = '';
  periods.forEach((p, pi) => {
    bodyHtml += '<tr>';
    bodyHtml += `<td style="padding:4px;text-align:center;vertical-align:middle;background:#e8f4fd;border-bottom:1px solid #f0f0f0;font-size:11px;color:#666">
      <div style="cursor:pointer;font-weight:700;font-size:13px" onclick="editPeriodLabel(${pi})" title="编辑课时">${p.label}</div>
      <div style="font-size:9px;color:#999;cursor:pointer" onclick="editPeriodTime(${pi})" title="编辑时间">${p.time||'-'}</div>
    </td>`;
    for (let d = 0; d < 7; d++) {
      const key = d + '-' + pi;
      const cls = classes[key] || '';
      const isWeekend = d >= 5;
      if (cls) {
        const parts = cls.replace(/\\n/g, '\n').split('\n');
        const courseName = parts[0] || '';
        const detail = parts.slice(1).join(' ');
        const bg = getCourseColor(courseName);
        bodyHtml += `<td style="padding:1px;border-bottom:1px solid #f0f0f0;vertical-align:top;background:${isWeekend ? '#fafafa' : '#fff'}" onclick="editScheduleCell(${d},${pi})">
          <div style="background:${bg};border-radius:6px;padding:4px;margin:1px;cursor:pointer;min-height:36px;font-size:10px;line-height:1.4">
            <div style="font-weight:600;color:#333;font-size:11px">${escapeHtml(courseName)}</div>
            ${detail ? `<div style="color:#888;margin-top:1px">${escapeHtml(detail)}</div>` : ''}
          </div>
        </td>`;
      } else {
        bodyHtml += `<td style="padding:1px;border-bottom:1px solid #f0f0f0;background:${isWeekend ? '#fafafa' : '#fff'};vertical-align:top" onclick="editScheduleCell(${d},${pi})">
          <div style="border-radius:6px;padding:4px;margin:1px;min-height:36px;cursor:pointer"></div>
        </td>`;
      }
    }
  });
  document.getElementById('scheduleBody').innerHTML = bodyHtml;
}

// ============ 周期记事 ============

let periodicTimer = null;
let editingPeriodicId = null;

function getCurrentPeriodicBook() {
  return (appData.periodicBooks || []).find(b => b.id === appData.currentPeriodicBookId) || null;
}

function ensurePeriodicBook() {
  if (!appData.periodicBooks) appData.periodicBooks = [];
  if (appData.periodicBooks.length === 0) {
    const b = { id: 'peri_' + Date.now(), name: '我的记事', entries: [] };
    appData.periodicBooks.push(b);
    appData.currentPeriodicBookId = b.id;
    saveData();
    return b;
  }
  const curr = getCurrentPeriodicBook();
  if (!curr) { appData.currentPeriodicBookId = appData.periodicBooks[0].id; saveData(); return appData.periodicBooks[0]; }
  return curr;
}

function addPeriodicBook() {
  const name = prompt('新记事本名称：', '新记事');
  if (!name || !name.trim()) return;
  const b = { id: 'peri_' + Date.now(), name: name.trim().substring(0, 20), entries: [] };
  appData.periodicBooks.push(b);
  appData.currentPeriodicBookId = b.id;
  saveData();
  renderPeriodicBookTabs();
  renderPeriodicNotes();
}

function switchPeriodicBook(id) {
  appData.currentPeriodicBookId = id;
  saveData();
  renderPeriodicBookTabs();
  renderPeriodicNotes();
}

function deleteCurrentPeriodicBook() {
  if (appData.periodicBooks.length <= 1) { alert('至少保留一个记事本'); return; }
  const book = getCurrentPeriodicBook();
  if (!book) return;
  if (!confirm('删除"' + book.name + '"及其所有记录？')) return;
  const idx = appData.periodicBooks.findIndex(b => b.id === book.id);
  if (idx >= 0) appData.periodicBooks.splice(idx, 1);
  appData.currentPeriodicBookId = appData.periodicBooks[0].id;
  saveData();
  renderPeriodicBookTabs();
  renderPeriodicNotes();
}

function renderPeriodicBookTabs() {
  const bar = document.getElementById('periodicBookTabsBar');
  const addBtn = bar.querySelector('.book-tab-add');
  bar.innerHTML = '';
  bar.appendChild(addBtn);
  (appData.periodicBooks || []).forEach(book => {
    const tab = document.createElement('button');
    tab.className = 'book-tab' + (book.id === appData.currentPeriodicBookId ? ' active' : '');
    tab.textContent = book.name;
    tab.title = book.name + ' (长按删除)';
    tab.addEventListener('click', () => switchPeriodicBook(book.id));
    tab.addEventListener('dblclick', () => deleteCurrentPeriodicBook());
    bar.insertBefore(tab, addBtn);
  });
}

function updatePeriodicClock() {
  const now = new Date();
  document.getElementById('periodicDateLabel').textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 星期' + ['日','一','二','三','四','五','六'][now.getDay()];
  document.getElementById('periodicTimeLabel').textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
}

function startPeriodicRecord() {
  const book = getCurrentPeriodicBook();
  if (!book) { ensurePeriodicBook(); }
  getCurrentPeriodicBook().entries.push({ id: Date.now(), time: new Date().toISOString(), note: '' });
  saveData();
  renderPeriodicNotes();
}

function startEditPeriodic(id) {
  editingPeriodicId = id;
  renderPeriodicNotes();
}

function cancelEditPeriodic() {
  editingPeriodicId = null;
  renderPeriodicNotes();
}

function setPeriBgColor(value, el) {
  document.querySelectorAll('#periBgEditor_' + editingPeriodicId + ' .memo-bg-dot').forEach(d => d.classList.remove('selected'));
  if (el) el.classList.add('selected');
  const imgInput = document.getElementById('editPeriBgImage_' + editingPeriodicId);
  if (imgInput) imgInput.value = '';
  const book = getCurrentPeriodicBook();
  if (book) { const entry = book.entries.find(e => e.id === editingPeriodicId); if (entry) entry._tempBg = { type: 'color', value: value }; }
}

function clearPeriBg(id) {
  const book = getCurrentPeriodicBook();
  if (book) { const entry = book.entries.find(e => e.id === id); if (entry) entry._tempBg = null; }
  document.querySelectorAll('#periBgEditor_' + id + ' .memo-bg-dot').forEach(d => d.classList.remove('selected'));
  const cb = document.querySelector('#periBgEditor_' + id + ' .clear-bg');
  if (cb) cb.classList.add('selected');
}

function saveEditPeriodic(id) {
  const book = getCurrentPeriodicBook();
  if (!book) return;
  const entry = book.entries.find(e => e.id === id);
  if (!entry) return;
  const noteEl = document.getElementById('editPeriNote_' + id);
  const dateEl = document.getElementById('editPeriDate_' + id);
  const timeEl = document.getElementById('editPeriTime_' + id);
  const imgEl = document.getElementById('editPeriBgImage_' + id);
  if (noteEl) entry.note = noteEl.value.trim();
  if (dateEl && timeEl && dateEl.value && timeEl.value) {
    const nt = new Date(dateEl.value + 'T' + timeEl.value);
    if (!isNaN(nt.getTime())) entry.time = nt.toISOString();
  }
  if (entry._tempBg !== undefined) { entry.background = entry._tempBg; delete entry._tempBg; }
  else if (imgEl && imgEl.value.trim()) { entry.background = { type: 'image', value: imgEl.value.trim() }; }
  editingPeriodicId = null;
  saveData();
  renderPeriodicNotes();
}

function deletePeriodicEntry(id) {
  if (!confirm('删除？')) return;
  const book = getCurrentPeriodicBook();
  if (!book) return;
  book.entries = book.entries.filter(e => e.id !== id);
  editingPeriodicId = null;
  saveData();
  renderPeriodicNotes();
}

function renderPeriodicNotes() {
  const book = ensurePeriodicBook();
  const entries = [...book.entries].sort((a, b) => new Date(b.time) - new Date(a.time));
  const listEl = document.getElementById('periodicList');
  const emptyEl = document.getElementById('periodicEmpty');

  updatePeriodicClock();
  document.getElementById('periodicListTitle').textContent = '📋 ' + book.name + ' (' + entries.length + ')';
  renderPeriodicBookTabs();

  listEl.innerHTML = '';
  if (entries.length === 0) {
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    entries.forEach((e, i) => {
      const t = new Date(e.time);
      const li = document.createElement('li');
      li.className = 'memo-item';
      li.style.position = 'relative';
      let gapStr = '';
      if (i < entries.length - 1) {
        const prev = entries[i + 1];
        const gap = Math.floor((t - new Date(prev.time)) / 1000);
        if (gap > 0) {
          const gh = Math.round(gap / 3600);
          gapStr = (gh > 0 ? gh + '时' : '不到1时');
        }
      }

      if (editingPeriodicId === e.id) {
        const dateStr = t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0');
        const timeStr = String(t.getHours()).padStart(2,'0') + ':' + String(t.getMinutes()).padStart(2,'0') + ':' + String(t.getSeconds()).padStart(2,'0');
        const bg = e.background || null;
        const bgColor = bg && bg.type === 'color' ? bg.value : '';
        const bgImage = bg && bg.type === 'image' ? bg.value : '';
        const bgDots = COLOR_PRESETS.map((val, i) => {
          const sel = bgColor === val ? ' selected' : '';
          return `<div class="memo-bg-dot${sel}" style="background:${val}" onclick="setPeriBgColor('${val.replace(/'/g, "\\'")}', this)" title="预设 ${i + 1}"></div>`;
        }).join('');
        li.innerHTML = `
          <div style="font-weight:600;font-size:15px;margin-bottom:8px">编辑记录 #${entries.length - i}</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <textarea id="editPeriNote_${e.id}" placeholder="备注" maxlength="500" rows="2" style="padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none;width:100%;resize:vertical;font-family:inherit;min-height:50px">${escapeHtml(e.note)}</textarea>
            <div style="display:flex;gap:6px">
              <input type="date" id="editPeriDate_${e.id}" value="${dateStr}" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none">
              <select id="editPeriTime_${e.id}" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none">${Array.from({length:24},(_,h)=>`<option value="${String(h).padStart(2,'0')}:00" ${parseInt(timeStr)===h?'selected':''}>${h}时</option>`).join('')}</select>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="memo-bg-toggle" onclick="document.getElementById('periBgEditor_${e.id}').style.display=document.getElementById('periBgEditor_${e.id}').style.display==='none'?'block':'none'">🎨 背景</button>
            </div>
            <div class="memo-bg-editor" id="periBgEditor_${e.id}" style="display:none">
              <div style="font-size:11px;color:#888;margin-bottom:4px">选择颜色</div>
              <div class="memo-bg-row">${bgDots}<div class="memo-bg-dot clear-bg${!bg ? ' selected' : ''}" onclick="clearPeriBg(${e.id})" title="清除">✕</div></div>
              <div style="font-size:11px;color:#888;margin-top:6px;margin-bottom:2px">或图片链接</div>
              <input type="url" id="editPeriBgImage_${e.id}" placeholder="https://..." value="${escapeHtml(bgImage)}">
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:8px">
            <button onclick="cancelEditPeriodic()" style="border:1px solid #e0e0e0;border-radius:6px;padding:4px 12px;cursor:pointer;background:#fafafa;font-size:12px;color:#666">取消</button>
            <button onclick="saveEditPeriodic(${e.id})" style="border:none;border-radius:6px;padding:4px 12px;cursor:pointer;background:#4facfe;color:#fff;font-size:12px;font-weight:500">保存</button>
          </div>
        `;
      } else {
        if (e.background) {
          if (e.background.type === 'image') li.style = 'background-image:url(' + escapeHtml(e.background.value) + ');background-size:cover;background-position:center';
          else li.style = 'background:' + e.background.value;
        }
        li.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="background:#4facfe;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0">${entries.length - i}</span>
            <span style="font-weight:600;font-size:16px">${t.getFullYear()+'/'+(t.getMonth()+1)+'/'+t.getDate()+' '+t.getHours()+'时'}</span>
            ${gapStr ? `<span style="font-size:11px;color:#4facfe;margin-left:12px">← 间隔 ${gapStr}</span>` : ''}
          </div>
          ${e.note ? `<div style="font-size:13px;color:#333;margin-left:32px;white-space:pre-wrap;word-break:break-word">${escapeHtml(e.note)}</div>` : '<div style="font-size:12px;color:#ccc;margin-left:32px">无备注</div>'}
          <div class="memo-actions" style="margin-top:6px;margin-left:8px">
            <button onclick="startEditPeriodic(${e.id})">✏ 编辑</button>
            <button class="memo-del-btn" onclick="deletePeriodicEntry(${e.id})">🗑 删除</button>
          </div>
        `;
      }
      listEl.appendChild(li);
    });
  }
}

function cleanupPeriodicTimer() {
  if (periodicTimer) { clearInterval(periodicTimer); periodicTimer = null; }
}

