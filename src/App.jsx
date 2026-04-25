import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './index.css';
import { buildPrompt } from './config/systemPrompt';
import { optimizeFull, injectLinks } from './services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { 
  Home, 
  LayoutDashboard, 
  Settings, 
  Moon, 
  Sun, 
  Monitor,
  Loader2,
  LogOut, 
  ChevronRight,
  Briefcase,
  Copy,
  CheckCircle2,
  Zap,
  Check,
  X,
  AlertCircle,
  BarChart3,
  User,
  Lock,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Minus,
  Type,
  Strikethrough,
  Eraser,
  Undo2,
  Redo2,
  ExternalLink,
  Link2,
  Sparkles,
  Search,
  BookOpen,
  Cpu,
  Globe,
  Database,
  Trash2,
  Save,
  ChevronDown,
  TrendingUp,
  Clock,
  FileText,
  Target,
  Plus,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { brands } from './config/brands.config';
import { analyzeSEO } from './logic/seoAnalyzer';
import { getDiffedHTML, acceptAllChanges } from './logic/TrackChanges';

// --- CONFIGURACIÓN POR DEFECTO ---
const DEFAULT_SETTINGS = {
  geminiApiKeys: [], // Ahora es una lista
  aiModel: 'gemini-1.5-flash',
  temperature: 0.3,
  defaultView: 'visual',
  autoSave: true,
  fontSize: 16,
  region: 'España',
  enableReadability: true,
  enableLSI: true,
  scoreThreshold: 80,
  forbiddenWords: '',
  globalPrompt: '',
  cleanHtmlOnCopy: true,
  gscConfig: {
    clientId: '',
    propertyUrl: '',
    isConnected: false
  }
};

// --- DATOS SIMULADOS PARA DASHBOARD ---
const MOCK_STATS = {
  globalAvg: 84.5,
  totalWords: 142500,
  successRate: 88,
  timeSaved: '72h',
  history: [
    { name: 'Lun', qty: 12 }, { name: 'Mar', qty: 18 }, { name: 'Mie', qty: 15 },
    { name: 'Jue', qty: 25 }, { name: 'Vie', qty: 22 }, { name: 'Sab', qty: 8 }, { name: 'Dom', qty: 5 }
  ],
  brandPerformance: brands.map(b => ({
    name: b.name.replace('Marca ', '').replace(' Tech', '').replace(' Finance', ''),
    score: Math.floor(Math.random() * (95 - 75) + 75),
    lsi: Math.floor(Math.random() * (90 - 60) + 60),
    readability: Math.floor(Math.random() * (85 - 50) + 50),
    color: b.color
  })),
  healthData: [
    { name: 'Óptimo', value: 65, color: '#10b981' },
    { name: 'Mejorable', value: 25, color: '#f59e0b' },
    { name: 'Crítico', value: 10, color: '#ef4444' }
  ]
};

// --- COMPONENTES DE APOYO ---

const LoginView = ({ onLogin }) => (
  <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
    <div style={{ background: 'var(--bg-primary)', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', width: '100%', maxWidth: '400px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: '48px', height: '48px', background: 'var(--accent)', borderRadius: '12px', margin: '0 auto 1rem', display: 'grid', placeItems: 'center', color: 'white' }}>
          <Zap size={24} fill="white" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Bienvenido</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Introduce tus credenciales para acceder</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Email</label>
          <div style={{ position: 'relative' }}>
            <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="email" placeholder="admin@seo.pro" style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'inherit' }} defaultValue="admin@seo.pro" />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Contraseña</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'inherit' }} defaultValue="password" />
          </div>
        </div>
        <button onClick={() => onLogin()} style={{ background: 'var(--accent)', color: 'white', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, marginTop: '1rem', cursor: 'pointer', border: 'none' }}>Entrar</button>
      </div>
    </div>
  </div>
);

const DashboardView = () => (
  <div style={{ padding: '3rem', flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
    <header style={{ marginBottom: '3rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard SEO</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Análisis global de rendimiento y productividad de contenidos.</p>
    </header>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
      {[
        { label: 'Media SEO Global', value: `${MOCK_STATS.globalAvg}%`, icon: <Target size={24} />, color: 'var(--accent)' },
        { label: 'Palabras Optimizadas', value: MOCK_STATS.totalWords.toLocaleString(), icon: <FileText size={24} />, color: '#10b981' },
        { label: 'Tasa de Éxito', value: `${MOCK_STATS.successRate}%`, icon: <CheckCircle2 size={24} />, color: '#f59e0b' },
        { label: 'Tiempo Ahorrado', value: MOCK_STATS.timeSaved, icon: <Clock size={24} />, color: '#ec4899' },
      ].map((kpi, i) => (
        <div key={i} style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: `rgba(${kpi.color === 'var(--accent)' ? '99,102,241' : '16,185,129'}, 0.1)`, color: kpi.color, display: 'grid', placeItems: 'center' }}>{kpi.icon}</div>
          <div><p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{kpi.label}</p><p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{kpi.value}</p></div>
        </div>
      ))}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
      <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', minHeight: '400px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={20} color="var(--accent)" /> Rendimiento por Marca</h3>
        <div style={{ width: '100%', height: '300px' }}><ResponsiveContainer width="100%" height="100%"><BarChart data={MOCK_STATS.brandPerformance}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} unit="%" /><Tooltip cursor={{fill: 'rgba(99,102,241,0.05)'}} contentStyle={{background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)'}} /><Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={40}>{MOCK_STATS.brandPerformance.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Bar></BarChart></ResponsiveContainer></div>
      </div>
      <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Salud del Contenido</h3>
        <div style={{ flex: 1 }}><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={MOCK_STATS.healthData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{MOCK_STATS.healthData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer><div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>{MOCK_STATS.healthData.map((d, i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }}></div><span style={{ color: 'var(--text-secondary)' }}>{d.name}</span></div><span style={{ fontWeight: 'bold' }}>{d.value}%</span></div>))}</div></div>
      </div>
    </div>
    <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Ranking Detallado de Marcas</h3>
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}><th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Marca</th><th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Score SEO</th><th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Riqueza LSI</th><th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Legibilidad</th><th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tendencia</th></tr></thead><tbody>{MOCK_STATS.brandPerformance.sort((a,b) => b.score - a.score).map((brand, i) => (<tr key={i} style={{ borderBottom: '1px solid var(--border)' }} className="table-row"><td style={{ padding: '1rem', fontWeight: 600 }}>{brand.name}</td><td style={{ padding: '1rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '40px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px' }}><div style={{ width: `${brand.score}%`, height: '100%', background: brand.score > 85 ? 'var(--seo-high)' : 'var(--seo-mid)', borderRadius: '3px' }}></div></div>{brand.score}%</div></td><td style={{ padding: '1rem' }}>{brand.lsi}%</td><td style={{ padding: '1rem' }}>{brand.readability}%</td><td style={{ padding: '1rem' }}><div style={{ color: 'var(--seo-high)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}><TrendingUp size={14} /> +{Math.floor(Math.random() * 5)}%</div></td></tr>))}</tbody></table></div>
    </div>
  </div>
);

const SettingsView = ({ settings, setSettings }) => {
  const [newKey, setNewKey] = useState('');
  const updateSetting = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));
  
  const addApiKey = () => {
    if (newKey.trim()) {
      updateSetting('geminiApiKeys', [...settings.geminiApiKeys, newKey.trim()]);
      setNewKey('');
    }
  };

  const removeApiKey = (index) => {
    const newList = settings.geminiApiKeys.filter((_, i) => i !== index);
    updateSetting('geminiApiKeys', newList);
  };

  const updateGSC = (key, val) => {
    updateSetting('gscConfig', { ...settings.gscConfig, [key]: val });
  };

  return (
    <div style={{ padding: '3rem', flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <header style={{ marginBottom: '3rem' }}><h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Configuración</h1><p style={{ color: 'var(--text-secondary)' }}>Gestión avanzada de APIs e integraciones SEO.</p></header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Inteligencia Artificial Avanzada */}
        <section style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Cpu size={20} color="var(--accent)" /> Inteligencia Artificial (Elastic)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Gestionar Gemini API Keys</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Añadir nueva API Key..." style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'inherit' }} />
                <button onClick={addApiKey} style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--accent)', color: 'white', border: 'none' }}><Plus size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {settings.geminiApiKeys.map((key, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{key.substring(0, 8)}...{key.substring(key.length - 4)}</span>
                    <button onClick={() => removeApiKey(i)} style={{ color: 'var(--seo-low)', background: 'transparent', border: 'none' }}><Trash2 size={16} /></button>
                  </div>
                ))}
                {settings.geminiApiKeys.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--seo-low)', fontStyle: 'italic' }}>No hay llaves configuradas. La IA no funcionará.</p>}
              </div>
            </div>
            <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Modelo de IA</label><select value={settings.aiModel} onChange={(e) => updateSetting('aiModel', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'inherit' }}><option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido)</option><option value="gemini-1.5-pro">Gemini 1.5 Pro (Avanzado)</option></select></div>
            <div><label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Temperatura <span>{settings.temperature}</span></label><input type="range" min="0.1" max="1.0" step="0.1" value={settings.temperature} onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} /></div>
          </div>
        </section>

        {/* Google Search Console Architecture */}
        <section style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={20} color="#4285F4" /> Google Search Console</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(66, 133, 244, 0.1)', borderRadius: '10px', border: '1px solid rgba(66, 133, 244, 0.2)', marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}><strong>Aviso:</strong> La integración con GSC requiere un Client ID de Google Cloud Console con las APIs de Webmasters activadas.</p>
            </div>
            <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Google Client ID</label><input type="text" value={settings.gscConfig.clientId} onChange={(e) => updateGSC('clientId', e.target.value)} placeholder="000000000-xxxxx.apps.googleusercontent.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'inherit' }} /></div>
            <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>URL de la Propiedad</label><input type="text" value={settings.gscConfig.propertyUrl} onChange={(e) => updateGSC('propertyUrl', e.target.value)} placeholder="https://miweb.com/" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'inherit' }} /></div>
            <button disabled style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><ShieldCheck size={18} /> Conectar con Google (Próximamente)</button>
          </div>
        </section>

        {/* Otros Ajustes */}
        <section style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Type size={20} color="var(--accent)" /> Editor & SEO</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Vista por defecto</span><div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '0.25rem' }}><button onClick={() => updateSetting('defaultView', 'visual')} style={{ padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.75rem', background: settings.defaultView === 'visual' ? 'var(--bg-primary)' : 'transparent', fontWeight: 600 }}>Visual</button><button onClick={() => updateSetting('defaultView', 'html')} style={{ padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.75rem', background: settings.defaultView === 'html' ? 'var(--bg-primary)' : 'transparent', fontWeight: 600 }}>HTML</button></div></div>
            <div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tamaño de fuente (px)</label><input type="number" value={settings.fontSize} onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'inherit' }} /></div>
            <div><label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Umbral SEO Verde <span>{settings.scoreThreshold}%</span></label><input type="range" min="50" max="95" step="5" value={settings.scoreThreshold} onChange={(e) => updateSetting('scoreThreshold', parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--seo-high)' }} /></div>
          </div>
        </section>
      </div>
      
      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}><button onClick={() => setSettings(DEFAULT_SETTINGS)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--seo-low)', color: 'var(--seo-low)', fontWeight: 600 }}><Trash2 size={18} /> Restaurar valores por defecto</button></div>
    </div>
  );
};

const LinkModal = ({ isOpen, onClose, onConfirm }) => {
  const [url, setUrl] = useState('https://');
  const [isNewTab, setIsNewTab] = useState(true);
  const [isNoFollow, setIsNoFollow] = useState(false);
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 3000 }}>
      <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', width: '350px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Insertar Enlace</h3>
        <input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL (https://...)" style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'inherit', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}><input type="checkbox" checked={isNewTab} onChange={(e) => setIsNewTab(e.target.checked)} /> Abrir en nueva pestaña</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}><input type="checkbox" checked={isNoFollow} onChange={(e) => setIsNoFollow(e.target.checked)} /> Atributo Nofollow</label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={() => { onConfirm({ url, isNewTab, isNoFollow }); onClose(); }} style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--accent)', color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>Insertar</button>
        </div>
      </div>
    </div>
  );
};

const FloatingToolbar = ({ position, onAction, onOpenLinkModal }) => {
  if (!position) return null;
  return (
    <div style={{ position: 'fixed', top: position.top, left: position.left, transform: 'translate(-50%, -120%)', background: 'var(--text-primary)', color: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.2rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', zIndex: 1000, animation: 'fadeIn 0.2s ease-out', flexWrap: 'wrap', maxWidth: '500px' }}>
      <select onChange={(e) => onAction('formatBlock', e.target.value)} style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '2px 4px', fontSize: '0.75rem', marginRight: '4px' }}><option value="P">Párrafo</option><option value="H1">H1</option><option value="H2">H2</option><option value="H3">H3</option></select>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('bold'); }} style={{ color: 'inherit', padding: '0.4rem' }}><Bold size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('italic'); }} style={{ color: 'inherit', padding: '0.4rem' }}><Italic size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('strikethrough'); }} style={{ color: 'inherit', padding: '0.4rem' }}><Strikethrough size={14} /></button>
      <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}></div>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('insertUnorderedList'); }} style={{ color: 'inherit', padding: '0.4rem' }}><List size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('insertOrderedList'); }} style={{ color: 'inherit', padding: '0.4rem' }}><ListOrdered size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('formatBlock', 'blockquote'); }} style={{ color: 'inherit', padding: '0.4rem' }}><Quote size={14} /></button>
      <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}></div>
      <button onMouseDown={(e) => { e.preventDefault(); onOpenLinkModal(); }} style={{ color: 'inherit', padding: '0.4rem' }}><LinkIcon size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('removeFormat'); }} style={{ color: 'inherit', padding: '0.4rem' }}><Eraser size={14} /></button>
    </div>
  );
};

const HTMLToolbar = ({ onAction, onOpenLinkModal }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', padding: '0.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
    <select onChange={(e) => onAction(`<${e.target.value.toLowerCase()}>`, `</${e.target.value.toLowerCase()}>`)} style={{ background: 'var(--bg-primary)', color: 'inherit', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem' }}><option value="P">Párrafo</option><option value="H1">H1</option><option value="H2">H2</option><option value="H3">H3</option></select>
    <button onClick={() => onAction('<strong>', '</strong>')} title="Negrita (strong)" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><Bold size={14} /></button>
    <button onClick={() => onAction('<i>', '</i>')} title="Cursiva" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><Italic size={14} /></button>
    <button onClick={() => onAction('<ul>\n  <li>', '</li>\n</ul>')} title="Lista" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><List size={14} /></button>
    <button onClick={onOpenLinkModal} title="Enlace avanzado" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><LinkIcon size={14} /></button>
  </div>
);

const Sidebar = ({ currentBrand, themeMode, setThemeMode, currentView, setView, onLogout }) => (
  <aside className="sidebar" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
    <div className="logo" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'grid', placeItems: 'center', color: 'white' }}><Zap size={18} fill="white" /></div><span style={{ fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'var(--font-title)' }}>SEO Optimizer</span></div>
    <nav style={{ flex: 1 }}>
      <ul style={{ listStyle: 'none' }}>
        {[
          { id: 'home', icon: <Home size={20} />, label: 'Inicio' },
          { id: 'analytics', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
          { id: 'settings', icon: <Settings size={20} />, label: 'Configuración' },
        ].map((item) => (
          <li key={item.id} onClick={() => setView(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', color: currentView === item.id ? 'var(--accent)' : 'var(--text-secondary)', background: currentView === item.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent', marginBottom: '0.5rem', cursor: 'pointer', transition: 'var(--transition)' }}>{item.icon} <span style={{ fontWeight: 500 }}>{item.label}</span></li>
        ))}
      </ul>
      {currentBrand && (<div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border)' }}><p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.75rem' }}>Proyecto Activo</p><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ width: '32px', height: '32px', borderRadius: '8px', background: currentBrand.color, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>{currentBrand.name[6]}</div><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{currentBrand.name}</span></div><button onClick={() => setView('home')} style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>Cambiar Proyecto</button></div>)}
    </nav>
    <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Tema</p>
      <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: '10px', gap: '0.25rem' }}>
        {[
          { id: 'light', icon: <Sun size={16} />, label: 'Claro' },
          { id: 'dark', icon: <Moon size={16} />, label: 'Oscuro' },
          { id: 'system', icon: <Monitor size={16} />, label: 'Sistema' }
        ].map(mode => (
          <button key={mode.id} onClick={() => setThemeMode(mode.id)} title={mode.label} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.5rem', borderRadius: '8px', background: themeMode === mode.id ? 'var(--bg-primary)' : 'transparent', color: themeMode === mode.id ? 'var(--accent)' : 'var(--text-muted)', border: 'none', boxShadow: themeMode === mode.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>{mode.icon}</button>
        ))}
      </div>
      <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', cursor: 'pointer', color: 'var(--seo-low)', marginTop: '1rem', borderRadius: '8px' }} className="logout-btn"><LogOut size={20} /><span>Cerrar sesión</span></div>
    </div>
  </aside>
);

const HomeView = ({ onOpenProject }) => (
  <div style={{ padding: '3rem', flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
    <header style={{ marginBottom: '3rem' }}><h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Mis Proyectos</h1><p style={{ color: 'var(--text-secondary)' }}>Selecciona una marca para comenzar la optimización de contenidos.</p></header>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
      {brands.map(brand => (
        <div key={brand.id} style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'var(--transition)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: brand.color }}></div>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: brand.color, display: 'grid', placeItems: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>{brand.name[6]}</div>
          <div><h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{brand.name}</h3><p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', minHeight: '3em' }}>{brand.guidelines}</p></div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', gap: '0.4rem' }}>{brand.seoKeywords.slice(0, 2).map(kw => (<span key={kw} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-tertiary)', fontWeight: 500 }}>{kw}</span>))}</div><button onClick={() => onOpenProject(brand)} style={{ background: 'var(--accent)', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Acceder <ChevronRight size={16} /></button></div>
        </div>
      ))}
    </div>
  </div>
);

const Workspace = ({ content, setContent, view, setView, isReviewing, onAcceptAll, onRejectAll, suggestedLinks, setSuggestedLinks, customInstructions, setCustomInstructions, onInjectLinks, isLoadingLinks, fontSize }) => {
  const [copied, setCopied] = useState(false);
  const [toolbarPos, setToolbarPos] = useState(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const editorRef = useRef(null);
  const htmlEditorRef = useRef(null);
  const handleCopy = () => { const text = isReviewing ? acceptAllChanges(content) : content; navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleSelection = () => { const selection = window.getSelection(); if (selection.isCollapsed || selection.toString().trim() === '') { setToolbarPos(null); return; } const range = selection.getRangeAt(0); const rect = range.getBoundingClientRect(); setToolbarPos({ top: rect.top, left: rect.left + rect.width / 2 }); };
  const applyFormat = (cmd, val) => { document.execCommand(cmd, false, val); let newHTML = editorRef.current.innerHTML; newHTML = newHTML.replace(/<b\b([^>]*)>(.*?)<\/b>/gi, '<strong$1>$2</strong>'); setContent(newHTML); setToolbarPos(null); };
  const insertLink = ({ url, isNewTab, isNoFollow }) => { if (view === 'visual') { const selection = window.getSelection(); if (!selection.rangeCount) return; const range = selection.getRangeAt(0); const link = document.createElement('a'); link.href = url; if (isNewTab) link.target = '_blank'; if (isNoFollow) link.rel = 'nofollow'; link.textContent = selection.toString(); range.deleteContents(); range.insertNode(link); setContent(editorRef.current.innerHTML); } else { const startTag = `<a href="${url}"${isNewTab ? ' target="_blank"' : ''}${isNoFollow ? ' rel="nofollow"' : ''}>`; const el = htmlEditorRef.current; const start = el.selectionStart; const end = el.selectionEnd; const text = el.value; setContent(text.substring(0, start) + startTag + text.substring(start, end) + '</a>' + text.substring(end)); } setToolbarPos(null); };
  return (
    <main style={{ padding: '2rem', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <LinkModal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} onConfirm={insertLink} />
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}><div><h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Editor de Optimización</h2><p style={{ color: 'var(--text-secondary)' }}>Gestiona enlaces y contenido con inteligencia artificial.</p></div>{isReviewing && (<div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={onRejectAll} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--seo-low)', color: 'var(--seo-low)', fontWeight: 600, fontSize: '0.85rem' }}>Rechazar Todo</button><button onClick={onAcceptAll} style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--seo-high)', color: 'white', fontWeight: 600, fontSize: '0.85rem', border: 'none' }}>Aceptar Todo</button></div>)}</header>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)' }}><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Instrucciones adicionales</label><textarea value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} placeholder="Ej: Refuerza el enfoque técnico..." style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'inherit', minHeight: '80px', fontSize: '0.85rem' }} /></div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)', position: 'relative' }}><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Enlaces sugeridos</label><textarea value={suggestedLinks} onChange={(e) => setSuggestedLinks(e.target.value)} placeholder="Ej: https://marca.com/guia-seo..." style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'inherit', minHeight: '80px', fontSize: '0.85rem' }} /><button onClick={onInjectLinks} disabled={isReviewing || isLoadingLinks} style={{ position: 'absolute', right: '25px', bottom: '25px', background: (isReviewing || isLoadingLinks) ? 'var(--text-muted)' : 'var(--accent)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (isReviewing || isLoadingLinks) ? 0.7 : 1 }}>{isLoadingLinks ? <><Loader2 size={16} className="spin" /> Vinculando...</> : <><Link2 size={16} /> Vincular Enlaces</>}</button></div>
        </div>
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)', minHeight: '500px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <FloatingToolbar position={toolbarPos} onAction={applyFormat} onOpenLinkModal={() => setIsLinkModalOpen(true)} />
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0.5rem', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => setView('visual')} style={{ padding: '0.5rem 1rem', borderBottom: view === 'visual' ? '2px solid var(--accent)' : '2px solid transparent', color: view === 'visual' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600 }}>Visual</button><button onClick={() => setView('html')} style={{ padding: '0.5rem 1rem', borderBottom: view === 'html' ? '2px solid var(--accent)' : '2px solid transparent', color: view === 'html' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600 }}>HTML</button></div>
            {view === 'html' && (<button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: copied ? 'var(--seo-high)' : 'var(--text-secondary)', padding: '0.4rem 0.8rem', borderRadius: '4px', background: 'var(--bg-tertiary)' }}>{copied ? <CheckCircle2 size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar HTML'}</button>)}
          </div>
          {view === 'html' && <HTMLToolbar onAction={(s, e) => applyFormat(s, e)} onOpenLinkModal={() => setIsLinkModalOpen(true)} />}
          <div style={{ flex: 1, padding: '2rem', position: 'relative', fontSize: `${fontSize}px` }}>
            {view === 'visual' ? (<div ref={editorRef} contentEditable={!isReviewing} onInput={(e) => setContent(e.currentTarget.innerHTML)} onMouseUp={handleSelection} onKeyUp={handleSelection} dangerouslySetInnerHTML={{ __html: content }} style={{ minHeight: '400px', outline: 'none', lineHeight: '1.8' }} />) : (<textarea ref={htmlEditorRef} value={content} onChange={(e) => setContent(e.target.value)} style={{ width: '100%', height: '100%', minHeight: '400px', border: 'none', outline: 'none', background: 'transparent', color: 'inherit', fontFamily: 'monospace', fontSize: '0.9rem', resize: 'none' }} />)}
          </div>
        </div>
      </div>
    </main>
  );
};

const AnalysisPanel = ({ currentBrand, level, setLevel, seoData, onOptimize, isLoading, isReviewing, threshold }) => (
  <aside style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', padding: '1.5rem', overflowY: 'auto', width: '350px', display: 'flex', flexDirection: 'column' }}>
    <div style={{ marginBottom: '2rem' }}><h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Semáforo SEO</h3><div style={{ height: '12px', background: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem' }}><div style={{ width: `${seoData.score}%`, height: '100%', background: seoData.score >= threshold ? 'var(--seo-high)' : seoData.score > 40 ? 'var(--seo-mid)' : 'var(--seo-low)', transition: 'all 0.5s ease-out' }}></div></div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}><p style={{ fontWeight: 'bold', color: seoData.score >= threshold ? 'var(--seo-high)' : seoData.score > 40 ? 'var(--seo-mid)' : 'var(--seo-low)' }}>{seoData.score}/100</p><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Umbral: {threshold}%</span></div><button onClick={onOptimize} disabled={isReviewing || isLoading} style={{ width: '100%', background: (isReviewing || isLoading) ? 'var(--text-muted)' : 'var(--accent)', color: 'white', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (isReviewing || isLoading) ? 0.7 : 1, transition: 'all 0.2s', marginBottom: '1.5rem' }}>{isLoading ? <><Loader2 size={18} className="spin" /> Optimizando...</> : <><Sparkles size={18} /> Optimizar Contenido</>}</button><div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>{seoData.checks.map((check, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{check.status === 'pass' ? <CheckCircle2 size={14} color="var(--seo-high)" /> : <AlertCircle size={14} color="var(--seo-low)" />}{check.label}</div>))}</div>{seoData.readability && (<div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}><h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BookOpen size={14} /> Legibilidad (Flesch)</h4><p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{seoData.readability.label}</p><p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Score: {seoData.readability.score.toFixed(1)}</p></div>)}<div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '10px' }}><h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Search size={14} /> Entidades LSI ({seoData.foundSemantics?.length || 0}/{seoData.totalSemantics || 0})</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>{currentBrand.semanticKeywords.map(kw => { const isFound = seoData.foundSemantics?.includes(kw); return (<span key={kw} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: isFound ? 'var(--seo-high)' : 'var(--bg-primary)', color: isFound ? 'white' : 'var(--text-muted)', opacity: isFound ? 1 : 0.6, border: `1px solid ${isFound ? 'transparent' : 'var(--border)'}` }}>{kw}</span>); })}</div></div></div><div style={{ marginBottom: '2rem' }}><h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Nivel de Optimización</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>{['Leve', 'Moderado', 'Fuerte'].map(lvl => (<button key={lvl} onClick={() => setLevel(lvl)} style={{ padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', border: level === lvl ? '1px solid var(--accent)' : '1px solid var(--border)', background: level === lvl ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)', color: level === lvl ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600 }}>{lvl}</button>))}</div></div><div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: `1px solid ${currentBrand.color}`, marginTop: 'auto' }}><h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: currentBrand.color }}><Briefcase size={18} /> Guía de {currentBrand.name}</h4><p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{currentBrand.guidelines}</p></div></aside>
);

// --- APP PRINCIPAL ---

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('home'); 
  const [currentBrand, setCurrentBrand] = useState(null);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme_mode') || 'system');
  const [content, setContent] = useState('<h1>Título del artículo</h1><p>Empieza a optimizar tu contenido para mejorar el posicionamiento...</p>');
  const [originalContent, setOriginalContent] = useState('');
  const [editorView, setEditorView] = useState('visual');
  const [level, setLevel] = useState('Moderado');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [error, setError] = useState(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [suggestedLinks, setSuggestedLinks] = useState('');
  const [settings, setSettings] = useState(() => { const saved = localStorage.getItem('seo_optimizer_settings'); return saved ? JSON.parse(saved) : DEFAULT_SETTINGS; });
  
  useEffect(() => { localStorage.setItem('seo_optimizer_settings', JSON.stringify(settings)); }, [settings]);
  
  useEffect(() => {
    localStorage.setItem('theme_mode', themeMode);
    const updateTheme = () => {
      let resolvedTheme = themeMode;
      if (themeMode === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    };
    updateTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => { if (themeMode === 'system') updateTheme(); };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [themeMode]);

  useEffect(() => { if (view === 'editor') setEditorView(settings.defaultView); }, [view, settings.defaultView]);
  const seoData = useMemo(() => { if (!currentBrand) return { score: 0, checks: [] }; return analyzeSEO(content, level, currentBrand.seoKeywords, currentBrand.semanticKeywords, settings); }, [content, level, currentBrand, settings]);
  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => { setIsAuthenticated(false); setView('home'); };
  const handleOpenProject = (brand) => { setCurrentBrand(brand); setView('editor'); };

  const handleFullOptimization = useCallback(async () => {
    if (isLoading || isReviewing) return;
    if (settings.geminiApiKeys.length === 0) { setError('Añade al menos una API Key en Configuración.'); return; }
    setError(null); setIsLoading(true); setOriginalContent(content);
    try {
      const links = suggestedLinks.split(',').map(l => l.trim()).filter(l => l.length > 0);
      const promptContext = settings.globalPrompt ? `${settings.globalPrompt}\n\n${customInstructions}` : customInstructions;
      const fullPrompt = buildPrompt(currentBrand.seoKeywords, links, content, promptContext, level);
      // Usamos la primera llave disponible (lógica de rotación simple)
      const optimized = await optimizeFull(fullPrompt, { apiKey: settings.geminiApiKeys[0], model: settings.aiModel, temperature: settings.temperature });
      setContent(getDiffedHTML(content, optimized)); setIsReviewing(true); setEditorView('visual');
    } catch (err) { setError(err.message || 'Error al conectar con la IA.'); } finally { setIsLoading(false); }
  }, [content, currentBrand, suggestedLinks, customInstructions, level, isLoading, isReviewing, settings]);

  const handleInjectLinks = useCallback(async () => {
    if (isLoadingLinks || isReviewing) return;
    if (settings.geminiApiKeys.length === 0) { setError('Añade al menos una API Key en Configuración.'); return; }
    setError(null); setIsLoadingLinks(true); setOriginalContent(content);
    try {
      const links = suggestedLinks.split(',').map(l => l.trim()).filter(l => l.length > 0);
      if (links.length === 0) throw new Error('No hay enlaces para insertar.');
      const optimized = await injectLinks(currentBrand.seoKeywords, links, content, { apiKey: settings.geminiApiKeys[0], model: settings.aiModel, temperature: settings.temperature });
      setContent(getDiffedHTML(content, optimized)); setIsReviewing(true); setEditorView('visual');
    } catch (err) { setError(err.message || 'Error al vincular enlaces.'); } finally { setIsLoadingLinks(false); }
  }, [content, currentBrand, suggestedLinks, isLoadingLinks, isReviewing, settings]);

  if (!isAuthenticated) return <LoginView onLogin={handleLogin} />;
  return (
    <div className="app-container" data-theme={themeMode === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : themeMode} style={{ gridTemplateColumns: view === 'editor' ? 'var(--sidebar-width) 1fr 350px' : 'var(--sidebar-width) 1fr' }}>
      <Sidebar currentBrand={currentBrand} themeMode={themeMode} setThemeMode={setThemeMode} currentView={view} setView={setView} onLogout={handleLogout} />
      {view === 'home' && <HomeView onOpenProject={handleOpenProject} />}
      {view === 'settings' && <SettingsView settings={settings} setSettings={setSettings} />}
      {view === 'analytics' && <DashboardView />}
      {view === 'editor' && (
        <>
          {error && <div className="error-toast">{error}</div>}
          <Workspace content={content} setContent={setContent} view={editorView} setView={setEditorView} isReviewing={isReviewing} onAcceptAll={() => { setContent(acceptAllChanges(content)); setIsReviewing(false); }} onRejectAll={() => { setContent(originalContent); setIsReviewing(false); }} suggestedLinks={suggestedLinks} setSuggestedLinks={setSuggestedLinks} customInstructions={customInstructions} setCustomInstructions={setCustomInstructions} onInjectLinks={handleInjectLinks} isLoadingLinks={isLoadingLinks} fontSize={settings.fontSize} />
          <AnalysisPanel currentBrand={currentBrand} level={level} setLevel={setLevel} seoData={seoData} onOptimize={handleFullOptimization} isLoading={isLoading} isReviewing={isReviewing} threshold={settings.scoreThreshold} />
        </>
      )}
    </div>
  );
}
export default App;
