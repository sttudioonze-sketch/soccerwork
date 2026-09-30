// SoccerWork — interações da landing

const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Vídeos ainda hospedados no Wix (provisório: migrar para YouTube não listado)
const VIDEOS = {
  demo: 'c41eef_53eeab8515db46dba06353b1ca8d83d4',
  antonio: 'c41eef_e64cd2777ef04415ab0832e30cd77973',
  eduardo: 'c41eef_b0a43e95b46e4d79b39a0d1f659eb450',
  jose: 'c41eef_c9b4e51798214296abed505bedf0b8fc',
  thiago: 'c41eef_e081fce4bfd540caae91ebb420c7053b',
  mauro: 'c41eef_2e4a8bb2958c4e9ea9d099f6b1ab2310',
  johnatan: 'c41eef_22e99ddb01464867993c597b71aefeaa',
};
const urlVideo = (id) => `https://video.wixstatic.com/video/${id}/720p/mp4/file.mp4`;

// ---------- topo ----------
const topo = document.getElementById('topo');
const limiteTopo = Number(topo.dataset.limite || 24);
const marcarTopo = () => topo.classList.toggle('rolou', window.scrollY > limiteTopo);
marcarTopo();
window.addEventListener('scroll', marcarTopo, { passive: true });

// ---------- hero: profundidade dos quadros seguindo o mouse ----------
const palco = document.getElementById('palco');
if (palco && !reduzir && window.matchMedia('(pointer: fine)').matches) {
  let alvoX = 0, alvoY = 0, pendente = false;
  window.addEventListener('pointermove', (e) => {
    alvoX = (e.clientX / window.innerWidth) * 2 - 1;
    alvoY = (e.clientY / window.innerHeight) * 2 - 1;
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(() => {
      palco.style.setProperty('--px', alvoX.toFixed(3));
      palco.style.setProperty('--py', alvoY.toFixed(3));
      pendente = false;
    });
  }, { passive: true });
}

// ---------- luz que segue o cursor nos cartões de vidro ----------
document.querySelectorAll('[data-luz]').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// ---------- números que contam ----------
const contadores = document.querySelectorAll('[data-contar]');
if (!reduzir && 'IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((ent) => {
      if (!ent.isIntersecting) return;
      const el = ent.target;
      const fim = Number(el.dataset.contar);
      const inicio = performance.now();
      const passo = (t) => {
        const p = Math.min((t - inicio) / 1200, 1);
        el.textContent = Math.round(fim * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(passo);
      };
      el.textContent = '0';
      requestAnimationFrame(passo);
      // se a aba estiver em segundo plano o rAF para: garante o número final
      setTimeout(() => { el.textContent = fim; }, 1600);
      obs.unobserve(el);
    });
  }, { threshold: .6 });
  contadores.forEach((el) => obs.observe(el));
}

// ---------- carrosséis: setas e arrastar com o mouse ----------
function rolarCarrossel(lista, dir) {
  const item = [...lista.children].find((li) => !li.hidden);
  const passo = item ? item.getBoundingClientRect().width + 18 : lista.clientWidth * .8;
  const quantos = Math.max(1, Math.floor(lista.clientWidth / passo));
  lista.scrollBy({ left: dir * passo * quantos, behavior: reduzir ? 'auto' : 'smooth' });
}
document.querySelectorAll('[data-rolar]').forEach((b) => {
  b.addEventListener('click', () => rolarCarrossel(document.getElementById(b.dataset.rolar), Number(b.dataset.dir)));
});

let arrastou = false;
document.querySelectorAll('.carrossel').forEach((lista) => {
  let x0 = 0, s0 = 0, ativo = false;
  lista.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    ativo = true; arrastou = false; x0 = e.clientX; s0 = lista.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!ativo) return;
    const dx = e.clientX - x0;
    if (Math.abs(dx) > 5) { arrastou = true; lista.classList.add('arrastando'); }
    if (arrastou) lista.scrollLeft = s0 - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!ativo) return;
    ativo = false;
    lista.classList.remove('arrastando');
  });
  // clique depois de arrastar não abre o item
  lista.addEventListener('click', (e) => { if (arrastou) { e.stopPropagation(); e.preventDefault(); arrastou = false; } }, true);
});

// ---------- ferramentas: filtro por área ----------
const filtros = [...document.querySelectorAll('[data-filtro]')];
const itensFerr = [...document.querySelectorAll('#ferr li')];
const nomeFiltro = document.getElementById('nome-filtro');
const listaFerr = document.getElementById('ferr');
function filtrar(botao) {
  const cat = botao.dataset.filtro;
  filtros.forEach((b) => b.setAttribute('aria-pressed', b === botao));
  itensFerr.forEach((li) => { li.hidden = cat !== 'todas' && li.dataset.cat !== cat; });
  nomeFiltro.textContent = botao.querySelector('strong').textContent;
  listaFerr.scrollTo({ left: 0 });
}
filtros.forEach((b) => b.addEventListener('click', () => filtrar(b)));
filtrar(filtros[0]);

// ---------- relatórios: coverflow ----------
const cf = document.getElementById('cf');
const cfItens = [...cf.children];
const cfAtual = document.getElementById('cf-atual');
let cfIndice = 0;
function atualizarCf() {
  const centro = cf.scrollLeft + cf.clientWidth / 2;
  let menor = Infinity;
  cfItens.forEach((li, i) => {
    const meio = li.offsetLeft + li.offsetWidth / 2;
    const d = Math.max(-3, Math.min(3, (meio - centro) / (li.offsetWidth * .85)));
    li.style.setProperty('--d', d.toFixed(3));
    li.style.setProperty('--ad', Math.abs(d).toFixed(3));
    li.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
    if (Math.abs(d) < menor) { menor = Math.abs(d); cfIndice = i; }
  });
  cfAtual.textContent = cfIndice + 1;
}
function centralizar(i) {
  const li = cfItens[Math.max(0, Math.min(cfItens.length - 1, i))];
  cf.scrollTo({ left: li.offsetLeft - (cf.clientWidth - li.offsetWidth) / 2, behavior: reduzir ? 'auto' : 'smooth' });
}
let cfPendente = false;
cf.addEventListener('scroll', () => {
  if (cfPendente) return;
  cfPendente = true;
  requestAnimationFrame(() => { atualizarCf(); cfPendente = false; });
}, { passive: true });
window.addEventListener('resize', atualizarCf);
document.querySelectorAll('[data-cf]').forEach((b) => b.addEventListener('click', () => centralizar(cfIndice + Number(b.dataset.cf))));
atualizarCf();
centralizar(2);

// ---------- depoimentos: barra de progresso ----------
const depo = document.getElementById('depo');
const depoProg = document.getElementById('depo-prog');
function progressoDepo() {
  const max = depo.scrollWidth - depo.clientWidth;
  const visivel = depo.clientWidth / depo.scrollWidth;
  const pos = max > 0 ? depo.scrollLeft / max : 0;
  depoProg.style.width = `${Math.min(100, (visivel + (1 - visivel) * pos) * 100)}%`;
}
depo.addEventListener('scroll', progressoDepo, { passive: true });
window.addEventListener('resize', progressoDepo);
progressoDepo();

// ---------- visualizador de imagens ----------
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
const lbTitulo = lb.querySelector('figcaption strong');
const lbTexto = lb.querySelector('figcaption span');
let grupo = [];
let atual = 0;

function dadosDe(botao) {
  const img = botao.querySelector('img');
  const caixa = botao.closest('li');
  const titulo = (botao.querySelector('strong') || caixa.querySelector('strong')).textContent;
  const texto = (botao.querySelector('.desc') || caixa.querySelector('span')).textContent;
  return { src: img.getAttribute('src'), titulo, texto };
}
function mostrar(i) {
  atual = (i + grupo.length) % grupo.length;
  const it = dadosDe(grupo[atual]);
  lbImg.src = it.src;
  lbImg.alt = it.titulo;
  lbTitulo.textContent = it.titulo;
  lbTexto.textContent = it.texto;
}
function abrirLb(botao, lista) {
  grupo = lista;
  mostrar(lista.indexOf(botao));
  lb.showModal();
}
document.querySelectorAll('.card-ferr').forEach((b) => {
  b.setAttribute('aria-label', `Ampliar: ${b.querySelector('strong').textContent}`);
  b.addEventListener('click', () => {
    const visiveis = [...document.querySelectorAll('#ferr li:not([hidden]) .card-ferr')];
    abrirLb(b, visiveis);
  });
});
const botoesCf = cfItens.map((li) => li.querySelector('button'));
botoesCf.forEach((b, i) => {
  b.setAttribute('aria-label', `Ampliar relatório: ${cfItens[i].querySelector('strong').textContent}`);
  // o relatório do centro abre; os laterais vêm para o centro
  b.addEventListener('click', () => (i === cfIndice ? abrirLb(b, botoesCf) : centralizar(i)));
});
lb.querySelectorAll('[data-lb]').forEach((b) => b.addEventListener('click', () => mostrar(atual + Number(b.dataset.lb))));
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') mostrar(atual + 1);
  if (e.key === 'ArrowLeft') mostrar(atual - 1);
});

// ---------- player de vídeo ----------
const player = document.getElementById('player');
const video = player.querySelector('video');
document.querySelectorAll('[data-video]').forEach((b) => {
  b.addEventListener('click', () => {
    video.src = urlVideo(VIDEOS[b.dataset.video]);
    player.showModal();
    video.play().catch(() => {});
  });
});
player.addEventListener('close', () => { video.pause(); video.removeAttribute('src'); video.load(); });

// fechar diálogos: botão ou clique fora do conteúdo
document.querySelectorAll('dialog').forEach((d) => {
  d.querySelector('[data-fechar]').addEventListener('click', () => d.close());
  d.addEventListener('click', (e) => { if (e.target === d || e.target.tagName === 'FIGURE') d.close(); });
});

// ---------- ano do rodapé ----------
document.querySelectorAll('[data-ano]').forEach((el) => { el.textContent = new Date().getFullYear(); });
