// SoccerWork — interações da landing

const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mouse = window.matchMedia('(pointer: fine)').matches;

// Vídeos hospedados junto com o site (baixados do Wix em 720p)
const VIDEOS = {
  demo: 'apresentacao',
  antonio: 'antonio-junior',
  eduardo: 'eduardo-oliveira',
  jose: 'jose-lummertz',
  thiago: 'thiago-ziemmer',
  mauro: 'mauro-mazoni',
  johnatan: 'johnatan-silva',
};
const urlVideo = (nome) => `videos/${nome}.mp4`;

// ---------- topo ----------
const topo = document.getElementById('topo');
const limiteTopo = Number(topo.dataset.limite || 24);
const marcarTopo = () => topo.classList.toggle('rolou', window.scrollY > limiteTopo);
marcarTopo();
window.addEventListener('scroll', marcarTopo, { passive: true });

// ---------- hero: profundidade dos quadros seguindo o mouse ----------
const palco = document.getElementById('palco');
if (palco && !reduzir && mouse) {
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

// ---------- números: cursor de célula que percorre a planilha ----------
const planilha = document.getElementById('planilha');
if (planilha) {
  const linhas = [...planilha.querySelectorAll('.pl-linha[data-fx]')];
  const ref = document.getElementById('pl-ref');
  const conteudo = document.getElementById('pl-conteudo');
  const cursor = planilha.querySelector('.pl-cursor');
  let fixa = 0;
  let ativa = 0;
  const posicionar = () => {
    const c = linhas[ativa].querySelector('dd').getBoundingClientRect();
    const p = planilha.getBoundingClientRect();
    Object.assign(cursor.style, { top: `${c.top - p.top}px`, left: `${c.left - p.left}px`, width: `${c.width}px`, height: `${c.height}px` });
  };
  const marcar = (i) => {
    ativa = i;
    linhas.forEach((l, j) => l.classList.toggle('ativa', j === i));
    ref.textContent = `B${i + 2}`;
    conteudo.textContent = linhas[i].dataset.fx;
    posicionar();
  };
  marcar(0);
  window.addEventListener('resize', posicionar);
  document.fonts?.ready.then(posicionar);
  window.addEventListener('load', posicionar);
  linhas.forEach((l, i) => l.addEventListener('pointerenter', () => marcar(i)));
  planilha.addEventListener('pointerleave', () => marcar(fixa));
  // ao aparecer na tela, o cursor desce uma vez pelas linhas e volta à primeira
  if (!reduzir && 'IntersectionObserver' in window) {
    const obsPl = new IntersectionObserver(([ent]) => {
      if (!ent.isIntersecting) return;
      obsPl.disconnect();
      [...linhas.keys(), 0].forEach((i, n) => setTimeout(() => { if (!planilha.matches(':hover')) marcar(i); }, 700 + n * 650));
    }, { threshold: .6 });
    obsPl.observe(planilha);
  }
}

// ---------- visualizador de imagens (planilhas e relatórios) ----------
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
const lbTitulo = lb.querySelector('figcaption strong');
const lbTexto = lb.querySelector('figcaption span');
let grupo = [];
let atual = 0;
function mostrar(i) {
  atual = (i + grupo.length) % grupo.length;
  const it = grupo[atual];
  lbImg.src = it.src;
  lbImg.alt = it.titulo;
  lbTitulo.textContent = it.titulo;
  lbTexto.textContent = it.texto;
}
function abrirLb(itens, i) {
  grupo = itens;
  mostrar(i);
  lb.showModal();
}
lb.querySelectorAll('[data-lb]').forEach((b) => b.addEventListener('click', () => mostrar(atual + Number(b.dataset.lb))));
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') mostrar(atual + 1);
  if (e.key === 'ArrowLeft') mostrar(atual - 1);
});

// ---------- ferramentas: filtro por área + vitrine com lupa ----------
const filtros = [...document.querySelectorAll('[data-filtro]')];
const itensFerr = [...document.querySelectorAll('#ferr li')];
const nomeFiltro = document.getElementById('nome-filtro');
const listaFerr = document.getElementById('ferr');
const vitFoto = document.getElementById('vit-foto');
const vitTitulo = document.getElementById('vit-titulo');
const vitDesc = document.getElementById('vit-desc');
const vitContador = document.getElementById('vit-contador');
const vitAbrir = document.getElementById('vit-abrir');
const lupa = vitAbrir.querySelector('.vit-lupa');
let vitVisiveis = [];
let vitIndice = 0;

const dadosItem = (li) => {
  const b = li.querySelector('button');
  return { src: b.dataset.src, titulo: b.querySelector('strong').textContent, texto: b.querySelector('.desc').textContent };
};
function mostrarVit(i) {
  vitIndice = (i + vitVisiveis.length) % vitVisiveis.length;
  const li = vitVisiveis[vitIndice];
  const d = dadosItem(li);
  vitFoto.src = d.src;
  vitFoto.alt = `Planilha ${d.titulo}`;
  vitTitulo.textContent = d.titulo;
  vitDesc.textContent = d.texto;
  vitContador.textContent = `${vitIndice + 1} de ${vitVisiveis.length}`;
  itensFerr.forEach((x) => x.querySelector('button').setAttribute('aria-pressed', x === li));
  // mantém o item escolhido visível na lista, sem rolar a página
  const b = li.querySelector('button');
  const topoLi = b.offsetTop; // a lista é position: relative
  if (topoLi < listaFerr.scrollTop || topoLi + b.offsetHeight > listaFerr.scrollTop + listaFerr.clientHeight) {
    listaFerr.scrollTo({ top: topoLi - 8, behavior: reduzir ? 'auto' : 'smooth' });
  }
}
function filtrar(botao) {
  const cat = botao.dataset.filtro;
  filtros.forEach((b) => b.setAttribute('aria-pressed', b === botao));
  itensFerr.forEach((li) => { li.hidden = cat !== 'todas' && li.dataset.cat !== cat; });
  vitVisiveis = itensFerr.filter((li) => !li.hidden);
  nomeFiltro.textContent = botao.querySelector('strong').textContent;
  listaFerr.scrollTo({ top: 0 });
  mostrarVit(0);
}
filtros.forEach((b) => b.addEventListener('click', () => filtrar(b)));
itensFerr.forEach((li) => li.querySelector('button').addEventListener('click', () => mostrarVit(vitVisiveis.indexOf(li))));
document.querySelectorAll('[data-vit]').forEach((b) => b.addEventListener('click', () => mostrarVit(vitIndice + Number(b.dataset.vit))));
vitAbrir.addEventListener('click', () => abrirLb(vitVisiveis.map(dadosItem), vitIndice));
filtrar(filtros[0]);

// lupa: amplia o trecho sob o cursor (fundo em CSS, não é imagem salvável)
if (mouse) {
  const ZOOM = 2.4;
  vitAbrir.addEventListener('pointermove', (e) => {
    const r = vitFoto.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const m = lupa.offsetWidth / 2;
    lupa.style.backgroundImage = `url("${vitFoto.getAttribute('src')}")`;
    lupa.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
    lupa.style.backgroundPosition = `${m - x * ZOOM}px ${m - y * ZOOM}px`;
    lupa.style.translate = `${x - m}px ${y - m}px`;
    vitAbrir.classList.add('com-lupa');
  });
  vitAbrir.addEventListener('pointerleave', () => vitAbrir.classList.remove('com-lupa'));
}

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

const dadosCf = cfItens.map((li) => ({
  src: li.querySelector('img').getAttribute('src'),
  titulo: li.querySelector('strong').textContent,
  texto: li.querySelector('span').textContent,
}));
cfItens.forEach((li, i) => {
  const b = li.querySelector('button');
  b.setAttribute('aria-label', `Ampliar relatório: ${dadosCf[i].titulo}`);
  // o relatório do centro abre; os laterais vêm para o centro
  b.addEventListener('click', () => (i === cfIndice ? abrirLb(dadosCf, i) : centralizar(i)));
});

// ---------- depoimentos: um em destaque, os outros na lista ----------
const depoVideo = document.getElementById('depo-video');
const depoCapa = document.getElementById('depo-capa');
const depoNome = document.getElementById('depo-nome');
const depoBotoes = [...document.querySelectorAll('[data-depo]')];
let depoAtual = depoBotoes[0];
function pararDepo() {
  depoVideo.pause();
  depoVideo.removeAttribute('src');
  depoVideo.load();
  depoCapa.hidden = false;
}
function tocarDepo() {
  depoVideo.src = urlVideo(VIDEOS[depoAtual.dataset.depo]);
  depoCapa.hidden = true;
  depoVideo.focus();
  depoVideo.play().catch(() => {});
}
function escolherDepo(b) {
  depoAtual = b;
  const nome = b.querySelector('strong').textContent;
  depoBotoes.forEach((x) => x.setAttribute('aria-pressed', x === b));
  depoNome.textContent = nome;
  depoCapa.querySelector('img').src = b.dataset.capa;
  depoCapa.setAttribute('aria-label', `Assistir ao depoimento de ${nome}`);
  pararDepo();
  tocarDepo();
}
depoBotoes.forEach((b) => b.addEventListener('click', () => escolherDepo(b)));
depoCapa.addEventListener('click', tocarDepo);

// ---------- player de vídeo (apresentação do sistema) ----------
const player = document.getElementById('player');
const video = player.querySelector('video');
document.querySelectorAll('[data-video]').forEach((b) => {
  b.addEventListener('click', () => {
    if (!depoVideo.paused) depoVideo.pause();
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

// ---------- imagens das planilhas: sem menu "salvar imagem" e sem arrastar ----------
const protegida = (e) => e.target instanceof Element && e.target.closest('[data-protegido]');
document.addEventListener('contextmenu', (e) => { if (protegida(e)) e.preventDefault(); });
document.addEventListener('dragstart', (e) => { if (protegida(e)) e.preventDefault(); });

// ---------- ano do rodapé ----------
document.querySelectorAll('[data-ano]').forEach((el) => { el.textContent = new Date().getFullYear(); });
