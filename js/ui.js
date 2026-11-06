import { projects, planets } from './data.js';

const $ = (id) => document.getElementById(id);
let activePlanet = null;
let currentProjects = [];

function escapeHTML(value='') {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

export function initUI({ onSelectPlanet, onHome }) {
  const legend = $('legendItems');
  legend.innerHTML = planets.map(p => `
    <button class="legend-item" data-planet="${p.id}">
      <span class="legend-dot" style="color:${p.color};background:${p.color}"></span>
      <span class="legend-number">${p.number}</span><span>${escapeHTML(p.name)}</span><span class="legend-count">${p.count}</span>
    </button>`).join('');
  legend.addEventListener('click', e => {
    const button=e.target.closest('[data-planet]');
    if(button) onSelectPlanet(button.dataset.planet);
  });
  $('resetView').addEventListener('click',onHome);
  $('homeButton').addEventListener('click',e=>{e.preventDefault();onHome();});
  $('closePanel').addEventListener('click',closePlanet);
  $('planetPanel').addEventListener('click',e=>{if(e.target.matches('[data-close]'))closePlanet();});
  $('closeProject').addEventListener('click',closeProject);
  $('projectModal').addEventListener('click',e=>{if(e.target.matches('[data-project-close]'))closeProject();});
  $('projectSearch').addEventListener('input',renderProjects);
  $('yearFilter').addEventListener('change',renderProjects);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeProject();closePlanet();}});
  return { openPlanet, closePlanet };
}

export function openPlanet(planetId) {
  activePlanet=planets.find(p=>p.id===planetId);
  if(!activePlanet)return;
  currentProjects=projects.filter(p=>p.planet===planetId).sort((a,b)=>Number(b.year)-Number(a.year)||a.id.localeCompare(b.id));
  $('panelKicker').textContent=`PLANET ${activePlanet.number} / ${activePlanet.english}`;
  $('panelTitle').textContent=activePlanet.name;
  $('panelDescription').textContent=activePlanet.description;
  $('projectCount').textContent=`${currentProjects.length} PROJECTS`;
  const years=[...new Set(currentProjects.map(p=>p.year))].sort((a,b)=>Number(b)-Number(a));
  $('yearFilter').innerHTML='<option value="">全部年份</option>'+years.map(y=>`<option value="${escapeHTML(y)}">${escapeHTML(y)}</option>`).join('');
  $('projectSearch').value='';
  renderProjects();
  $('planetPanel').classList.add('is-open');
  $('planetPanel').setAttribute('aria-hidden','false');
}

function renderProjects() {
  const query=$('projectSearch').value.trim().toLowerCase();
  const year=$('yearFilter').value;
  const filtered=currentProjects.filter(p=>{
    const text=[p.id,p.name,p.year,...p.tag].join(' ').toLowerCase();
    return (!query||text.includes(query))&&(!year||p.year===year);
  });
  $('projectList').innerHTML=filtered.length?filtered.map(p=>`
    <button class="project-row" data-project="${p.id}">
      <span class="project-id">${p.id}</span>
      <span class="project-name">${escapeHTML(p.name)}</span>
      <span class="project-year">${escapeHTML(p.year)}</span>
      <span class="project-arrow">↗</span>
    </button>`).join(''):'<div class="empty-state">找不到符合條件的作品</div>';
  $('projectList').querySelectorAll('[data-project]').forEach(btn=>btn.addEventListener('click',()=>openProject(btn.dataset.project)));
}

function openProject(id) {
  const p=projects.find(item=>item.id===id);
  if(!p)return;
  $('detailKicker').textContent=`PROJECT / ${p.id}`;
  $('detailTitle').textContent=p.name;
  $('detailYear').textContent=`YEAR  ${p.year}     ·     ${p.photoNum} PHOTO${p.photoNum===1?'':'S'}`;
  $('detailTags').innerHTML=p.tag.map(tag=>`<span>${escapeHTML(tag)}</span>`).join('');

  // 截圖命名規則：img/原始ID/序號.png，例如 img/00001/1.png
  const gallery = $('detailGallery');
  const imageCount = Math.max(0, Number.parseInt(p.photoNum, 10) || 0);
  gallery.innerHTML = Array.from({ length: imageCount }, (_, index) => {
    const filename = `${index + 1}.png`;
    const relativePath = `img/${p.id}/${filename}`;
    const src = `./${relativePath}`;
    return `<figure>
      <img src="${src}" alt="${escapeHTML(p.name)} 網站截圖 ${index + 1}" loading="lazy">
      <figcaption>${escapeHTML(relativePath)}</figcaption>
    </figure>`;
  }).join('');

  gallery.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      const figure = img.closest('figure');
      if (figure) {
        const missing = document.createElement('div');
        missing.className = 'gallery-missing';
        missing.textContent = `尚未找到截圖\n請將圖片放入 img 資料夾：\n${img.getAttribute('src').replace('./', '')}`;
        figure.replaceChild(missing, img);
      }
    }, { once: true });
  });

  const link=$('detailLink');
  if(p.linkHref){
    link.href=p.linkHref;link.textContent='開啟作品網站 ↗';link.classList.remove('is-disabled');link.removeAttribute('aria-disabled');
  }else{
    link.href='#';link.textContent='尚無公開作品連結';link.classList.add('is-disabled');link.setAttribute('aria-disabled','true');
  }
  $('projectModal').classList.add('is-open');
  $('projectModal').setAttribute('aria-hidden','false');
}
function closeProject(){$('projectModal').classList.remove('is-open');$('projectModal').setAttribute('aria-hidden','true');}
function closePlanet(){$('planetPanel').classList.remove('is-open');$('planetPanel').setAttribute('aria-hidden','true');}
