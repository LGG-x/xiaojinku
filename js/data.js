// ===================== 常量 & 全局状态 =====================
const STORAGE_KEY = 'accounting_books';          // 主存储 key
const OLD_STORAGE_KEY = 'accounting_book_records'; // 旧版兼容

const COLOR_PRESETS = [
  'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  '#4facfe',
  '#27ae60',
  '#e74c3c',
  '#8e44ad',
  '#2c3e50',
  '#f39c12'
];

let appData = { books: [], currentBookId: null, customEmojis: [], memoBooks: [], currentMemoBookId: null, anniversaries: [], anniBackground: 'linear-gradient(135deg, #667eea, #764ba2)', schedule: null, periodicBooks: [], currentPeriodicBookId: null };
let currentType = 'income';
let viewYear, viewMonth;
let selectedEmoji = '😊';
let currentIconMode = 'emoji'; // 'emoji' | 'photo'
let currentMode = 'book'; // 'book' | 'memo'
let editingMemoId = null; // 正在编辑的备忘录 ID
let currentSort = 'date-desc'; // 排序方式
let currentFilter = 'all'; // 筛选：all / income / expense
let editingRecordId = null; // 正在编辑的记录 ID
let selectMode = false; // 是否在选择导出模式
let selectedRecordIds = new Set(); // 选中的记录 ID
let viewAllMonths = false; // 显示全部日期

const DEFAULT_EMOJIS = [
  '💰','💸','😊','🍽','☕','🍕','🍔','🍜',
  '🚗','🚌','🚇','✈','🚲','⛽',
  '🛒','👗','👟','💄','🎁','📱',
  '🏠','💡','🔧','📺','🛏',
  '💊','🏥','💉','🩺',
  '📚','✏','🎓','💻',
  '🎮','🎬','🎵','🎸','⚽','🏀',
  '💼','📈','💵','🏦','💳',
  '🐱','🐶','🌿','🌈','❤','⭐','🔥','🎉'
];

function getAllEmojis() {
  return [...DEFAULT_EMOJIS, ...(appData.customEmojis || [])];
}

// ============ Emoji 选择器 ============

function toggleEmojiPopup(e) {
  e.stopPropagation();
  const existing = document.querySelector('.emoji-popup');
  if (existing) { existing.remove(); return; }

  const wrapper = document.querySelector('.emoji-wrapper');
  const allEmojis = getAllEmojis();
  const popup = document.createElement('div');
  popup.className = 'emoji-popup';
  popup.innerHTML = allEmojis.map(em =>
    `<span onclick="selectEmoji('${em}', event)">${em}</span>`
  ).join('') + `<span onclick="addCustomEmoji(event)" style="color:#4facfe;font-weight:bold;font-size:24px" title="添加自定义图标">＋</span>`;
  wrapper.appendChild(popup);

  setTimeout(() => {
    document.addEventListener('click', function closeEmoji() {
      popup.remove();
      document.removeEventListener('click', closeEmoji);
    }, { once: true });
  }, 0);
}

function selectEmoji(emoji, e) {
  e.stopPropagation();
  selectedEmoji = emoji;
  const btn = document.getElementById('emojiBtn');
  btn.textContent = emoji;
  btn.classList.add('has-icon');
  document.querySelector('.emoji-popup')?.remove();
}

function addCustomEmoji(e) {
  e.stopPropagation();
  const input = prompt('输入或粘贴一个 emoji：');
  if (!input || !input.trim()) return;

  const emoji = input.trim();
  // 取第一个字符（支持多字节 emoji）
  const firstEmoji = [...emoji][0];
  if (!firstEmoji) return;

  if (!appData.customEmojis) appData.customEmojis = [];
  if (getAllEmojis().includes(firstEmoji)) {
    // 已存在，直接选中
    selectEmoji(firstEmoji, e);
    return;
  }

  appData.customEmojis.push(firstEmoji);
  saveData();
  selectEmoji(firstEmoji, e);

  // 重建弹窗
  document.querySelector('.emoji-popup')?.remove();
  const wrapper = document.querySelector('.emoji-wrapper');
  const allEmojis = getAllEmojis();
  const popup = document.createElement('div');
  popup.className = 'emoji-popup';
  popup.innerHTML = allEmojis.map(em =>
    `<span onclick="selectEmoji('${em}', event)">${em}</span>`
  ).join('') + `<span onclick="addCustomEmoji(event)" style="color:#4facfe;font-weight:bold;font-size:24px" title="添加自定义图标">＋</span>`;
  wrapper.appendChild(popup);

  setTimeout(() => {
    document.addEventListener('click', function closeEmoji() {
      popup.remove();
      document.removeEventListener('click', closeEmoji);
    }, { once: true });
  }, 0);
}

// 切换图标模式：emoji / 照片
function switchIconMode(mode) {
  currentIconMode = mode;
  const wrapper = document.getElementById('emojiWrapper');
  const photoInput = document.getElementById('photoUrlInput');
  const toggleEmoji = document.getElementById('modeToggleEmoji');
  const togglePhoto = document.getElementById('modeTogglePhoto');

  if (mode === 'emoji') {
    wrapper.style.display = 'block';
    photoInput.style.display = 'none';
    toggleEmoji.classList.add('active');
    togglePhoto.classList.remove('active');
  } else {
    wrapper.style.display = 'none';
    photoInput.style.display = 'block';
    togglePhoto.classList.add('active');
    toggleEmoji.classList.remove('active');
    photoInput.focus();
  }
}

