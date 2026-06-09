// ============ 模式切换 ============

function switchMode(mode) {
  currentMode = mode;
  window.scrollTo(0, 0);
  const tabBook = document.getElementById('modeTabBook');
  const tabMemo = document.getElementById('modeTabMemo');
  const tabAnni = document.getElementById('modeTabAnni');
  const bookSections = document.getElementById('bookSections');
  const memoSec = document.getElementById('memoSection');
  const monthLabel = document.getElementById('monthLabel');
  const header = document.getElementById('appHeader');

  if (mode === 'book') {
    tabBook.classList.add('active');
    tabMemo.classList.remove('active');
    tabAnni.classList.remove('active');
    bookSections.style.display = '';
    document.getElementById('memoBookTabsBar').style.display = 'none';
    document.getElementById('memoMonthNav').style.display = 'none';
    document.getElementById('anniSection').style.display = 'none';
    document.getElementById('anniBottomNav').style.display = 'none';
    document.getElementById('anniSection').style.paddingBottom = '';
    memoSec.classList.remove('show');
    memoSec.style.display = 'none';
    document.body.style.background = '#e8f5e9';
    cleanupPeriodicTimer();
    render();
  } else if (mode === 'memo') {
    tabMemo.classList.add('active');
    tabBook.classList.remove('active');
    tabAnni.classList.remove('active');
    bookSections.style.display = 'none';
    document.getElementById('memoBookTabsBar').style.display = '';
    document.getElementById('memoMonthNav').style.display = '';
    document.getElementById('anniSection').style.display = 'none';
    memoSec.style.display = '';
    document.body.style.background = '#fce4ec';
    cleanupPeriodicTimer();
    ensureMemoBook();
    renderMemoHeader();
    renderMemoBookTabs();
    renderMonthNav();
    renderMemos();
  } else if (mode === 'anni') {
    tabAnni.classList.add('active');
    tabBook.classList.remove('active');
    tabMemo.classList.remove('active');
    bookSections.style.display = 'none';
    document.getElementById('memoBookTabsBar').style.display = 'none';
    document.getElementById('memoMonthNav').style.display = 'none';
    memoSec.classList.remove('show');
    memoSec.style.display = 'none';
    document.getElementById('anniSection').style.display = '';
    document.getElementById('anniBottomNav').style.display = 'flex';
    document.getElementById('anniSection').style.paddingBottom = '60px';
    document.body.style.background = '#e3f2fd';
    const header = document.getElementById('appHeader');
    const anniBg = appData.anniBackground || 'linear-gradient(135deg, #667eea, #764ba2)';
    header.style.backgroundImage = '';
    header.style.background = '';
    if (anniBg.startsWith('http://') || anniBg.startsWith('https://')) {
      header.style.backgroundImage = `url(${anniBg})`;
      header.style.backgroundSize = 'cover';
      header.style.backgroundPosition = 'center';
    } else {
      header.style.background = anniBg;
    }
    document.getElementById('bookTitle').innerHTML = '📅 纪念日 <span style="font-size:12px;opacity:0.7">⚙</span>';
    document.getElementById('bookTitle').onclick = showAnniSettings;
    document.getElementById('monthLabel').textContent = '';
    renderAnnis();
  }
}

