import { useState, useEffect, useCallback } from "react";
import { initBlockchain, connectWallet, mintBadge, getBadgesOfAddress, getGasPrice, formatTxHash } from "./blockchain";

// ============ TAILWIND CONFIG (custom colors via inline styles) ============
const THEME_VARS = {
  light: {
    '--bg': '#F0F4FF',
    '--bg2': '#FFFFFF',
    '--text': '#0D1B2A',
    '--text2': '#5A7184',
    '--border': '#DDE5F0',
    '--primary': '#009E60',
    '--primary-l': '#00D48C',
    '--primary-d': '#006B45',
    '--accent': '#EFB034',
    '--danger': '#DE3125',
    '--shadow': '0 4px 20px rgba(0,0,0,0.07)',
  },
  dark: {
    '--bg': '#08090E',
    '--bg2': '#111318',
    '--text': '#EAEEF5',
    '--text2': '#6B7280',
    '--border': '#1E2130',
    '--primary': '#00C47A',
    '--primary-l': '#00FFB3',
    '--primary-d': '#008B56',
    '--accent': '#F5C842',
    '--danger': '#FF4D3D',
    '--shadow': '0 4px 20px rgba(0,0,0,0.4)',
  },
};

// ============ INITIAL DATA ============
const INITIAL_DATA = {
  badges: [
    { id: 1, name: "React.js Avancé", skill: "Développement Web", level: "Avancé", issuer: "Koanda Tinga", date: "12 avr. 2026", tx: "0xa83f7d_c91b4e" },
    { id: 2, name: "Flutter Débutant", skill: "Développement Mobile", level: "Débutant", issuer: "Koanda Tinga", date: "10 mars 2026", tx: "0x9d2c_b4e" },
    { id: 3, name: "UI/UX Design", skill: "UI/UX Design", level: "Intermédiaire", issuer: "Koanda Tinga", date: "05 fév. 2026", tx: "0x3e8a_c7" },
    { id: 4, name: "Data Python", skill: "Data & IA", level: "Débutant", issuer: "Koanda Tinga", date: "20 jan. 2026", tx: "0x1f4d_e9" },
  ],
  students: [
    { id: 1, name: "Oumar Sawadogo", avatar: "OS", wallet: "0xOumar...3f2a", city: "Ouaga", badges: ["React.js Avancé", "Flutter Débutant", "UI/UX Design"], score: 86 },
    { id: 2, name: "Aminata Koné", avatar: "AK", wallet: "0xAminata...7b4e", city: "Bobo", badges: ["Flutter Débutant", "UI/UX Design"], score: 74 },
    { id: 3, name: "Yannick Dabiré", avatar: "YD", wallet: "0xYannick...9d2c", city: "Ouaga", badges: ["React.js Avancé"], score: 68 },
    { id: 4, name: "Fatou B.", avatar: "FB", wallet: "0xFatou...8e3a", city: "Ouaga", badges: ["Data Python"], score: 62 },
  ],
  activities: [
    "Badge React.js attribué à Oumar S. · Il y a 2h",
    "Nouveau badge Flutter créé · Hier",
    "3 vérifications de portfolio aujourd'hui",
  ],
  notifications: [
    { text: "Nouveau badge reçu ! React.js Avancé certifié par Koanda Tinga", time: "il y a 21h", type: "badge" },
    { text: "Votre portfolio a été consulté · Une entreprise a vérifié vos badges", time: "il y a 5h", type: "view" },
    { text: "Badge disponible · CodeLab BF propose un nouveau badge Data / Python", time: "Hier", type: "info" },
  ],
};

const INITIAL_USERS = [
  { id: 1, name: "Oumar Sawadogo", email: "oumar@skillbadge.bf", phone: "+226 70 00 00 01", password: "123456", role: "apprenant", avatar: "OS" },
  { id: 2, name: "Koanda Tinga", email: "koanda@codelab.bf", phone: "+226 70 00 00 02", password: "123456", role: "formateur", avatar: "KT" },
];

// ============ HELPERS ============
function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  const set = useCallback((v) => {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);
  return [val, set];
}

function Avatar({ initials, size = 36 }) {
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.35, fontFamily: 'inherit' }}>
      {initials}
    </div>
  );
}

function Badge({ children, color = 'primary', small }) {
  const bg = color === 'primary' ? 'rgba(0,158,96,0.15)' : color === 'warning' ? 'rgba(239,176,52,0.15)' : 'rgba(222,49,37,0.15)';
  const tc = color === 'primary' ? 'var(--primary-l)' : color === 'warning' ? 'var(--accent)' : 'var(--danger)';
  return <span style={{ background: bg, color: tc, padding: small ? '2px 8px' : '4px 12px', borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{children}</span>;
}

function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--primary)', color: '#fff', padding: '12px 20px', borderRadius: 40, zIndex: 9999, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8, animation: 'slideIn 0.3s ease' }}>
      <span>✓</span> {message}
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div style={{ background: 'var(--border)', borderRadius: 20, height: 6, overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--primary-l))', borderRadius: 20, transition: 'width 0.5s' }} />
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background: 'var(--bg2)', borderRadius: 20, border: '1px solid var(--border)', padding: 20, boxShadow: 'var(--shadow)', ...style }}>{children}</div>;
}

function Btn({ children, onClick, outline, style, disabled, small }) {
  if (outline) return (
    <button onClick={onClick} disabled={disabled} style={{ background: 'transparent', border: '1px solid var(--border)', padding: small ? '6px 14px' : '10px 20px', borderRadius: 40, color: 'var(--text)', cursor: 'pointer', fontSize: small ? 12 : 14, fontFamily: 'inherit', transition: 'all 0.2s', ...style }}>
      {children}
    </button>
  );
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-l))', border: 'none', padding: small ? '8px 16px' : '12px 24px', borderRadius: 40, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: small ? 12 : 14, fontFamily: 'inherit', transition: 'all 0.2s', opacity: disabled ? 0.6 : 1, ...style }}>
      {children}
    </button>
  );
}

function Input({ id, type = 'text', placeholder, value, onChange, label }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{label}</label>}
      <input id={id} type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width: '100%', padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

function Select({ id, value, onChange, label, options }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{label}</label>}
      <select id={id} value={value} onChange={onChange}
        style={{ width: '100%', padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Navbar({ title, icon, user, onLogout, onTheme }) {
  return (
    <nav style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '12px 0', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer' }} onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'home' }))}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--primary), var(--primary-l))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>{icon}</div>
          <span>Skill<span style={{ color: 'var(--primary-l)' }}>Badge</span>{title && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)', marginLeft: 6 }}>{title}</span>}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={onTheme} style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '7px 14px', borderRadius: 40, cursor: 'pointer', color: 'var(--text)', fontSize: 13 }}>☀️ 🌙</button>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={user.avatar} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</span>
              <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: 40, cursor: 'pointer', color: 'var(--text2)', fontSize: 13 }}>⎋ Déco</button>
            </div>
          )}
          {!user && (
            <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'home' }))} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '7px 14px', borderRadius: 40, cursor: 'pointer', color: 'var(--text)', fontSize: 13 }}>🏠 Accueil</button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ============ HOME ============
function Home({ onNavigate, onTheme }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
      <div style={{ background: 'var(--bg2)', borderRadius: 32, padding: 48, maxWidth: 800, width: '100%', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32, fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary), var(--primary-l))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22 }}>🎓</div>
          <span>Skill<span style={{ color: 'var(--primary-l)' }}>Badge</span></span>
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: 12, fontSize: 28, fontWeight: 800 }}>Bienvenue sur SkillBadge</h1>
        <p style={{ textAlign: 'center', color: 'var(--text2)', marginBottom: 40, fontSize: 15 }}>La plateforme de certification blockchain pour les talents du Burkina Faso</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, margin: '0 0 32px' }}>
          {[
            { icon: '🎓', title: 'Apprenant', desc: 'Consultez vos badges et votre progression', cta: 'Se connecter →', page: 'login' },
            { icon: '📋', title: 'Formateur', desc: 'Émettez des badges sur la blockchain', cta: 'Se connecter →', page: 'loginFormateur' },
            { icon: '🏢', title: 'Recruteur', desc: 'Vérifiez les compétences des candidats', cta: 'Accès libre →', page: 'recruteur' },
          ].map(r => (
            <div key={r.page} onClick={() => onNavigate(r.page)}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{r.icon}</div>
              <h3 style={{ marginBottom: 8, fontWeight: 700 }}>{r.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>{r.desc}</p>
              <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>{r.cta}</span>
            </div>
          ))}
        </div>
        
        {/* Bouton pour changer le thème */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button 
            onClick={onTheme} 
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: 40, cursor: 'pointer', color: 'var(--text)', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            ☀️ 🌙 Changer de thème
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ LOGIN APPRENANT ============
function Login({ users, onLogin, onNavigate, showToast }) {
  const [id, setId] = useState('');
  const [pwd, setPwd] = useState('');
  const handle = () => {
    const u = users.find(u => (u.email === id || u.phone === id) && u.password === pwd && u.role === 'apprenant');
    if (u) { onLogin(u); onNavigate('apprenant'); }
    else showToast('Identifiants incorrects');
  };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
      <div style={{ background: 'var(--bg2)', borderRadius: 32, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24, fontSize: 22, fontWeight: 800 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--primary), var(--primary-l))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>🎓</div>
          <span>Skill<span style={{ color: 'var(--primary-l)' }}>Badge</span></span>
        </div>
        <h2 style={{ marginBottom: 24, fontWeight: 800 }}>Connexion Apprenant</h2>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16, background: 'var(--bg)', padding: '8px 12px', borderRadius: 10 }}>Demo: oumar@skillbadge.bf / 123456</p>
        <Input label="📧 Email ou téléphone" placeholder="exemple@email.com" value={id} onChange={e => setId(e.target.value)} />
        <Input label="🔒 Mot de passe" type="password" placeholder="••••••••" value={pwd} onChange={e => setPwd(e.target.value)} />
        <Btn onClick={handle} style={{ width: '100%', marginBottom: 16 }}>Se connecter</Btn>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 12 }}>Pas de compte ? <span onClick={() => onNavigate('register')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>S'inscrire</span></p>
        <Btn outline onClick={() => onNavigate('home')} style={{ width: '100%' }}>← Retour à l'accueil</Btn>
      </div>
    </div>
  );
}

// ============ LOGIN FORMATEUR ============
function LoginFormateur({ users, onLogin, onNavigate, showToast }) {
  const [id, setId] = useState('');
  const [pwd, setPwd] = useState('');
  const handle = () => {
    const u = users.find(u => (u.email === id || u.phone === id) && u.password === pwd && u.role === 'formateur');
    if (u) { onLogin(u); onNavigate('formateur'); }
    else showToast('Identifiants formateur incorrects');
  };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
      <div style={{ background: 'var(--bg2)', borderRadius: 32, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24, fontSize: 22, fontWeight: 800 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--primary), var(--primary-l))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>📋</div>
          <span>Skill<span style={{ color: 'var(--primary-l)' }}>Badge</span> Formateur</span>
        </div>
        <h2 style={{ marginBottom: 24, fontWeight: 800 }}>Connexion Formateur</h2>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16, background: 'var(--bg)', padding: '8px 12px', borderRadius: 10 }}>Demo: koanda@codelab.bf / 123456</p>
        <Input label="📧 Email ou téléphone" placeholder="email@formateur.com" value={id} onChange={e => setId(e.target.value)} />
        <Input label="🔒 Mot de passe" type="password" placeholder="••••••••" value={pwd} onChange={e => setPwd(e.target.value)} />
        <Btn onClick={handle} style={{ width: '100%', marginBottom: 16 }}>Se connecter</Btn>
        <Btn outline onClick={() => onNavigate('home')} style={{ width: '100%' }}>← Retour à l'accueil</Btn>
      </div>
    </div>
  );
}

// ============ REGISTER ============
function Register({ users, setUsers, onLogin, onNavigate, showToast }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handle = () => {
    if (!form.name || !form.email || !form.phone || !form.password) { showToast('Tous les champs sont requis'); return; }
    if (form.password !== form.confirm) { showToast('Mots de passe différents'); return; }
    if (users.find(u => u.email === form.email)) { showToast('Email déjà utilisé'); return; }
    const initials = form.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const nu = { id: Date.now(), name: form.name, email: form.email, phone: form.phone, password: form.password, role: 'apprenant', avatar: initials };
    setUsers([...users, nu]);
    onLogin(nu);
    onNavigate('apprenant');
  };
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
      <div style={{ background: 'var(--bg2)', borderRadius: 32, padding: 40, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24, fontSize: 22, fontWeight: 800 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--primary), var(--primary-l))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>🎓</div>
          <span>Skill<span style={{ color: 'var(--primary-l)' }}>Badge</span></span>
        </div>
        <h2 style={{ marginBottom: 24, fontWeight: 800 }}>Inscription Apprenant</h2>
        <Input label="👤 Nom complet" placeholder="Oumar Sawadogo" value={form.name} onChange={set('name')} />
        <Input label="📧 Email" type="email" placeholder="exemple@email.com" value={form.email} onChange={set('email')} />
        <Input label="📱 Téléphone" type="tel" placeholder="+226 XX XX XX XX" value={form.phone} onChange={set('phone')} />
        <Input label="🔒 Mot de passe" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
        <Input label="🔒 Confirmer" type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} />
        <Btn onClick={handle} style={{ width: '100%', marginBottom: 12 }}>Créer mon compte</Btn>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 12 }}>Déjà un compte ? <span onClick={() => onNavigate('login')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>Se connecter</span></p>
        <Btn outline onClick={() => onNavigate('home')} style={{ width: '100%' }}>← Retour à l'accueil</Btn>
      </div>
    </div>
  );
}

// ============ APPRENANT DASHBOARD ============
function Apprenant({ currentUser, data, onLogout, onNavigate, onTheme, showToast }) {
  const [filter, setFilter] = useState('all');
  const student = data.students[0];
  const progress = Math.min(100, student.badges.length * 12 + 20);

  const getBadgeInfo = name => data.badges.find(b => b.name === name) || { level: 'Intermédiaire', issuer: 'CodeLab BF', date: '2026', tx: '0x...' };
  const levelColor = l => l === 'Avancé' ? 'danger' : l === 'Intermédiaire' ? 'warning' : 'primary';

  let filtered = student.badges.map(n => ({ name: n, ...getBadgeInfo(n) }));
  if (filter === 'expert') filtered = filtered.filter(b => b.level === 'Avancé');
  else if (filter === 'inter') filtered = filtered.filter(b => b.level === 'Intermédiaire');
  else if (filter === 'debutant') filtered = filtered.filter(b => b.level === 'Débutant');

  const recommended = data.badges.filter(b => !student.badges.includes(b.name)).slice(0, 3);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar title="Apprenant" icon="🎓" user={currentUser} onLogout={onLogout} onTheme={onTheme} />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div><h2 style={{ fontWeight: 800, marginBottom: 4 }}>{student.name}</h2><p style={{ color: 'var(--text2)', fontSize: 14 }}>📍 Ouagadougou, Burkina Faso</p></div>
          <div style={{ background: 'var(--bg2)', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)' }}>📈 Progression: {progress}%</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { icon: '🏅', num: student.badges.length, label: 'Badges obtenus' },
            { icon: '👁️', num: Math.floor(Math.random() * 40 + 10), label: 'Vues portfolio' },
            { icon: '🤝', num: Math.floor(Math.random() * 4), label: 'Offres reçues' },
            { icon: '🏆', num: progress, label: '% complétion' },
          ].map((s, i) => (
            <Card key={i} style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div>
              <p style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</p>
            </Card>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h3 style={{ fontWeight: 700 }}>🎓 Mes badges</h3><Badge>{filtered.length} badges</Badge></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[['all', 'Tous'], ['expert', '🔴 Experts'], ['inter', '🟡 Interm.'], ['debutant', '🟢 Débutants']].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 14px', borderRadius: 40, border: '1px solid var(--border)', background: filter === v ? 'var(--primary)' : 'var(--bg)', color: filter === v ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: filter === v ? 700 : 400 }}>{l}</button>
              ))}
            </div>
            {filtered.length === 0 ? <p style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>Aucun badge dans cette catégorie</p> : filtered.map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderRadius: 12, padding: '10px 14px', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>🏅 {b.name}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Badge color={levelColor(b.level)} small>{b.level}</Badge><Badge small>✓ Vérifié</Badge></div>
              </div>
            ))}
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>ℹ️ Dernier badge</h3>
              {student.badges.length > 0 && (() => {
                const b = getBadgeInfo(student.badges[0]);
                return (
                  <div style={{ background: 'var(--bg)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🏅</div>
                    <h4 style={{ marginBottom: 4 }}>{b.name || student.badges[0]}</h4>
                    <Badge>{b.level}</Badge>
                    <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>📅 {b.date}</p>
                    <p style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'monospace' }}>⛓️ {b.tx}</p>
                    <Btn small onClick={() => { navigator.clipboard?.writeText(`Badge "${student.badges[0]}" certifié SkillBadge!`); showToast('Badge partagé !'); }} style={{ marginTop: 10 }}>📤 Partager</Btn>
                  </div>
                );
              })()}
            </Card>
            <Card>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🔔 Notifications</h3>
              {data.notifications.slice(0, 3).map((n, i) => (
                <div key={i} style={{ background: 'var(--bg)', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <p style={{ fontSize: 13, marginBottom: 4 }}>{n.text}</p>
                  <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'monospace' }}>{n.time}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>

        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🔗 Partager mon portfolio</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            <div style={{ textAlign: 'center', background: 'var(--bg)', borderRadius: 16, padding: 20 }}>
              <div style={{ width: 100, height: 100, background: 'white', borderRadius: 14, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>▦</div>
              <p style={{ fontSize: 12, color: 'var(--text2)' }}>Scannez ce QR code</p>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <code style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 40, flex: 1, fontSize: 12, wordBreak: 'break-all' }}>https://skillbadge.bf/{student.wallet}</code>
                <Btn small onClick={() => { navigator.clipboard?.writeText(`https://skillbadge.bf/${student.wallet}`); showToast('Lien copié !'); }}>📋 Copier</Btn>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['💬 WhatsApp', '#25D366'], ['💼 LinkedIn', '#0077B5'], ['📧 Email', '#EA4335']].map(([l, c]) => (
                  <button key={l} style={{ background: c, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 40, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }} onClick={() => showToast(`Partagé via ${l.split(' ')[1]}!`)}>{l}</button>
                ))}
                <Btn outline small onClick={() => showToast('Export PDF...')}>📄 PDF</Btn>
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <Card><h3 style={{ fontWeight: 700, marginBottom: 16 }}>📊 Ma progression</h3>{[['React.js', 85], ['Flutter', 60], ['UI/UX Design', 45], ['Python', 30]].map(([s, v]) => (<div key={s} style={{ marginBottom: 12 }}><p style={{ fontSize: 13, marginBottom: 5 }}>{s}</p><ProgressBar value={v} /></div>))}</Card>
          <Card><h3 style={{ fontWeight: 700, marginBottom: 16 }}>💡 Badges recommandés</h3>{recommended.length === 0 ? <p style={{ color: 'var(--text2)', fontSize: 13 }}>🎉 Vous avez tous les badges disponibles !</p> : recommended.map((b, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}><span style={{ fontSize: 13, fontWeight: 600 }}>💎 {b.name}</span><Btn small onClick={() => showToast(`Demande envoyée pour "${b.name}"`)}>Postuler →</Btn></div>))}<h3 style={{ fontWeight: 700, margin: '16px 0 12px' }}>🏆 Accomplissements</h3><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['🚀 Premier badge', '📈 Multi-skills', '✨ Vérifié blockchain'].map(a => (<span key={a} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', fontSize: 11 }}>{a}</span>))}</div></Card>
        </div>
      </div>
    </div>
  );
}

// ============ FORMATEUR DASHBOARD ============
function Formateur({ currentUser, data, setData, onLogout, onNavigate, onTheme, showToast }) {
  const [badgeName, setBadgeName] = useState('');
  const [badgeSkill, setBadgeSkill] = useState('Développement Web');
  const [badgeLevel, setBadgeLevel] = useState('intermediaire');
  const [badgeDesc, setBadgeDesc] = useState('');
  const [assignBadge, setAssignBadge] = useState('');
  const [assignStudent, setAssignStudent] = useState('');
  const [assignComment, setAssignComment] = useState('');
  const [badgeFilter, setBadgeFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const [useRealBlockchain, setUseRealBlockchain] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [gasPrice, setGasPrice] = useState('0');

  const levelMap = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
  const skillIcon = s => ({ 'Développement Web': '⚛️', 'Développement Mobile': '📱', 'Data & IA': '🐍', 'Cybersécurité': '🔒', 'UI/UX Design': '🎨' }[s] || '💻');

  // Connecter MetaMask
  const connectMetaMask = async () => {
    const result = await connectWallet();
    if (result.success) {
      setWalletConnected(true);
      setWalletAddress(result.address);
      const price = await getGasPrice();
      setGasPrice(parseFloat(price).toFixed(2));
      showToast(`✅ Wallet connecté: ${result.address.substring(0, 8)}...`);
    } else {
      showToast(`❌ Erreur: ${result.error}`);
    }
  };

  const createBadge = async () => {
    if (!badgeName) { showToast('Entrez un nom de badge'); return; }
    
    let txHash;
    if (useRealBlockchain && walletConnected) {
      showToast('⏳ Émission du badge sur Polygon...');
      const result = await mintBadge(
        '0x' + '0'.repeat(40),
        badgeName,
        levelMap[badgeLevel],
        `ipfs://metadata/${badgeName.replace(/\s/g, '_')}`
      );
      if (!result.success) {
        showToast(`❌ Erreur: ${result.error}`);
        return;
      }
      txHash = result.txHash;
      showToast(`✅ Badge émis sur Polygon! TX: ${formatTxHash(txHash)}`);
    } else {
      await new Promise(r => setTimeout(r, 800));
      txHash = '0x' + Math.random().toString(36).substring(2, 14);
      showToast(`🎉 Badge simulé: ${badgeName}`);
    }
    
    const nb = { id: Date.now(), name: badgeName, skill: badgeSkill, level: levelMap[badgeLevel], desc: badgeDesc, issuer: currentUser.name, date: new Date().toLocaleDateString('fr-FR'), tx: txHash };
    setData(d => ({ ...d, badges: [...d.badges, nb], activities: [`✅ Badge "${badgeName}" créé · TX: ${txHash}`, ...d.activities] }));
    setBadgeName(''); setBadgeDesc('');
  };

  const assignBadgeFn = async () => {
    if (!assignBadge || !assignStudent) { showToast('Sélectionnez un badge et un apprenant'); return; }
    setAssigning(true);
    await new Promise(r => setTimeout(r, 1200));
    const tx = '0x' + Math.random().toString(36).substring(2, 14);
    setData(d => {
      const newStudents = d.students.map(s => s.name === assignStudent ? { ...s, badges: [...s.badges, assignBadge], score: Math.min(100, s.score + 5) } : s);
      return { ...d, students: newStudents, activities: [`🏅 Badge "${assignBadge}" → ${assignStudent} · TX: ${tx}`, ...d.activities], notifications: [{ text: `Nouveau badge "${assignBadge}" reçu !`, time: "À l'instant", type: 'badge' }, ...d.notifications] };
    });
    showToast(`✅ Badge attribué à ${assignStudent} !`);
    setAssigning(false); setAssignComment('');
  };

  const exportCSV = () => {
    const csv = 'Nom,Compétence,Niveau,Date,TX\n' + data.badges.map(b => `"${b.name}","${b.skill}","${b.level}","${b.date}","${b.tx}"`).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'badges.csv'; a.click();
    showToast('📊 CSV exporté');
  };

  const filteredBadges = data.badges.filter(b => b.name.toLowerCase().includes(badgeFilter.toLowerCase()));
  const filteredStudents = data.students.filter(s => s.name.toLowerCase().includes(studentFilter.toLowerCase()));

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar title="Formateur" icon="📋" user={currentUser} onLogout={onLogout} onTheme={onTheme} />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div><h2 style={{ fontWeight: 800 }}>Tableau de bord Formateur</h2><p style={{ color: 'var(--text2)', fontSize: 14 }}>📋 CodeLab BF · Ouagadougou</p></div>
          <Badge>⛓️ Wallet: 0xKoanda...7b4e</Badge>
        </div>

        {/* Toggle Blockchain */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={useRealBlockchain} onChange={e => setUseRealBlockchain(e.target.checked)} style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>⛓️ Utiliser la vraie blockchain Polygon (Testnet)</span>
              </label>
            </div>
            {useRealBlockchain && !walletConnected && (
              <Btn onClick={connectMetaMask} small>🔌 Connecter MetaMask</Btn>
            )}
            {useRealBlockchain && walletConnected && (
              <Badge>✅ {walletAddress.substring(0, 10)}... · Gas: {gasPrice} Gwei</Badge>
            )}
          </div>
        </Card>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { icon: '🏅', num: data.badges.length, label: 'Badges émis', sub: '+12 ce mois' },
            { icon: '👥', num: data.students.length, label: 'Apprenants', sub: '+3 nouvelles inscriptions' },
            { icon: '📈', num: 94, label: 'Taux réussite', sub: null, progress: 94 },
            { icon: '⏳', num: 3, label: 'En attente', sub: null, btn: true },
          ].map((k, i) => (
            <Card key={i} style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 28 }}>{k.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{k.num}</div>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{k.label}</p>
              {k.sub && <span style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 20 }}>{k.sub}</span>}
              {k.progress && <ProgressBar value={k.progress} />}
              {k.btn && <Btn small outline onClick={() => showToast('3 badges en attente')} style={{ marginTop: 6, padding: '4px 10px', fontSize: 11 }}>Voir →</Btn>}
            </Card>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
          <Card>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>➕ Créer un badge</h3>
            <Input label="Nom du badge" placeholder="Ex: React.js Avancé" value={badgeName} onChange={e => setBadgeName(e.target.value)} />
            <Select label="Compétence" value={badgeSkill} onChange={e => setBadgeSkill(e.target.value)} options={['Développement Web', 'Développement Mobile', 'Data & IA', 'Cybersécurité', 'UI/UX Design'].map(v => ({ value: v, label: v }))} />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Niveau</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['debutant', '🟢 Débutant'], ['intermediaire', '🟡 Intermédiaire'], ['avance', '🔴 Avancé']].map(([v, l]) => (
                  <button key={v} onClick={() => setBadgeLevel(v)} style={{ flex: 1, padding: '8px 4px', borderRadius: 12, border: `1px solid ${badgeLevel === v ? 'var(--primary)' : 'var(--border)'}`, background: badgeLevel === v ? 'rgba(0,158,96,0.1)' : 'var(--bg)', color: badgeLevel === v ? 'var(--primary-l)' : 'var(--text)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Critères</label>
              <textarea rows={2} placeholder="Maîtrise des hooks, API REST..." value={badgeDesc} onChange={e => setBadgeDesc(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg2))', border: '1px solid var(--border)', borderRadius: 16, padding: 16, textAlign: 'center', marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: 18, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{skillIcon(badgeSkill)}</div>
              <h4 style={{ fontWeight: 700 }}>{badgeName || 'Nom du badge'}</h4>
              <Badge style={{ marginTop: 6 }}>{levelMap[badgeLevel]}</Badge>
              <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6 }}>{badgeDesc.substring(0, 50) || 'Description...'}</p>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 10 }}>⛓️ NFT sur Polygon · Frais est.: 0.0012 MATIC</p>
            <Btn onClick={createBadge} style={{ width: '100%' }}>⛏️ Créer sur blockchain</Btn>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>👤 Attribuer un badge</h3>
              <Select label="Badge" value={assignBadge} onChange={e => setAssignBadge(e.target.value)} options={[{ value: '', label: '-- Sélectionner --' }, ...data.badges.map(b => ({ value: b.name, label: `${b.name} (${b.level})` }))]} />
              <Select label="Apprenant" value={assignStudent} onChange={e => setAssignStudent(e.target.value)} options={[{ value: '', label: '-- Sélectionner --' }, ...data.students.map(s => ({ value: s.name, label: `${s.name} (${s.city})` }))]} />
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Note d'évaluation</label>
                <textarea rows={2} placeholder="Commentaire..." value={assignComment} onChange={e => setAssignComment(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 10 }}>🔒 Action irréversible sur la blockchain</p>
              <Btn onClick={assignBadgeFn} disabled={assigning} style={{ width: '100%' }}>{assigning ? '⏳ Émission...' : '⛓️ Émettre sur blockchain'}</Btn>
            </Card>
            <Card><h3 style={{ fontWeight: 700, marginBottom: 14 }}>📊 Statistiques</h3>{[['Débutants', 30], ['Intermédiaires', 45], ['Avancés', 25], ['Dév. Web', 65]].map(([l, v]) => (<div key={l} style={{ marginBottom: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}><span>{l}</span><span style={{ color: 'var(--text2)' }}>{v}%</span></div><ProgressBar value={v} /></div>))}</Card>
          </div>
        </div>

        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontWeight: 700 }}>📋 Mes badges créés</h3>
            <div style={{ display: 'flex', gap: 10 }}><input placeholder="🔍 Rechercher..." value={badgeFilter} onChange={e => setBadgeFilter(e.target.value)} style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }} /><Btn outline small onClick={exportCSV}>⬇️ Export CSV</Btn></div>
          </div>
          {filteredBadges.map((b, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderRadius: 12, padding: '10px 14px', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}><span style={{ fontSize: 14, fontWeight: 600 }}>🏷️ {b.name}</span><Badge>{b.level} · {b.skill}</Badge><span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'monospace' }}>TX: {b.tx}</span></div>))}
        </Card>

        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 14 }}>👥 Mes apprenants</h3>
          <input placeholder="🔍 Filtrer par nom..." value={studentFilter} onChange={e => setStudentFilter(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
          {filteredStudents.map((s, i) => (<div key={i} onClick={() => setShowModal(s)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', flexWrap: 'wrap', gap: 8 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Avatar initials={s.avatar} size={32} /><div><p style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</p><span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'monospace' }}>{s.wallet}</span></div></div><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Badge>{s.badges.length} badges</Badge><span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>Score {s.score}</span><Btn small outline onClick={e => { e.stopPropagation(); setAssignStudent(s.name); showToast(`Sélectionné: ${s.name}`); }}>+ Attribuer</Btn></div></div>))}
        </Card>

        <Card><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}><h3 style={{ fontWeight: 700 }}>⏱️ Activité blockchain récente</h3><Btn small outline onClick={() => showToast('Actualisé')}>🔄 Rafraîchir</Btn></div>{data.activities.slice(0, 5).map((a, i) => (<div key={i} style={{ background: 'var(--bg)', borderRadius: 12, padding: 12, marginBottom: 8, fontSize: 13 }}>⛓️ {a}</div>))}</Card>
      </div>

      {showModal && (<div onClick={() => setShowModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 24, padding: 32, maxWidth: 500, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><h3 style={{ fontWeight: 800 }}>{showModal.name}</h3><button onClick={() => setShowModal(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', color: 'var(--text)' }}>✕</button></div><p style={{ color: 'var(--text2)', marginBottom: 6 }}>📍 {showModal.city} · ⛓️ {showModal.wallet}</p><p style={{ marginBottom: 12, fontWeight: 600 }}>🏅 {showModal.badges.length} badges · Score {showModal.score}</p><ProgressBar value={showModal.score} /><div style={{ marginTop: 16 }}>{showModal.badges.map((b, i) => (<div key={i} style={{ background: 'var(--bg)', borderRadius: 10, padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}><span>{b}</span><Badge small>✓</Badge></div>))}</div><Btn onClick={() => { setAssignStudent(showModal.name); setShowModal(null); showToast(`Sélectionné: ${showModal.name}`); }} style={{ width: '100%', marginTop: 16 }}>➕ Attribuer un badge</Btn></div></div>)}
    </div>
  );
}

// ============ RECRUTEUR ============
function Recruteur({ data, onNavigate, onTheme, showToast }) {
  const [method, setMethod] = useState('manual');
  const [walletInput, setWalletInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skillFilter, setSkillFilter] = useState('all');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [shortlist, setShortlist] = useLocalStorage('skillbadge_shortlist', ['Oumar Sawadogo', 'Aminata Koné']);
  const [history, setHistory] = useLocalStorage('verif_history', []);
  const [useRealBlockchain, setUseRealBlockchain] = useState(false);

  const verify = async (student) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setResult(student);
    setHistory([{ name: student.name, time: new Date().toISOString() }, ...history.slice(0, 9)]);
    setLoading(false);
    showToast(`✅ Vérifié: ${student.name}`);
  };

  const verifyOnChain = async (address) => {
    setLoading(true);
    const result = await getBadgesOfAddress(address);
    if (result.success) {
      const mockStudent = {
        name: 'Candidat On-Chain',
        avatar: 'BC',
        city: 'Blockchain',
        badges: result.badges.map(b => `Badge #${b.id}`),
        score: 85,
        wallet: address
      };
      setResult(mockStudent);
      setHistory([{ name: mockStudent.name, time: new Date().toISOString() }, ...history.slice(0, 9)]);
      showToast(`✅ Vérifié on-chain: ${address.substring(0, 10)}...`);
    } else {
      showToast('⚠️ Adresse non trouvée');
    }
    setLoading(false);
  };

  const verifyByWallet = async () => {
    if (useRealBlockchain) {
      await verifyOnChain(walletInput);
    } else {
      const s = data.students.find(s => s.wallet.toLowerCase().includes(walletInput.toLowerCase()));
      if (s) await verify(s); else showToast('❌ Adresse introuvable');
    }
  };

  const verifyByName = async () => {
    const s = data.students.find(s => s.name.toLowerCase().includes(nameInput.toLowerCase()));
    if (s) await verify(s); else showToast('❌ Candidat introuvable');
  };

  const quickVerify = async (name) => {
    const s = data.students.find(st => st.name === name);
    if (s) { setNameInput(s.name); await verify(s); }
  };

  const addShortlist = () => {
    if (!result) return;
    if (!shortlist.includes(result.name)) { setShortlist([...shortlist, result.name]); showToast(`⭐ ${result.name} ajouté`); }
    else showToast('Déjà dans la shortlist');
  };

  let filteredCandidates = data.students.filter(s => s.name.toLowerCase().includes(candidateSearch.toLowerCase()));
  if (skillFilter !== 'all') filteredCandidates = filteredCandidates.filter(s => s.badges.some(b => b.toLowerCase().includes(skillFilter.toLowerCase())));

  const formatAgo = (dateStr) => {
    const d = new Date(dateStr);
    const sec = Math.floor((new Date() - d) / 1000);
    if (sec < 60) return "à l'instant";
    if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`;
    if (sec < 86400) return `il y a ${Math.floor(sec / 3600)}h`;
    return `il y a ${Math.floor(sec / 86400)}j`;
  };

  const totalBadges = data.students.reduce((s, st) => s + st.badges.length, 0);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar title="Recruteur" icon="🏢" user={null} onLogout={null} onTheme={onTheme} />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ marginBottom: 24 }}><h2 style={{ fontWeight: 800 }}>🔍 Portail Recruteur</h2><p style={{ color: 'var(--text2)', fontSize: 14 }}>Vérifiez instantanément les compétences d'un candidat sur la blockchain Polygon</p></div>

        {/* Toggle Blockchain */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={useRealBlockchain} onChange={e => setUseRealBlockchain(e.target.checked)} style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>⛓️ Utiliser la blockchain réelle (vérification on-chain)</span>
            </label>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { icon: '👥', num: data.students.length, label: 'Talents vérifiés' },
            { icon: '🏅', num: totalBadges, label: 'Badges émis' },
            { icon: '✅', num: Math.floor(Math.random() * 15 + 5), label: "Vérif. aujourd'hui" },
            { icon: '⚡', num: '<3s', label: 'Temps de vérif' },
          ].map((s, i) => (<Card key={i} style={{ textAlign: 'center', padding: 16 }}><div style={{ fontSize: 28 }}>{s.icon}</div><div style={{ fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div><p style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</p></Card>))}
        </div>

        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🔍 Vérifier un candidat</h3>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {[['wallet', '🔗 Wallet'], ['qr', '📱 QR Code'], ['manual', '🔍 Nom']].map(([v, l]) => (<button key={v} onClick={() => setMethod(v)} style={{ flex: 1, minWidth: 100, padding: '10px 14px', borderRadius: 14, border: `1px solid ${method === v ? 'var(--primary)' : 'var(--border)'}`, background: method === v ? 'rgba(0,158,96,0.1)' : 'var(--bg)', color: method === v ? 'var(--primary-l)' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: method === v ? 700 : 400 }}>{l}</button>))}
          </div>

          {method === 'wallet' && (<div><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><input placeholder={useRealBlockchain ? "0x..." : "0xOumar...3f2a"} value={walletInput} onChange={e => setWalletInput(e.target.value)} style={{ flex: 1, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontFamily: 'monospace', fontSize: 13, outline: 'none' }} /><Btn onClick={verifyByWallet} disabled={loading}>{loading ? '⏳' : '✓ Vérifier'}</Btn></div>{!useRealBlockchain && (<div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>{data.students.map(s => (<button key={s.name} onClick={() => { setWalletInput(s.wallet); }} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>📋 {s.name.split(' ')[0]}</button>))}</div>)}</div>)}

          {method === 'qr' && (<div style={{ textAlign: 'center', padding: 24, background: 'var(--bg)', borderRadius: 16 }}><div style={{ fontSize: 72, marginBottom: 12 }}>▦</div><p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>Scannez le QR code présenté par le candidat</p><Btn onClick={() => verify(data.students[0])}>📷 Simuler un scan</Btn></div>)}

          {method === 'manual' && (<div><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><input placeholder="Nom du candidat..." value={nameInput} onChange={e => setNameInput(e.target.value)} style={{ flex: 1, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }} /><Btn onClick={verifyByName} disabled={loading}>{loading ? '⏳' : '🔍 Rechercher'}</Btn></div><div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>{data.students.map(s => (<button key={s.name} onClick={() => quickVerify(s.name)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>👤 {s.name}</button>))}</div></div>)}
        </Card>

        {result && (<div style={{ background: 'rgba(0,158,96,0.07)', border: '1px solid var(--primary)', borderLeft: '4px solid var(--primary)', borderRadius: 20, padding: 24, marginBottom: 24, animation: 'fadeIn 0.3s' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><Avatar initials={result.avatar} size={48} /><div><h3 style={{ fontWeight: 800, fontSize: 20 }}>{result.name}</h3><p style={{ color: 'var(--text2)', fontSize: 13 }}>{result.badges.length} badges valides · {result.city}</p></div></div><div style={{ fontSize: 40, fontWeight: 800, background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{result.score}</div></div><div style={{ background: 'var(--bg)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 12, fontFamily: 'monospace', color: 'var(--text2)' }}>⛓️ Vérifié sur Polygon Mainnet · Hash: 0x{Math.random().toString(36).substring(2, 14)} · {new Date().toLocaleString('fr-FR')}</div><h4 style={{ marginBottom: 10, fontWeight: 700 }}>🏅 Badges certifiés</h4>{result.badges.map((b, i) => { const bi = data.badges.find(bd => bd.name === b); return (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderRadius: 12, padding: '10px 14px', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}><span style={{ fontWeight: 600 }}>🏅 {b}</span><Badge small>{bi?.level || 'Vérifié'}</Badge><span style={{ fontSize: 11, color: 'var(--text2)' }}>{bi?.issuer}</span><Badge small>✓ Valide</Badge></div>);})}<div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}><Btn onClick={() => showToast(`📧 Message envoyé à ${result.name}`)}>📧 Contacter</Btn><Btn outline onClick={() => showToast('📄 PDF exporté')}>📄 Export</Btn><Btn outline onClick={addShortlist}>⭐ Shortlist</Btn></div></div>)}

        <Card style={{ marginBottom: 20 }}><h3 style={{ fontWeight: 700, marginBottom: 14 }}>🔽 Filtrer par compétence</h3><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>{[['all', 'Tous'], ['React', '⚛️ React'], ['Flutter', '📱 Flutter'], ['UI/UX', '🎨 UI/UX'], ['Python', '🐍 Python']].map(([v, l]) => (<button key={v} onClick={() => setSkillFilter(v)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${skillFilter === v ? 'var(--primary)' : 'var(--border)'}`, background: skillFilter === v ? 'var(--primary)' : 'var(--bg)', color: skillFilter === v ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>{l}</button>))}</div><input placeholder="Rechercher par nom..." value={candidateSearch} onChange={e => setCandidateSearch(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} /></Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <Card><h3 style={{ fontWeight: 700, marginBottom: 14 }}>👥 Talents vérifiés</h3>{filteredCandidates.map((s, i) => (<div key={i} onClick={() => quickVerify(s.name)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar initials={s.avatar} size={32} /><span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</span></div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.badges.length} badges</span><Badge small>Score {s.score}</Badge></div></div>))}</Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card><h3 style={{ fontWeight: 700, marginBottom: 12 }}>📜 Historique</h3>{history.length === 0 ? <p style={{ color: 'var(--text2)', fontSize: 13 }}>Aucune vérification</p> : history.slice(0, 5).map((h, i) => (<div key={i} onClick={() => quickVerify(h.name)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderRadius: 12, padding: '8px 12px', marginBottom: 6, cursor: 'pointer' }}><span style={{ fontSize: 13 }}>👤 {h.name}</span><Badge small>{formatAgo(h.time)}</Badge></div>))}</Card>
            <Card><h3 style={{ fontWeight: 700, marginBottom: 12 }}>⭐ Shortlist ({shortlist.length})</h3>{shortlist.length === 0 ? <p style={{ color: 'var(--text2)', fontSize: 13 }}>Aucun candidat</p> : shortlist.map((name, i) => { const s = data.students.find(st => st.name === name); return (<div key={i} onClick={() => quickVerify(name)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}><span style={{ fontSize: 13 }}>👤 {name}</span><Badge small>Score {s?.score || 0}</Badge></div>); })}</Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ROOT APP ============
export default function App() {
  const [page, setPage] = useState('home');
  const [theme, setTheme] = useLocalStorage('skillbadge_theme', 'light');
  const [currentUser, setCurrentUser] = useLocalStorage('skillbadge_current_user', null);
  const [users, setUsers] = useLocalStorage('skillbadge_users', INITIAL_USERS);
  const [data, setData] = useLocalStorage('skillbadge_blockchain', INITIAL_DATA);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = e => setPage(e.detail);
    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (page === 'home' || page === 'login' || page === 'loginFormateur') {
        setPage(currentUser.role === 'apprenant' ? 'apprenant' : 'formateur');
      }
    }
  }, []);

  const showToast = useCallback((msg) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
  }, []);

  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const navigate = (p) => {
    if ((p === 'apprenant') && (!currentUser || currentUser.role !== 'apprenant')) { setPage('login'); return; }
    if ((p === 'formateur') && (!currentUser || currentUser.role !== 'formateur')) { setPage('loginFormateur'); return; }
    setPage(p);
  };

  const logout = () => { setCurrentUser(null); setPage('home'); };

  const vars = THEME_VARS[theme] || THEME_VARS.light;
  const style = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');

  return (
    <div style={{ fontFamily: "'DM Sans', 'Sora', 'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&display=swap');
        :root { ${style} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); color: var(--text); }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        input, select, textarea, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: var(--bg); } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
      `}</style>

      {page === 'home' && <Home onNavigate={navigate} onTheme={toggleTheme} />}
      {page === 'login' && <Login users={users} onLogin={setCurrentUser} onNavigate={navigate} showToast={showToast} />}
      {page === 'loginFormateur' && <LoginFormateur users={users} onLogin={setCurrentUser} onNavigate={navigate} showToast={showToast} />}
      {page === 'register' && <Register users={users} setUsers={setUsers} onLogin={setCurrentUser} onNavigate={navigate} showToast={showToast} />}
      {page === 'apprenant' && <Apprenant currentUser={currentUser} data={data} onLogout={logout} onNavigate={navigate} onTheme={toggleTheme} showToast={showToast} />}
      {page === 'formateur' && <Formateur currentUser={currentUser} data={data} setData={setData} onLogout={logout} onNavigate={navigate} onTheme={toggleTheme} showToast={showToast} />}
      {page === 'recruteur' && <Recruteur data={data} onNavigate={navigate} onTheme={toggleTheme} showToast={showToast} />}

      {toasts.map(t => <Toast key={t.id} message={t.msg} onClose={() => removeToast(t.id)} />)}
    </div>
  );
}
