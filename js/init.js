// ===================== 启动初始化 =====================

function init() {
  const curr = getCurrentYearMonth();
  viewYear = curr.year;
  viewMonth = curr.month;

  const hasData = loadData();
  if (!hasData) {
    migrateOldData();
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
    }
  }

  // 修复旧数据中可能缺失的 background 字段
  let needsSave = false;
  appData.books.forEach(b => {
    if (!b.background || !b.background.type) {
      b.background = { type: 'color', value: COLOR_PRESETS[0] };
      needsSave = true;
    }
  });
  if (needsSave) saveData();

  render();
  document.getElementById('amountInput').focus();

  // Enter 提交：只在单行输入框生效，textarea 不拦截
  document.getElementById('itemInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); addRecord(); }
  });
  document.getElementById('amountInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); addRecord(); }
  });
  document.getElementById('memoTitleInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); addMemo(); }
  });
  document.getElementById('anniNameInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); addAnniversary(); }
  });
  document.getElementById('anniDateInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); addAnniversary(); }
  });
}

init();

// PWA Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
