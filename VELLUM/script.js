// ==========================================
// 1. ESTADO GLOBAL Y CONFIGURACIÓN
// ==========================================
window.myLibrary = JSON.parse(localStorage.getItem('myMangaCloud')) || [];
let rankMilestones = JSON.parse(localStorage.getItem('systemMilestones')) || {};
let dailyStreak = JSON.parse(localStorage.getItem('dailyStreak')) || { count: 0, lastDate: null };
let titulosObtenidos = JSON.parse(localStorage.getItem('titulosObtenidos')) || [];
// --- NUEVO: ESTADO MASCOTA ---
let petStatus = JSON.parse(localStorage.getItem('petStatus')) || { energy: 100, lastCheck: Date.now() };

let selectedImage = "";
let editingIndex = -1;
let lastRankName = null;

// ==========================================
// 2. SISTEMA DE AVATARS Y TAMAGOTCHI
// ==========================================
function actualizarVitalidad() {
    const ahora = Date.now();
    const horasTranscurridas = (ahora - petStatus.lastCheck) / (1000 * 60 * 60);
    
    if (horasTranscurridas >= 1) {
        petStatus.energy -= Math.floor(horasTranscurridas * 5);
        if (petStatus.energy < 0) petStatus.energy = 0;
        petStatus.lastCheck = ahora;
        localStorage.setItem('petStatus', JSON.stringify(petStatus));
    }

    const energyFill = document.getElementById('energy-fill');
    if (energyFill) {
        energyFill.style.width = `${petStatus.energy}%`;
        energyFill.style.backgroundColor = petStatus.energy < 30 ? "#ff4d4d" : "#4caf50";
    }
}

function alimentarMascota(capsLeidos) {
    petStatus.energy += (capsLeidos * 2);
    if (petStatus.energy > 100) petStatus.energy = 100;
    petStatus.lastCheck = Date.now();
    localStorage.setItem('petStatus', JSON.stringify(petStatus));
    actualizarAvatarMascota();
}

function actualizarAvatarMascota() {
    const avatarImg = document.getElementById('user-avatar');
    if (!avatarImg) return;

    const totalCaps = window.myLibrary.reduce((acc, m) => acc + (parseInt(m.current) || 0), 0);
    const totalXP = totalCaps + (dailyStreak.count * 10);
    const playerName = document.getElementById('player-name').innerText || 'Cazador';
    
    // Ropa según Rango
    let outfit = "none";
    if (totalXP >= 300) outfit = "shirt";
    if (totalXP >= 700) outfit = "tactical";
    if (totalXP >= 1500) outfit = "suit";
    if (totalXP >= 3000) outfit = "knightArmor";

    // Expresión según Vitalidad/Rango
    let eyes = "variant01";
    if (petStatus.energy < 30) eyes = "variant05"; // Triste
    else if (totalXP >= 3000) eyes = "variant10"; // Guerrero

    avatarImg.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${playerName}&extraTraits=${outfit}&eyes=${eyes}&backgroundColor=b6e3f4,c0aede`;
    
    // Aura Rango S
    const aura = document.getElementById('avatar-aura-effect');
    if (aura) {
        if (totalXP >= 3000) {
            aura.style.boxShadow = "0 0 20px #ffd700";
            aura.classList.add('pulse-animation');
        } else {
            aura.style.boxShadow = "none";
        }
    }
}

// ==========================================
// 3. CONTROL DE INTERFAZ Y FONDOS
// ==========================================
window.switchPane = (id) => {
    document.querySelectorAll('.pane').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const targetPane = document.getElementById('pane-' + id);
    if (targetPane) targetPane.classList.remove('hidden');
    
    const btn = document.getElementById('nav-' + id);
    if (btn) btn.classList.add('active');
    
    if (id === 'profile') {
        renderMilestones();
        renderizarHistorialTitulos();
        actualizarAvatarMascota();
        actualizarVitalidad();
    }
};

document.getElementById('bg-selector')?.addEventListener('change', (e) => {
    const bg = e.target.value;
    const backgrounds = {
        'sakura': "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2076')",
        'dungeon': "linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9)), url('https://images.unsplash.com/photo-1519074063912-ad2d6d51dd2d?q=80&w=1974')",
        'stars': "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=2050')",
        'none': "#0a0a0c"
    };
    document.body.style.background = backgrounds[bg] || backgrounds['none'];
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
});

// ==========================================
// 4. SISTEMA DE DETALLES Y EDICIÓN
// ==========================================
window.mostrarDetalles = (index) => {
    const m = window.myLibrary[index];
    const container = document.getElementById('detail-content');
    container.innerHTML = `
        <div class="detail-card-modern">
            <button class="close-detail-btn" onclick="window.cerrarDetalles()">✕</button>
            <div class="detail-grid">
                <div class="detail-img-side"><img src="${m.img}" onerror="this.src='https://via.placeholder.com/300x450'"></div>
                <div class="detail-info-side">
                    <div class="detail-header"><h2>${m.title}</h2></div>
                    <div class="detail-stats-row">
                        <div class="stat-box"><small>PROGRESO</small><span>${m.current} / ${m.total}</span></div>
                        <div class="stat-box"><small>NOTA</small><span>⭐ ${m.rating}</span></div>
                    </div>
                    <div class="detail-genres">${(m.genres || 'Sin géneros').split(',').map(g => `<span class="genre-pill">${g.trim()}</span>`).join('')}</div>
                    <button onclick="prepararEdicion(${index})" class="btn-edit">MODIFICAR REGISTRO</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('details-overlay').classList.remove('hidden');
};

window.cerrarDetalles = () => document.getElementById('details-overlay').classList.add('hidden');

window.prepararEdicion = (index) => {
    editingIndex = index;
    const m = window.myLibrary[index];
    document.getElementById('input-title').value = m.title;
    document.getElementById('input-current-cap').value = m.current;
    document.getElementById('input-total-cap').value = m.total;
    document.getElementById('input-genres').value = m.genres || "";
    document.getElementById('input-rating').value = m.rating || "";
    cerrarDetalles();
    document.getElementById('form-overlay').classList.remove('hidden');
};

// ==========================================
// 5. LÓGICA DE CLASES Y TÍTULOS
// ==========================================
const clasesInfo = {
    'ACCIÓN': { titulo: 'SOBERANO DE LA ACCIÓN', color: '#ff4d4d', icono: '⚔️' },
    'ROMANCE': { titulo: 'MAESTRO DEL ROMANCE', color: '#ff85a2', icono: '💖' },
    'FANTASÍA': { titulo: 'MONARCA DE LA FANTASÍA', color: '#a349eb', icono: '🪄' },
    'LEVELING': { titulo: 'EL QUE SUBE DE NIVEL SOLO', color: '#ffd700', icono: '👑' }
};

function actualizarTituloJugador() {
    if (window.myLibrary.length === 0) return;
    const conteoGeneros = {};
    window.myLibrary.forEach(m => {
        if (m.genres) {
            m.genres.split(',').forEach(g => {
                const gen = g.trim().toUpperCase();
                conteoGeneros[gen] = (conteoGeneros[gen] || 0) + 1;
            });
        }
    });
    let max = 0, dominante = "";
    for (const [gen, total] of Object.entries(conteoGeneros)) {
        if (total > max) { max = total; dominante = gen; }
    }
    const claseActual = clasesInfo[dominante] || { titulo: "CAZADOR MULTICLASE", color: "#00d4ff", icono: '🎖️' };
    if (!titulosObtenidos.includes(claseActual.titulo)) {
        mostrarPantallaLogro(claseActual);
        titulosObtenidos.push(claseActual.titulo);
        localStorage.setItem('titulosObtenidos', JSON.stringify(titulosObtenidos));
    }
    const tituloEl = document.getElementById('player-title');
    if (tituloEl) {
        tituloEl.innerText = claseActual.titulo;
        tituloEl.style.color = claseActual.color;
    }
}

function mostrarPantallaLogro(clase) {
    new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3').play().catch(()=>{});
    const div = document.createElement('div');
    div.className = 'achievement-popup';
    div.innerHTML = `<div class="achievement-inner" style="border-color:${clase.color}"><p>CLASE DESBLOQUEADA</p><h1>${clase.icono} ${clase.titulo}</h1><button onclick="this.parentElement.parentElement.remove()">CONTINUAR</button></div>`;
    document.body.appendChild(div);
}

// ==========================================
// 6. RENDER Y ESTADÍSTICAS
// ==========================================
window.render = (data = window.myLibrary) => {
    const container = document.getElementById('manhwa-display');
    if (!container) return;
    container.innerHTML = data.map((m, i) => `
        <div class="manhwa-card-modern" onclick="mostrarDetalles(${i})">
            <div class="card-img-wrapper">
                <img src="${m.img}" onerror="this.src='https://via.placeholder.com/150'">
                <div class="card-badge">CAP. ${m.current}</div>
            </div>
            <div class="card-info"><h3>${m.title}</h3><div class="card-stars">⭐ ${m.rating}</div></div>
        </div>
    `).join('');
};

function updateStats() {
    const totalCaps = window.myLibrary.reduce((acc, m) => acc + (parseInt(m.current) || 0), 0);
    const totalXP = totalCaps + (dailyStreak.count * 10);
    const nivel = Math.floor(totalXP / 100) + 1;
    const xpActual = totalXP % 100;

    // Sonido subida de nivel
    const nivelAnterior = parseInt(document.getElementById('user-level')?.innerText || 1);
    if (nivel > nivelAnterior) {
        const sounds = ['https://assets.mixkit.co/active_storage/sfx/1368/1368-preview.mp3', 'https://assets.mixkit.co/active_storage/sfx/1370/1370-preview.mp3'];
        new Audio(sounds[Math.floor(Math.random()*sounds.length)]).play().catch(()=>{});
    }

    if (document.getElementById('total-count-home')) document.getElementById('total-count-home').innerText = window.myLibrary.length;
    if (document.getElementById('user-level')) document.getElementById('user-level').innerText = nivel;
    if (document.getElementById('current-xp')) document.getElementById('current-xp').innerText = xpActual;
    if (document.getElementById('xp-fill')) document.getElementById('xp-fill').style.width = `${xpActual}%`;
    
    // Rango Nombre
    let rango = "RANGO E";
    if (totalCaps >= 100) rango = "RANGO D";
    if (totalCaps >= 300) rango = "RANGO C";
    if (totalCaps >= 700) rango = "RANGO B";
    if (totalCaps >= 1500) rango = "RANGO A";
    if (totalCaps >= 3000) rango = "RANGO S";
    if (document.getElementById('rank-display')) document.getElementById('rank-display').innerText = rango;

    actualizarTituloJugador();
    actualizarAvatarMascota();
}

// ==========================================
// 7. HISTORIAL Y LOGS (MILESTONES)
// ==========================================
function renderMilestones() {
    const container = document.getElementById('milestones-list');
    if (container) container.innerHTML = Object.entries(rankMilestones).map(([r, d]) => `<div class="milestone-item"><b>${r}</b><br><small>${d}</small></div>`).join('') || "Sin registros";
}
function renderizarHistorialTitulos() {
    const container = document.getElementById('titles-history-list');
    if (container) container.innerHTML = titulosObtenidos.map(t => `<div class="title-badge-item">${t}</div>`).join('') || "Sin títulos";
}

// ==========================================
// 8. INICIALIZACIÓN Y EVENTOS
// ==========================================
document.getElementById('open-form-btn')?.addEventListener('click', () => {
    editingIndex = -1;
    document.getElementById('input-title').value = "";
    document.getElementById('form-overlay').classList.remove('hidden');
});

document.getElementById('close-form')?.addEventListener('click', () => document.getElementById('form-overlay').classList.add('hidden'));

document.getElementById('input-file')?.addEventListener('change', function(e) {
    const reader = new FileReader();
    reader.onload = () => selectedImage = reader.result;
    if (e.target.files[0]) reader.readAsDataURL(e.target.files[0]);
});

document.getElementById('save-btn')?.addEventListener('click', async () => {
    const capsInput = parseInt(document.getElementById('input-current-cap').value) || 0;
    
    // Alimentar mascota
    if (editingIndex > -1) {
        const diff = capsInput - window.myLibrary[editingIndex].current;
        if (diff > 0) alimentarMascota(diff);
    } else {
        alimentarMascota(capsInput);
    }

    const item = {
        title: document.getElementById('input-title').value,
        current: capsInput,
        total: document.getElementById('input-total-cap').value,
        genres: document.getElementById('input-genres').value,
        rating: document.getElementById('input-rating').value,
        img: selectedImage || (editingIndex > -1 ? window.myLibrary[editingIndex].img : "")
    };

    if (editingIndex > -1) window.myLibrary[editingIndex] = item;
    else window.myLibrary.push(item);

    localStorage.setItem('myMangaCloud', JSON.stringify(window.myLibrary));
    if (window.subirALaNube) await window.subirALaNube(window.myLibrary);
    
    document.getElementById('form-overlay').classList.add('hidden');
    render();
    updateStats();
});

window.fusionarDatos = (datos) => {
    window.myLibrary = datos;
    render();
    updateStats();
};

window.onload = () => {
    actualizarVitalidad();
    render();
    updateStats();
    setTimeout(() => document.getElementById('splash-screen')?.classList.add('splash-hidden'), 2000);
};