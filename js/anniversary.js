// ============ 纪念日 ============

function addAnniversary() {
  const nameEl = document.getElementById('anniNameInput');
  const dateEl = document.getElementById('anniDateInput');
  const name = nameEl.value.trim();
  if (!name) { nameEl.focus(); return; }
  if (!dateEl.value) { dateEl.focus(); return; }

  if (!appData.anniversaries) appData.anniversaries = [];
  appData.anniversaries.push({
    id: Date.now(),
    name: name.substring(0, 30),
    date: dateEl.value,
    note: '',
    createdAt: new Date().toISOString()
  });

  nameEl.value = '';
  dateEl.value = '';
  saveData();
  renderAnnis();
}

let currentAnniSub = 'anni';
let calYear, calMonth;

// 节日数据（公历节日 + 农历节日近似日期 2026）
const FESTIVALS_2026 = {
  '01-01': '元旦 🎉', '01-05': '小寒', '01-20': '大寒',
  '02-03': '立春', '02-14': '情人节 💕', '02-17': '春节 🧧', '02-18': '雨水',
  '03-05': '惊蛰', '03-08': '妇女节 👩', '03-20': '春分',
  '04-05': '清明节 🌿', '04-20': '谷雨',
  '05-01': '劳动节 🏖', '05-04': '青年节', '05-05': '立夏', '05-10': '母亲节 💐', '05-21': '小满',
  '06-01': '儿童节 🎈', '06-05': '芒种', '06-19': '端午节 🎋', '06-21': '父亲节 👨', '06-21': '夏至',
  '07-01': '建党节', '07-07': '小暑', '07-22': '大暑',
  '08-01': '建军节', '08-07': '立秋', '08-23': '处暑', '08-29': '七夕 💫',
  '09-07': '白露', '09-10': '教师节 📚', '09-23': '秋分', '09-25': '中秋节 🥮',
  '10-01': '国庆节 🇨🇳', '10-03': '中秋节 🥮', '10-08': '寒露', '10-23': '霜降',
  '11-07': '立冬', '11-22': '小雪', '11-26': '感恩节 🦃',
  '12-07': '大雪', '12-21': '冬至 🥟', '12-25': '圣诞节 🎄'
};

function changeCalMonth(delta) {
  calMonth += delta;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function showCalPicker() {
  const existing = document.querySelector('.picker-overlay');
  if (existing) existing.remove();
  const curr = new Date();
  const endYear = curr.getFullYear() + 1;

  const yearOpts = [];
  for (let y = 2020; y <= endYear; y++) {
    const sel = y === calYear ? ' selected' : '';
    yearOpts.push(`<option value="${y}"${sel}>${y} 年</option>`);
  }
  const monthOpts = [];
  for (let m = 0; m < 12; m++) {
    const sel = m === calMonth ? ' selected' : '';
    monthOpts.push(`<option value="${m}"${sel}>${m + 1} 月</option>`);
  }

  const overlay = document.createElement('div');
  overlay.className = 'picker-overlay';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="picker-panel" onclick="event.stopPropagation()">
      <h3>📅 选择年月</h3>
      <div class="picker-row">
        <select id="calPickerYear">${yearOpts.join('')}</select>
        <select id="calPickerMonth">${monthOpts.join('')}</select>
      </div>
      <div class="picker-actions">
        <button class="btn-cancel" onclick="closeCalPicker()">关闭</button>
        <button class="btn-confirm" onclick="confirmCalPicker()">跳转</button>
      </div>
    </div>
  `;
  const onKey = (e) => {
    if (e.key === 'Escape') closeCalPicker();
    if (e.key === 'Enter') confirmCalPicker();
  };
  document.addEventListener('keydown', onKey, { once: false });
  overlay._removeKeyHandler = () => document.removeEventListener('keydown', onKey);
  overlay.addEventListener('click', closeCalPicker);
  document.body.appendChild(overlay);
}

function closeCalPicker() {
  const overlay = document.querySelector('.picker-overlay');
  if (overlay) {
    if (overlay._removeKeyHandler) overlay._removeKeyHandler();
    overlay.remove();
  }
}

function confirmCalPicker() {
  const yEl = document.getElementById('calPickerYear');
  const mEl = document.getElementById('calPickerMonth');
  if (yEl && mEl) {
    calYear = parseInt(yEl.value);
    calMonth = parseInt(mEl.value);
  }
  closeCalPicker();
  renderCalendar();
}

function renderCalendar() {
  document.getElementById('calTitle').textContent = calYear + ' 年 ' + (calMonth + 1) + ' 月';

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  // 空白格子
  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement('div'));
  }

  // 日期格子
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    const isToday = calYear === today.getFullYear() && calMonth === today.getMonth() && d === today.getDate();
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const key = mm + '-' + dd;
    const hasFestival = FESTIVALS_2026[key];

    cell.style.padding = '2px 0';
    cell.style.fontSize = '14px';
    cell.style.borderRadius = '6px';
    cell.style.height = '42px';
    cell.style.display = 'flex';
    cell.style.flexDirection = 'column';
    cell.style.alignItems = 'center';
    cell.style.justifyContent = 'center';
    cell.style.overflow = 'hidden';
    if (isToday) cell.style.background = '#4facfe';
    cell.style.color = isToday ? '#fff' : '#333';
    cell.style.fontWeight = isToday ? '700' : '400';
    cell.style.cursor = 'default';
    cell.title = hasFestival || '';

    const dayOfWeek = new Date(calYear, calMonth, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = hasFestival && (hasFestival.includes('节') || hasFestival.includes('🎉') || hasFestival.includes('🧧') || hasFestival.includes('🌿') || hasFestival.includes('🏖') || hasFestival.includes('🎋') || hasFestival.includes('🥮') || hasFestival.includes('🇨🇳'));
    const showRest = isWeekend || isHoliday;
    const restBadge = showRest ? '<span style="position:absolute;top:1px;right:3px;font-size:8px;color:#4facfe;font-weight:600">休</span>' : '';
    const festText = hasFestival ? '<div style="font-size:8px;color:' + (isToday ? '#fff' : '#f7971e') + ';white-space:nowrap;overflow:hidden">' + hasFestival.replace(/[^一-龥]/g,'').substring(0,2) + '</div>' : '';

    cell.style.position = 'relative';
    cell.innerHTML = restBadge + d + festText;
    grid.appendChild(cell);
  }

  // 当月节日列表
  const festDiv = document.getElementById('calFestivals');
  const monthKey = String(calMonth + 1).padStart(2, '0');
  const monthFests = Object.entries(FESTIVALS_2026).filter(([k]) => k.startsWith(monthKey));
  if (monthFests.length > 0) {
    festDiv.innerHTML = monthFests.map(([k, v]) => {
      const targetDate = new Date(calYear, calMonth, parseInt(k.split('-')[1]));
      const daysUntil = getDaysUntil(targetDate.toISOString().substring(0, 10));
      return { k, v, daysUntil };
    }).sort((a, b) => a.daysUntil - b.daysUntil).map(({ k, v, daysUntil }) => {
      const badge = daysUntil === 0 ? '🎉 今天' : daysUntil > 0 ? daysUntil + ' 天后' : '已过';
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:14px">
        <span>${v}</span><span style="color:#999">${k} · ${badge}</span></div>`;
    }).join('');
  } else {
    festDiv.innerHTML = '<div style="color:#bbb;font-size:13px;padding:8px 0">本月暂无节日</div>';
  }
}

function switchAnniSub(sub) {
  currentAnniSub = sub;
  document.querySelectorAll('[id^="anniSub"]').forEach(el => el.style.display = 'none');
  const target = document.getElementById('anniSub' + sub.charAt(0).toUpperCase() + sub.slice(1));
  if (target) target.style.display = '';
  document.querySelectorAll('.anni-nav-btn').forEach(b => {
    b.style.background = '#fff';
    b.style.color = '#4facfe';
    b.style.border = '1px solid #4facfe';
    b.style.fontWeight = 'normal';
  });
  const navBtn = document.getElementById('anniNav' + sub.charAt(0).toUpperCase() + sub.slice(1));
  if (navBtn) { navBtn.style.background = '#4facfe'; navBtn.style.color = '#fff'; navBtn.style.border = '1px solid #4facfe'; navBtn.style.fontWeight = '600'; }

  if (sub === 'calendar') {
    if (!calYear) { const now = new Date(); calYear = now.getFullYear(); calMonth = now.getMonth(); }
    renderCalendar();
  }
  if (sub === 'schedule') {
    renderSchedule();
  }
  if (sub === 'periodic') {
    ensurePeriodicBook();
    updatePeriodicClock();
    renderPeriodicNotes();
    if (!periodicTimer) periodicTimer = setInterval(updatePeriodicClock, 1000);
  } else {
    cleanupPeriodicTimer();
  }
}

function deleteAnniversary(id) {
  if (!confirm('确定删除这个纪念日吗？')) return;
  appData.anniversaries = appData.anniversaries.filter(a => a.id !== id);
  saveData();
  renderAnnis();
}

function getDaysUntil(dateStr) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(dateStr + 'T00:00:00');
  // 今年的纪念日
  let thisYear = new Date(today.getFullYear(), target.getMonth(), target.getDate());
  if (thisYear < today) {
    // 已过，算明年的
    thisYear = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate());
  }
  return Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24));
}

function toggleAnniPin(id) {
  const a = appData.anniversaries.find(x => x.id === id);
  if (!a) return;
  a.pinned = !a.pinned;
  saveData();
  renderAnnis();
}

let editingAnniId = null;

function startEditAnni(id) {
  editingAnniId = id;
  renderAnnis();
}

function cancelEditAnni() {
  editingAnniId = null;
  renderAnnis();
}

function setAnniBgColor(value, el) {
  document.querySelectorAll('#anniBgEditor_' + editingAnniId + ' .memo-bg-dot').forEach(d => d.classList.remove('selected'));
  if (el) el.classList.add('selected');
  const imgInput = document.getElementById('editAnniBgImage_' + editingAnniId);
  if (imgInput) imgInput.value = '';
  // 暂存在 temp
  const a = appData.anniversaries.find(x => x.id === editingAnniId);
  if (a) a._tempBg = { type: 'color', value: value };
}

function clearAnniBg(id) {
  const a = appData.anniversaries.find(x => x.id === id);
  if (a) a._tempBg = null;
  document.querySelectorAll('#anniBgEditor_' + id + ' .memo-bg-dot').forEach(d => d.classList.remove('selected'));
  const clearBtn = document.querySelector('#anniBgEditor_' + id + ' .clear-bg');
  if (clearBtn) clearBtn.classList.add('selected');
}

function saveEditAnni(id) {
  const a = appData.anniversaries.find(x => x.id === id);
  if (!a) return;
  const nameEl = document.getElementById('editAnniName_' + id);
  const dateEl = document.getElementById('editAnniDate_' + id);
  const imgEl = document.getElementById('editAnniBgImage_' + id);
  if (nameEl) a.name = nameEl.value.trim().substring(0, 30) || a.name;
  if (dateEl) a.date = dateEl.value;
  if (a._tempBg !== undefined) { a.background = a._tempBg; delete a._tempBg; }
  else if (imgEl && imgEl.value.trim()) { a.background = { type: 'image', value: imgEl.value.trim() }; }
  editingAnniId = null;
  saveData();
  renderAnnis();
}

function renderAnnis() {
  const listEl = document.getElementById('anniList');
  const emptyEl = document.getElementById('anniEmpty');
  if (!appData.anniversaries) appData.anniversaries = [];

  const sorted = [...appData.anniversaries].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return getDaysUntil(a.date) - getDaysUntil(b.date);
  });

  listEl.innerHTML = '';
  if (sorted.length === 0) {
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
    sorted.forEach(a => {
      const days = getDaysUntil(a.date);
      const li = document.createElement('li');
      li.className = 'memo-item';
      li.style.position = 'relative';
      const isToday = days === 0;
      const badgeColor = isToday ? '#e74c3c' : days <= 7 ? '#f39c12' : '#4facfe';

      if (editingAnniId === a.id) {
        const bg = a.background || null;
        const bgColor = bg && bg.type === 'color' ? bg.value : '';
        const bgImage = bg && bg.type === 'image' ? bg.value : '';
        const bgDots = COLOR_PRESETS.map((val, i) => {
          const sel = bgColor === val ? ' selected' : '';
          return `<div class="memo-bg-dot${sel}" style="background:${val}" onclick="setAnniBgColor('${val.replace(/'/g, "\\'")}', this)" title="预设 ${i + 1}"></div>`;
        }).join('');

        li.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <input type="text" id="editAnniName_${a.id}" value="${escapeHtml(a.name)}" maxlength="30" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:14px;outline:none">
            <input type="date" id="editAnniDate_${a.id}" value="${a.date}" style="padding:8px;border:1px solid #ddd;border-radius:6px;font-size:14px;outline:none">
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <button class="memo-bg-toggle" onclick="document.getElementById('anniBgEditor_${a.id}').style.display=document.getElementById('anniBgEditor_${a.id}').style.display==='none'?'block':'none'">🎨 背景</button>
          </div>
          <div class="memo-bg-editor" id="anniBgEditor_${a.id}" style="display:none">
            <div style="font-size:11px;color:#888;margin-bottom:4px">选择颜色</div>
            <div class="memo-bg-row">${bgDots}<div class="memo-bg-dot clear-bg${!bg ? ' selected' : ''}" onclick="clearAnniBg(${a.id})" title="清除">✕</div></div>
            <div style="font-size:11px;color:#888;margin-top:6px;margin-bottom:2px">或图片链接</div>
            <input type="url" id="editAnniBgImage_${a.id}" placeholder="https://..." value="${escapeHtml(bgImage)}">
          </div>
          <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:8px">
            <button onclick="cancelEditAnni()" style="border:1px solid #e0e0e0;border-radius:6px;padding:4px 12px;cursor:pointer;background:#fafafa;font-size:12px;color:#666">取消</button>
            <button onclick="saveEditAnni(${a.id})" style="border:none;border-radius:6px;padding:4px 12px;cursor:pointer;background:#4facfe;color:#fff;font-size:12px;font-weight:500">保存</button>
          </div>
        `;
      } else {
        if (a.background) {
          if (a.background.type === 'image') li.style = 'background-image:url(' + escapeHtml(a.background.value) + ');background-size:cover;background-position:center;position:relative';
          else li.style = 'background:' + a.background.value + ';position:relative';
        }
        li.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600;font-size:15px">${escapeHtml(a.name)}</span>
            <span style="background:${badgeColor};color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap">${isToday ? '🎉 今天' : days + ' 天后'}</span>
          </div>
          <div style="font-size:12px;color:#999;margin-top:4px">${a.date.replace(/^(\d+)-(\d+)-(\d+)/, '$1年$2月$3日')}</div>
          <div class="memo-actions">
            <button onclick="startEditAnni(${a.id})">✏ 编辑</button>
            <button class="memo-del-btn" onclick="deleteAnniversary(${a.id})">🗑 删除</button>
          </div>
          <span onclick="toggleAnniPin(${a.id})" style="position:absolute;bottom:12px;right:12px;cursor:pointer;font-size:16px" title="${a.pinned ? '取消置顶' : '置顶'}">${a.pinned ? '📌' : '📍'}</span>
        `;
      }
      listEl.appendChild(li);
    });
  }
}

// 纪念日背景设置
let anniSettingsBgType = 'color';

function showAnniSettings() {
  if (currentMode !== 'anni') return;
  const bg = appData.anniBackground || 'linear-gradient(135deg, #f7971e, #ffd200)';
  const isImage = bg.startsWith('http://') || bg.startsWith('https://');
  anniSettingsBgType = isImage ? 'image' : 'color';

  const overlay = document.getElementById('anniSettingsOverlay');
  document.querySelectorAll('#anniBgTypeToggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === anniSettingsBgType);
  });
  document.getElementById('anniBgColorField').style.display = anniSettingsBgType === 'color' ? 'block' : 'none';
  document.getElementById('anniBgImageField').style.display = anniSettingsBgType === 'image' ? 'block' : 'none';

  if (anniSettingsBgType === 'color') {
    document.getElementById('anniBgCustom').value = isImage ? '' : bg;
  } else {
    document.getElementById('anniBgImage').value = isImage ? bg : '';
  }

  renderAnniColorPresets();
  overlay.style.display = 'flex';

  const onKey = (e) => { if (e.key === 'Escape') closeAnniSettings(); };
  document.addEventListener('keydown', onKey, { once: false });
  overlay._keyHandler = onKey;
}

function closeAnniSettings() {
  const overlay = document.getElementById('anniSettingsOverlay');
  overlay.style.display = 'none';
  if (overlay._keyHandler) {
    document.removeEventListener('keydown', overlay._keyHandler);
    overlay._keyHandler = null;
  }
}

function switchAnniBgTypeUI(type) {
  anniSettingsBgType = type;
  document.querySelectorAll('#anniBgTypeToggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  document.getElementById('anniBgColorField').style.display = type === 'color' ? 'block' : 'none';
  document.getElementById('anniBgImageField').style.display = type === 'image' ? 'block' : 'none';
}

function renderAnniColorPresets() {
  const container = document.getElementById('anniColorPresets');
  const curVal = document.getElementById('anniBgCustom').value;
  container.innerHTML = COLOR_PRESETS.map((val, i) => {
    const isSelected = curVal === val;
    return `<div class="color-preset${isSelected ? ' selected' : ''}"
      style="background:${val}"
      onclick="selectAnniColorPreset('${val.replace(/'/g, "\\'")}', this)"
      title="预设 ${i + 1}"></div>`;
  }).join('');
}

function selectAnniColorPreset(value, el) {
  document.getElementById('anniBgCustom').value = value;
  document.querySelectorAll('#anniColorPresets .color-preset').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
}

function saveAnniSettings() {
  let val;
  if (anniSettingsBgType === 'image') {
    val = document.getElementById('anniBgImage').value.trim();
    if (!val) { closeAnniSettings(); return; }
  } else {
    val = document.getElementById('anniBgCustom').value.trim();
    if (!val) { closeAnniSettings(); return; }
  }
  appData.anniBackground = val;
  const header = document.getElementById('appHeader');
  header.style.background = '';
  header.style.backgroundImage = '';
  if (anniSettingsBgType === 'image') {
    header.style.backgroundImage = `url(${val})`;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
  } else {
    header.style.background = val;
  }
  saveData();
  closeAnniSettings();
}

