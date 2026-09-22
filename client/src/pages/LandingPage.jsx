import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, Award, Shield, MessageCircle, BarChart3,
  ChevronRight, Star, ArrowRight, CheckCircle, Play, FileText,
  Briefcase, Lock, Zap, Globe, TrendingUp, Eye, Layers,
  GraduationCap, UserCheck, ClipboardCheck, BadgeCheck,
  Code, Cpu, Search, Mail, Menu, X
} from 'lucide-react';
import './LandingAnimations.css';

/* ─── useReveal hook ─── */
const useReveal = (threshold = 0.15) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
};

/* ─── RevealDiv wrapper (safe for use inside .map) ─── */
const RevealDiv = ({ className = 'reveal', style, children, ...props }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={className} style={style} {...props}>{children}</div>;
};

/* ─── Scroll-triggered Counter ─── */
const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.unobserve(el); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
};

/* ─── SVG Logo ─── */
const Logo = ({ size = 38 }) => (
  <div style={{
    width: size, height: size, borderRadius: 12,
    background: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(45,106,79,0.35)', position: 'relative',
  }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
      <path d="M4 20L12 4L20 20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14H16" stroke="#b7e4c7" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.5" fill="#b7e4c7" />
    </svg>
  </div>
);

/* ─── Navbar ─── */
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const navLink = { fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s', padding: '6px 0', position: 'relative' };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, transition: 'all 0.4s ease',
      background: scrolled ? 'rgba(26,46,36,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.15)' : 'none',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Logo size={38} />
          <div>
            <span style={{ fontWeight: 800, color: '#fff', fontSize: 18, letterSpacing: '-0.5px', display: 'block', lineHeight: 1 }}>SkillBridge</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>ETHIOPIA</span>
          </div>
        </Link>

        <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['Features', 'How It Works', 'Roles', 'Certificates'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} style={navLink}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
            >{item}</a>
          ))}
        </div>

        <div className="nav-cta-desktop" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/login" style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 500, padding: '8px 16px' }}>Sign In</Link>
          <Link to="/register" style={{
            fontSize: 14, color: '#1a2e24', textDecoration: 'none', fontWeight: 700,
            background: 'linear-gradient(135deg, #b7e4c7, #95d5b2)', padding: '10px 24px', borderRadius: 50,
            transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 16px rgba(183,228,199,0.3)',
          }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 24px rgba(183,228,199,0.4)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 16px rgba(183,228,199,0.3)'; }}
          >Get Started</Link>
        </div>

        <button className="nav-mobile-btn" onClick={() => setMobileOpen(!mobileOpen)}
          style={{ display: 'none', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8 }}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {mobileOpen && (
        <div style={{ background: '#1a2e24', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['Features', 'How It Works', 'Roles', 'Certificates'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setMobileOpen(false)} style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>{item}</a>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, display: 'flex', gap: 12 }}>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
            <Link to="/register" style={{ color: '#1a2e24', textDecoration: 'none', fontWeight: 700, background: '#b7e4c7', padding: '8px 20px', borderRadius: 50 }}>Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

/* ─── Hero ─── */
const Hero = () => {
  const [email, setEmail] = useState('');
  return (
    <section style={{
      background: 'linear-gradient(160deg, #0f1f17 0%, #1a2e24 30%, #1c3a2c 60%, #162b20 100%)',
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      paddingTop: 72, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(82,183,136,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', left: '10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(183,228,199,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', position: 'relative', zIndex: 2 }} className="hero-grid">
        <div>
          <p className="hero-fade-up" style={{ fontSize: 13, color: '#52b788', fontWeight: 600, marginBottom: 12, letterSpacing: '2px', textTransform: 'uppercase' }}>
            🚀 Ethiopia's #1 Learning Platform
          </p>
          <h1 className="hero-fade-up-2 hero-heading" style={{ fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: 24, letterSpacing: '-1.5px' }}>
            Unlock Your Next<br />
            <span style={{ background: 'linear-gradient(135deg, #52b788, #b7e4c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Career Move</span>
          </h1>
          <p className="hero-fade-up-3" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 36, maxWidth: 460 }}>
            Connect with verified mentors, master real-world skills through structured courses, and earn certificates that employers trust.
          </p>

          <div className="hero-fade-up-4 hero-email-row" style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'rgba(255,255,255,0.07)', borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)', padding: 5, maxWidth: 460 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, paddingLeft: 16 }}>
              <Mail size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, width: '100%', fontFamily: "'Inter', sans-serif" }} />
            </div>
            <Link to="/register" style={{ background: 'linear-gradient(135deg, #2d6a4f, #40916c)', color: '#fff', padding: '13px 28px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(45,106,79,0.4)' }}>
              Get Started
            </Link>
          </div>

          <div className="hero-fade-up-4" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              Trusted by <strong style={{ color: 'rgba(255,255,255,0.8)' }}>500+</strong> learners across Ethiopia
            </span>
          </div>
        </div>

        {/* Hero Right — Animated Dashboard Mockup */}
        <div className="hero-image-col hero-visual-enter" style={{ position: 'relative' }}>
          <div style={{ position: 'relative', borderRadius: 24, background: 'linear-gradient(145deg, rgba(45,106,79,0.15), rgba(26,46,36,0.4))', border: '1px solid rgba(255,255,255,0.08)', padding: 28, backdropFilter: 'blur(20px)' }}>
            {/* Mini dashboard header */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
            </div>
            {/* Fake sidebar + content */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[BookOpen, Users, Award, MessageCircle, BarChart3].map((Icon, i) => (
                  <div key={i} style={{ width: 40, height: 40, borderRadius: 10, background: i === 0 ? 'rgba(82,183,136,0.2)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={i === 0 ? '#52b788' : 'rgba(255,255,255,0.2)'} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', width: '60%' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'rgba(82,183,136,0.1)', borderRadius: 12, padding: 14, border: '1px solid rgba(82,183,136,0.15)' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#52b788', margin: 0 }}>12</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Courses</p>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 12, padding: 14, border: '1px solid rgba(245,158,11,0.12)' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', margin: 0 }}>89%</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Progress</p>
                  </div>
                </div>
                {/* Progress bars */}
                {['React Mastery', 'Node.js API', 'UI Design'].map((t, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{t}</span>
                      <span style={{ fontSize: 10, color: '#52b788' }}>{[85, 62, 40][i]}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #2d6a4f, #52b788)', width: `${[85, 62, 40][i]}%`, transition: 'width 1.5s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Cards */}
          <div className="float-card-1" style={{ position: 'absolute', top: -16, right: -16, background: '#fff', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} color="#2d6a4f" />
            </div>
            <div>
              <p style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, margin: 0 }}>Mentors</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#1a2e24', margin: 0 }}>50+</p>
            </div>
          </div>
          <div className="float-card-2" style={{ position: 'absolute', bottom: -12, left: -12, background: '#fff', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} color="#ea580c" />
            </div>
            <div>
              <p style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, margin: 0 }}>Certificates</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#1a2e24', margin: 0 }}>300+</p>
            </div>
          </div>
          <div className="float-card-3" style={{ position: 'absolute', top: '45%', right: -24, background: 'linear-gradient(135deg, #2d6a4f, #40916c)', borderRadius: 12, padding: '10px 16px', boxShadow: '0 8px 30px rgba(45,106,79,0.3)' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px 0' }}>Live Now</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>🔴 24 Students Online</p>
          </div>
        </div>
      </div>
    </section>
  );
};
/* ─── Trusted Partners (Marquee) ─── */
const partners = ['Addis Ababa University', 'AAIT', 'Unity University', 'Bahir Dar University', 'Jimma University', 'Hawassa University', 'Mekelle University', 'Adama Science'];
const TrustedPartners = () => (
  <section style={{ background: '#f8faf9', padding: '36px 0', borderTop: '1px solid #eef1f4', borderBottom: '1px solid #eef1f4', overflow: 'hidden' }}>
    <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', fontWeight: 700, marginBottom: 20, letterSpacing: '1px', textTransform: 'uppercase' }}>Trusted by leading institutions</p>
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(90deg, #f8faf9, transparent)', zIndex: 2 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(270deg, #f8faf9, transparent)', zIndex: 2 }} />
      <div className="marquee-track">
        {[...partners, ...partners].map((name, i) => (
          <div key={i} style={{ fontSize: 15, fontWeight: 800, color: '#969da5ff', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <GraduationCap size={18} /> {name}
          </div>
        ))}
      </div>
    </div>
  </section>
);


/* ─── Categories ─── */
const categories = [
  { icon: Cpu, title: 'Technology', count: '64 Courses', color: '#2d6a4f', bg: 'linear-gradient(180deg, #7db694 0%, #ffffff 100%)', accent: '#d9efe1', blurb: 'Build core digital skills with practical, job-ready paths.' },
  { icon: Code, title: 'Web Development', count: '32 Courses', color: '#1565c0', bg: 'linear-gradient(180deg, #eef5fd 0%, #ffffff 100%)', accent: '#dbeafe', blurb: 'Learn modern web fundamentals with real project work.' },
  { icon: TrendingUp, title: 'App Development', count: '18 Courses', color: '#6a1b9a', bg: 'linear-gradient(180deg, #f7effb 0%, #ffffff 100%)', accent: '#eddcf7', blurb: 'Turn ideas into apps using structured build steps.' },
  { icon: BarChart3, title: 'Machine Learning', count: '24 Courses', color: '#e65100', bg: 'linear-gradient(180deg, #fff5e8 0%, #ffffff 100%)', accent: '#fde7ce', blurb: 'Explore models, data, and predictions at your pace.' },
  { icon: Briefcase, title: 'AI', count: '27 Courses', color: '#00695c', bg: 'linear-gradient(180deg, #edf8f6 0%, #ffffff 100%)', accent: '#d5f0eb', blurb: 'Discover practical AI concepts with clear milestones.' },
  { icon: Users, title: 'Robotics', count: '14 Courses', color: '#ad1457', bg: 'linear-gradient(180deg, #fdf0f5 0%, #ffffff 100%)', accent: '#f8d9e5', blurb: 'Blend hardware and software into hands-on projects.' },
];

const ExploreCategories = () => {
  const ref = useReveal();
  return (
    <section id="features" style={{ background: '#fff', padding: '100px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div ref={ref} className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Explore Categories</p>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#1a2e24', marginBottom: 12, letterSpacing: '-0.5px' }}>
            Discover Your Learning Path
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
            Whether you're looking to break into a new industry or advance in your career, find the perfect course for your journey.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24, alignItems: 'stretch' }} className="category-grid stagger-children">
          {categories.map((cat, i) => (
            <RevealDiv key={i} className="reveal cat-card" style={{ background: cat.bg, border: '1px solid rgba(45,106,79,0.08)', borderRadius: 22, padding: 0, textAlign: 'center', cursor: 'pointer', transition: 'all 0.35s ease', boxShadow: '0 10px 30px rgba(15,23,42,0.04)', height: '100%' }}
              onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%'); e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%'); }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 18px 50px ${cat.color}18`; e.currentTarget.style.borderColor = `${cat.color}33`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(15,23,42,0.04)'; e.currentTarget.style.borderColor = 'rgba(45,106,79,0.08)'; }}>
              <div className="cat-card-inner" style={{ position: 'relative', width: '100%', minHeight: 260, height: '100%' }}>
                <div className="cat-card-face cat-card-front" style={{ position: 'absolute', inset: 0, padding: '24px 20px', borderRadius: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                  <div style={{ width: 58, height: 58, borderRadius: 18, background: cat.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, transition: 'transform 0.3s ease, box-shadow 0.3s ease', boxShadow: `inset 0 0 0 1px ${cat.color}14` }}>
                    <cat.icon size={26} color={cat.color} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a2e24', marginBottom: 4, letterSpacing: '-0.2px', lineHeight: 1.2 }}>{cat.title}</h3>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, letterSpacing: '0.2px' }}>{cat.count}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: cat.color, fontWeight: 700 }}>Enroll to course</span>
                    <ArrowRight size={12} color={cat.color} />
                  </div>
                </div>

                <div className="cat-card-face cat-card-back" style={{ position: 'absolute', inset: 0, padding: '24px 20px', borderRadius: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: `linear-gradient(180deg, ${cat.accent} 0%, rgba(255,255,255,0.98) 100%)` }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 10px 24px rgba(15,23,42,0.08)' }}>
                    <cat.icon size={22} color={cat.color} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1a2e24', marginBottom: 8, lineHeight: 1.2 }}>{cat.title}</h3>
                  <p style={{ fontSize: 12, color: '#5f6b78', lineHeight: 1.45, marginBottom: 14, maxWidth: 150, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cat.blurb}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: '#fff', color: cat.color, fontSize: 12, fontWeight: 700, boxShadow: '0 8px 20px rgba(15,23,42,0.06)' }}>
                    See courses
                    <ArrowRight size={12} color={cat.color} />
                  </div>
                </div>
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
};


/* ─── How It Works / Reach Potential ─── */
const HowItWorks = () => {
  const r1 = useReveal(); const r2 = useReveal();
  return (
    <section id="how-it-works" style={{ background: '#fff', padding: '100px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="talent-grid">
          <div ref={r1} className="reveal-left">
            <p style={{ fontSize: 12, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Global Reach</p>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: '#1a2e24', marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.5px' }}>
              Reach Your Full<br />Potential Worldwide
            </h2>
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 32 }}>
              Expand your skills and learn from skilled mentors. Our platform makes it easy to find courses, learn at your pace, and earn certificates that employers trust.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
              {[{ icon: Globe, text: 'Learn Anywhere' }, { icon: Layers, text: 'Structured Courses' }, { icon: Zap, text: 'Fast Progress' }, { icon: BarChart3, text: 'Analytics & Insights' }].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={16} color="#2d6a4f" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{item.text}</span>
                </div>
              ))}
            </div>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a2e24', color: '#fff', padding: '14px 28px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(26,46,36,0.3)' }}
              onMouseEnter={e => { e.target.style.background = '#2d6a4f'; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.target.style.background = '#1a2e24'; e.target.style.transform = 'translateY(0)'; }}>
              Start Learning <ArrowRight size={16} />
            </Link>
          </div>
          <div ref={r2} className="reveal-right" style={{ position: 'relative' }}>
            <div style={{ background: 'linear-gradient(135deg, #f0faf3, #e8f5e9)', borderRadius: 24, padding: 40, border: '1px solid #d5e8da', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="globe-spin" style={{ opacity: 0.15 }}>
                  <Globe size={220} color="#2d6a4f" strokeWidth={0.5} />
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="orbit-dot" style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: '#2d6a4f', boxShadow: '0 0 12px rgba(45,106,79,0.5)' }} />
                  <div className="orbit-dot-2" style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: '#52b788', boxShadow: '0 0 12px rgba(82,183,136,0.5)' }} />
                </div>
                {[{ top: '15%', left: '25%', d: '0s' }, { top: '55%', left: '65%', d: '1s' }, { top: '35%', left: '75%', d: '2s' }, { top: '65%', left: '20%', d: '1.5s' }, { top: '25%', left: '55%', d: '0.5s' }].map((dot, i) => (
                  <div key={i} style={{ position: 'absolute', top: dot.top, left: dot.left, width: 12, height: 12, borderRadius: '50%', background: '#2d6a4f', animation: 'pulseDot 2.5s ease-in-out infinite', animationDelay: dot.d }} />
                ))}
              </div>
              <div style={{ position: 'absolute', top: 20, right: 20, background: '#fff', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulseDot 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Live in 5+ regions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Expert Guidance ─── */
const ExpertGuidance = () => {
  const ref = useReveal();
  return (
    <section style={{ background: 'linear-gradient(180deg, #f8faf9 0%, #ffffff 100%)', padding: '100px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div ref={ref} className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Expert Guidance</p>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#1a2e24', marginBottom: 12, letterSpacing: '-0.5px' }}>Guidance from Industry Experts</h2>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>Follow a clear learning flow with curated advice, course structure, and mentor support.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 24, alignItems: 'stretch' }} className="expert-grid stagger-children">
          {[{ step: '01', title: 'Explore the Right Path', desc: 'Discover featured courses or search by industry and skill level.', icon: Search, color: '#2d6a4f', bg: 'linear-gradient(180deg, #eef8f2 0%, #ffffff 100%)', accent: '#d9efe1' },
          { step: '02', title: 'Understand the Structure', desc: 'See modules, tests, and certification paths before enrolling.', icon: BookOpen, color: '#1565c0', bg: 'linear-gradient(180deg, #eef5fd 0%, #ffffff 100%)', accent: '#dbeafe' },
          { step: '03', title: 'Connect with Mentors', desc: 'Send requests, chat, and get personalized guidance.', icon: MessageCircle, color: '#6a1b9a', bg: 'linear-gradient(180deg, #f7effb 0%, #ffffff 100%)', accent: '#eddcf7' }
          ].map((item, i) => (
            <RevealDiv key={i} className="reveal" style={{ background: item.bg, borderRadius: 22, padding: 0, border: '1px solid rgba(45,106,79,0.08)', transition: 'all 0.35s ease', cursor: 'pointer', boxShadow: '0 10px 30px rgba(15,23,42,0.04)', height: '100%', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 22px 56px ${item.color}18`; e.currentTarget.style.borderColor = `${item.color}33`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(15,23,42,0.04)'; e.currentTarget.style.borderColor = 'rgba(45,106,79,0.08)'; }}>
              <div style={{ position: 'relative', padding: 24, minHeight: 240, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 16, background: item.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `inset 0 0 0 1px ${item.color}14` }}>
                    <item.icon size={24} color={item.color} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: item.color, background: '#fff', padding: '7px 10px', borderRadius: 999, boxShadow: '0 8px 18px rgba(15,23,42,0.05)' }}>{item.step}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a2e24', marginBottom: 8, lineHeight: 1.25 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.55, marginBottom: 18, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.desc}</p>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: item.color, fontSize: 13, fontWeight: 700 }}>
                  Learn more
                  <ArrowRight size={14} color={item.color} />
                </div>
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Roles ─── */
const roleCards = [
  { role: 'Student', emoji: '🎓', color: '#2d6a4f', bg: '#e8f5e9', features: ['Browse & enroll in courses', 'Learn with video, PDFs & notes', 'Take module & final tests', 'Chat with your mentor', 'Earn certificates & badges', 'Track your progress'] },
  { role: 'Mentor', emoji: '👨‍🏫', color: '#1565c0', bg: '#e3f2fd', features: ['Create courses with modules', 'Accept or reject students', 'Add videos, notes & PDFs', 'Create tests & quiz questions', 'Approve certificates', 'Chat with your students'] },
  { role: 'Admin', emoji: '🛡️', color: '#e65100', bg: '#fff3e0', features: ['Approve mentors & employers', 'Approve or reject courses', 'Manage all platform users', 'Review content reports', 'Create & manage badges', 'Full platform control'] },
  { role: 'Employer', emoji: '💼', color: '#6a1b9a', bg: '#f3e5f5', features: ['Browse certified student pool', 'View verified certificates', 'See student skills & badges', 'Discover qualified talent', 'Filter by course completion', 'Trusted verification'] },
];

const Roles = () => {
  const ref = useReveal();
  return (
    <section id="roles" style={{ background: '#fff', padding: '100px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div ref={ref} className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Platform Roles</p>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#1a2e24', marginBottom: 12, letterSpacing: '-0.5px' }}>Four Roles, One Powerful Platform</h2>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>Each role gets a dedicated dashboard with tailored features.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }} className="roles-grid stagger-children">
          {roleCards.map((r) => (
            <RevealDiv key={r.role} className="reveal" style={{ background: '#fafbfc', borderRadius: 20, overflow: 'hidden', border: '1px solid #eef1f4', transition: 'all 0.35s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 20px 50px ${r.color}15`; e.currentTarget.style.borderColor = r.color; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#eef1f4'; }}>
              <div style={{ background: `linear-gradient(135deg, ${r.bg}, ${r.bg}88)`, padding: '28px 20px', textAlign: 'center', borderBottom: '1px solid #eef1f4' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{r.emoji}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: r.color }}>{r.role}</h3>
              </div>
              <div style={{ padding: 20 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {r.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#6b7280', marginBottom: 10, lineHeight: 1.5 }}>
                      <CheckCircle size={14} color={r.color} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Certificate Showcase ─── */
const CertificateShowcase = () => {
  const r1 = useReveal(); const r2 = useReveal();
  return (
    <section id="certificates" style={{ background: '#f8faf9', padding: '100px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="cert-grid">
          <div ref={r1} className="reveal-scale" style={{ position: 'relative' }}>
            <div style={{ background: '#fff', border: '2px solid #eef1f4', borderRadius: 24, padding: 36, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.06)' }}>
              <div style={{ border: '2px solid #d5e8da', borderRadius: 16, padding: 36, background: '#fafffe', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #2d6a4f, #40916c)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 18px', borderRadius: 20, letterSpacing: '1px' }}>CERTIFICATE</div>
                <div style={{ fontSize: 52, marginBottom: 12, marginTop: 8 }}>🏆</div>
                <p style={{ fontSize: 10, color: '#2d6a4f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>Certificate of Completion</p>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2e24', marginBottom: 4 }}>Advanced React Development</h3>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>This is to certify that</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#2d6a4f', marginBottom: 4 }}>Dawit Haile</p>
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>has completed the course under <strong style={{ color: '#374151' }}>Abebe Kebede</strong></p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
                  {['Mentor Signature', 'Date Issued'].map((t, i) => (
                    <div key={i} style={{ textAlign: 'center' }}><div style={{ width: 60, borderTop: '1px solid #d1d5db', marginBottom: 4 }} /><p style={{ fontSize: 10, color: '#9ca3af' }}>{t}</p></div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                {['🏅', '⭐', '🎯', '💎'].map((b, i) => (
                  <div key={i} className="badge-bounce" style={{ width: 48, height: 48, borderRadius: 14, background: '#f0faf3', border: '1px solid #d5e8da', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, cursor: 'default' }}>{b}</div>
                ))}
              </div>
            </div>
          </div>
          <div ref={r2} className="reveal-right">
            <p style={{ fontSize: 12, fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Achievements</p>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: '#1a2e24', marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.5px' }}>Earn Verified Certificates & Badges</h2>
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 28 }}>Every certificate is mentor-approved, printable, and verifiable. Badges are auto-awarded to gamify your learning journey.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[{ icon: CheckCircle, text: 'Complete all course modules', color: '#2d6a4f' }, { icon: FileText, text: 'Pass the final test with ≥70% score', color: '#1565c0' }, { icon: UserCheck, text: 'Request certificate — mentor approves', color: '#e65100' }, { icon: BadgeCheck, text: 'Badge is automatically assigned', color: '#6a1b9a' }, { icon: Eye, text: 'Employers can view and verify', color: '#00695c' }].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, transition: 'all 0.2s', background: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0faf3'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={16} color={item.color} />
                  </div>
                  <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Stats Bar (scroll-triggered counters) ─── */
const StatsBar = () => {
  const ref = useReveal();
  return (
    <section style={{ background: 'linear-gradient(135deg, #0f1f17, #1a2e24, #162b20)', padding: '70px 0' }}>
      <div ref={ref} className="reveal stats-grid" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
        {[
          { value: 500, suffix: '+', label: 'Active Learners', icon: Users },
          { value: 120, suffix: '+', label: 'Courses Available', icon: BookOpen },
          { value: 50, suffix: '+', label: 'Expert Mentors', icon: GraduationCap },
          { value: 300, suffix: '+', label: 'Certificates Issued', icon: Award },
        ].map((s) => (
          <div key={s.label} style={{ padding: '10px 0' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(82,183,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <s.icon size={22} color="#52b788" />
            </div>
            <p style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: '-1px' }}><Counter end={s.value} suffix={s.suffix} /></p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ─── CTA ─── */
const CTA = () => {
  const ref = useReveal();
  return (
    <section style={{ background: '#fff', padding: '100px 0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
        <div ref={ref} className="reveal-scale" style={{ background: 'linear-gradient(135deg, #1a2e24, #0f1f17)', borderRadius: 28, padding: '64px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Logo size={52} />
            <div style={{ margin: '20px 0' }} />
            <h2 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.5px' }}>Ready to Bridge the Gap?</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>Join hundreds of Ethiopian learners building real skills with verified mentors.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Link to="/register" style={{ background: 'linear-gradient(135deg, #b7e4c7, #95d5b2)', color: '#1a2e24', padding: '14px 32px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(183,228,199,0.3)', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(183,228,199,0.4)'; }}
                onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(183,228,199,0.3)'; }}>
                Create Free Account <ArrowRight size={16} />
              </Link>
              <Link to="/login" style={{ border: '2px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 28px', borderRadius: 50, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'transparent'; }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Footer ─── */
const Footer = () => (
  <footer style={{ background: '#0f1f17', padding: '60px 0 0', color: '#fff' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: 40, marginBottom: 40 }} className="footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Logo size={36} />
            <div>
              <span style={{ fontWeight: 800, fontSize: 17, display: 'block', lineHeight: 1 }}>SkillBridge</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>ETHIOPIA</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 260 }}>
            A mentor-guided learning management system built for Ethiopian learners, educators, and employers.
          </p>
        </div>
        {[{ title: 'About', items: ['Features', 'How It Works', 'Roles', 'Certificates'] },
        { title: 'Resources', items: ['Courses', 'Mentors', 'Help Desk', 'FAQ', 'Contact Us'] },
        { title: 'Social', items: ['Telegram', 'LinkedIn', 'Twitter', 'Instagram'] }
        ].map(col => (
          <div key={col.title}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{col.title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.items.map(item => (
                ['Help Desk', 'FAQ', 'Contact Us'].includes(item) ? (
                  <Link
                    key={item}
                    to={item === 'Help Desk' ? '/help-desk' : item === 'FAQ' ? '/faq' : '/contact-us'}
                    style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#52b788'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                  >
                    {item}
                  </Link>
                ) : (
                  <a key={item} href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#52b788'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}>{item}</a>
                )
              ))}
            </div>
          </div>
        ))}
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Stay Updated</h4>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.6 }}>Get the latest updates on courses.</p>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 50, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <input type="email" placeholder="Your email" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 13, padding: '10px 16px', fontFamily: "'Inter', sans-serif" }} />
            <button style={{ background: 'linear-gradient(135deg, #2d6a4f, #40916c)', color: '#fff', border: 'none', padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Subscribe</button>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2026 SkillBridge Ethiopia.</p>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/privacy" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}>Privacy Policy</Link>
          <Link to="/terms" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}>Terms of Service</Link>
        </div>
      </div>
    </div>
  </footer>
);

const LandingPage = () => (
  <div style={{ minHeight: '100vh', background: '#fff' }}>
    <Navbar />
    <Hero />
    <TrustedPartners />

    <ExploreCategories />
    <HowItWorks />
    <ExpertGuidance />
    <Roles />
    <CertificateShowcase />
    <StatsBar />
    <CTA />
    <Footer />
  </div>
);

export default LandingPage;
