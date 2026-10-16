/**
 * MOGGER GYM — Aplicação Web Profissional
 * Design System Shadcn/ui · Ícones Lucide Refinados · Supabase com Google Auth · Escala 125% · Responsivo
 */

const EXERCISE_SOURCE = 'https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/exercises.json';
const GIF_SOURCE = 'https://raw.githubusercontent.com/mohamedatef90/exercise-library/main/gifs/';
const SOURCE_PAGE = 'https://github.com/mohamedatef90/exercise-library';

// Ícones SVG do Google para o botão OAuth
const GOOGLE_ICON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
</svg>`;

// Constantes de fallback público para Supabase
const DEFAULT_SUPABASE_URL = '';
const DEFAULT_SUPABASE_ANON_KEY = '';

const state = {
  user: null,
  authProvider: 'local', // 'local' | 'supabase'
  authTab: 'login', // 'login' | 'register'
  supabaseUrl: '',
  supabaseAnonKey: '',
  supabaseClient: null,
  resolutionScale: localStorage.getItem('mogger_scale') || '125',
  page: 'dashboard',
  adminConfigured: true,
  workouts: [],
  logs: [],
  stats: {},
  users: [],
  exercises: [],
  exercisesReady: false,
  exerciseLoading: false,
  exerciseError: false,
  exerciseSearch: '',
  exerciseMuscle: 'all',
  exerciseEquipment: 'all',
  exerciseLimit: 18,
  draft: null,
  editingWorkoutId: null,
  pickerSearch: '',
  modal: null,
  userSearch: '',
};

const app = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const toastRegion = document.getElementById('toast-region');

// Mapeamento ampliado de ícones Lucide
const ICONS = {
  dashboard: 'layout-dashboard',
  workouts: 'dumbbell',
  library: 'book-open',
  history: 'history',
  users: 'users-round',
  settings: 'settings',
  logout: 'log-out',
  calendar: 'calendar-days',
  dumbbell: 'dumbbell',
  bolt: 'zap',
  zap: 'zap',
  medal: 'medal',
  timer: 'timer',
  arrow: 'arrow-up-right',
  plus: 'plus',
  check: 'check',
  shield: 'shield-check',
  search: 'search',
  target: 'target',
  activity: 'activity',
  heart: 'heart',
  menu: 'menu',
  sparkles: 'sparkles',
  flame: 'flame',
  trophy: 'trophy',
  trash: 'trash-2',
  edit: 'pencil',
  info: 'info',
  x: 'x',
  chevronRight: 'chevron-right',
  more: 'more-horizontal',
  refresh: 'rotate-cw',
  layers: 'layers',
};

const BODY_LABELS = {
  chest: 'Peito', back: 'Costas', shoulders: 'Ombros', 'upper arms': 'Braços',
  'lower arms': 'Antebraços', 'upper legs': 'Pernas', 'lower legs': 'Panturrilhas',
  waist: 'Abdômen', cardio: 'Cardio', neck: 'Pescoço', 'full body': 'Corpo inteiro',
};
const MUSCLE_LABELS = {
  abs: 'Abdômen', abdominals: 'Abdômen', biceps: 'Bíceps', triceps: 'Tríceps',
  chest: 'Peitoral', pectorals: 'Peitoral', lats: 'Costas', 'upper back': 'Costas',
  'lower back': 'Lombar', traps: 'Trapézio', trapezius: 'Trapézio', shoulders: 'Ombros',
  delts: 'Deltoides', quadriceps: 'Quadríceps', hamstrings: 'Posterior de coxa',
  glutes: 'Glúteos', calves: 'Panturrilhas', forearms: 'Antebraços', obliques: 'Oblíquos',
  'hip flexors': 'Flexores do quadril', adductors: 'Adutores', abductors: 'Abdutores',
  'serratus anterior': 'Serrátil anterior', 'spine erectors': 'Eretores da coluna',
};
const EQUIPMENT_LABELS = {
  'body weight': 'Peso corporal', barbell: 'Barra', dumbbell: 'Halteres', cable: 'Polia',
  'cable machine': 'Polia', machine: 'Máquina', kettlebell: 'Kettlebell', bench: 'Banco',
  'smith machine': 'Smith', band: 'Elástico', 'resistance band': 'Elástico', 'leverage machine': 'Máquina',
  'medicine ball': 'Bola medicinal', 'stability ball': 'Bola suíça', 'ez barbell': 'Barra EZ',
  'olympic barbell': 'Barra olímpica', rope: 'Corda', treadmill: 'Esteira', 'roller': 'Rolo',
};
const EXERCISE_TRANSLATIONS = {
  '3/4 sit-up': 'Abdominal 3/4', 'sit-up': 'Abdominal tradicional', 'crunch': 'Abdominal crunch',
  'plank': 'Prancha abdominal', 'side plank': 'Prancha lateral', 'push-up': 'Flexão de braço',
  'push up': 'Flexão de braço', 'wide grip push-up': 'Flexão com pegada aberta',
  'barbell bench press': 'Supino reto com barra', 'dumbbell bench press': 'Supino reto com halteres',
  'incline bench press': 'Supino inclinado', 'incline dumbbell bench press': 'Supino inclinado com halteres',
  'decline bench press': 'Supino declinado', 'chest fly': 'Crucifixo', 'dumbbell fly': 'Crucifixo com halteres',
  'cable crossover': 'Crossover na polia', 'barbell squat': 'Agachamento com barra', 'squat': 'Agachamento livre',
  'bodyweight squat': 'Agachamento livre', 'goblet squat': 'Agachamento goblet', 'front squat': 'Agachamento frontal',
  'barbell deadlift': 'Levantamento terra', 'deadlift': 'Levantamento terra', 'romanian deadlift': 'Terra romeno',
  'dumbbell romanian deadlift': 'Terra romeno com halteres', 'leg press': 'Leg press',
  'leg extension': 'Cadeira extensora', 'lying leg curl': 'Mesa flexora', 'seated leg curl': 'Cadeira flexora',
  'calf raise': 'Elevação de panturrilha', 'standing calf raise': 'Panturrilha em pé',
  'lat pulldown': 'Puxada alta na polia', 'wide grip lat pulldown': 'Puxada alta aberta',
  'pull-up': 'Barra fixa', 'pull up': 'Barra fixa', 'chin-up': 'Barra fixa supinada',
  'barbell row': 'Remada curvada com barra', 'bent over row': 'Remada curvada', 'seated cable row': 'Remada baixa',
  'dumbbell row': 'Remada unilateral com halter', 't-bar row': 'Remada T', 'face pull': 'Face pull na polia',
  'barbell curl': 'Rosca direta com barra', 'dumbbell curl': 'Rosca direta com halteres',
  'biceps curl': 'Rosca bíceps', 'hammer curl': 'Rosca martelo', 'preacher curl': 'Rosca Scott',
  'triceps pushdown': 'Tríceps na polia', 'triceps dip': 'Mergulho para tríceps', 'triceps extension': 'Extensão de tríceps',
  'overhead triceps extension': 'Tríceps francês', 'shoulder press': 'Desenvolvimento de ombros',
  'dumbbell shoulder press': 'Desenvolvimento com halteres', 'military press': 'Desenvolvimento militar',
  'lateral raise': 'Elevação lateral', 'dumbbell lateral raise': 'Elevação lateral com halteres',
  'front raise': 'Elevação frontal', 'rear delt fly': 'Crucifixo inverso', 'dumbbell shrug': 'Encolhimento com halteres',
  'barbell shrug': 'Encolhimento com barra', 'hip thrust': 'Elevação pélvica', 'glute bridge': 'Ponte de glúteos',
  'walking lunge': 'Afundo caminhando', 'lunge': 'Afundo', 'reverse lunge': 'Afundo reverso',
  'bulgarian split squat': 'Agachamento búlgaro', 'burpee': 'Burpee', 'jumping jack': 'Polichinelo',
  'mountain climber': 'Escalador', 'bicycle crunch': 'Abdominal bicicleta', 'leg raise': 'Elevação de pernas',
  'hanging leg raise': 'Elevação de pernas suspenso', 'russian twist': 'Abdominal russo',
  'treadmill running': 'Corrida na esteira', 'running': 'Corrida', 'cycling': 'Bicicleta ergométrica',
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}
function initials(name) { return String(name || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0] || '').join('').toUpperCase(); }
function firstName(name) { return String(name || '').trim().split(/\s+/)[0] || 'atleta'; }
function pretty(value) { return String(value || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function translateExercise(name) {
  const exact = String(name || '').toLowerCase().trim();
  if (EXERCISE_TRANSLATIONS[exact]) return EXERCISE_TRANSLATIONS[exact];
  for (const [key, value] of Object.entries(EXERCISE_TRANSLATIONS)) {
    if (exact.startsWith(key + ' ')) return value + ' ' + pretty(exact.slice(key.length + 1));
  }
  return pretty(name);
}
function labelBody(value) { const v = String(value || '').toLowerCase(); return BODY_LABELS[v] || pretty(value); }
function labelMuscle(value) { const v = String(value || '').toLowerCase(); return MUSCLE_LABELS[v] || pretty(value); }
function labelEquipment(value) { const v = String(value || '').toLowerCase(); return EQUIPMENT_LABELS[v] || pretty(value); }

/**
 * TRADUÇÃO DAS INSTRUÇÕES E DESCRIÇÕES DOS GIFS PARA PORTUGUÊS
 */
function translateInstruction(text) {
  let s = String(text || '').replace(/^Step:\s*\d+\s*/i, '').trim();
  if (!s) return '';

  const phrases = [
    [/Repeat for the desired number of repetitions\.?/gi, 'Repita pelo número desejado de repetições.'],
    [/Continue alternating sides for the desired number of repetitions\.?/gi, 'Continue alternando os lados pelo número desejado de repetições.'],
    [/Continue alternating sides in a pedaling motion for the desired number of repetitions\.?/gi, 'Continue alternando os lados em movimento de pedalada pelo número desejado de repetições.'],
    [/Pause for a moment at the top, then slowly lower your upper body back down to the starting position\.?/gi, 'Faça uma pausa no topo e desça o tronco lentamente de volta à posição inicial.'],
    [/Pause for a moment at the top, then slowly lower the weights? back down to the starting position\.?/gi, 'Faça uma pausa no topo e desça a carga de forma controlada à posição inicial.'],
    [/Pause for a moment at the top, then slowly return to the starting position\.?/gi, 'Faça uma breve pausa no topo e retorne lentamente à posição inicial.'],
    [/Pause for a moment at the bottom, then slowly return to the starting position\.?/gi, 'Faça uma breve pausa na descida e retorne lentamente à posição inicial.'],
    [/Pause for a moment at the top\.?/gi, 'Faça uma breve pausa no ponto de maior contração.'],
    [/Pause for a moment at the bottom\.?/gi, 'Faça uma breve pausa na fase inferior do movimento.'],
    [/Lie flat on your back with your knees bent and feet flat on the ground\.?/gi, 'Deite-se de costas com os joelhos flexionados e os pés firmes no chão.'],
    [/Lie flat on your back with your hands placed behind your head\.?/gi, 'Deite-se de costas com as mãos posicionadas atrás da cabeça.'],
    [/Lie flat on a bench with your feet flat on the floor\.?/gi, 'Deite-se no banco reto com os pés bem apoiados no chão.'],
    [/Stand with your feet shoulder-width apart and your arms extended straight down by your sides\.?/gi, 'Fique em pé com os pés na largura dos ombros e os braços estendidos ao lado do corpo.'],
    [/Stand with your feet shoulder-width apart\.?/gi, 'Fique em pé com os pés na largura dos ombros.'],
    [/Stand upright with your feet hip-width apart\.?/gi, 'Fique em pé ereto com os pés na largura do quadril.'],
    [/Stand upright with your feet shoulder-width apart\.?/gi, 'Fique em pé ereto com os pés na largura dos ombros.'],
    [/Keeping your back straight and your core engaged,?/gi, 'Mantendo a coluna reta e o abdômen contraído,'],
    [/Keeping your core engaged and your back straight,?/gi, 'Mantendo o abdômen contraído e a postura alinhada,'],
    [/Engaging your abs,?/gi, 'Contraindo o abdômen,'],
    [/Return to the starting position and repeat the movement on the opposite side,?/gi, 'Retorne à posição inicial e repita o movimento do lado oposto,'],
    [/Repeat on the other side\.?/gi, 'Repita o movimento para o outro lado.'],
    [/Slowly return to the starting position\.?/gi, 'Retorne de forma controlada à posição inicial.'],
    [/Slowly lower the weights? back down\.?/gi, 'Abaixe a carga de forma controlada.'],
    [/Push through your heels to return to the starting position\.?/gi, 'Empurre o chão com os calcanhares para retornar à posição inicial.'],
    [/Push the barbell back up to the starting position\.?/gi, 'Empurre a barra para cima de volta à posição inicial.'],
    [/Push the dumbbells? back up to the starting position\.?/gi, 'Empurre os halteres para cima de volta à posição inicial.'],
    [/Hold a dumbbell in each hand\.?/gi, 'Segure um halter em cada mão.'],
    [/Grasp the barbell with an overhand grip\.?/gi, 'Segure a barra com pegada pronada (palmas voltadas para baixo).'],
    [/Grasp the handles? with an underhand grip\.?/gi, 'Segure os pegadores com pegada supinada (palmas voltadas para cima).'],
    [/Lift your legs off the ground and bend your knees at a 90-degree angle\.?/gi, 'Eleve as pernas do chão flexionando os joelhos em um ângulo de 90 graus.'],
    [/Inhale as you lower,?/gi, 'Inspire durante a descida,'],
    [/Exhale as you push,?/gi, 'Expire ao empurrar,'],
    [/Exhale as you lift,?/gi, 'Expire ao levantar,'],
    [/Exhale as you curl,?/gi, 'Expire durante a contração,']
  ];

  for (const [pattern, rep] of phrases) {
    s = s.replace(pattern, rep);
  }

  const terms = [
    [/\bstarting position\b/gi, 'posição inicial'],
    [/\bshoulder-width apart\b/gi, 'na largura dos ombros'],
    [/\bhip-width apart\b/gi, 'na largura do quadril'],
    [/\boverhand grip\b/gi, 'pegada pronada'],
    [/\bunderhand grip\b/gi, 'pegada supinada'],
    [/\bneutral grip\b/gi, 'pegada neutra'],
    [/\bupper body\b/gi, 'tronco superior'],
    [/\blower body\b/gi, 'membros inferiores'],
    [/\bcore engaged\b/gi, 'core contraído'],
    [/\bback straight\b/gi, 'coluna alinhada'],
    [/\bright arm\b/gi, 'braço direito'],
    [/\bleft arm\b/gi, 'braço esquerdo'],
    [/\bright leg\b/gi, 'perna direita'],
    [/\bleft leg\b/gi, 'perna esquerda'],
    [/\bright knee\b/gi, 'joelho direito'],
    [/\bleft knee\b/gi, 'joelho esquerdo'],
    [/\bright elbow\b/gi, 'cotovelo direito'],
    [/\bleft elbow\b/gi, 'cotovelo esquerdo'],
    [/\bright hand\b/gi, 'mão direita'],
    [/\bleft hand\b/gi, 'mão esquerda'],
    [/\bbarbell\b/gi, 'barra'],
    [/\bdumbbells\b/gi, 'halteres'],
    [/\bdumbbell\b/gi, 'halter'],
    [/\bweights\b/gi, 'pesos'],
    [/\bweight\b/gi, 'peso'],
    [/\bbench\b/gi, 'banco'],
    [/\bfloor\b/gi, 'chão'],
    [/\bground\b/gi, 'chão'],
    [/\bknees\b/gi, 'joelhos'],
    [/\bknee\b/gi, 'joelho'],
    [/\belbows\b/gi, 'cotovelos'],
    [/\belbow\b/gi, 'cotovelo'],
    [/\bshoulders\b/gi, 'ombros'],
    [/\bshoulder\b/gi, 'ombro'],
    [/\bchest\b/gi, 'peito'],
    [/\bthighs\b/gi, 'coxas'],
    [/\bhips\b/gi, 'quadril'],
    [/\bfeet\b/gi, 'pés'],
    [/\bfoot\b/gi, 'pé'],
    [/\bhands\b/gi, 'mãos'],
    [/\bhand\b/gi, 'mão'],
    [/\bhead\b/gi, 'cabeça'],
    [/\btorso\b/gi, 'tronco'],
    [/\bslowly\b/gi, 'lentamente'],
    [/\bsimultaneously\b/gi, 'simultaneamente'],
    [/\bstraightening\b/gi, 'estendendo'],
    [/\bbending\b/gi, 'flexionando'],
    [/\blifting\b/gi, 'levantando'],
    [/\blowering\b/gi, 'abaixando'],
    [/\bstraight\b/gi, 'reto'],
    [/\bdesired number of repetitions\b/gi, 'número desejado de repetições']
  ];

  for (const [pattern, rep] of terms) {
    s = s.replace(pattern, rep);
  }

  return s.charAt(0).toUpperCase() + s.slice(1);
}

function describeGif(ex) {
  const name = translateExercise(ex.name);
  const body = labelBody(ex.bodyParts?.[0] || 'Geral');
  const muscle = labelMuscle(ex.targetMuscles?.[0] || 'Músculos principais');
  const equip = labelEquipment(ex.equipment?.[0] || 'Peso corporal');
  return `Demonstração visual de <b>${esc(name)}</b> com foco em <b>${esc(body)}</b> (${esc(muscle)}) utilizando <b>${esc(equip)}</b>. Observe o alinhamento da postura e mantenha a cadência uniforme durante a execução.`;
}

/**
 * MANTÉM OS GIFS 100% FUNCIONAIS
 */
function gifUrl(ex) {
  if (!ex) return '';
  if (ex.gifUrl) return ex.gifUrl;
  if (ex.gif) {
    if (ex.gif.startsWith('http')) return ex.gif;
    return GIF_SOURCE + encodeURIComponent(ex.gif);
  }
  return '';
}

function exerciseObject(ex) {
  return {
    id: String(ex.id || ex.exerciseId || ex.name),
    name: String(ex.name || 'Exercício'),
    gif: ex.gif || (ex.gifUrl ? ex.gifUrl : ''),
    targetMuscles: Array.isArray(ex.targetMuscles) ? ex.targetMuscles : (ex.targetMuscle ? [ex.targetMuscle] : []),
    bodyParts: Array.isArray(ex.bodyParts) ? ex.bodyParts : (ex.bodyPart ? [ex.bodyPart] : []),
    equipment: Array.isArray(ex.equipment) ? ex.equipment : (ex.equipment ? [ex.equipment] : []),
    instructions: Array.isArray(ex.instructions) ? ex.instructions : [],
  };
}

/* ==============================================================================
   SUPABASE & GOOGLE OAUTH HELPER
   ============================================================================== */
function getSupabase() {
  if (state.supabaseClient) return state.supabaseClient;
  const url = state.supabaseUrl || localStorage.getItem('mogger_supabase_url') || DEFAULT_SUPABASE_URL;
  const key = state.supabaseAnonKey || localStorage.getItem('mogger_supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY;
  if (window.supabase && url && key) {
    try {
      state.supabaseClient = window.supabase.createClient(url, key);
    } catch (e) {
      console.warn('Não foi possível conectar ao Supabase:', e);
    }
  }
  return state.supabaseClient;
}

async function initSupabaseAuth() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: { session }, error } = await sb.auth.getSession();
    if (session?.user) {
      const u = session.user;
      state.user = {
        id: u.id,
        name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Usuário Google',
        email: u.email,
        avatar: u.user_metadata?.avatar_url || '',
        role: 'member',
        createdAt: u.created_at || new Date().toISOString()
      };
      state.authProvider = 'supabase';
      return state.user;
    }
  } catch (err) {
    console.warn('Erro ao verificar sessão do Supabase:', err);
  }
  return null;
}

async function signInWithGoogle() {
  const sb = getSupabase();
  if (!sb) {
    openSupabaseConfigModal(true);
    return;
  }
  try {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  } catch (err) {
    toast('Falha ao autenticar com o Google: ' + err.message, 'error');
  }
}

/* ==============================================================================
   REDE E API LOCAL COM FALLBACK
   ============================================================================== */
async function api(path, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type':'application/json' } : {}), ...(options.headers || {}) };
  let response;
  try {
    response = await fetch(path, { credentials: 'same-origin', ...options, headers });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o Mogger Gym está em execução.');
  }
  let data = {};
  try { data = await response.json(); } catch { /* sem JSON */ }
  if (!response.ok) throw new Error(data.error || 'Algo deu errado. Tente novamente.');
  return data;
}

function toast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const iconName = type === 'error' ? 'info' : 'check';
  el.innerHTML = `${icon(iconName)} <span>${esc(message)}</span>`;
  toastRegion.appendChild(el);
  hydrateIcons(el);
  window.setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    window.setTimeout(() => el.remove(), 250);
  }, 3500);
}

function showLoading(message = 'Carregando…') {
  const el = document.createElement('div');
  el.id = 'loading-overlay';
  el.className = 'loading-overlay';
  el.innerHTML = `<div class="spinner"></div><div class="loading-text">${esc(message)}</div>`;
  document.body.appendChild(el);
}
function hideLoading() {
  document.getElementById('loading-overlay')?.remove();
}

function icon(name, label = '') {
  const iconName = ICONS[name] || name || 'circle';
  return `<i data-lucide="${iconName}"${label ? ` aria-label="${esc(label)}"` : ' aria-hidden="true"'}></i>`;
}

function hydrateIcons(root = document) {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons({
      root: root === document ? undefined : root,
      attrs: { 'stroke-width': 2 }
    });
  }
}

function formatDate(value, opts = { day:'2-digit', month:'short' }) {
  if (!value) return '—';
  try { return new Intl.DateTimeFormat('pt-BR', opts).format(new Date(value)); } catch { return '—'; }
}
function localToday() {
  return new Intl.DateTimeFormat('pt-BR', { weekday:'long', day:'2-digit', month:'long' }).format(new Date());
}
function showError(el, message) { if (!el) return; el.textContent = message; el.classList.add('show'); }
function hideError(el) { if (!el) return; el.textContent = ''; el.classList.remove('show'); }

/* ==============================================================================
   ESCALA DE TELA (125% DEFAULT)
   ============================================================================== */
function applyScale(scale) {
  state.resolutionScale = scale;
  localStorage.setItem('mogger_scale', scale);
  document.documentElement.classList.remove('scale-100', 'scale-125', 'scale-150');
  document.documentElement.classList.add(`scale-${scale}`);
  const buttons = document.querySelectorAll('.scale-btn');
  buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.scale === scale));
}

/* ==============================================================================
   INICIALIZAÇÃO DO APP (BOOT)
   ============================================================================== */
async function boot() {
  applyScale(state.resolutionScale);
  try {
    // 1. Tentar buscar configuração do Supabase no servidor
    try {
      const config = await api('/api/config/supabase');
      if (config.supabaseUrl) state.supabaseUrl = config.supabaseUrl;
      if (config.supabaseAnonKey) state.supabaseAnonKey = config.supabaseAnonKey;
    } catch (e) { /* continua normalmente */ }

    // 2. Verificar se já há sessão ativa do Supabase (Google OAuth)
    try {
      const sbUser = await initSupabaseAuth();
      if (sbUser) {
        await enterApp();
        return;
      }
    } catch (e) { console.warn('Supabase auth:', e); }

    // 3. Fallback: verificar sessão tradicional
    try {
      const { user } = await api('/api/auth/me');
      if (user) {
        state.user = user;
        state.authProvider = 'local';
        await enterApp();
        return;
      }
    } catch (e) { /* sem sessão prévia */ }

    renderLogin();
  } catch (err) {
    renderLogin();
  }
}

/* ==============================================================================
   TELA DE LOGIN SHADCN COM GOOGLE AUTH & SUPABASE
   ============================================================================== */
function renderLogin(error = '', email = '') {
  state.authTab = state.authTab || 'login';
  const isLogin = state.authTab === 'login';

  app.innerHTML = `
  <main class="login-shell">
    <section class="login-story">
      <div class="brand-lockup">
        <div class="brand-mark">M</div>
        <div>
          <div class="brand-name">MOGGER<span>GYM</span></div>
          <div class="brand-caption">TREINE COM PROPÓSITO</div>
        </div>
      </div>
      <div class="story-copy">
        <div class="eyebrow">DESIGN MODERNO · PERFORMANCE TOTAL</div>
        <h1>Construa força.<br>Eleve o seu <em>padrão.</em></h1>
        <p>Um espaço refinado para transformar esforço em resultado. Organize seus treinos com demonstrações em GIF, acompanhe seu ritmo e evolua com consistência.</p>
        <div class="story-proof">
          <div><span class="proof-number">1.100<span style="color:hsl(var(--primary))">+</span></span><span class="proof-label">EXERCÍCIOS COM GIF</span></div>
          <div class="proof-divider"></div>
          <div><span class="proof-number">125<span style="color:hsl(var(--primary))">%</span></span><span class="proof-label">ESCALA AMPLIADA</span></div>
          <div class="proof-divider"></div>
          <div><span class="proof-number">NUVEM</span><span class="proof-label">SUPABASE &amp; GOOGLE</span></div>
        </div>
      </div>
      <div class="story-footer">
        <span>© MOGGER GYM · PLATAFORMA FITNESS</span>
        <!--<button class="text-link" data-action="open-supabase-modal" style="font-size:0.75rem;color:hsl(var(--muted-foreground))">
          ${icon('settings')} Configurar Supabase
        </button> -->
      </div>
    </section>

    <section class="login-side">
      <div class="login-card">
        <div class="brand-lockup mobile-brand">
          <div class="brand-mark">M</div>
          <div>
            <div class="brand-name">MOGGER<span>GYM</span></div>
            <div class="brand-caption">TREINE COM PROPÓSITO</div>
          </div>
        </div>

        <div class="auth-tabs" role="tablist">
          <button type="button" class="auth-tab ${isLogin ? 'active' : ''}" data-action="set-auth-tab" data-tab="login" role="tab" aria-selected="${isLogin}">
            Entrar
          </button>
          <button type="button" class="auth-tab ${!isLogin ? 'active' : ''}" data-action="set-auth-tab" data-tab="register" role="tab" aria-selected="${!isLogin}">
            Criar Conta
          </button>
        </div>

        <div class="login-step">
          ${icon('shield')} ${isLogin ? 'ÁREA DE ACESSO' : 'NOVO CADASTRO'}
        </div>
        <h2>${isLogin ? 'Entrar na plataforma' : 'Criar nova conta'}</h2>
        <p class="login-subtitle">
          ${isLogin
            ? 'Acesse seus treinos personalizados e continue seu progresso diário.'
            : 'Cadastre-se gratuitamente para montar seus treinos e acompanhar sua evolução.'}
        </p>

        <!-- Botão Google OAuth Shadcn -->
        <button type="button" class="btn-google" data-action="login-google">
          ${GOOGLE_ICON_SVG}
          <span>${isLogin ? 'Continuar com o Google' : 'Cadastrar com o Google'}</span>
        </button>

        <div class="auth-divider">${isLogin ? 'ou entre com e-mail' : 'ou crie com seus dados'}</div>

        <div class="form-error ${error ? 'show' : ''}" id="login-error">${esc(error)}</div>

        ${isLogin ? `
        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">E-mail</label>
            <input class="field" id="login-email" name="email" type="email" autocomplete="username" placeholder="voce@email.com" required value="${esc(email)}" />
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">Senha</label>
            <div class="input-wrap">
              <input class="field" id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Digite sua senha" required />
              <button type="button" class="password-toggle" data-action="toggle-password">Mostrar</button>
            </div>
          </div>

          <button class="login-submit" type="submit">
            <span>Entrar com credenciais</span>
            ${icon('arrow')}
          </button>
        </form>
        ` : `
        <form id="register-form">
          <div class="form-group">
            <label class="form-label" for="register-name">Nome completo</label>
            <input class="field" id="register-name" name="name" type="text" autocomplete="name" placeholder="Ex: Lucas Silva" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="register-email">E-mail</label>
            <input class="field" id="register-email" name="email" type="email" autocomplete="username" placeholder="voce@email.com" required value="${esc(email)}" />
          </div>

          <div class="form-group">
            <label class="form-label" for="register-password">Senha (mínimo 6 caracteres)</label>
            <div class="input-wrap">
              <input class="field" id="register-password" name="password" type="password" autocomplete="new-password" placeholder="Crie sua senha" required minlength="6" />
              <button type="button" class="password-toggle" data-action="toggle-register-password">Mostrar</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="register-confirm">Confirmar senha</label>
            <input class="field" id="register-confirm" name="confirmPassword" type="password" autocomplete="new-password" placeholder="Repita a senha" required minlength="6" />
          </div>

          <button class="login-submit" type="submit">
            <span>Criar minha conta</span>
            ${icon('arrow')}
          </button>
        </form>
        `}

        <div class="login-footnote">
          <span style="color:hsl(var(--primary))">${icon('shield')}</span>
          <span>Autenticação segura via Google OAuth / Supabase ou credenciais criptografadas no servidor Mogger.</span>
        </div>
      </div>
    </section>
  </main>`;

  document.getElementById('login-form')?.addEventListener('submit', handleLocalLogin);
  document.getElementById('register-form')?.addEventListener('submit', handleRegister);
  hydrateIcons();
}

async function handleLocalLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const btn = form.querySelector('button[type="submit"]');
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  const errorEl = document.getElementById('login-error');
  hideError(errorEl);
  btn.disabled = true;
  btn.innerHTML = 'Conectando…';
  try {
    const data = await api('/api/auth/login', { method:'POST', body:JSON.stringify({ email, password }) });
    state.user = data.user;
    state.authProvider = 'local';
    await enterApp();
  } catch (err) {
    showError(errorEl, err.message);
    btn.disabled = false;
    btn.innerHTML = `<span>Entrar com credenciais</span> ${icon('arrow')}`;
    hydrateIcons(btn);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const btn = form.querySelector('button[type="submit"]');
  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  const confirmPassword = form.elements.confirmPassword.value;
  const errorEl = document.getElementById('login-error');
  hideError(errorEl);

  if (!name) {
    showError(errorEl, 'Por favor, informe seu nome completo.');
    return;
  }
  if (!email) {
    showError(errorEl, 'Por favor, informe um e-mail válido.');
    return;
  }
  if (password.length < 6) {
    showError(errorEl, 'A senha deve ter no mínimo 6 caracteres.');
    return;
  }
  if (password !== confirmPassword) {
    showError(errorEl, 'As senhas digitadas não coincidem.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = 'Criando conta…';

  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name
          }
        }
      });
      if (error) throw error;
      if (data?.session?.user) {
        toast('Conta criada com sucesso!');
        await initSupabaseAuth();
        await enterApp();
        return;
      } else {
        toast('Conta criada! Faça login com suas credenciais.', 'success');
        state.authTab = 'login';
        renderLogin('', email);
        return;
      }
    } catch (sbErr) {
      showError(errorEl, sbErr.message || 'Falha ao criar conta no Supabase.');
      btn.disabled = false;
      btn.innerHTML = `<span>Criar minha conta</span> ${icon('arrow')}`;
      hydrateIcons(btn);
      return;
    }
  }

  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    toast('Conta criada com sucesso!');
    state.user = data.user;
    state.authProvider = 'local';
    await enterApp();
  } catch (err) {
    showError(errorEl, err.message);
    btn.disabled = false;
    btn.innerHTML = `<span>Criar minha conta</span> ${icon('arrow')}`;
    hydrateIcons(btn);
  }
}

async function enterApp() {
  state.page = 'dashboard';
  state.draft = null;
  state.editingWorkoutId = null;
  await refreshData();
  renderApp();
  loadExercises();
}

/* ==============================================================================
   SINCRONIZAÇÃO DE DADOS (SUPABASE OU LOCAL)
   ============================================================================== */
async function refreshData() {
  const sb = getSupabase();
  if (state.authProvider === 'supabase' && sb && state.user) {
    try {
      // 1. Treinos no Supabase
      const { data: workoutsData, error: wErr } = await sb
        .from('workouts')
        .select('*')
        .eq('user_id', state.user.id)
        .order('updated_at', { ascending: false });
      
      if (!wErr && workoutsData) {
        state.workouts = workoutsData.map(w => ({
          id: w.id,
          userId: w.user_id,
          title: w.title,
          focus: w.focus,
          days: w.days,
          notes: w.notes,
          exercises: Array.isArray(w.exercises) ? w.exercises : [],
          createdAt: w.created_at,
          updatedAt: w.updated_at
        }));
      }

      // 2. Logs no Supabase
      const { data: logsData, error: lErr } = await sb
        .from('workout_logs')
        .select('*')
        .eq('user_id', state.user.id)
        .order('completed_at', { ascending: false });

      if (!lErr && logsData) {
        state.logs = logsData.map(l => ({
          id: l.id,
          userId: l.user_id,
          workoutId: l.workout_id,
          workoutTitle: l.workout_title,
          durationMinutes: l.duration_minutes,
          exercisesCompleted: l.exercises_completed,
          note: l.note,
          completedAt: l.completed_at
        }));
      }

      // Calcular estatísticas
      calculateStats();
      return;
    } catch (err) {
      console.warn('Erro ao consultar Supabase, caindo para modo local:', err);
    }
  }

  // Modo local padrão
  try {
    const [workouts, logs, stats] = await Promise.all([
      api('/api/workouts'),
      api('/api/logs'),
      api('/api/stats')
    ]);
    state.workouts = workouts.workouts || [];
    state.logs = logs.logs || [];
    state.stats = stats;
    if (state.user?.role === 'admin') {
      const users = await api('/api/admin/users');
      state.users = users.users || [];
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

function calculateStats() {
  const ownWorkouts = state.workouts;
  const ownLogs = state.logs;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  const weekLogs = ownLogs.filter(l => new Date(l.completedAt) >= weekStart);
  const recent = ownLogs.filter(l => Date.now() - new Date(l.completedAt).getTime() < 30 * 24 * 3600 * 1000);

  state.stats = {
    workoutCount: ownWorkouts.length,
    completedCount: ownLogs.length,
    weekCount: weekLogs.length,
    recentCount: recent.length,
    minutes: ownLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0),
    lastWorkout: ownLogs[0] || null
  };
}

/* ==============================================================================
   CARREGAMENTO DE EXERCÍCIOS E PROTEÇÃO DOS GIFS
   ============================================================================== */
async function loadExercises(force = false) {
  if (state.exerciseLoading || (state.exercisesReady && !force)) return;
  state.exerciseLoading = true;
  state.exerciseError = false;
  try {
    const response = await fetch(EXERCISE_SOURCE, { signal: AbortSignal.timeout(20000), cache: 'force-cache' });
    if (!response.ok) throw new Error('A biblioteca externa não respondeu.');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Formato de exercícios indisponível.');
    state.exercises = data.map(exerciseObject).filter(ex => ex.id && ex.name);
    state.exercisesReady = true;
  } catch (err) {
    state.exerciseError = true;
    state.exercises = fallbackExercises().map(exerciseObject);
    state.exercisesReady = true;
  } finally {
    state.exerciseLoading = false;
    if (['library', 'builder'].includes(state.page)) renderApp();
  }
}

function fallbackExercises() {
  const rows = [
    ['fbench','Supino reto com barra',['chest','pectorals'],['chest'],['barbell']],
    ['fsquat','Agachamento livre',['quadriceps','glutes'],['upper legs'],['body weight']],
    ['flatrow','Remada curvada',['lats','upper back'],['back'],['barbell']],
    ['fpress','Desenvolvimento com halteres',['shoulders','delts'],['shoulders'],['dumbbell']],
    ['fpush','Flexão de braço',['chest','triceps'],['chest'],['body weight']],
    ['fplank','Prancha abdominal',['abs'],['waist'],['body weight']],
    ['fcurl','Rosca bíceps',['biceps'],['upper arms'],['dumbbell']],
    ['fdead','Levantamento terra',['hamstrings','glutes','back'],['upper legs','back'],['barbell']],
    ['fpressleg','Leg press',['quadriceps','glutes'],['upper legs'],['machine']],
    ['flatraise','Elevação lateral',['delts'],['shoulders'],['dumbbell']],
    ['fpulldown','Puxada alta',['lats'],['back'],['cable']],
    ['fcrunch','Abdominal crunch',['abs'],['waist'],['body weight']],
  ];
  return rows.map(([id,name,targetMuscles,bodyParts,equipment])=>({id,name,targetMuscles,bodyParts,equipment,gif:'',instructions:[]}));
}

/* ==============================================================================
   RENDERIZAÇÃO PRINCIPAL DO APLICATIVO SHADCN
   ============================================================================== */
function renderApp() {
  if (!state.user) return renderLogin();

  const userAvatar = state.user.avatar
    ? `<img src="${esc(state.user.avatar)}" alt="${esc(state.user.name)}" />`
    : esc(initials(state.user.name));

  app.innerHTML = `
    <div class="app-shell">
      <!-- SIDEBAR SHADCN FITNESS COM ÍCONES REFINADOS -->
      <aside class="sidebar">
        <div class="sidebar-top">
          <div class="brand-lockup">
            <div class="brand-mark">M</div>
            <div>
              <div class="brand-name">MOGGER<span>GYM</span></div>
              <div class="brand-caption">PLATAFORMA FITNESS</div>
            </div>
          </div>
        </div>

        <div class="nav-caption">MENU PRINCIPAL</div>
        <nav class="side-nav" aria-label="Navegação principal">
          ${navItem('dashboard', 'Visão geral', 'dashboard', '', 'Início')}
          ${navItem('workouts', 'Meus treinos', 'workouts', state.workouts.length || '', 'Treinos')}
          ${navItem('library', 'Biblioteca de exercícios', 'library', '', 'Exercícios')}
          ${navItem('history', 'Histórico', 'history', '', 'Histórico')}
          ${state.user.role === 'admin' ? `
            <div class="nav-caption">GESTÃO</div>
            ${navItem('users', 'Usuários', 'users', state.users.filter(u=>u.role==='member').length || '', 'Usuários')}
          ` : ''}
        </nav>

        <div class="sidebar-bottom">
          <div class="sidebar-tip">
            <div class="tip-icon">${icon('sparkles')}</div>
            <strong>Consistência &gt; Intensidade</strong>
            <p>Pequenos blocos diários de esforço constroem transformações duradouras.</p>
          </div>

          <div class="profile-mini">
            <div class="avatar">${userAvatar}</div>
            <div class="profile-meta">
              <strong>${esc(state.user.name)}</strong>
              <span>${state.authProvider === 'supabase' ? 'Google / Supabase' : (state.user.role === 'admin' ? 'Administrador' : 'Membro Mogger')}</span>
            </div>
            <button class="icon-button" title="Sair da conta" aria-label="Sair da conta" data-action="logout">
              ${icon('logout')}
            </button>
          </div>
        </div>
      </aside>

      <!-- ÁREA DE CONTEÚDO PRINCIPAL -->
      <main class="main-area">
        <header class="topbar">
          <div class="breadcrumb">
            <div class="mobile-brand-icon">M</div>
            <span class="breadcrumb-prefix">Painel / </span>
            <b class="breadcrumb-current">${esc(pageLabel(state.page))}</b>
          </div>

          <div class="topbar-actions">
            <!-- Seletor de Escala (Desktop) -->
            <div class="scale-selector" title="Resolução e escala de leitura">
              <button class="scale-btn ${state.resolutionScale==='100'?'active':''}" data-action="set-scale" data-scale="100">100%</button>
              <button class="scale-btn ${state.resolutionScale==='125'?'active':''}" data-action="set-scale" data-scale="125">125%</button>
              <button class="scale-btn ${state.resolutionScale==='150'?'active':''}" data-action="set-scale" data-scale="150">150%</button>
            </div>

            <div class="date-chip">
              ${icon('calendar')}
              <span>${esc(localToday())}</span>
            </div>

            <button class="icon-top" data-action="go-library" title="Buscar exercícios" aria-label="Buscar exercícios">
              ${icon('search')}
            </button>

            <button class="avatar avatar-button" data-action="open-user-profile" title="Minha conta (${esc(state.user.name)})" aria-label="Abrir menu de perfil">
              ${userAvatar}
            </button>
          </div>
        </header>

        <div class="page-content" id="page-content">${renderPage()}</div>
      </main>
    </div>`;

  wireDynamicPage();
  hydrateIcons();
}

function navItem(page, label, iconKey, pill = '', shortLabel = '') {
  const active = state.page === page;
  const displayShort = shortLabel || label;
  return `
    <button class="nav-item ${active ? 'active' : ''}" data-page="${page}" title="${label}">
      <span class="nav-icon">${icon(iconKey)}</span>
      <span class="nav-label desktop-only">${label}</span>
      <span class="nav-label mobile-only">${displayShort}</span>
      ${pill ? `<span class="nav-pill">${pill}</span>` : ''}
    </button>`;
}

function pageLabel(page) {
  return ({
    dashboard: 'Visão geral',
    workouts: 'Meus treinos',
    library: 'Biblioteca de exercícios',
    history: 'Histórico de treinos',
    users: 'Gestão de usuários',
    builder: 'Montar treino'
  })[page] || 'Visão geral';
}

function renderPage() {
  switch (state.page) {
    case 'workouts': return renderWorkouts();
    case 'library': return renderLibrary();
    case 'history': return renderHistory();
    case 'users': return state.user.role === 'admin' ? renderAdmin() : renderDashboard();
    case 'builder': return renderBuilder();
    default: return renderDashboard();
  }
}

/* ==============================================================================
   MÓDULO: DASHBOARD / VISÃO GERAL COM ICON BADGES SHADCN
   ============================================================================== */
function statCard(label, value, detail, iconName, colorVariant = 'primary', emphasis = '') {
  return `
    <div class="stat-card">
      <div class="stat-top">
        <span>${label}</span>
        <div class="icon-badge ${colorVariant}">${icon(iconName)}</div>
      </div>
      <div class="stat-number">${value}</div>
      <div class="stat-foot">
        ${emphasis ? `<span class="positive">${emphasis}</span> · ` : ''}${detail}
      </div>
    </div>`;
}

function renderDashboard() {
  const stats = state.stats || {};
  const workouts = state.workouts.slice(0, 3);
  const planned = state.workouts.length
    ? `${state.workouts.length} treino${state.workouts.length===1?'':'s'} ativo${state.workouts.length===1?'':'s'}`
    : 'Monte seu primeiro plano';

  const hours = Math.floor((stats.minutes || 0) / 60);
  const mins = (stats.minutes || 0) % 60;

  return `
    <div class="page-heading">
      <div>
        <h1>Bom treino, ${esc(firstName(state.user.name))} <span style="color:hsl(var(--primary))">✦</span></h1>
        <p>Acompanhe sua disciplina diária e eleve sua performance com movimentos precisos.</p>
      </div>
      <div class="heading-actions">
        <button class="btn btn-outline" data-page="library">
          ${icon('search')} Explorar exercícios
        </button>
        <button class="btn btn-primary" data-action="new-workout">
          ${icon('plus')} Montar treino
        </button>
      </div>
    </div>

    <!-- Banner Hero Fitness -->
    <section class="hero-banner">
      <div class="hero-copy">
        <div class="eyebrow">${icon('flame')} PROPÓSITO &amp; DISCIPLINA</div>
        <h2>Não dependa de sorte.<br><em>Construa consistência.</em></h2>
        <p>Monte suas séries, visualize a mecânica nos GIFs e registre cada conquista com a precisão que seu corpo merece.</p>
        <button class="btn btn-primary" data-page="workouts">
          <span>Acessar rotinas de treino</span>
          ${icon('arrow')}
        </button>
      </div>
      <div class="hero-visual">
        <div class="hero-glyph">M</div>
        <div class="hero-number">MOGGER · PERFORMANCE V2</div>
      </div>
    </section>

    <!-- Stat Grid com Ícones Shadcn Refinados -->
    <div class="stat-grid">
      ${statCard('Treinos salvos', stats.workoutCount || 0, 'Na sua biblioteca privada', 'dumbbell', 'primary')}
      ${statCard('Sessões concluídas', stats.completedCount || 0, 'Total registrado', 'trophy', 'emerald', stats.completedCount ? 'Evoluindo' : '')}
      ${statCard('Nesta semana', stats.weekCount || 0, 'Sessões nos últimos 7 dias', 'flame', 'amber')}
      ${statCard('Tempo de treino', `${hours}h ${mins}m`, 'Tempo total acumulado', 'timer', 'violet')}
    </div>

    <!-- Conteúdo Principal do Dashboard -->
    <div class="content-grid">
      <section class="panel">
        <div class="panel-heading">
          <div>
            <h3>Seus treinos em andamento</h3>
            <p>${esc(planned)}</p>
          </div>
          <button class="text-link" data-page="workouts">
            <span>Ver todos</span> ${icon('arrow')}
          </button>
        </div>

        ${workouts.length ? `
          <div class="workout-list">
            ${workouts.map((w, idx) => workoutRow(w, idx)).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-orb">${icon('dumbbell')}</div>
            <h4>Crie seu primeiro treino</h4>
            <p>Personalize exercícios, repetições, descanso e foco para o seu objetivo.</p>
            <button class="btn btn-primary btn-small" data-action="new-workout">
              ${icon('plus')} Montar rotina
            </button>
          </div>
        `}
      </section>

      <section class="panel">
        <div class="panel-heading">
          <div>
            <h3>Frequência da semana</h3>
            <p>Treinos finalizados nos últimos 7 dias</p>
          </div>
          <div class="icon-badge amber">${icon('calendar')}</div>
        </div>
        ${renderWeekBars()}
        <div class="weekly-summary">
          <span>Meta recomendada</span>
          <strong>${stats.weekCount || 0} / 4 sessões</strong>
        </div>
      </section>
    </div>

    <!-- Módulos de Acesso Rápido com Design Shadcn -->
    <div class="section-title">MÓDULOS DE ACESSO RÁPIDO</div>
    <div class="content-grid" style="margin-bottom:1.5rem">
      <button class="panel" data-page="library" style="text-align:left;cursor:pointer;display:flex;align-items:center;gap:1.1rem">
        <div class="icon-badge primary" style="width:3rem;height:3rem">
          ${icon('book-open')}
        </div>
        <div>
          <h3 style="font:800 1.05rem 'Manrope';margin:0 0 4px">Biblioteca de Exercícios</h3>
          <span style="color:hsl(var(--muted-foreground));font-size:0.85rem">1.100+ exercícios com demonstração em GIF</span>
        </div>
        <span style="margin-left:auto;color:hsl(var(--primary))">${icon('arrow')}</span>
      </button>

      <button class="panel" data-page="history" style="text-align:left;cursor:pointer;display:flex;align-items:center;gap:1.1rem">
        <div class="icon-badge emerald" style="width:3rem;height:3rem">
          ${icon('history')}
        </div>
        <div>
          <h3 style="font:800 1.05rem 'Manrope';margin:0 0 4px">Histórico de Sessões</h3>
          <span style="color:hsl(var(--muted-foreground));font-size:0.85rem">Consulte duração, anotações e evolução</span>
        </div>
        <span style="margin-left:auto;color:hsl(var(--primary))">${icon('arrow')}</span>
      </button>
    </div>

    <div class="footer-credit">
      Mogger Gym · Treine com propósito e segurança. Consulte um profissional de educação física e saúde.
    </div>`;
}

function renderWeekBars() {
  const days = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const now = new Date();
  const jsDay = (now.getDay() + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - jsDay);
  start.setHours(0, 0, 0, 0);

  const counts = days.map((_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return state.logs.filter(l => {
      const logDate = new Date(l.completedAt);
      return logDate.getFullYear() === date.getFullYear() &&
             logDate.getMonth() === date.getMonth() &&
             logDate.getDate() === date.getDate();
    }).length;
  });

  const max = Math.max(1, ...counts);
  return `
    <div class="week-bars">
      ${days.map((day, i) => `
        <div class="day-column ${i === jsDay ? 'today' : ''}">
          <div class="bar-track">
            <div class="bar-fill" style="height:${counts[i] ? Math.max(12, (counts[i]/max)*100) : 4}%"></div>
          </div>
          <span class="day-label">${day}</span>
        </div>
      `).join('')}
    </div>`;
}

function workoutRow(workout, index = 0) {
  const iconsList = ['dumbbell', 'flame', 'target', 'zap'];
  const iconChoice = iconsList[index % iconsList.length];
  const count = workout.exercises?.length || 0;
  return `
    <div class="workout-row">
      <div class="icon-badge primary" style="width:2.6rem;height:2.6rem">
        ${icon(iconChoice)}
      </div>
      <div class="workout-info">
        <strong>${esc(workout.title)}</strong>
        <span>${esc(workout.focus || 'Hipertrofia')} · ${count} exercício${count===1?'':'s'}</span>
      </div>
      <span class="workout-tag">${workout.days || 4}x / sem</span>
      <button class="icon-button" data-action="view-workout" data-id="${esc(workout.id)}" aria-label="Visualizar treino" title="Visualizar treino">
        ${icon('arrow')}
      </button>
    </div>`;
}

/* ==============================================================================
   MÓDULO: MEUS TREINOS
   ============================================================================== */
function renderWorkouts() {
  return `
    <div class="page-heading">
      <div>
        <h1>Meus treinos</h1>
        <p>Suas rotinas personalizadas para máxima hipertrofia e performance.</p>
      </div>
      <div class="heading-actions">
        <button class="btn btn-primary" data-action="new-workout">
          ${icon('plus')} Criar novo treino
        </button>
      </div>
    </div>

    <div class="metric-strip">
      <div class="metric-box">
        <span>Treinos ativos</span>
        <strong>${state.workouts.length}</strong>
      </div>
      <div class="metric-box">
        <span>Exercícios montados</span>
        <strong>${state.workouts.reduce((n, w) => n + (w.exercises?.length || 0), 0)}</strong>
      </div>
      <div class="metric-box">
        <span>Sessões registradas</span>
        <strong>${state.stats.completedCount || 0}</strong>
      </div>
    </div>

    ${state.workouts.length ? `
      <div class="section-title">SUAS ROTINAS CONFIGURADAS</div>
      <div class="content-grid">
        ${state.workouts.map(w => `
          <section class="panel">
            <div class="panel-heading">
              <div>
                <span class="meta-chip">${esc(w.focus || 'Personalizado')}</span>
                <h3 style="margin-top:0.6rem;font-size:1.25rem">${esc(w.title)}</h3>
                <p>${w.exercises?.length || 0} exercícios · ${w.days || 4} dias por semana</p>
              </div>
              <button class="icon-button" data-action="edit-workout" data-id="${esc(w.id)}" aria-label="Editar treino" title="Editar">
                ${icon('edit')}
              </button>
            </div>

            <div class="workout-list">
              ${(w.exercises || []).slice(0, 3).map(ex => `
                <div class="workout-row" style="background:hsl(var(--card));padding:0.75rem 0.85rem">
                  <div class="icon-badge primary" style="width:2.2rem;height:2.2rem">
                    ${icon('dumbbell')}
                  </div>
                  <div class="workout-info">
                    <strong>${esc(translateExercise(ex.name))}</strong>
                    <span>${ex.sets || 3} séries × ${esc(ex.reps || '8–12')} reps</span>
                  </div>
                </div>
              `).join('')}
              ${(w.exercises || []).length > 3 ? `
                <div style="color:hsl(var(--muted-foreground));font-size:0.8rem;padding:0.4rem 0.6rem">
                  + ${w.exercises.length - 3} exercício(s) adicionais
                </div>
              ` : ''}
            </div>

            <div style="display:flex;gap:0.6rem;margin-top:1.2rem;flex-wrap:wrap">
              <button class="btn btn-primary" style="flex:1" data-action="view-workout" data-id="${esc(w.id)}">
                ${icon('activity')} Visualizar
              </button>
              <button class="btn btn-outline" style="flex:1" data-action="edit-workout" data-id="${esc(w.id)}">
                ${icon('edit')} Editar
              </button>
              <button class="btn btn-outline" style="flex:1" data-action="complete-workout" data-id="${esc(w.id)}">
                ${icon('check')} Concluir
              </button>
              <button class="btn btn-ghost btn-small" data-action="duplicate-workout" data-id="${esc(w.id)}" title="Duplicar treino">
                ${icon('layers')} Duplicar
              </button>
              <button class="btn btn-danger btn-small" data-action="delete-workout" data-id="${esc(w.id)}" title="Excluir">
                ${icon('trash')}
              </button>
            </div>
          </section>
        `).join('')}
      </div>
    ` : `
      <div class="panel">
        <div class="empty-state">
          <div class="empty-orb">${icon('dumbbell')}</div>
          <h4>Nenhum treino montado ainda</h4>
          <p>Monte seu primeiro treino agora escolhendo movimentos da biblioteca e definindo suas repetições.</p>
          <button class="btn btn-primary" data-action="new-workout">
            ${icon('plus')} Montar meu primeiro treino
          </button>
        </div>
      </div>
    `}

    <div class="footer-credit">
      Sempre registre o término da sua sessão para calibrar o volume e consistência.
    </div>`;
}

/* ==============================================================================
   MÓDULO: BIBLIOTECA DE EXERCÍCIOS & PROTEÇÃO TOTAL DOS GIFS
   ============================================================================== */
function exerciseCard(ex, showAdd = true) {
  const target = ex.targetMuscles?.[0] ? labelMuscle(ex.targetMuscles[0]) : (ex.bodyParts?.[0] ? labelBody(ex.bodyParts[0]) : 'Geral');
  const equipment = ex.equipment?.[0] ? labelEquipment(ex.equipment[0]) : 'Equipamento variado';
  const src = gifUrl(ex);

  return `
    <article class="exercise-card">
      <div class="exercise-media">
        ${src ? `
          <img loading="lazy" src="${esc(src)}" alt="Demonstração em GIF de ${esc(translateExercise(ex.name))}"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        ` : ''}
        <div class="media-fallback" style="display:${src ? 'none' : 'flex'}">
          ${icon('activity')}
          <small>GIF indisponível</small>
        </div>
        <span class="exercise-badge">${esc(target)}</span>
      </div>

      <div class="exercise-body">
        <h3 class="exercise-title">${esc(translateExercise(ex.name))}</h3>
        <div class="exercise-meta">
          <span class="meta-chip">${esc(equipment)}</span>
        </div>

        <div class="exercise-card-foot">
          <small>${ex.instructions?.length ? `${ex.instructions.length} passos de técnica` : 'Movimento com GIF'}</small>
          <div style="display:flex;align-items:center;gap:0.45rem">
            <button class="btn btn-outline btn-small" data-action="exercise-details" data-id="${esc(ex.id)}">
              Detalhes
            </button>
            ${showAdd ? `
              <button class="add-exercise-btn" data-action="add-exercise" data-id="${esc(ex.id)}" title="Adicionar ao treino">
                ${icon('plus')}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </article>`;
}

function availableBodyParts() {
  const values = [...new Set(state.exercises.flatMap(ex => ex.bodyParts || []).filter(Boolean))].sort();
  return values.map(v => `<option value="${esc(v)}" ${state.exerciseMuscle===v?'selected':''}>${esc(labelBody(v))}</option>`).join('');
}

function availableEquipment() {
  const values = [...new Set(state.exercises.flatMap(ex => ex.equipment || []).filter(Boolean))].sort();
  return values.map(v => `<option value="${esc(v)}" ${state.exerciseEquipment===v?'selected':''}>${esc(labelEquipment(v))}</option>`).join('');
}

function renderLibrary() {
  return `
    <div class="page-heading">
      <div>
        <h1>Biblioteca de exercícios</h1>
        <p>Explore mais de 1.100 movimentos com demonstrações em GIF animado.</p>
      </div>
      <div class="heading-actions">
        <button class="btn btn-outline" data-page="workouts">
          Meus treinos ${icon('arrow')}
        </button>
      </div>
    </div>

    ${state.exerciseError ? `
      <div class="panel" style="margin-bottom:1.2rem;color:#fcd34d;background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.3)">
        Não foi possível carregar o repositório remoto completo no momento. Exibindo movimentos essenciais locais.
      </div>
    ` : ''}

    <div class="filter-bar">
      <div class="search-box">
        <span class="search-glass">${icon('search')}</span>
        <input class="field" id="exercise-search" placeholder="Buscar por exercício, músculo ou equipamento…" value="${esc(state.exerciseSearch)}" autocomplete="off" />
      </div>
      <select class="filter-select" id="exercise-muscle">
        <option value="all">Todos os grupos musculares</option>
        ${availableBodyParts()}
      </select>
      <select class="filter-select" id="exercise-equipment">
        <option value="all">Todos os equipamentos</option>
        ${availableEquipment()}
      </select>
      <span class="result-count" id="exercise-result-count">
        ${state.exerciseLoading ? 'Carregando biblioteca…' : `${state.exercises.length.toLocaleString('pt-BR')} exercícios disponíveis`}
      </span>
    </div>

    <div id="exercise-results">${renderExerciseGrid()}</div>

    <div class="library-note">
      Demonstrações visuais animadas integradas da biblioteca pública oficial <a href="${SOURCE_PAGE}" target="_blank" rel="noopener">Biblioteca de Exercícios</a> via CDN direto.
    </div>
    <div class="footer-credit">
      Ajuste a carga e amplitude à sua condição articular. Não treine sentindo dor aguda.
    </div>`;
}

function filteredExercises() {
  const search = state.exerciseSearch.toLocaleLowerCase('pt-BR').trim();
  return state.exercises.filter(ex => {
    if (state.exerciseMuscle !== 'all' && !(ex.bodyParts || []).includes(state.exerciseMuscle)) return false;
    if (state.exerciseEquipment !== 'all' && !(ex.equipment || []).includes(state.exerciseEquipment)) return false;
    if (!search) return true;
    const hay = [
      ex.name,
      translateExercise(ex.name),
      ...(ex.targetMuscles || []).map(labelMuscle),
      ...(ex.bodyParts || []).map(labelBody),
      ...(ex.equipment || []).map(labelEquipment)
    ].join(' ').toLocaleLowerCase('pt-BR');
    return hay.includes(search);
  });
}

function renderExerciseGrid() {
  if (!state.exercises.length && state.exerciseLoading) {
    return `
      <div class="panel">
        <div class="empty-state">
          <div class="empty-orb">${icon('refresh')}</div>
          <h4>Carregando biblioteca de exercícios…</h4>
          <p>Preparando animações em GIF e dados anatômicos.</p>
        </div>
      </div>`;
  }
  const exercises = filteredExercises();
  if (!exercises.length) {
    return `
      <div class="panel">
        <div class="empty-state">
          <div class="empty-orb">${icon('search')}</div>
          <h4>Nenhum exercício encontrado</h4>
          <p>Tente refinar os filtros de músculos ou equipamento.</p>
          <button class="btn btn-outline btn-small" data-action="clear-exercise-filters">Limpar filtros</button>
        </div>
      </div>`;
  }
  const visible = exercises.slice(0, state.exerciseLimit);
  return `
    <div class="exercise-grid">
      ${visible.map(ex => exerciseCard(ex, true)).join('')}
    </div>
    ${exercises.length > visible.length ? `
      <div class="load-more-wrap">
        <button class="btn btn-outline" data-action="load-more">
          Mostrar mais exercícios (${(exercises.length - visible.length).toLocaleString('pt-BR')} restantes)
        </button>
      </div>
    ` : `
      <div style="text-align:center;color:hsl(var(--muted-foreground));font-size:0.85rem;padding:1.5rem 0 0.5rem">
        Exibindo todos os ${exercises.length.toLocaleString('pt-BR')} exercícios
      </div>
    `}`;
}

/* ==============================================================================
   MÓDULO: CONSTRUTOR DE TREINOS (WORKOUT BUILDER)
   ============================================================================== */
function newDraft() {
  return { title: '', focus: 'Hipertrofia', days: 4, notes: '', exercises: [] };
}
function draftSetCount(d) {
  return (d.exercises || []).reduce((n, e) => n + (Number(e.sets) || 3), 0);
}

function renderBuilder() {
  const d = state.draft || newDraft();
  state.draft = d;

  return `
    <div class="page-heading">
      <div>
        <h1>${state.editingWorkoutId ? 'Editar treino' : 'Monte seu treino'}</h1>
        <p>Personalize exercícios, séries, repetições e intervalos de descanso.</p>
      </div>
      <div class="heading-actions">
        <button class="btn btn-outline" data-page="workouts">
          ← Voltar aos treinos
        </button>
      </div>
    </div>

    <div class="builder-layout">
      <section class="panel builder-panel">
        <div class="panel-heading">
          <div>
            <h3>Configurações da rotina</h3>
            <p>Defina objetivo e divisão semanal</p>
          </div>
          <div class="icon-badge primary">${icon('edit')}</div>
        </div>

        <div class="builder-fields">
          <div class="form-group">
            <label class="form-label" for="draft-title">Nome do treino *</label>
            <input class="field" id="draft-title" value="${esc(d.title)}" placeholder="Ex.: Treino A — Peitoral e Tríceps" maxlength="80" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="draft-focus">Objetivo</label>
            <select class="field" id="draft-focus">
              ${['Hipertrofia','Força','Resistência','Condicionamento','Mobilidade','Geral'].map(v => `<option ${d.focus===v?'selected':''}>${v}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="draft-days">Frequência semanal</label>
            <select class="field" id="draft-days">
              ${[1,2,3,4,5,6,7].map(n => `<option value="${n}" ${Number(d.days)===n?'selected':''}>${n} dia${n>1?'s':''} por semana</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="draft-notes">Anotações estratégicas</label>
            <input class="field" id="draft-notes" value="${esc(d.notes || '')}" placeholder="Ex.: foco na fase excêntrica lenta" maxlength="240" />
          </div>
        </div>

        <div class="panel-heading" style="margin-top:1.5rem">
          <div>
            <h3>Exercícios selecionados</h3>
            <p>Ajuste séries, reps e descansos de cada movimento</p>
          </div>
          <button class="btn btn-outline btn-small" data-action="open-exercise-picker">
            ${icon('plus')} Adicionar exercício
          </button>
        </div>

        <div id="builder-exercises">${renderBuilderExercises()}</div>

        <div style="display:flex;justify-content:flex-end;gap:0.65rem;margin-top:1.6rem">
          <button class="btn btn-outline" data-page="workouts">Cancelar</button>
          <button class="btn btn-primary" data-action="save-workout">
            ${icon('check')} ${state.editingWorkoutId ? 'Salvar alterações' : 'Salvar treino'}
          </button>
        </div>
      </section>

      <!-- Sidebar do Resumo -->
      <aside class="panel builder-sidebar">
        <div class="panel-heading">
          <div>
            <h3>Resumo da rotina</h3>
            <p>Métricas estimadas</p>
          </div>
        </div>

        <div class="summary-row">
          <span>Exercícios</span>
          <strong id="summary-count">${d.exercises.length}</strong>
        </div>
        <div class="summary-row">
          <span>Séries planejadas</span>
          <strong id="summary-sets">${draftSetCount(d)}</strong>
        </div>
        <div class="summary-row">
          <span>Frequência</span>
          <strong id="summary-days">${d.days}x / semana</strong>
        </div>
        <div class="summary-row">
          <span>Foco</span>
          <strong id="summary-focus">${esc(d.focus || 'Hipertrofia')}</strong>
        </div>

        <div class="summary-callout">
          ${icon('sparkles')} <b>Mecânica e Técnica:</b><br>
          Use os GIFs como guia de alinhamento e busque sobrecarga progressiva com controle.
        </div>

        <div class="builder-sticky-actions">
          <button class="btn btn-primary" data-action="save-workout">
            ${icon('check')} Salvar treino
          </button>
          <button class="btn btn-outline" data-action="open-exercise-picker">
            ${icon('plus')} Adicionar da biblioteca
          </button>
        </div>
      </aside>
    </div>`;
}

function renderBuilderExercises() {
  const d = state.draft || newDraft();
  if (!d.exercises.length) {
    return `
      <div class="empty-builder">
        <div style="font-size:2.2rem;margin-bottom:0.6rem;color:hsl(var(--primary))">${icon('plus')}</div>
        <b>Sua rotina ainda não tem exercícios.</b><br>
        Adicione movimentos da biblioteca e personalize séries e repetições.<br>
        <button class="btn btn-primary btn-small" style="margin-top:1rem" data-action="open-exercise-picker">
          ${icon('search')} Buscar na biblioteca
        </button>
      </div>`;
  }

  return d.exercises.map((ex, i) => `
    <div class="builder-exercise" data-exercise-row="${i}">
      <div class="builder-exercise-main">
        <div class="builder-thumb">
          ${gifUrl(ex) ? `
            <img src="${esc(gifUrl(ex))}" alt="" loading="lazy" onerror="this.style.display='none'">
          ` : `<span style="color:hsl(var(--muted-foreground))">${icon('dumbbell')}</span>`}
        </div>
        <div class="builder-ex-info">
          <strong>${esc(translateExercise(ex.name))}</strong>
          <span>${esc(labelBody(ex.bodyParts?.[0] || ex.targetMuscles?.[0] || 'Geral'))}</span>
        </div>
        <button class="remove-exercise" data-action="remove-draft-exercise" data-index="${i}" title="Remover exercício" aria-label="Remover">
          ${icon('trash')}
        </button>
      </div>
      <div class="builder-exercise-params">
        <div class="param-box">
          <label class="compact-label">Séries</label>
          <input class="compact-field" type="number" min="1" max="20" inputmode="numeric" value="${Number(ex.sets) || 3}" data-draft-index="${i}" data-field="sets" />
        </div>
        <div class="param-box">
          <label class="compact-label">Reps</label>
          <input class="compact-field" value="${esc(ex.reps || '8–12')}" maxlength="20" data-draft-index="${i}" data-field="reps" />
        </div>
        <div class="param-box rest-control">
          <label class="compact-label">Descanso(s)</label>
          <input class="compact-field" type="number" min="0" max="600" inputmode="numeric" value="${Number(ex.rest) || 90}" data-draft-index="${i}" data-field="rest" />
        </div>
      </div>
    </div>
  `).join('');
}

/* ==============================================================================
   MÓDULO: HISTÓRICO DE TREINOS
   ============================================================================== */
function renderHistory() {
  return `
    <div class="page-heading">
      <div>
        <h1>Histórico de treinos</h1>
        <p>Acompanhe seu registro de dedicação e consistência com precisão.</p>
      </div>
      <div class="heading-actions">
        <button class="btn btn-primary" data-page="workouts">
          Meus treinos ${icon('arrow')}
        </button>
      </div>
    </div>

    <div class="metric-strip">
      <div class="metric-box">
        <span>Total de sessões</span>
        <strong>${state.stats.completedCount || 0}</strong>
      </div>
      <div class="metric-box">
        <span>Tempo total de treino</span>
        <strong>${Math.floor((state.stats.minutes || 0) / 60)}h ${(state.stats.minutes || 0) % 60}m</strong>
      </div>
      <div class="metric-box">
        <span>Últimos 30 dias</span>
        <strong>${state.stats.recentCount || 0}</strong>
      </div>
    </div>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <h3>Sessões concluídas</h3>
          <p>Registros de esforço salvos</p>
        </div>
        <div class="icon-badge violet">${icon('history')}</div>
      </div>

      ${state.logs.length ? `
        <div class="history-list">
          ${state.logs.map(log => {
            const date = new Date(log.completedAt);
            return `
              <div class="history-entry">
                <div class="history-date">
                  <strong>${date.getDate()}</strong>
                  <span>${new Intl.DateTimeFormat('pt-BR', { month:'short' }).format(date).replace('.', '')}</span>
                </div>
                <div class="history-copy">
                  <strong>${esc(log.workoutTitle || 'Treino finalizado')}</strong>
                  <span>
                    ${formatDate(log.completedAt, { weekday:'long', year:'numeric', day:'2-digit', month:'long' })}
                    · ${log.exercisesCompleted || 0} exercícios concluídos
                    ${log.note ? `· Anotação: ${esc(log.note)}` : ''}
                  </span>
                </div>
                <div class="history-duration">
                  ${log.durationMinutes || 0}
                  <small>minutos</small>
                </div>
              </div>`;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-orb">${icon('history')}</div>
          <h4>Nenhuma sessão registrada</h4>
          <p>Finalize um dos seus treinos clicando em "Concluir" para gravar o tempo e anotações.</p>
          <button class="btn btn-primary btn-small" data-page="workouts">
            Ir para Meus Treinos
          </button>
        </div>
      `}
    </section>

    <div class="footer-credit">
      A consistência nos registros reflete diretamente o seu comprometimento.
    </div>`;
}

/* ==============================================================================
   MÓDULO: ADMINISTRAÇÃO DE USUÁRIOS
   ============================================================================== */
function renderAdmin() {
  const members = state.users.filter(u => u.role === 'member');
  const active = members.filter(u => u.active).length;
  const completed = members.reduce((sum, u) => sum + (u.completedCount || 0), 0);
  const search = state.userSearch.toLocaleLowerCase('pt-BR').trim();
  const visible = state.users.filter(u => [u.name, u.email].join(' ').toLocaleLowerCase('pt-BR').includes(search));

  return `
    <div class="page-heading">
      <div>
        <h1>Gestão de usuários</h1>
        <p>Controle de membros e segurança das credenciais.</p>
      </div>
      <div class="heading-actions">
        <button class="btn btn-primary" data-action="create-user">
          ${icon('plus')} Criar usuário
        </button>
      </div>
    </div>

    <div class="metric-strip">
      <div class="metric-box">
        <span>Usuários cadastrados</span>
        <strong>${members.length}</strong>
      </div>
      <div class="metric-box">
        <span>Contas ativas</span>
        <strong>${active}</strong>
      </div>
      <div class="metric-box">
        <span>Sessões registradas</span>
        <strong>${completed}</strong>
      </div>
    </div>

    <section class="panel">
      <div class="panel-heading">
        <div>
          <h3>Contas cadastradas</h3>
          <p>Gerenciamento de acessos e senhas</p>
        </div>
        <div class="icon-badge emerald">${icon('users')}</div>
      </div>

      <div class="filter-bar">
        <div class="search-box">
          <span class="search-glass">${icon('search')}</span>
          <input class="field" id="user-search" placeholder="Buscar por nome ou e-mail…" value="${esc(state.userSearch)}" />
        </div>
        <span class="result-count">${visible.length} conta(s)</span>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Treinos</th>
              <th>Sessões</th>
              <th style="text-align:right">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${visible.map(u => `
              <tr>
                <td data-label="Usuário">
                  <div class="table-user">
                    <div class="avatar">${esc(initials(u.name))}</div>
                    <div>
                      <strong>${esc(u.name)}</strong>
                      <small>${esc(u.email)}</small>
                    </div>
                  </div>
                </td>
                <td data-label="Perfil"><span class="role-chip">${u.role === 'admin' ? 'Administrador' : 'Membro'}</span></td>
                <td data-label="Status"><span class="status-chip ${u.active ? '' : 'inactive'}">${u.active ? 'Ativo' : 'Desativado'}</span></td>
                <td data-label="Treinos">${u.workoutCount || 0}</td>
                <td data-label="Sessões">${u.completedCount || 0}</td>
                <td data-label="Ações">
                  <div class="table-actions">
                    ${u.role === 'member' ? `
                      <button class="btn btn-outline btn-small" data-action="reset-user-password" data-id="${esc(u.id)}">Senha</button>
                      <button class="btn ${u.active ? 'btn-outline' : 'btn-primary'} btn-small" data-action="toggle-user" data-id="${esc(u.id)}" data-active="${u.active ? 'false' : 'true'}">${u.active ? 'Desativar' : 'Ativar'}</button>
                      <button class="btn btn-danger btn-small" data-action="delete-user" data-id="${esc(u.id)}">${icon('trash')}</button>
                    ` : `<span style="color:hsl(var(--muted-foreground));font-size:0.8rem">Conta Principal</span>`}
                  </div>
                </td>
              </tr>
            `).join('') || `
              <tr><td colspan="6"><div class="empty-state"><h4>Nenhuma conta encontrada</h4><p>Crie uma conta ou altere os termos de busca.</p></div></td></tr>
            `}
          </tbody>
        </table>
      </div>
    </section>`;
}

/* ==============================================================================
   LÓGICA DINÂMICA DA PÁGINA E INPUTS
   ============================================================================== */
function wireDynamicPage() {
  if (state.page === 'library') {
    const search = document.getElementById('exercise-search');
    search?.addEventListener('input', e => {
      state.exerciseSearch = e.target.value;
      state.exerciseLimit = 18;
      refreshExerciseResults(false);
    });
    document.getElementById('exercise-muscle')?.addEventListener('change', e => {
      state.exerciseMuscle = e.target.value;
      state.exerciseLimit = 18;
      refreshExerciseResults(true);
    });
    document.getElementById('exercise-equipment')?.addEventListener('change', e => {
      state.exerciseEquipment = e.target.value;
      state.exerciseLimit = 18;
      refreshExerciseResults(true);
    });
  }

  if (state.page === 'builder') {
    document.getElementById('draft-title')?.addEventListener('input', e => { state.draft.title = e.target.value; });
    document.getElementById('draft-focus')?.addEventListener('change', e => {
      state.draft.focus = e.target.value;
      const x = document.getElementById('summary-focus');
      if (x) x.textContent = e.target.value;
    });
    document.getElementById('draft-days')?.addEventListener('change', e => {
      state.draft.days = Number(e.target.value);
      const x = document.getElementById('summary-days');
      if (x) x.textContent = `${e.target.value}x / semana`;
    });
    document.getElementById('draft-notes')?.addEventListener('input', e => { state.draft.notes = e.target.value; });
    wireBuilderInputsOnly();
  }

  if (state.page === 'users') {
    document.getElementById('user-search')?.addEventListener('input', e => {
      const pos = e.target.selectionStart;
      state.userSearch = e.target.value;
      const result = document.querySelector('#page-content');
      if (result) {
        result.innerHTML = renderAdmin();
        wireDynamicPage();
        hydrateIcons();
        const next = document.getElementById('user-search');
        next?.focus();
        next?.setSelectionRange(pos, pos);
      }
    });
  }
}

function wireBuilderInputsOnly() {
  document.querySelectorAll('[data-draft-index]').forEach(el => {
    const save = () => {
      const index = Number(el.dataset.draftIndex);
      if (!state.draft?.exercises[index]) return;
      const field = el.dataset.field;
      state.draft.exercises[index][field] = field === 'sets' || field === 'rest' ? Number(el.value) : el.value;
      const summary = document.getElementById('summary-sets');
      if (summary) summary.textContent = draftSetCount(state.draft);
    };
    el.addEventListener('input', save);
    el.addEventListener('change', save);
  });
}

function refreshExerciseResults(updateFilters) {
  const result = document.getElementById('exercise-results');
  if (result) {
    result.innerHTML = renderExerciseGrid();
    hydrateIcons(result);
  }
  const count = document.getElementById('exercise-result-count');
  if (count) count.textContent = `${filteredExercises().length.toLocaleString('pt-BR')} resultado(s)`;
  if (updateFilters && state.page === 'library') {
    const muscle = document.getElementById('exercise-muscle');
    const equip = document.getElementById('exercise-equipment');
    if (muscle) muscle.value = state.exerciseMuscle;
    if (equip) equip.value = state.exerciseEquipment;
  }
}

function clearExerciseFilters() {
  state.exerciseSearch = '';
  state.exerciseMuscle = 'all';
  state.exerciseEquipment = 'all';
  state.exerciseLimit = 18;
  renderApp();
}

/* ==============================================================================
   OPERAÇÕES CRUD (WORKOUTS & LOGS) COM SUPABASE DB & LOCAL
   ============================================================================== */
function openNewWorkout() {
  state.draft = newDraft();
  state.editingWorkoutId = null;
  state.page = 'builder';
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openEditWorkout(idValue) {
  const workout = state.workouts.find(w => w.id === idValue);
  if (!workout) return;
  state.draft = JSON.parse(JSON.stringify(workout));
  state.editingWorkoutId = workout.id;
  state.page = 'builder';
  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * VISUALIZAR TREINO — Exibe todos os exercícios com GIF, séries, reps e descanso
 */
function openViewWorkout(workoutId) {
  const workout = state.workouts.find(w => w.id === workoutId);
  if (!workout) return;
  const exercises = workout.exercises || [];

  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <section class="modal modal-wide" role="dialog" aria-modal="true" style="max-height:92vh;display:flex;flex-direction:column">
        <div class="modal-head">
          <div>
            <h3>${esc(workout.title)}</h3>
            <p>${esc(workout.focus || 'Hipertrofia')} · ${exercises.length} exercício${exercises.length === 1 ? '' : 's'} · ${workout.days || 4}x/sem</p>
          </div>
          <button class="modal-close" data-action="close-modal" aria-label="Fechar">
            ${icon('x')}
          </button>
        </div>

        <div style="overflow-y:auto;flex:1;padding:0.5rem 0">
          ${exercises.length ? exercises.map((ex, i) => {
            const src = gifUrl(ex);
            const name = translateExercise(ex.name);
            const target = ex.targetMuscles?.[0] ? labelMuscle(ex.targetMuscles[0]) : (ex.bodyParts?.[0] ? labelBody(ex.bodyParts[0]) : 'Geral');
            return `
              <div class="view-exercise-card" style="display:flex;gap:1rem;align-items:center;padding:1rem;border-bottom:1px solid hsl(var(--border))">
                <div class="view-gif-wrap" style="flex-shrink:0;width:120px;height:120px;border-radius:var(--radius-md);overflow:hidden;background:hsl(var(--secondary));display:flex;align-items:center;justify-content:center">
                  ${src
                    ? `<img src="${esc(src)}" alt="${esc(name)}" style="width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                    : ''}
                  <div class="media-fallback" style="display:${src ? 'none' : 'flex'};flex-direction:column;align-items:center;gap:4px;color:hsl(var(--muted-foreground))">
                    ${icon('dumbbell')}
                    <small style="font-size:0.65rem">Sem GIF</small>
                  </div>
                </div>
                <div style="flex:1;min-width:0">
                  <strong style="font-size:1.05rem;display:block;margin-bottom:4px">${esc(name)}</strong>
                  <span class="meta-chip" style="margin-bottom:6px;display:inline-block">${esc(target)}</span>
                  <div class="view-stats" style="display:flex;gap:1.2rem;flex-wrap:wrap;margin-top:8px">
                    <div>
                      <div class="view-stat-value" style="font-size:1.2rem;font-weight:800;color:hsl(var(--primary))">${ex.sets || 3}</div>
                      <div class="view-stat-label" style="font-size:0.7rem;color:hsl(var(--muted-foreground));text-transform:uppercase;font-weight:600">Séries</div>
                    </div>
                    <div>
                      <div class="view-stat-value" style="font-size:1.2rem;font-weight:800;color:hsl(var(--foreground))">${esc(ex.reps || '8–12')}</div>
                      <div class="view-stat-label" style="font-size:0.7rem;color:hsl(var(--muted-foreground));text-transform:uppercase;font-weight:600">Reps</div>
                    </div>
                    <div>
                      <div class="view-stat-value" style="font-size:1.2rem;font-weight:800;color:hsl(var(--foreground))">${ex.rest || 90}s</div>
                      <div class="view-stat-label" style="font-size:0.7rem;color:hsl(var(--muted-foreground));text-transform:uppercase;font-weight:600">Descanso</div>
                    </div>
                  </div>
                </div>
              </div>`;
          }).join('') : `
            <div class="empty-state" style="padding:2rem">
              <div class="empty-orb">${icon('dumbbell')}</div>
              <h4>Nenhum exercício neste treino</h4>
              <p>Edite o treino para adicionar exercícios.</p>
            </div>
          `}
        </div>

        ${workout.notes ? `
          <div style="padding:0.75rem 1rem;border-top:1px solid hsl(var(--border));font-size:0.85rem;color:hsl(var(--muted-foreground))">
            <strong>Anotações:</strong> ${esc(workout.notes)}
          </div>
        ` : ''}

        <div class="modal-actions">
          <button class="btn btn-outline" data-action="close-modal">Fechar</button>
          <button class="btn btn-primary" data-action="edit-workout" data-id="${esc(workout.id)}">
            ${icon('edit')} Editar treino
          </button>
        </div>
      </section>
    </div>`;

  hydrateIcons(modalRoot);
}

async function duplicateWorkout(workoutId) {
  const workout = state.workouts.find(w => w.id === workoutId);
  if (!workout) return;
  showLoading('Duplicando treino…');
  const payload = {
    title: workout.title + ' (Cópia)',
    focus: workout.focus,
    days: workout.days,
    notes: workout.notes,
    exercises: workout.exercises
  };
  const sb = getSupabase();
  if (state.authProvider === 'supabase' && sb && state.user) {
    try {
      const { error } = await sb.from('workouts').insert({
        user_id: state.user.id,
        title: payload.title,
        focus: payload.focus,
        days: payload.days,
        notes: payload.notes,
        exercises: payload.exercises
      });
      if (error) throw error;
      await refreshData();
      hideLoading();
      renderApp();
      toast('Treino duplicado com sucesso!');
    } catch (err) {
      hideLoading();
      toast('Erro ao duplicar: ' + err.message, 'error');
    }
    return;
  }
  try {
    await api('/api/workouts', { method: 'POST', body: JSON.stringify(payload) });
    await refreshData();
    hideLoading();
    renderApp();
    toast('Treino duplicado com sucesso!');
  } catch (err) {
    hideLoading();
    toast('Erro ao duplicar: ' + err.message, 'error');
  }
}


async function saveWorkout() {
  if (!state.draft) return;
  const title = document.getElementById('draft-title')?.value?.trim() || state.draft.title?.trim();
  if (!title) {
    toast('Dê um nome ao treino antes de salvar.', 'error');
    document.getElementById('draft-title')?.focus();
    return;
  }
  if (!state.draft.exercises.length) {
    toast('Adicione pelo menos um exercício ao treino.', 'error');
    return;
  }

  showLoading('Salvando treino…');
  const payload = {
    title,
    focus: document.getElementById('draft-focus')?.value || state.draft.focus,
    days: Number(document.getElementById('draft-days')?.value || state.draft.days),
    notes: document.getElementById('draft-notes')?.value || state.draft.notes || '',
    exercises: state.draft.exercises
  };

  const sb = getSupabase();
  if (state.authProvider === 'supabase' && sb && state.user) {
    try {
      if (state.editingWorkoutId) {
        const { error } = await sb
          .from('workouts')
          .update({
            title: payload.title,
            focus: payload.focus,
            days: payload.days,
            notes: payload.notes,
            exercises: payload.exercises,
            updated_at: new Date().toISOString()
          })
          .eq('id', state.editingWorkoutId)
          .eq('user_id', state.user.id);
        if (error) throw error;
        hideLoading();
        toast('Treino atualizado no Supabase com sucesso.');
      } else {
        const { error } = await sb
          .from('workouts')
          .insert({
            user_id: state.user.id,
            title: payload.title,
            focus: payload.focus,
            days: payload.days,
            notes: payload.notes,
            exercises: payload.exercises
          });
        if (error) throw error;
        hideLoading();
        toast('Treino gravado no Supabase com sucesso.');
      }
      state.draft = null;
      state.editingWorkoutId = null;
      await refreshData();
      state.page = 'workouts';
      renderApp();
      return;
    } catch (err) {
      hideLoading();
      toast('Erro no Supabase: ' + err.message, 'error');
      return;
    }
  }

  // Fallback local
  try {
    if (state.editingWorkoutId) {
      await api(`/api/workouts/${encodeURIComponent(state.editingWorkoutId)}`, { method:'PUT', body:JSON.stringify(payload) });
    } else {
      await api('/api/workouts', { method:'POST', body:JSON.stringify(payload) });
    }
    hideLoading();
    toast(state.editingWorkoutId ? 'Treino atualizado com sucesso.' : 'Treino salvo com sucesso.');
    state.draft = null;
    state.editingWorkoutId = null;
    await refreshData();
    state.page = 'workouts';
    renderApp();
  } catch (err) {
    hideLoading();
    toast(err.message, 'error');
  }
}

async function deleteWorkout(workoutId) {
  const sb = getSupabase();
  if (state.authProvider === 'supabase' && sb && state.user) {
    try {
      const { error } = await sb
        .from('workouts')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', state.user.id);
      if (error) throw error;
      modalRoot.innerHTML = '';
      await refreshData();
      renderApp();
      toast('Treino removido do Supabase.');
      return;
    } catch (err) {
      toast('Erro ao excluir no Supabase: ' + err.message, 'error');
      return;
    }
  }

  try {
    await api(`/api/workouts/${encodeURIComponent(workoutId)}`, { method:'DELETE' });
    modalRoot.innerHTML = '';
    await refreshData();
    renderApp();
    toast('Treino excluído.');
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ==============================================================================
   MODAIS SHADCN COM GIFS E INTERATIVIDADE
   ============================================================================== */
function openPicker() {
  state.pickerSearch = '';
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <section class="modal modal-wide" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <h3>Adicionar exercícios</h3>
            <p>Selecione um ou mais movimentos para compor sua rotina.</p>
          </div>
          <button class="modal-close" data-action="close-modal" aria-label="Fechar">
            ${icon('x')}
          </button>
        </div>

        <div class="filter-bar">
          <div class="search-box">
            <span class="search-glass">${icon('search')}</span>
            <input class="field" id="picker-search" placeholder="Buscar exercício por nome…" value="" />
          </div>
          <span class="result-count" id="picker-count"></span>
        </div>

        <div class="exercise-picker" id="picker-results">${renderPickerResults()}</div>

        <div class="modal-actions">
          <button class="btn btn-outline" data-action="close-modal">Fechar</button>
        </div>
      </section>
    </div>`;

  hydrateIcons(modalRoot);
  const search = document.getElementById('picker-search');
  search?.addEventListener('input', e => {
    state.pickerSearch = e.target.value;
    const results = document.getElementById('picker-results');
    if (results) {
      results.innerHTML = renderPickerResults();
      hydrateIcons(results);
    }
    const count = document.getElementById('picker-count');
    if (count) count.textContent = `${filteredPickerExercises().length} resultado(s)`;
  });
  const count = document.getElementById('picker-count');
  if (count) count.textContent = `${filteredPickerExercises().length} resultado(s)`;
}

function filteredPickerExercises() {
  const query = state.pickerSearch.toLocaleLowerCase('pt-BR').trim();
  return state.exercises.filter(ex => {
    const hay = [
      ex.name,
      translateExercise(ex.name),
      ...(ex.targetMuscles || []).map(labelMuscle),
      ...(ex.equipment || []).map(labelEquipment)
    ].join(' ').toLocaleLowerCase('pt-BR');
    return !query || hay.includes(query);
  }).slice(0, 100);
}

function renderPickerResults() {
  const items = filteredPickerExercises();
  if (!state.exercises.length) return `<div class="empty-state"><p>Carregando biblioteca…</p></div>`;
  if (!items.length) return `<div class="empty-state"><p>Nenhum exercício encontrado com esse nome.</p></div>`;

  return items.map(ex => `
    <div class="picker-exercise">
      <div class="builder-thumb">
        ${gifUrl(ex) ? `
          <img src="${esc(gifUrl(ex))}" alt="" loading="lazy" onerror="this.style.display='none'">
        ` : `<span style="color:hsl(var(--muted-foreground))">${icon('dumbbell')}</span>`}
      </div>
      <div class="builder-ex-info">
        <strong>${esc(translateExercise(ex.name))}</strong>
        <span>${esc(labelBody(ex.bodyParts?.[0] || ex.targetMuscles?.[0] || 'Geral'))} · ${esc(labelEquipment(ex.equipment?.[0] || 'Vários'))}</span>
      </div>
      <button class="btn btn-primary btn-small" data-action="picker-add" data-id="${esc(ex.id)}">
        ${icon('plus')} Adicionar
      </button>
    </div>
  `).join('');
}

function addExercise(idValue) {
  const ex = state.exercises.find(e => String(e.id) === String(idValue));
  if (!ex || !state.draft) return;
  if (state.draft.exercises.some(e => String(e.id) === String(ex.id))) {
    toast('Esse exercício já consta na rotina.', 'error');
    return;
  }
  state.draft.exercises.push({ ...exerciseObject(ex), sets: 3, reps: '8–12', rest: 90 });
  const builder = document.getElementById('builder-exercises');
  if (builder) {
    builder.innerHTML = renderBuilderExercises();
    hydrateIcons(builder);
  }
  const count = document.getElementById('summary-count');
  if (count) count.textContent = state.draft.exercises.length;
  const sets = document.getElementById('summary-sets');
  if (sets) sets.textContent = draftSetCount(state.draft);
  toast('Exercício incluído com sucesso.');
  wireBuilderInputsOnly();
}

/**
 * MODAL DE DETALHES DO EXERCÍCIO COM GIF AMPLIADO
 */
function openExerciseDetails(ex) {
  const src = gifUrl(ex);
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <section class="modal modal-wide" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <h3>${esc(translateExercise(ex.name))}</h3>
            <p>${esc(labelBody(ex.bodyParts?.[0] || ex.targetMuscles?.[0] || 'Geral'))} · ${esc(labelEquipment(ex.equipment?.[0] || 'Vários'))}</p>
          </div>
          <button class="modal-close" data-action="close-modal" aria-label="Fechar">
            ${icon('x')}
          </button>
        </div>

        <div class="exercise-detail-grid">
          <div class="exercise-media exercise-modal-media">
            ${src ? `
              <img src="${esc(src)}" alt="Demonstração em GIF de ${esc(translateExercise(ex.name))}" onerror="this.style.display='none'">
            ` : `
              <div class="media-fallback">
                ${icon('activity')}
                <small>GIF indisponível</small>
              </div>
            `}
          </div>

          <div>
            <div class="section-title" style="margin-top:0">DEMONSTRAÇÃO DO GIF</div>
            <div class="summary-callout" style="margin: 0.4rem 0 0.9rem; font-size: 0.85rem; line-height: 1.6">
              ${describeGif(ex)}
            </div>

            <div class="section-title" style="margin-top:0">MÚSCULOS ATIVADOS</div>
            <div class="exercise-meta" style="margin-bottom:0.9rem">
              ${(ex.targetMuscles || []).map(m => `<span class="meta-chip">${esc(labelMuscle(m))}</span>`).join('') || '<span class="meta-chip">Geral</span>'}
            </div>

            <div class="section-title">GUIA PASSO A PASSO (TRADUZIDO)</div>
            ${ex.instructions?.length ? `
              <ol style="font-size:0.85rem;color:hsl(var(--foreground));line-height:1.7;padding-left:1.2rem;margin:0">
                ${ex.instructions.slice(0, 8).map(s => `<li style="margin-bottom:0.4rem">${esc(translateInstruction(s))}</li>`).join('')}
              </ol>
            ` : `
              <p style="font-size:0.85rem;color:hsl(var(--muted-foreground));line-height:1.6">
                Observe a demonstração no GIF acima como guia visual. Mantenha a postura alinhada, respiração cadenciada e execute a amplitude completa com controle articular.
              </p>
            `}
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-outline" data-action="close-modal">Fechar</button>
          <button class="btn btn-primary" data-action="add-exercise" data-id="${esc(ex.id)}">
            ${icon('plus')} Adicionar ao treino
          </button>
        </div>
      </section>
    </div>`;
  hydrateIcons(modalRoot);
}

/**
 * MODAL DE CONCLUIR TREINO (REGISTRO DE SESSÃO)
 */
function openCompleteModal(workoutId) {
  const workout = state.workouts.find(w => w.id === workoutId);
  if (!workout) return;

  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <section class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <h3>Registrar sessão concluída</h3>
            <p>Parabéns pela dedicação! Grave os dados do seu treino de hoje.</p>
          </div>
          <button class="modal-close" data-action="close-modal">
            ${icon('x')}
          </button>
        </div>

        <form id="complete-form">
          <div class="form-group">
            <label class="form-label">Rotina realizada</label>
            <input class="field" value="${esc(workout.title)}" disabled />
          </div>

          <div class="form-group">
            <label class="form-label">Duração estimada (minutos)</label>
            <input class="field" name="duration" type="number" min="1" max="600" value="45" required />
          </div>

          <div class="form-group">
            <label class="form-label">Exercícios concluídos</label>
            <input class="field" name="exercises" type="number" min="0" max="100" value="${workout.exercises?.length || 0}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Anotação pessoal (opcional)</label>
            <input class="field" name="note" maxlength="500" placeholder="Ex.: aumentei a carga no supino e zerei as repetições" />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" data-action="close-modal">Cancelar</button>
            <button type="submit" class="btn btn-primary">
              ${icon('check')} Salvar sessão
            </button>
          </div>
        </form>
      </section>
    </div>`;

  hydrateIcons(modalRoot);
  document.getElementById('complete-form').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;

    const durationMinutes = Number(form.elements.duration.value) || 45;
    const exercisesCompleted = Number(form.elements.exercises.value) || (workout.exercises?.length || 0);
    const note = form.elements.note.value.trim();

    const sb = getSupabase();
    if (state.authProvider === 'supabase' && sb && state.user) {
      try {
        const { error } = await sb
          .from('workout_logs')
          .insert({
            user_id: state.user.id,
            workout_id: workout.id,
            workout_title: workout.title,
            duration_minutes: durationMinutes,
            exercises_completed: exercisesCompleted,
            note: note
          });
        if (error) throw error;
        modalRoot.innerHTML = '';
        await refreshData();
        state.page = 'history';
        renderApp();
        toast('Sessão registrada no Supabase. Mandou muito bem!');
        return;
      } catch (err) {
        toast('Erro no Supabase: ' + err.message, 'error');
        btn.disabled = false;
        return;
      }
    }

    try {
      await api(`/api/workouts/${encodeURIComponent(workout.id)}/complete`, {
        method: 'POST',
        body: JSON.stringify({ durationMinutes, exercisesCompleted, note })
      });
      modalRoot.innerHTML = '';
      await refreshData();
      state.page = 'history';
      renderApp();
      toast('Sessão registrada no histórico.');
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
    }
  });
}

/**
 * TIMER DE DESCANSO ENTRE SÉRIES
 */
function openRestTimer(seconds = 90) {
  let remaining = seconds;
  const overlay = document.createElement('div');
  overlay.className = 'rest-timer-overlay';
  overlay.id = 'rest-timer';
  function updateDisplay() {
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    overlay.innerHTML = `
      <div class="rest-timer-label">${icon('timer')} Tempo de descanso</div>
      <div class="rest-timer-display">${min}:${String(sec).padStart(2, '0')}</div>
      <div class="rest-timer-actions">
        <button class="btn btn-outline" data-action="cancel-timer">Pular</button>
        <button class="btn btn-primary" data-action="cancel-timer">${icon('check')} Pronto!</button>
      </div>
    `;
    hydrateIcons(overlay);
  }
  updateDisplay();
  document.body.appendChild(overlay);
  const interval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(interval);
      overlay.remove();
      toast('Descanso finalizado! Vamos para a próxima série. 💪');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } else {
      updateDisplay();
    }
  }, 1000);
  overlay.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]');
    if (action?.dataset.action === 'cancel-timer') {
      clearInterval(interval);
      overlay.remove();
    }
  });
}

/**
 * MODAL DE CONFIGURAÇÃO DO SUPABASE
 */
function openSupabaseConfigModal(triggerGoogleAfter = false) {
  const currentUrl = state.supabaseUrl || localStorage.getItem('mogger_supabase_url') || '';
  const currentKey = state.supabaseAnonKey || localStorage.getItem('mogger_supabase_anon_key') || '';

  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <section class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <h3>Configurar Banco do Supabase</h3>
            <p>Conecte seu projeto Supabase para habilitar login com Google e persistência em nuvem.</p>
          </div>
          <button class="modal-close" data-action="close-modal">
            ${icon('x')}
          </button>
        </div>

        <form id="supabase-config-form">
          <div class="form-group">
            <label class="form-label" for="cfg-sb-url">URL do Projeto Supabase</label>
            <input class="field" id="cfg-sb-url" name="url" placeholder="https://seu-projeto.supabase.co" value="${esc(currentUrl)}" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="cfg-sb-key">Chave Anon do Supabase (Pública)</label>
            <input class="field" id="cfg-sb-key" name="key" type="password" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." value="${esc(currentKey)}" required />
          </div>

          <div class="summary-callout" style="margin-top:0.5rem">
            <b>Dica de configuração:</b><br>
            Execute o arquivo <code>supabase-schema.sql</code> no SQL Editor do seu Supabase para criar as tabelas com segurança (RLS). No Supabase Dashboard, habilite o provider <b>Google</b> em <i>Authentication → Providers</i>.
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" data-action="close-modal">Fechar</button>
            <button type="submit" class="btn btn-primary">
              ${icon('check')} Salvar &amp; Conectar
            </button>
          </div>
        </form>
      </section>
    </div>`;

  hydrateIcons(modalRoot);
  document.getElementById('supabase-config-form').addEventListener('submit', async e => {
    e.preventDefault();
    const url = document.getElementById('cfg-sb-url').value.trim();
    const key = document.getElementById('cfg-sb-key').value.trim();
    if (!url || !key) {
      toast('Preencha a URL e a Anon Key.', 'error');
      return;
    }
    state.supabaseUrl = url;
    state.supabaseAnonKey = key;
    localStorage.setItem('mogger_supabase_url', url);
    localStorage.setItem('mogger_supabase_anon_key', key);
    state.supabaseClient = null; // Reinicializa client
    getSupabase();
    modalRoot.innerHTML = '';
    toast('Supabase configurado com sucesso!');

    if (triggerGoogleAfter) {
      signInWithGoogle();
    }
  });
}

function openUserProfileModal() {
  if (!state.user) return;
  const userAvatar = state.user.avatar
    ? `<img src="${esc(state.user.avatar)}" alt="${esc(state.user.name)}" />`
    : esc(initials(state.user.name));

  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <section class="modal modal-sheet" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div style="display:flex;align-items:center;gap:0.85rem">
            <div class="avatar" style="width:3rem;height:3rem;font-size:1.15rem">${userAvatar}</div>
            <div>
              <h3 style="font-size:1.15rem">${esc(state.user.name)}</h3>
              <p style="font-size:0.82rem">${esc(state.user.email)}</p>
            </div>
          </div>
          <button class="modal-close" data-action="close-modal" aria-label="Fechar">${icon('x')}</button>
        </div>

        <div style="display:flex;flex-direction:column;gap:0.75rem;margin:1.2rem 0">
          <div class="panel" style="padding:0.9rem;background:hsl(var(--popover))">
            <div style="font-size:0.72rem;color:hsl(var(--muted-foreground));font-weight:700;text-transform:uppercase;margin-bottom:6px">Status da Conta</div>
            <div style="display:flex;align-items:center;gap:0.5rem">
              <span class="status-chip">${state.authProvider === 'supabase' ? 'Google / Supabase' : (state.user.role === 'admin' ? 'Administrador' : 'Membro Mogger')}</span>
            </div>
          </div>

          <div class="panel" style="padding:0.9rem;background:hsl(var(--popover))">
            <div style="font-size:0.72rem;color:hsl(var(--muted-foreground));font-weight:700;text-transform:uppercase;margin-bottom:8px">Escala de Resolução</div>
            <div class="scale-selector" style="display:flex;width:100%">
              <button class="scale-btn ${state.resolutionScale==='100'?'active':''}" style="flex:1;padding:8px" data-action="set-scale" data-scale="100">100%</button>
              <button class="scale-btn ${state.resolutionScale==='125'?'active':''}" style="flex:1;padding:8px" data-action="set-scale" data-scale="125">125%</button>
              <button class="scale-btn ${state.resolutionScale==='150'?'active':''}" style="flex:1;padding:8px" data-action="set-scale" data-scale="150">150%</button>
            </div>
          </div>

          <button class="btn btn-outline" data-action="open-supabase-modal" style="width:100%;justify-content:flex-start;padding:0.85rem">
            ${icon('settings')} Configurar Banco Supabase
          </button>
        </div>

        <div class="modal-actions" style="margin-top:1.2rem">
          <button class="btn btn-danger" data-action="logout" style="width:100%;padding:0.85rem;justify-content:center">
            ${icon('logout')} Sair da conta
          </button>
        </div>
      </section>
    </div>`;

  hydrateIcons(modalRoot);
}

function openUserModal(userId = null) {
  const user = state.users.find(u => u.id === userId);
  const editing = Boolean(user);
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <section class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <h3>${editing ? 'Redefinir senha' : 'Criar conta de usuário'}</h3>
            <p>${editing ? 'Crie uma nova senha para o membro.' : 'Cadastre um novo membro no Mogger Gym.'}</p>
          </div>
          <button class="modal-close" data-action="close-modal">${icon('x')}</button>
        </div>
        <form id="user-form">
          ${editing ? '' : `
            <div class="form-group">
              <label class="form-label">Nome completo</label>
              <input class="field" name="name" maxlength="80" required placeholder="Nome do atleta" />
            </div>
            <div class="form-group">
              <label class="form-label">E-mail</label>
              <input class="field" name="email" type="email" maxlength="254" required placeholder="atleta@email.com" />
            </div>
          `}
          <div class="form-group">
            <label class="form-label">${editing ? 'Nova senha' : 'Senha inicial'}</label>
            <input class="field" name="password" type="password" minlength="10" required autocomplete="new-password" placeholder="Mínimo 10 caracteres" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirmar senha</label>
            <input class="field" name="confirm" type="password" minlength="10" required autocomplete="new-password" placeholder="Repita a senha" />
          </div>
          <div class="form-error" id="user-form-error"></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" data-action="close-modal">Cancelar</button>
            <button type="submit" class="btn btn-primary">${editing ? 'Salvar nova senha' : 'Criar conta'}</button>
          </div>
        </form>
      </section>
    </div>`;

  hydrateIcons(modalRoot);
  document.getElementById('user-form').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const error = document.getElementById('user-form-error');
    hideError(error);
    const password = form.elements.password.value;
    const confirm = form.elements.confirm.value;
    if (password !== confirm) { showError(error, 'As senhas digitadas não coincidem.'); return; }
    if (password.length < 10) { showError(error, 'A senha precisa ter pelo menos 10 caracteres.'); return; }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      if (editing) {
        await api(`/api/admin/users/${encodeURIComponent(user.id)}`, { method:'PATCH', body:JSON.stringify({ password }) });
      } else {
        await api('/api/admin/users', { method:'POST', body:JSON.stringify({ name:form.elements.name.value, email:form.elements.email.value, password }) });
      }
      modalRoot.innerHTML = '';
      await refreshData();
      renderApp();
      toast(editing ? 'Senha redefinida com sucesso.' : 'Membro cadastrado com sucesso.');
    } catch (err) {
      showError(error, err.message);
      btn.disabled = false;
    }
  });
}

function confirmDeleteWorkout(workoutId) {
  const workout = state.workouts.find(w => w.id === workoutId);
  if (!workout) return;
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <section class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <h3>Excluir treino?</h3>
            <p>Esta rotina será excluída permanentemente.</p>
          </div>
          <button class="modal-close" data-action="close-modal">${icon('x')}</button>
        </div>
        <div style="padding:1rem;background:rgba(239,68,68,0.12);border-radius:var(--radius-md);color:#fca5a5;font-size:0.9rem">
          Você está excluindo <b>${esc(workout.title)}</b>. Esta ação não poderá ser desfeita.
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" data-action="close-modal">Cancelar</button>
          <button class="btn btn-danger" data-action="confirm-delete-workout" data-id="${esc(workout.id)}">Excluir treino</button>
        </div>
      </section>
    </div>`;
  hydrateIcons(modalRoot);
}

function confirmDeleteUser(userId) {
  const user = state.users.find(u => u.id === userId);
  if (!user) return;
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="backdrop-close">
      <section class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <h3>Remover usuário?</h3>
            <p>A conta e os treinos deste atleta serão apagados.</p>
          </div>
          <button class="modal-close" data-action="close-modal">${icon('x')}</button>
        </div>
        <div style="padding:1rem;background:rgba(239,68,68,0.12);border-radius:var(--radius-md);color:#fca5a5;font-size:0.9rem">
          Remover <b>${esc(user.name)}</b> (${esc(user.email)}).
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" data-action="close-modal">Cancelar</button>
          <button class="btn btn-danger" data-action="confirm-delete-user" data-id="${esc(user.id)}">Remover</button>
        </div>
      </section>
    </div>`;
  hydrateIcons(modalRoot);
}

/* ==============================================================================
   LOGOUT UNIFICADO (SUPABASE + LOCAL)
   ============================================================================== */
async function logout() {
  const sb = getSupabase();
  if (sb) {
    try { await sb.auth.signOut(); } catch (e) { /* ignore */ }
  }
  try {
    await api('/api/auth/logout', { method:'POST', body:'{}' });
  } catch { /* ignore */ }

  state.user = null;
  state.authProvider = 'local';
  state.workouts = [];
  state.logs = [];
  state.users = [];
  state.stats = {};
  state.draft = null;
  state.editingWorkoutId = null;
  modalRoot.innerHTML = '';
  renderLogin();
}

/* ==============================================================================
   DISPATCHER GLOBAL DE EVENTOS (CLICK)
   ============================================================================== */
document.addEventListener('click', async event => {
  // Navegação de páginas
  const nav = event.target.closest('[data-page]');
  if (nav) {
    const page = nav.dataset.page;
    if (page === 'builder') return;
    if (page === 'users' && state.user?.role !== 'admin') return;
    state.page = page;
    renderApp();
    if (page === 'library' && !state.exercisesReady) loadExercises();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // Ações de botões e links
  const el = event.target.closest('[data-action]');
  if (!el) return;

  const action = el.dataset.action;
  const idValue = el.dataset.id;

  switch (action) {
    case 'set-scale': {
      const scale = el.dataset.scale;
      if (scale) applyScale(scale);
      break;
    }
    case 'login-google':
      await signInWithGoogle();
      break;
    case 'open-supabase-modal':
      openSupabaseConfigModal();
      break;
    case 'open-user-profile':
      openUserProfileModal();
      break;
    case 'set-auth-tab': {
      const tab = el.dataset.tab;
      if (tab) {
        state.authTab = tab;
        renderLogin();
      }
      break;
    }
    case 'toggle-password': {
      const input = document.getElementById('login-password');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        el.textContent = input.type === 'password' ? 'Mostrar' : 'Ocultar';
      }
      break;
    }
    case 'toggle-register-password': {
      const pass = document.getElementById('register-password');
      const confirm = document.getElementById('register-confirm');
      if (pass) {
        const nextType = pass.type === 'password' ? 'text' : 'password';
        pass.type = nextType;
        if (confirm) confirm.type = nextType;
        el.textContent = nextType === 'password' ? 'Mostrar' : 'Ocultar';
      }
      break;
    }
    case 'logout':
      await logout();
      break;
    case 'new-workout':
      openNewWorkout();
      break;
    case 'view-workout':
      openViewWorkout(idValue);
      break;
    case 'edit-workout':
      openEditWorkout(idValue);
      break;
    case 'save-workout':
      await saveWorkout();
      break;
    case 'open-exercise-picker':
      if (!state.exercisesReady) await loadExercises();
      openPicker();
      break;
    case 'close-modal':
      modalRoot.innerHTML = '';
      break;
    case 'backdrop-close':
      if (event.target === el) modalRoot.innerHTML = '';
      break;
    case 'picker-add':
      addExercise(idValue);
      break;
    case 'add-exercise':
      if (modalRoot.childElementCount) modalRoot.innerHTML = '';
      if (!state.draft) {
        state.draft = newDraft();
        state.editingWorkoutId = null;
        state.page = 'builder';
        renderApp();
        addExercise(idValue);
      } else {
        addExercise(idValue);
      }
      break;
    case 'remove-draft-exercise': {
      const i = Number(el.dataset.index);
      state.draft.exercises.splice(i, 1);
      const wrap = document.getElementById('builder-exercises');
      if (wrap) {
        wrap.innerHTML = renderBuilderExercises();
        hydrateIcons(wrap);
      }
      const c = document.getElementById('summary-count');
      if (c) c.textContent = state.draft.exercises.length;
      const s = document.getElementById('summary-sets');
      if (s) s.textContent = draftSetCount(state.draft);
      wireBuilderInputsOnly();
      break;
    }
    case 'load-more':
      state.exerciseLimit += 18;
      refreshExerciseResults(false);
      break;
    case 'clear-exercise-filters':
      clearExerciseFilters();
      break;
    case 'go-library':
      state.page = 'library';
      renderApp();
      if (!state.exercisesReady) loadExercises();
      break;
    case 'complete-workout':
      openCompleteModal(idValue);
      break;
    case 'delete-workout':
      confirmDeleteWorkout(idValue);
      break;
    case 'confirm-delete-workout':
      await deleteWorkout(idValue);
      break;
    case 'create-user':
      openUserModal();
      break;
    case 'reset-user-password':
      openUserModal(idValue);
      break;
    case 'toggle-user': {
      const active = el.dataset.active === 'true';
      try {
        await api(`/api/admin/users/${encodeURIComponent(idValue)}`, { method:'PATCH', body:JSON.stringify({ active }) });
        await refreshData();
        renderApp();
        toast(active ? 'Conta ativada.' : 'Conta desativada.');
      } catch (err) {
        toast(err.message, 'error');
      }
      break;
    }
    case 'delete-user':
      confirmDeleteUser(idValue);
      break;
    case 'confirm-delete-user':
      try {
        await api(`/api/admin/users/${encodeURIComponent(idValue)}`, { method:'DELETE' });
        modalRoot.innerHTML = '';
        await refreshData();
        renderApp();
        toast('Conta removida com sucesso.');
      } catch (err) {
        toast(err.message, 'error');
      }
      break;
    case 'duplicate-workout':
      await duplicateWorkout(idValue);
      break;
    case 'start-rest-timer': {
      const restTime = Number(el.dataset.rest) || 90;
      openRestTimer(restTime);
      break;
    }
    case 'cancel-timer':
      break;
    case 'exercise-details': {
      const ex = state.exercises.find(e => String(e.id) === String(idValue));
      if (ex) openExerciseDetails(ex);
      break;
    }
  }
});

// Inicialização automática
boot();
