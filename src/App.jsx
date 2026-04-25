import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import './index.css';
import { buildPrompt } from './config/systemPrompt';
import { optimizeFull, injectLinks } from './services/geminiService';
import { 
  Home, 
  LayoutDashboard, 
  Settings, 
  Moon, 
  Sun, 
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
  BookOpen
} from 'lucide-react';
import { brands } from './config/brands.config';
import { analyzeSEO } from './logic/seoAnalyzer';
import { getDiffedHTML, acceptAllChanges } from './logic/TrackChanges';

// --- COMPONENTES DE APOYO ---

const LinkModal = ({ isOpen, onClose, onConfirm }) => {
  const [url, setUrl] = useState('https://');
  const [isNewTab, setIsNewTab] = useState(true);
  const [isNoFollow, setIsNoFollow] = useState(false);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 3000 }}>
      <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', width: '350px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Insertar Enlace</h3>
        <input 
          autoFocus
          value={url} 
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL (https://...)" 
          style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'inherit', marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={isNewTab} onChange={(e) => setIsNewTab(e.target.checked)} /> Abrir en nueva pestaña
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={isNoFollow} onChange={(e) => setIsNoFollow(e.target.checked)} /> Atributo Nofollow
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cancelar</button>
          <button 
            onClick={() => { onConfirm({ url, isNewTab, isNoFollow }); onClose(); }}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--accent)', color: 'white', fontSize: '0.85rem', fontWeight: 600 }}
          >Insertar</button>
        </div>
      </div>
    </div>
  );
};

const FloatingToolbar = ({ position, onAction, onOpenLinkModal }) => {
  if (!position) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: position.top, 
      left: position.left, 
      transform: 'translate(-50%, -120%)',
      background: 'var(--text-primary)',
      color: 'var(--bg-primary)',
      padding: '0.5rem',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.2rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out',
      flexWrap: 'wrap',
      maxWidth: '500px'
    }}>
      <select 
        onChange={(e) => onAction('formatBlock', e.target.value)}
        style={{ background: 'transparent', color: 'inherit', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '2px 4px', fontSize: '0.75rem', marginRight: '4px' }}
      >
        <option value="P">Párrafo</option>
        <option value="H1">H1</option>
        <option value="H2">H2</option>
        <option value="H3">H3</option>
      </select>

      <button onMouseDown={(e) => { e.preventDefault(); onAction('bold'); }} title="Negrita (strong)" style={{ color: 'inherit', padding: '0.4rem', borderRadius: '4px' }}><Bold size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('italic'); }} title="Cursiva" style={{ color: 'inherit', padding: '0.4rem', borderRadius: '4px' }}><Italic size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('strikethrough'); }} title="Tachado" style={{ color: 'inherit', padding: '0.4rem', borderRadius: '4px' }}><Strikethrough size={14} /></button>
      
      <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}></div>
      
      <button onMouseDown={(e) => { e.preventDefault(); onAction('insertUnorderedList'); }} title="Lista" style={{ color: 'inherit', padding: '0.4rem', borderRadius: '4px' }}><List size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('insertOrderedList'); }} title="Lista ordenada" style={{ color: 'inherit', padding: '0.4rem', borderRadius: '4px' }}><ListOrdered size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('formatBlock', 'blockquote'); }} title="Cita" style={{ color: 'inherit', padding: '0.4rem', borderRadius: '4px' }}><Quote size={14} /></button>
      
      <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}></div>

      <button onMouseDown={(e) => { e.preventDefault(); onAction('justifyLeft'); }} title="Alinear izquierda" style={{ color: 'inherit', padding: '0.4rem', borderRadius: '4px' }}><AlignLeft size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('justifyCenter'); }} title="Centrar" style={{ color: 'inherit', padding: '0.4rem', borderRadius: '4px' }}><AlignCenter size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('justifyRight'); }} title="Alinear derecha" style={{ color: 'inherit', padding: '0.4rem', borderRadius: '4px' }}><AlignRight size={14} /></button>
      
      <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}></div>

      <button onMouseDown={(e) => { e.preventDefault(); onOpenLinkModal(); }} title="Enlace avanzado" style={{ color: 'inherit', padding: '0.4rem', borderRadius: '4px' }}><LinkIcon size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onAction('removeFormat'); }} title="Limpiar formato" style={{ color: 'inherit', padding: '0.4rem', borderRadius: '4px' }}><Eraser size={14} /></button>
    </div>
  );
};

const HTMLToolbar = ({ onAction, onOpenLinkModal }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', padding: '0.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
    <select 
      onChange={(e) => onAction(`<${e.target.value.toLowerCase()}>`, `</${e.target.value.toLowerCase()}>`)}
      style={{ background: 'var(--bg-primary)', color: 'inherit', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem' }}
    >
      <option value="P">Párrafo</option>
      <option value="H1">H1</option>
      <option value="H2">H2</option>
      <option value="H3">H3</option>
      <option value="H4">H4</option>
    </select>

    <button onClick={() => onAction('<strong>', '</strong>')} title="Negrita (strong)" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><Bold size={14} /></button>
    <button onClick={() => onAction('<i>', '</i>')} title="Cursiva" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><Italic size={14} /></button>
    <button onClick={() => onAction('<ul>\n  <li>', '</li>\n</ul>')} title="Lista" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><List size={14} /></button>
    <button onClick={() => onAction('<ol>\n  <li>', '</li>\n</ol>')} title="Lista ordenada" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><ListOrdered size={14} /></button>
    <button onClick={() => onAction('<blockquote>', '</blockquote>')} title="Cita" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><Quote size={14} /></button>
    
    <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }}></div>

    <button onClick={() => onAction('<div style="text-align:left">', '</div>')} title="Alinear izquierda" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><AlignLeft size={14} /></button>
    <button onClick={() => onAction('<div style="text-align:center">', '</div>')} title="Centrar" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><AlignCenter size={14} /></button>
    <button onClick={() => onAction('<div style="text-align:right">', '</div>')} title="Alinear derecha" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><AlignRight size={14} /></button>

    <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }}></div>

    <button onClick={onOpenLinkModal} title="Enlace avanzado" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><LinkIcon size={14} /></button>
    <button onClick={() => onAction('<hr />', '')} title="Línea horizontal" style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '4px' }}><Minus size={14} /></button>
  </div>
);

// --- VISTAS ---

const LoginView = ({ onLogin }) => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
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
        <button onClick={onLogin} style={{ background: 'var(--accent)', color: 'white', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, marginTop: '1rem', transition: 'var(--transition)' }}>Entrar</button>
      </div>
    </div>
  </div>
);

const HomeView = ({ onOpenProject }) => (
  <div style={{ padding: '3rem', flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
    <header style={{ marginBottom: '3rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Mis Proyectos</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Selecciona una marca para comenzar la optimización de contenidos.</p>
    </header>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
      {brands.map(brand => (
        <div key={brand.id} style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'var(--transition)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: brand.color }}></div>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: brand.color, display: 'grid', placeItems: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {brand.name[6]}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{brand.name}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', minHeight: '3em' }}>{brand.guidelines}</p>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {brand.seoKeywords.slice(0, 2).map(kw => (
                <span key={kw} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-tertiary)', fontWeight: 500 }}>{kw}</span>
              ))}
            </div>
            <button 
              onClick={() => onOpenProject(brand)}
              style={{ background: 'var(--accent)', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Acceder <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Sidebar = ({ currentBrand, theme, toggleTheme, currentView, setView, onLogout }) => {
  return (
    <aside className="sidebar" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
      <div className="logo" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'grid', placeItems: 'center', color: 'white' }}>
          <Zap size={18} fill="white" />
        </div>
        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'var(--font-title)' }}>SEO Optimizer</span>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none' }}>
          {[
            { id: 'home', icon: <Home size={20} />, label: 'Inicio' },
            { id: 'analytics', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
            { id: 'settings', icon: <Settings size={20} />, label: 'Configuración' },
          ].map((item) => (
            <li 
              key={item.id} 
              onClick={() => setView(item.id)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                color: currentView === item.id ? 'var(--accent)' : 'var(--text-secondary)',
                background: currentView === item.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                marginBottom: '0.5rem',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              {item.icon}
              <span style={{ fontWeight: 500 }}>{item.label}</span>
            </li>
          ))}
        </ul>

        {currentBrand && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.75rem' }}>Proyecto Activo</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: currentBrand.color, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>{currentBrand.name[6]}</div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{currentBrand.name}</span>
            </div>
            <button onClick={() => setView('home')} style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>Cambiar Proyecto</button>
          </div>
        )}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <div 
          onClick={toggleTheme}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
        </div>
        <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', cursor: 'pointer', color: 'var(--seo-low)' }}>
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </div>
      </div>
    </aside>
  );
};

const Workspace = ({ content, setContent, view, setView, isReviewing, onAcceptAll, onRejectAll, suggestedLinks, setSuggestedLinks, customInstructions, setCustomInstructions, onInjectLinks, isLoadingLinks }) => {
  const [copied, setCopied] = useState(false);
  const [toolbarPos, setToolbarPos] = useState(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const editorRef = useRef(null);
  const htmlEditorRef = useRef(null);

  const handleCopy = () => {
    const text = isReviewing ? acceptAllChanges(content) : content;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection.isCollapsed || selection.toString().trim() === '') {
      setToolbarPos(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setToolbarPos({ top: rect.top, left: rect.left + rect.width / 2 });
  };

  const applyFormat = (cmd, val) => {
    document.execCommand(cmd, false, val);
    let newHTML = editorRef.current.innerHTML;
    newHTML = newHTML.replace(/<b\b([^>]*)>(.*?)<\/b>/gi, '<strong$1>$2</strong>');
    setContent(newHTML);
    setToolbarPos(null);
  };

  const insertLink = ({ url, isNewTab, isNoFollow }) => {
    if (view === 'visual') {
      const target = isNewTab ? '_blank' : '_self';
      const rel = isNoFollow ? 'nofollow' : '';
      
      // Creamos el enlace manualmente para tener control total de los atributos
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const link = document.createElement('a');
      link.href = url;
      if (isNewTab) link.target = '_blank';
      if (isNoFollow) link.rel = 'nofollow';
      link.textContent = selection.toString();
      
      range.deleteContents();
      range.insertNode(link);
      setContent(editorRef.current.innerHTML);
    } else {
      const startTag = `<a href="${url}"${isNewTab ? ' target="_blank"' : ''}${isNoFollow ? ' rel="nofollow"' : ''}>`;
      const endTag = `</a>`;
      const el = htmlEditorRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const text = el.value;
      const before = text.substring(0, start);
      const selected = text.substring(start, end);
      const after = text.substring(end);
      setContent(before + startTag + selected + endTag + after);
    }
    setToolbarPos(null);
  };

  const applyHTMLFormat = (startTag, endTag) => {
    const el = htmlEditorRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const newText = text.substring(0, start) + startTag + text.substring(start, end) + endTag + text.substring(end);
    setContent(newText);
  };

  return (
    <main style={{ padding: '2rem', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <LinkModal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} onConfirm={insertLink} />
      
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Editor de Optimización</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Gestiona enlaces y contenido con inteligencia artificial.</p>
          </div>
          {isReviewing && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={onRejectAll} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--seo-low)', color: 'var(--seo-low)', fontWeight: 600, fontSize: '0.85rem' }}>Rechazar Todo</button>
              <button onClick={onAcceptAll} style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--seo-high)', color: 'white', fontWeight: 600, fontSize: '0.85rem', border: 'none' }}>Aceptar Todo</button>
            </div>
          )}
        </header>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Instrucciones adicionales</label>
            <textarea 
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ej: Refuerza el enfoque técnico y la autoridad de marca..."
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'inherit', minHeight: '80px', resize: 'vertical', fontSize: '0.85rem' }}
            />
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Enlaces sugeridos</label>
            <textarea 
              value={suggestedLinks}
              onChange={(e) => setSuggestedLinks(e.target.value)}
              placeholder="Ej: https://marca.com/guia-seo, https://marca.com/blog..."
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'inherit', minHeight: '80px', resize: 'vertical', fontSize: '0.85rem' }}
            />
            <button 
              onClick={onInjectLinks}
              disabled={isReviewing || isLoadingLinks}
              style={{ position: 'absolute', right: '25px', bottom: '25px', background: (isReviewing || isLoadingLinks) ? 'var(--text-muted)' : 'var(--accent)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (isReviewing || isLoadingLinks) ? 0.7 : 1 }}>
              {isLoadingLinks ? <><Loader2 size={16} className="spin" /> Vinculando...</> : <><Link2 size={16} /> Vincular Enlaces</>}
            </button>
          </div>
        </div>

        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border)', minHeight: '500px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <FloatingToolbar position={toolbarPos} onAction={applyFormat} onOpenLinkModal={() => setIsLinkModalOpen(true)} />
          
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0.5rem', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setView('visual')} style={{ padding: '0.5rem 1rem', borderBottom: view === 'visual' ? '2px solid var(--accent)' : '2px solid transparent', color: view === 'visual' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600 }}>Visual</button>
              <button onClick={() => setView('html')} style={{ padding: '0.5rem 1rem', borderBottom: view === 'html' ? '2px solid var(--accent)' : '2px solid transparent', color: view === 'html' ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600 }}>HTML</button>
            </div>
            {view === 'html' && (
              <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: copied ? 'var(--seo-high)' : 'var(--text-secondary)', padding: '0.4rem 0.8rem', borderRadius: '4px', background: 'var(--bg-tertiary)' }}>
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar HTML'}
              </button>
            )}
          </div>

          {view === 'html' && <HTMLToolbar onAction={applyHTMLFormat} onOpenLinkModal={() => setIsLinkModalOpen(true)} />}
          
          <div style={{ flex: 1, padding: '2rem', position: 'relative' }}>
            {view === 'visual' ? (
              <div 
                ref={editorRef}
                contentEditable={!isReviewing} 
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                onMouseUp={handleSelection}
                onKeyUp={handleSelection}
                dangerouslySetInnerHTML={{ __html: content }}
                style={{ minHeight: '400px', outline: 'none', lineHeight: '1.8' }}
              />
            ) : (
              <textarea 
                ref={htmlEditorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ width: '100%', height: '100%', minHeight: '400px', border: 'none', outline: 'none', background: 'transparent', color: 'inherit', fontFamily: 'monospace', fontSize: '0.9rem', resize: 'none', padding: '0.5rem' }}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

const AnalysisPanel = ({ currentBrand, level, setLevel, seoData, onOptimize, isLoading, isReviewing }) => (
  <aside style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)', padding: '1.5rem', overflowY: 'auto', width: '350px', display: 'flex', flexDirection: 'column' }}>
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Semáforo SEO</h3>
      <div style={{ height: '12px', background: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div style={{ width: `${seoData.score}%`, height: '100%', background: seoData.score > 70 ? 'var(--seo-high)' : seoData.score > 40 ? 'var(--seo-mid)' : 'var(--seo-low)', transition: 'all 0.5s ease-out' }}></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ fontWeight: 'bold', color: seoData.score > 70 ? 'var(--seo-high)' : seoData.score > 40 ? 'var(--seo-mid)' : 'var(--seo-low)' }}>{seoData.score}/100</p>
      </div>

      <button 
        onClick={onOptimize}
        disabled={isReviewing || isLoading}
        style={{ width: '100%', background: (isReviewing || isLoading) ? 'var(--text-muted)' : 'var(--accent)', color: 'white', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (isReviewing || isLoading) ? 0.7 : 1, transition: 'all 0.2s', marginBottom: '1.5rem' }}>
        {isLoading ? <><Loader2 size={18} className="spin" /> Optimizando...</> : <><Sparkles size={18} /> Optimizar Contenido</>}
      </button>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {seoData.checks.map((check, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {check.status === 'pass' ? <CheckCircle2 size={14} color="var(--seo-high)" /> : <AlertCircle size={14} color="var(--seo-low)" />}
            {check.label}
          </div>
        ))}
      </div>

      {seoData.readability && (
        <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BookOpen size={14} /> Legibilidad (Flesch)
          </h4>
          <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{seoData.readability.label}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Score: {seoData.readability.score.toFixed(1)}</p>
        </div>
      )}

      <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '10px' }}>
        <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Search size={14} /> Entidades LSI ({seoData.foundSemantics?.length || 0}/{seoData.totalSemantics || 0})
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {currentBrand.semanticKeywords.map(kw => {
            const isFound = seoData.foundSemantics?.includes(kw);
            return (
              <span key={kw} style={{ 
                fontSize: '0.7rem', 
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px', 
                background: isFound ? 'var(--seo-high)' : 'var(--bg-primary)', 
                color: isFound ? 'white' : 'var(--text-muted)',
                opacity: isFound ? 1 : 0.6,
                border: `1px solid ${isFound ? 'transparent' : 'var(--border)'}`
              }}>
                {kw}
              </span>
            );
          })}
        </div>
      </div>
    </div>

    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Nivel de Optimización</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
        {['Leve', 'Moderado', 'Fuerte'].map(lvl => (
          <button 
            key={lvl} 
            onClick={() => setLevel(lvl)}
            style={{ padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', border: level === lvl ? '1px solid var(--accent)' : '1px solid var(--border)', background: level === lvl ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)', color: level === lvl ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600 }}
          >{lvl}</button>
        ))}
      </div>
    </div>

    <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', border: `1px solid ${currentBrand.color}`, marginTop: 'auto' }}>
      <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: currentBrand.color }}><Briefcase size={18} /> Guía de {currentBrand.name}</h4>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{currentBrand.guidelines}</p>
    </div>
  </aside>
);

// --- APP PRINCIPAL ---

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('home'); 
  const [currentBrand, setCurrentBrand] = useState(null);
  const [theme, setTheme] = useState('light');
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const seoData = useMemo(() => {
    if (!currentBrand) return { score: 0, checks: [] };
    return analyzeSEO(content, level, currentBrand.seoKeywords, currentBrand.semanticKeywords);
  }, [content, level, currentBrand]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => { setIsAuthenticated(false); setView('home'); };

  const handleOpenProject = (brand) => {
    setCurrentBrand(brand);
    setView('editor');
  };

  const handleFullOptimization = useCallback(async () => {
    if (isLoading || isReviewing) return;
    setError(null);
    setIsLoading(true);
    setOriginalContent(content);

    try {
      const links = suggestedLinks.split(',').map(l => l.trim()).filter(l => l.length > 0);
      const fullPrompt = buildPrompt(currentBrand.seoKeywords, links, content, customInstructions, level);
      const optimized = await optimizeFull(fullPrompt);
      const diffed = getDiffedHTML(content, optimized);
      setContent(diffed);
      setIsReviewing(true);
      setEditorView('visual');
    } catch (err) {
      console.error('[Optimize] Error:', err);
      setError('Error al conectar con la IA. Revisa la API Key.');
    } finally {
      setIsLoading(false);
    }
  }, [content, currentBrand, suggestedLinks, customInstructions, level, isLoading, isReviewing]);

  const handleInjectLinks = useCallback(async () => {
    if (isLoadingLinks || isReviewing) return;
    setError(null);
    setIsLoadingLinks(true);
    setOriginalContent(content);

    try {
      const links = suggestedLinks.split(',').map(l => l.trim()).filter(l => l.length > 0);
      if (links.length === 0) throw new Error('No hay enlaces para insertar.');
      const optimized = await injectLinks(currentBrand.seoKeywords, links, content);
      const diffed = getDiffedHTML(content, optimized);
      setContent(diffed);
      setIsReviewing(true);
      setEditorView('visual');
    } catch (err) {
      console.error('[InjectLinks] Error:', err);
      setError(err.message || 'Error al vincular enlaces.');
    } finally {
      setIsLoadingLinks(false);
    }
  }, [content, currentBrand, suggestedLinks, isLoadingLinks, isReviewing]);

  const handleAcceptAll = () => { setContent(acceptAllChanges(content)); setIsReviewing(false); };
  const handleRejectAll = () => { setContent(originalContent); setIsReviewing(false); };

  if (!isAuthenticated) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="app-container" data-theme={theme} style={{ gridTemplateColumns: view === 'editor' ? 'var(--sidebar-width) 1fr 350px' : 'var(--sidebar-width) 1fr' }}>
      <Sidebar currentBrand={currentBrand} theme={theme} toggleTheme={toggleTheme} currentView={view} setView={setView} onLogout={handleLogout} />
      {view === 'home' && <HomeView onOpenProject={handleOpenProject} />}
      {view === 'editor' && (
        <>
          {error && <div className="error-toast">{error}</div>}
          <Workspace 
            content={content} setContent={setContent} view={editorView} setView={setEditorView} 
            isReviewing={isReviewing} onAcceptAll={handleAcceptAll} onRejectAll={handleRejectAll}
            suggestedLinks={suggestedLinks} setSuggestedLinks={setSuggestedLinks}
            customInstructions={customInstructions} setCustomInstructions={setCustomInstructions}
            onInjectLinks={handleInjectLinks} isLoadingLinks={isLoadingLinks}
          />
          <AnalysisPanel 
            currentBrand={currentBrand} level={level} setLevel={setLevel} seoData={seoData} 
            onOptimize={handleFullOptimization} isLoading={isLoading} isReviewing={isReviewing}
          />
        </>
      )}
    </div>
  );
}

export default App;
