const viewport = document.querySelector('#viewport');
const stage = document.querySelector('#stage-frame');
const slides = Array.from(document.querySelectorAll('.slide'));
const previous = document.querySelector('#prev');
const next = document.querySelector('#next');
const counter = document.querySelector('#slide-counter');
const fullscreen = document.querySelector('#fullscreen');
const notes = document.querySelector('#notes');
const notesOpen = document.querySelector('#notes-open');
const notesTitle = document.querySelector('#notes-title');
const notesTime = document.querySelector('#notes-time');
const notesContent = document.querySelector('#notes-content');
const languageButtons = Array.from(document.querySelectorAll('[data-language]'));

let activeSlide = 0;
let noteLanguage = 'both';

function fitStage() {
  const padding = getComputedStyle(viewport);
  const width = viewport.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight);
  const height = viewport.clientHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom);
  const scale = Math.max(0, Math.min(width / 1280, height / 720));
  stage.style.setProperty('--scale', scale);
  stage.style.setProperty('--fit-width', `${1280 * scale}px`);
  stage.style.setProperty('--fit-height', `${720 * scale}px`);
}

function showSlideFromHash() {
  const match = /^#slide-(\d+)$/.exec(window.location.hash);
  activeSlide = match ? Math.min(slides.length, Math.max(1, Number(match[1]))) - 1 : 0;
  slides.forEach((slide, index) => { slide.hidden = index !== activeSlide; });
  counter.textContent = `${activeSlide + 1} / ${slides.length}`;
  previous.disabled = activeSlide === 0;
  next.disabled = activeSlide === slides.length - 1;
  viewport.scrollTop = 0;
  if (notes.open) renderNotes();
}

function goTo(index) {
  if (index >= 0 && index < slides.length && index !== activeSlide) {
    window.location.hash = slides[index].id;
  }
}

const extraNotes = {
  'slide-3': {
    en: 'Spades details · Place 3–5 to start a shield. If only 1–2 remain, you may add 1–2. Your 0–5 spend limit includes new Spades. On attack, you can spend up to the lower of that limit and the Spades available. Spending one or two blocks one or two damage. Unused blocking power from spent Spades expires.',
    zh: '黑桃细则 · 首次放 3–5 张，桌上只剩 1–2 张时可补 1–2 张。消耗上限为 0–5 张，包括本轮新放的黑桃。受击时，实际消耗受上限和场上可用张数限制。用 1 张挡 1 点，用 2 张挡 2 点。已消耗黑桃的多余格挡值作废。',
  },
  'slide-4': {
    en: 'The bonus goes to the first valid play successfully confirmed by the server. An unused Defense bonus expires at the end of the round. Invalid plays cannot be confirmed.',
    zh: '奖励由服务器成功确认合法出牌的顺序决定。黑桃奖励当轮未用于格挡即失效。非法出牌无法确认。',
  },
  'slide-6': {
    en: 'Online version · Each device shows only its player’s hand. Refreshing restores the player’s choice and confirmation. The reveal lasts 3 seconds and the result animation lasts 4 seconds.',
    zh: '线上版 · 各设备只显示自己的手牌，刷新后恢复已选内容与确认状态。揭示展示 3 秒，结算动画 4 秒。',
  },
};

function renderNotes() {
  const entry = window.suitDuelNotes[activeSlide];
  notesTitle.textContent = entry.title;
  notesTime.textContent = entry.time;
  notesContent.lang = noteLanguage === 'zh' ? 'zh-CN' : 'en';
  notesContent.replaceChildren();
  languageButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === noteLanguage));
  });

  const languages = noteLanguage === 'both' ? ['en', 'zh'] : [noteLanguage];
  entry.segments.forEach((segment) => {
    const pair = document.createElement('div');
    pair.className = segment.kind === 'cue' ? 'note-pair cue' : 'note-pair';
    languages.forEach((language) => {
      const paragraph = document.createElement('p');
      paragraph.lang = language === 'zh' ? 'zh-CN' : 'en';
      paragraph.textContent = segment[language];
      pair.append(paragraph);
    });
    notesContent.append(pair);
  });

  const detail = extraNotes[slides[activeSlide].id];
  if (detail) {
    const reference = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = noteLanguage === 'zh' ? '规则备查' : 'Rule reference';
    const aside = document.createElement('aside');
    languages.forEach((language) => {
      const paragraph = document.createElement('p');
      paragraph.lang = language === 'zh' ? 'zh-CN' : 'en';
      paragraph.textContent = detail[language];
      aside.append(paragraph);
    });
    reference.append(summary, aside);
    notesContent.append(reference);
  }
}

function toggleFullscreen() {
  const request = document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen();
  request.catch(() => fullscreen.blur());
}

const demo = document.querySelector('#slide-5');
const demoButton = document.querySelector('#demo-advance');
const demoHp = document.querySelector('#demo-hp');
const demoStatus = document.querySelector('#demo-status');
const demoSteps = [
  { action: 'Reveal cards', status: 'All three players lock in their choices.', hp: '10', icon: '→' },
  { action: 'Resolve round', status: 'All plays are revealed. Place B’s new shield first.', hp: '10', icon: '→' },
  { action: 'Replay round', status: 'A deals 5 damage. B blocks 3. C saves a boost.', hp: '10 → 8', icon: '↻' },
];

function showDemoStep(step) {
  demo.dataset.phase = step;
  demo.querySelectorAll('.demo-hidden').forEach((element) => { element.hidden = step > 0; });
  demo.querySelectorAll('.demo-open').forEach((element) => { element.hidden = step === 0; });
  demo.querySelectorAll('.demo-result').forEach((element) => { element.hidden = step < 2; });
  const { action, status, hp, icon } = demoSteps[step];
  demoButton.firstChild.textContent = `${action} `;
  demoButton.querySelector('span').textContent = icon;
  demoHp.textContent = hp;
  demoStatus.textContent = status;
}

previous.addEventListener('click', () => goTo(activeSlide - 1));
next.addEventListener('click', () => goTo(activeSlide + 1));
window.addEventListener('hashchange', showSlideFromHash);
new ResizeObserver(fitStage).observe(viewport);

demoButton.addEventListener('click', () => {
  showDemoStep((Number(demo.dataset.phase) + 1) % demoSteps.length);
});

notesOpen.addEventListener('click', () => {
  renderNotes();
  notes.showModal();
});
notes.addEventListener('close', () => notesOpen.focus());
languageButtons.forEach((button) => {
  button.addEventListener('click', () => {
    noteLanguage = button.dataset.language;
    renderNotes();
  });
});

fullscreen.disabled = !document.fullscreenEnabled;
fullscreen.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => {
  fullscreen.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
  fitStage();
});

document.addEventListener('keydown', (event) => {
  if (notes.open || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;

  switch (event.key) {
    case 'ArrowLeft':
    case 'PageUp':
      event.preventDefault();
      goTo(activeSlide - 1);
      break;
    case 'ArrowRight':
    case 'PageDown':
      event.preventDefault();
      goTo(activeSlide + 1);
      break;
    case ' ':
      if (event.target.closest('button, a')) break;
      event.preventDefault();
      goTo(activeSlide + 1);
      break;
    case 'Home':
      event.preventDefault();
      goTo(0);
      break;
    case 'End':
      event.preventDefault();
      goTo(slides.length - 1);
      break;
    case 'f':
    case 'F':
      if (!fullscreen.disabled) toggleFullscreen();
      break;
  }
});

showSlideFromHash();
fitStage();
