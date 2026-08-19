import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  Play,
  Link2,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Upload,
  CheckCircle,
  Clock,
  Smartphone,
  Film,
  Sparkles,
  Lock,
  Server,
  HardDrive,
  Cpu,
  Radio,
  Layers,
  Database,
  Quote,
  Star,
} from 'lucide-react';
import Navbar from '../components/Navbar';

gsap.registerPlugin(ScrollTrigger);

const VIDEO_URL = 'https://ik.imagekit.io/vxqem8zrj/5077479-uhd_4096_2160_25fps.mp4';
const LOGO_URL = 'https://res.cloudinary.com/dhudpc4eu/image/upload/v1787121249/pixora-uploads/pixora-bg-1787121249639-esge0v.png';

const features = [
  {
    icon: Link2,
    badge: 'Zero Expiry',
    title: 'Permanent Universal Links',
    desc: 'Generate a permanent, lifetime-active link for every video. No 7-day limits, no dead URLs, no re-uploading ever.',
    gradient: 'from-blue-600 to-indigo-600',
    color: '#3b82f6',
  },
  {
    icon: Zap,
    badge: 'Lossless Streaming',
    title: 'Original Quality Playback',
    desc: 'Videos stream seamlessly in original crisp bitrates up to 4K resolution without aggressive compression or buffering.',
    gradient: 'from-cyan-500 to-blue-600',
    color: '#06b6d4',
  },
  {
    icon: Clock,
    badge: '3-Hour Capacity',
    title: 'Long-Form Video Support',
    desc: 'Upload full lectures, documentaries, client cuts, webinars, and long masterclasses up to 3 hours long with zero hassle.',
    gradient: 'from-indigo-500 to-purple-600',
    color: '#6366f1',
  },
  {
    icon: Globe,
    badge: 'Zero Installs Needed',
    title: 'Plays on Any Browser & Device',
    desc: 'Recipients open your link on Chrome, Safari, Firefox, iOS, or Android and stream instantly without downloading extra apps.',
    gradient: 'from-sky-500 to-blue-700',
    color: '#0284c7',
  },
  {
    icon: Shield,
    badge: 'Direct Cloud Engine',
    title: 'High-Speed Cloud Storage',
    desc: 'Client-to-cloud direct uploads bypass server bottlenecks and deliver 99.99% global CDN distribution speed.',
    gradient: 'from-blue-700 to-slate-900',
    color: '#1d4ed8',
  },
  {
    icon: Smartphone,
    badge: 'Android Native APK',
    title: 'Dedicated Mobile App',
    desc: 'Switch effortlessly between the responsive web app and the native Android APK built with Capacitor WebView.',
    gradient: 'from-purple-600 to-blue-600',
    color: '#8b5cf6',
  },
];

const steps = [
  {
    step: '01',
    title: 'Upload Any Video',
    desc: 'Drag and drop your MP4, MOV, MKV, or WebM file up to 3 hours in duration.',
    tag: 'Direct Secure Pipe',
    icon: Upload,
  },
  {
    step: '02',
    title: 'Automated Processing',
    desc: 'Our engine validates bitrate, prepares adaptive stream chunks, and generates a HD thumbnail.',
    tag: 'Cloud Optimization',
    icon: Film,
  },
  {
    step: '03',
    title: 'Get Universal Short Link',
    desc: 'Instantly receive a clean, permanent link like `deceptor.app/v/xK9pL2`.',
    tag: 'Permanent Lifetime ID',
    icon: Link2,
  },
  {
    step: '04',
    title: 'Share & Stream Anywhere',
    desc: 'Recipients click and watch right away in custom clean player. No ads, no sign-in required.',
    tag: 'Instant Playback',
    icon: Play,
  },
];

const comparisonData = [
  { feature: 'Link Lifetime Expiration', deceptor: 'Permanent (Never Expires)', googleDrive: 'Restricted / Quota Limits', wetransfer: 'Expires in 7 Days', youtube: 'Subject to Copyright / Ads' },
  { feature: 'Max Duration per File', deceptor: 'Up to 3 Hours', googleDrive: 'Limited by free storage', wetransfer: '2GB File Cap', youtube: '15m (unverified)' },
  { feature: 'Recipient Experience', deceptor: 'Instant Clean Ad-Free Stream', googleDrive: 'Processing video screen', wetransfer: 'Must download huge file', youtube: 'Pre-roll & mid-roll ads' },
  { feature: 'Recipient Login Required?', deceptor: 'Never Required', googleDrive: 'Often requires Google sign-in', wetransfer: 'No (Download only)', youtube: 'Required for private' },
  { feature: 'Native Android APK', deceptor: 'Included Free', googleDrive: 'Heavy Google App', wetransfer: 'Web / App', youtube: 'Heavy YouTube App' },
];

const LandingPage = () => {
  const containerRef = useRef(null);
  const mockupRef = useRef(null);

  useEffect(() => {
    // ── 1. Smooth Lenis Setup ──────────────────────────────────────────
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // ── 2. GSAP Context for Scoped Animations ──────────────────────────
    const ctx = gsap.context(() => {
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .fromTo('.hero-pill', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.1 })
        .fromTo('.hero-heading', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.3')
        .fromTo('.hero-desc', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
        .fromTo('.hero-actions', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
        .fromTo('.hero-stats', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
        .fromTo('.hero-mockup-wrapper', { opacity: 0, y: 50, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.9 }, '-=0.5')
        .fromTo('.telemetry-tag', { opacity: 0, y: 15 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.5 }, '-=0.4');

      // Scroll-triggered 3D Mockup tilt
      if (mockupRef.current) {
        gsap.to(mockupRef.current, {
          scrollTrigger: {
            trigger: mockupRef.current,
            start: 'top 70%',
            end: 'bottom 15%',
            scrub: 1,
          },
          rotateX: 4,
          scale: 0.98,
          transformPerspective: 1000,
        });
      }

      // Feature Cards Stagger
      gsap.fromTo(
        '.feature-item',
        { opacity: 0, y: 40 },
        {
          scrollTrigger: {
            trigger: '#features-grid',
            start: 'top 80%',
          },
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.8,
          ease: 'power3.out',
        }
      );

      // Steps Stagger
      gsap.fromTo(
        '.step-card',
        { opacity: 0, x: -30 },
        {
          scrollTrigger: {
            trigger: '#steps-section',
            start: 'top 75%',
          },
          opacity: 1,
          x: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power3.out',
        }
      );

      // Comparison Table Reveal
      gsap.fromTo(
        '.comparison-container',
        { opacity: 0, y: 40 },
        {
          scrollTrigger: {
            trigger: '#comparison-section',
            start: 'top 80%',
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        }
      );

      // Trust metrics reveal
      gsap.fromTo(
        '.metric-box',
        { opacity: 0, scale: 0.9 },
        {
          scrollTrigger: {
            trigger: '#trust-section',
            start: 'top 85%',
          },
          opacity: 1,
          scale: 1,
          stagger: 0.15,
          duration: 0.7,
          ease: 'back.out(1.4)',
        }
      );

      // CTA Banner Reveal
      gsap.fromTo(
        '.cta-card-box',
        { opacity: 0, y: 50 },
        {
          scrollTrigger: {
            trigger: '#cta-section',
            start: 'top 85%',
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        }
      );
    }, containerRef);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050811] text-white selection:bg-blue-600 selection:text-white overflow-x-hidden relative">
      {/* ── Spline 3D Canvas Background ── */}
      <div className="spline-container absolute top-0 left-0 w-full h-full -z-10">
        <iframe
          src="https://my.spline.design/unchained-d3hHCgdWho7a8ATGzKtB11TU"
          frameBorder="0"
          width="100%"
          height="100%"
          id="aura-spline"
          title="Spline 3D Aura Background"
        ></iframe>
      </div>

      {/* Dynamic Single Glassmorphic Capsule Navbar */}
      <Navbar />

      {/* ── 1. HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen pt-36 sm:pt-40 pb-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center overflow-hidden">
        {/* Ambient Glow Halos */}
        <div className="ambient-glow-blue top-[10%] left-[15%]" />
        <div className="ambient-glow-cyan top-[25%] right-[10%]" />
        <div className="ambient-glow-purple bottom-[10%] left-[30%]" />
        <div className="grid-mesh" />

        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Top Glass Pill */}
          <div className="hero-pill inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-capsule text-xs sm:text-sm font-semibold text-blue-200 mb-8 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span>Zero Expiration Video Engine • Free Forever</span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 text-[10px] font-mono font-bold">v2.0</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-heading font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.05] mb-6">
            Upload Once.{' '}
            <br className="hidden sm:block" />
            <span className="text-gradient-cyan">Stream Forever.</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-desc font-sans text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Host videos up to <strong className="text-white font-semibold">3 hours long</strong>. Generate permanent, lifetime-active universal links that play in original quality across all browsers and devices without compression.
          </p>

          {/* CTA Buttons */}
          <div className="hero-actions flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-14">
            <Link to="/signup" className="btn btn-primary btn-lg w-full sm:w-auto group">
              <span>Start Hosting Free</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#how-it-works" className="btn btn-dark btn-lg w-full sm:w-auto flex items-center justify-center gap-2">
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              <span>See How It Works</span>
            </a>
          </div>

          {/* Live Platform Quick Stats Glass Box */}
          <div className="hero-stats grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl w-full">
            <div className="glass-capsule rounded-2xl p-4 text-center">
              <div className="font-display font-black text-2xl sm:text-3xl text-white">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">Original Bitrate</div>
            </div>
            <div className="glass-capsule rounded-2xl p-4 text-center">
              <div className="font-display font-black text-2xl sm:text-3xl text-cyan-400">3 Hours</div>
              <div className="text-xs text-slate-400 mt-0.5">Max Video Length</div>
            </div>
            <div className="glass-capsule rounded-2xl p-4 text-center">
              <div className="font-display font-black text-2xl sm:text-3xl text-white">∞ Days</div>
              <div className="text-xs text-slate-400 mt-0.5">Link Lifetime</div>
            </div>
          </div>
        </div>

        {/* ── Frameless Monolithic 4K Glass Showcase ──────────────────────── */}
        <div className="hero-mockup-wrapper relative mt-16 w-full max-w-5xl mx-auto px-2">
          {/* Glowing Ambient Video Backlight */}
          <div className="absolute -inset-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 rounded-[32px] blur-3xl opacity-45 transition duration-1000" />

          {/* Top Telemetry Feature Tags Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="telemetry-tag flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl glass-capsule">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white tracking-tight">Direct Stream Active</span>
                <span className="text-[9px] font-mono text-emerald-400">STATUS: 200 OK</span>
              </div>
            </div>

            <div className="telemetry-tag flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl glass-capsule">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white tracking-tight">Lossless Original Bitrate</span>
                <span className="text-[9px] font-mono text-cyan-400">NO RE-ENCODING</span>
              </div>
            </div>

            <div className="telemetry-tag flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl glass-capsule">
              <Cpu className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white tracking-tight">4K UHD 2160p • 25 FPS</span>
                <span className="text-[9px] font-mono text-blue-400">4096 × 2160 NATIVE</span>
              </div>
            </div>

            <div className="telemetry-tag flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl glass-capsule">
              <Radio className="w-4 h-4 text-purple-400" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white tracking-tight">Permanent Universal Link</span>
                <span className="text-[9px] font-mono text-purple-400">LIFETIME ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Frameless Monolithic Video Canvas */}
          <div
            ref={mockupRef}
            className="relative rounded-2xl sm:rounded-3xl glass-panel overflow-hidden shadow-2xl bg-black border border-white/20 p-1 sm:p-1.5"
          >
            <div className="relative aspect-video w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black">
              <video
                src={VIDEO_URL}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />

              {/* Bottom Telemetry Overlay Strip */}
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-blue-600/40 border border-blue-400/40 text-cyan-300 text-[11px] font-bold tracking-wide shadow-sm">
                    4K MASTER
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-200 font-medium">Zero Compression Artifacts</span>
                </div>

                <div className="flex items-center gap-2 text-slate-300 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    Global CDN Edge Synced
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Telemetry Spec Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="telemetry-tag flex items-center gap-2 px-3.5 py-2.5 rounded-2xl glass-capsule text-slate-300 text-xs">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Multi-Region Edge Caching</span>
            </div>
            <div className="telemetry-tag flex items-center gap-2 px-3.5 py-2.5 rounded-2xl glass-capsule text-slate-300 text-xs">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direct Cloud Bucket Ingest</span>
            </div>
            <div className="telemetry-tag flex items-center gap-2 px-3.5 py-2.5 rounded-2xl glass-capsule text-slate-300 text-xs">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>AES-256 Cloud Encryption</span>
            </div>
            <div className="telemetry-tag flex items-center gap-2 px-3.5 py-2.5 rounded-2xl glass-capsule text-slate-300 text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>99.99% Availability SLA</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. CORE FEATURES GRID ────────────────────────────────────────── */}
      <section id="features" className="py-28 px-4 sm:px-6 lg:px-8 relative border-t border-white/5">
        <div className="ambient-glow-cyan top-[20%] left-[5%]" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-capsule-blue text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Engine Features
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
              Engineered for <span className="text-gradient-cyan">Reliable Video Hosting</span>
            </h2>
            <p className="font-sans text-slate-400 text-base sm:text-lg">
              Everything built from scratch to guarantee your video links stay online, fast, and accessible for a lifetime.
            </p>
          </div>

          {/* Cards Grid */}
          <div id="features-grid" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="feature-item glass-panel glass-panel-hover rounded-3xl p-7 sm:p-8 relative group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 p-3 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-lg`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-3 py-1 rounded-full glass-capsule text-slate-300">
                    {item.badge}
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h3>
                <p className="font-sans text-slate-400 text-sm sm:text-base leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. HOW IT WORKS (4 STEPS) ────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-4 sm:px-6 lg:px-8 relative">
        <div className="ambient-glow-purple bottom-[15%] right-[10%]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-capsule-blue text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
              Workflow
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
              Four Simple Steps to <span className="text-gradient-cyan">Permanent Links</span>
            </h2>
            <p className="font-sans text-slate-400 text-base sm:text-lg">
              No complicated configuration. Upload, wait a few seconds, and share your universal link.
            </p>
          </div>

          <div id="steps-section" className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {steps.map((st, i) => (
              <div
                key={i}
                className="step-card glass-panel glass-panel-hover rounded-3xl p-8 flex gap-6 items-start group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/20 border border-cyan-400/40 flex-shrink-0 flex items-center justify-center text-cyan-300 font-display font-black text-xl group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                  {st.step}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase">{st.tag}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">{st.title}</h3>
                  <p className="font-sans text-slate-400 text-sm leading-relaxed">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. WHY DECEPTOR COMPARISON TABLE ─────────────────────────────── */}
      <section id="comparison-section" className="py-28 px-4 sm:px-6 lg:px-8 border-y border-white/5 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-capsule-blue text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
              Comparison
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
              Why Creators Choose <span className="text-gradient-cyan">Deceptor</span>
            </h2>
            <p className="font-sans text-slate-400 text-base sm:text-lg">
              Compare Deceptor with traditional cloud drives and temporary transfer tools.
            </p>
          </div>

          <div className="comparison-container rounded-3xl overflow-hidden glass-panel shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="p-4 sm:p-5 text-sm font-semibold text-slate-400">Feature</th>
                    <th className="p-4 sm:p-5 text-sm font-bold text-cyan-400 bg-blue-950/40 border-x border-blue-500/20">Deceptor</th>
                    <th className="p-4 sm:p-5 text-sm font-medium text-slate-400">Google Drive</th>
                    <th className="p-4 sm:p-5 text-sm font-medium text-slate-400">WeTransfer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 sm:p-5 font-medium text-white">{row.feature}</td>
                      <td className="p-4 sm:p-5 font-bold text-cyan-300 bg-blue-950/30 border-x border-blue-500/20 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span>{row.deceptor}</span>
                      </td>
                      <td className="p-4 sm:p-5 text-slate-400">{row.googleDrive}</td>
                      <td className="p-4 sm:p-5 text-slate-400">{row.wetransfer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. USER-PROVIDED 3-COLUMN VERTICAL TESTIMONIALS SECTION ─────── */}
      <section id="testimonials-section" className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Header with Review Counter */}
          <div className="mb-12">
            <span className="text-sm font-medium text-rose-400">Testimonials</span>
            <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white font-display">
              Real stories from teams who transformed their video distribution.
            </h2>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 border-white/10 bg-white/5 backdrop-blur-md">
              <span className="inline-flex items-center -space-x-2">
                <img className="h-6 w-6 rounded-full ring-2 object-cover ring-neutral-900" src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop" alt="Reviewer 1" />
                <img className="h-6 w-6 rounded-full ring-2 object-cover ring-neutral-900" src="https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&auto=format&fit=crop" alt="Reviewer 2" />
                <img className="h-6 w-6 rounded-full ring-2 object-cover ring-neutral-900" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop" alt="Reviewer 3" />
                <img className="h-6 w-6 rounded-full ring-2 object-cover ring-neutral-900" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" alt="Reviewer 4" />
              </span>
              <span className="ml-2 inline-flex items-center gap-1 text-sm text-neutral-300">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="ml-1 font-semibold text-white">4.9/5 • 2,431 reviews</span>
              </span>
            </div>
          </div>

          {/* 3-Column Vertical Auto-Scrolling Masonry */}
          <div
            className="grid grid-cols-1 overflow-hidden md:grid-cols-3 py-6 gap-6"
            style={{
              maskImage: 'linear-gradient(180deg, transparent, black 15%, black 85%, transparent)',
              WebkitMaskImage: 'linear-gradient(180deg, transparent, black 15%, black 85%, transparent)',
              maxHeight: '620px',
            }}
          >
            {/* Column 1 - Scroll Up */}
            <div className="overflow-hidden">
              <div data-scroll-column="1" className="space-y-6">
                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "The instant setup let our team start tracking video performance in minutes. Permanent links changed how we deliver masterclasses."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=256&auto=format&fit=crop" alt="Aisha Green" />
                    <div>
                      <div className="text-sm font-semibold text-white">Aisha Green</div>
                      <div className="text-xs text-neutral-400">Head of Media Production</div>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "Sharing 3-hour documentary cuts is effortless now. Recipients stream without signing in — no confusion, no compression."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=256&auto=format&fit=crop" alt="Priya Patel" />
                    <div>
                      <div className="text-sm font-semibold text-white">Priya Patel</div>
                      <div className="text-xs text-neutral-400">Creative Director</div>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "From first upload to full studio rollout took under an hour. Lifetime active links are a complete game changer."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1546456073-6712f79251bb?q=80&w=256&auto=format&fit=crop" alt="Jonas Weber" />
                    <div>
                      <div className="text-sm font-semibold text-white">Jonas Weber</div>
                      <div className="text-xs text-neutral-400">Operations Lead</div>
                    </div>
                  </div>
                </article>

                {/* Duplicate for seamless loop */}
                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "The instant setup let our team start tracking video performance in minutes. Permanent links changed how we deliver masterclasses."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=256&auto=format&fit=crop" alt="Aisha Green" />
                    <div>
                      <div className="text-sm font-semibold text-white">Aisha Green</div>
                      <div className="text-xs text-neutral-400">Head of Media Production</div>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            {/* Column 2 - Scroll Down */}
            <div className="overflow-hidden">
              <div data-scroll-column="2" className="space-y-6">
                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "Encrypted cloud uploads with direct client pipes—security included. We cut our client review cycles by 62%."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=256&auto=format&fit=crop" alt="Michael Chen" />
                    <div>
                      <div className="text-sm font-semibold text-white">Michael Chen</div>
                      <div className="text-xs text-neutral-400">Executive Producer</div>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "Zero re-encoding means our 4K color grading stays 100% true to our exports. No compression artifacts."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop" alt="Rachel Adams" />
                    <div>
                      <div className="text-sm font-semibold text-white">Rachel Adams</div>
                      <div className="text-xs text-neutral-400">Post-Production Supervisor</div>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "Support and uptime are outstanding. The native Android APK works identically to desktop web."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=256&auto=format&fit=crop" alt="Liam O'Connor" />
                    <div>
                      <div className="text-sm font-semibold text-white">Liam O'Connor</div>
                      <div className="text-xs text-neutral-400">Engineering Lead</div>
                    </div>
                  </div>
                </article>

                {/* Duplicate for seamless loop */}
                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "Encrypted cloud uploads with direct client pipes—security included. We cut our client review cycles by 62%."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=256&auto=format&fit=crop" alt="Michael Chen" />
                    <div>
                      <div className="text-sm font-semibold text-white">Michael Chen</div>
                      <div className="text-xs text-neutral-400">Executive Producer</div>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            {/* Column 3 - Scroll Up */}
            <div className="overflow-hidden">
              <div data-scroll-column="3" className="space-y-6">
                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "Switching from temporary transfer tools to Deceptor was our best workflow decision this year."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop" alt="Carlos Rivera" />
                    <div>
                      <div className="text-sm font-semibold text-white">Carlos Rivera</div>
                      <div className="text-xs text-neutral-400">Agency CEO</div>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "Permanent links removed all client complaints about expired downloads. Unmatched reliability."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=256&auto=format&fit=crop" alt="Sofia Martinez" />
                    <div>
                      <div className="text-sm font-semibold text-white">Sofia Martinez</div>
                      <div className="text-xs text-neutral-400">Head of Video Strategy</div>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "Adaptive streaming chunks mean even recipients on mobile cellular data watch smoothly without stalling."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=256&auto=format&fit=crop" alt="Noah Bennett" />
                    <div>
                      <div className="text-sm font-semibold text-white">Noah Bennett</div>
                      <div className="text-xs text-neutral-400">Education Program Lead</div>
                    </div>
                  </div>
                </article>

                {/* Duplicate for seamless loop */}
                <article className="rounded-2xl border p-6 border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-xl">
                  <blockquote className="text-[16px] sm:text-[17px] text-neutral-100 leading-relaxed font-sans">
                    <span className="inline-flex items-start gap-2">
                      <Quote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-1" />
                      "Switching from temporary transfer tools to Deceptor was our best workflow decision this year."
                    </span>
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop" alt="Carlos Rivera" />
                    <div>
                      <div className="text-sm font-semibold text-white">Carlos Rivera</div>
                      <div className="text-xs text-neutral-400">Agency CEO</div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. TRUST & SECURITY METRICS ──────────────────────────────────── */}
      <section id="trust-section" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/5 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="metric-box rounded-3xl p-8 glass-panel text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-blue-400/30">
                <Server className="w-6 h-6" />
              </div>
              <div className="font-display font-black text-3xl sm:text-4xl text-white mb-1">99.99%</div>
              <div className="font-semibold text-sm text-slate-300 mb-1">Guaranteed CDN Uptime</div>
              <div className="text-xs text-slate-500">Multi-region global edge nodes</div>
            </div>

            <div className="metric-box rounded-3xl p-8 glass-panel text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-400/30">
                <Lock className="w-6 h-6" />
              </div>
              <div className="font-display font-black text-3xl sm:text-4xl text-cyan-400 mb-1">TLS 1.3</div>
              <div className="font-semibold text-sm text-slate-300 mb-1">End-to-End Encrypted Transfer</div>
              <div className="text-xs text-slate-500">Direct client-to-storage signed tokens</div>
            </div>

            <div className="metric-box rounded-3xl p-8 glass-panel text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-400/30">
                <HardDrive className="w-6 h-6" />
              </div>
              <div className="font-display font-black text-3xl sm:text-4xl text-indigo-400 mb-1">0% Loss</div>
              <div className="font-semibold text-sm text-slate-300 mb-1">Original Bitrate Preservation</div>
              <div className="text-xs text-slate-500">Zero mandatory re-encoding artifacts</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. CALL TO ACTION BANNER ─────────────────────────────────────── */}
      <section id="cta-section" className="py-28 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto">
          <div className="cta-card-box relative rounded-3xl p-10 sm:p-16 glass-panel border border-cyan-500/30 overflow-hidden text-center shadow-2xl">
            {/* Background Glow */}
            <div className="ambient-glow-blue top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight mb-5">
                Ready to Stop Worrying About Expired Video Links?
              </h2>
              <p className="font-sans text-slate-300 text-base sm:text-lg mb-10 leading-relaxed">
                Create an account in 30 seconds. Upload your first 3-hour video and share a universal lifetime link today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup" className="btn btn-primary btn-lg w-full sm:w-auto text-base">
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="btn btn-dark btn-lg w-full sm:w-auto text-base">
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FOOTER ────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#04060b]/90 border-t border-white/5 text-slate-400 text-sm backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.svg"
              alt="Deceptor Logo"
              className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
            />
            <span className="font-display font-black text-lg text-white">Deceptor</span>
          </div>
          <div>© {new Date().getFullYear()} Deceptor. Permanent Universal Video Hosting. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#testimonials-section" className="hover:text-white transition-colors">Reviews</a>
            <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
