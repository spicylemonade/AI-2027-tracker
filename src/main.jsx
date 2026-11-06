import './index.css';
import React, { useState, useEffect, useMemo, useRef, forwardRef, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import predictionsData from './data/predictions.json';
import blogPostsData from './data/blogPosts.json';
import {
  buildDanielCurveForViewport,
  SCENARIO_LOG10_OFFSET,
  ECI_EXTRAPOLATED_P80_POINTS,
  ECI_FIT,
  METR_PROGRESS_DOMAIN,
  METR_PROGRESS_SNAPSHOT,
  PUBLISHED_METR_P80_POINTS,
  TODAY_REFERENCE_DATE,
} from './data/metrProgress';
import { AECI_EXTRAPOLATED_P80_POINTS, AECI_FIT } from './data/aeciProgress';
import horizonEstimates from './data/horizonEstimates';
import { buildDateTicks, buildHorizonTicks, panViewport, wheelViewport, zoomViewport } from './data/chartViewport';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Theme Context ---
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

// --- Color Palettes ---
const lightColors = {
  background: 'bg-[#fafafa]',
  textPrimary: 'text-[#1d1d1f]',
  textSecondary: 'text-[#86868b]',
  accentGreen: 'text-emerald-600',
  bgAccentGreen: 'bg-emerald-600',
  hoverBgAccentGreen: 'hover:bg-emerald-700',
  borderMuted: 'border-[#d2d2d7]',
  cardBackground: 'bg-white',
  navbarBackground: 'bg-[#fafafa]/80 backdrop-blur-xl border-b border-[#d2d2d7]/60',
  footerBackground: 'bg-[#f5f5f7]',
  proseText: 'text-[#1d1d1f]',
  proseHeadings: 'text-[#1d1d1f]',
  proseLinks: 'text-emerald-600',
};

const darkColors = {
  background: 'bg-[#0a0a0a]',
  textPrimary: 'text-[#f5f5f7]',
  textSecondary: 'text-[#86868b]',
  accentGreen: 'text-emerald-400',
  bgAccentGreen: 'bg-emerald-500',
  hoverBgAccentGreen: 'hover:bg-emerald-600',
  borderMuted: 'border-[#38383d]',
  cardBackground: 'bg-[#161617]',
  navbarBackground: 'bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#38383d]/60',
  footerBackground: 'bg-[#161617]',
  proseText: 'text-[#f5f5f7]',
  proseHeadings: 'text-[#f5f5f7]',
  proseLinks: 'text-emerald-400',
};

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  // Handle potential date formats gracefully
  try {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateString; // Return original string if parsing fails
  }
};

const parseUtcDate = (dateString) => Date.parse(`${dateString}T00:00:00Z`);

const formatCompactMetrHours = (hours) => {
  if (hours < 1 / 60) {
    return `${Math.round(hours * 3600)} sec`;
  }

  if (hours < 1) {
    const minutes = hours * 60;
    return `${minutes >= 10 ? minutes.toFixed(0) : minutes.toFixed(1)} min`;
  }

  if (hours < 100) {
    return `${hours >= 10 ? hours.toFixed(1) : hours.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} h`;
  }

  return `${Math.round(hours).toLocaleString('en-US')} h`;
};

const formatMonthYear = (dateString) =>
  new Date(`${dateString}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

const getStatusClasses = (status, isDarkMode) => {
  // Base classes that don't change with theme much
  // Or, you can have completely different sets
  switch (status) {
    case 'Confirmed Accurate': return `${isDarkMode ? 'bg-emerald-800/50 text-emerald-300 border-emerald-700' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`;
    case 'Partially Accurate': return `${isDarkMode ? 'bg-yellow-700/50 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`;
    case 'Inaccurate / Debunked': return `${isDarkMode ? 'bg-red-800/50 text-red-300 border-red-700' : 'bg-red-100 text-red-700 border-red-300'}`;
    case 'In Progress / Monitoring': return `${isDarkMode ? 'bg-blue-700/50 text-blue-300 border-blue-600' : 'bg-blue-100 text-blue-700 border-blue-300'}`;
    case 'Pending Evaluation': return `${isDarkMode ? 'bg-neutral-700 text-neutral-400 border-neutral-600' : 'bg-gray-100 text-gray-600 border-gray-300'}`;
    default: return `${isDarkMode ? 'bg-neutral-700 text-neutral-400 border-neutral-600' : 'bg-gray-100 text-gray-600 border-gray-300'}`;
  }
};

// --- SVG Icons (Simple Placeholders) ---
const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 ml-1">
    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);


// --- Reusable UI Components ---
const Card = forwardRef(({ children, className = '', hoverable = false }, ref) => {
  const { activeColors } = useTheme();
  const hoverEffects = hoverable ? 'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5' : '';
  return (
    <div ref={ref} className={`${activeColors.cardBackground} rounded-2xl border ${activeColors.borderMuted} ${hoverEffects} ${className}`}>
      {children}
    </div>
  );
});
const CardHeader = ({ children, className = '' }) => <div className={`px-5 pt-5 pb-3 sm:px-6 sm:pt-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '', size = 'lg' }) => {
    const { activeColors } = useTheme();
    const sizeClass = size === 'lg' ? 'text-base' : 'text-sm';
    return <h3 className={`font-semibold tracking-tight ${activeColors.textPrimary} ${sizeClass} ${className}`}>{children}</h3>;
};
const CardDescription = ({ children, className = '' }) => {
    const { activeColors } = useTheme();
    return <p className={`text-[13px] leading-relaxed ${activeColors.textSecondary} ${className}`}>{children}</p>;
};
const CardContent = ({ children, className = '' }) => <div className={`px-5 pb-5 sm:px-6 sm:pb-6 ${className}`}>{children}</div>;


const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, asChild = false, href, target, rel }) => {
  const { activeColors } = useTheme();
  const sizeClasses = size === 'lg' ? 'px-7 py-3 text-[15px]' : size === 'sm' ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2.5 text-[13px]';
  const baseClasses = `font-medium rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97] ${sizeClasses} inline-flex items-center justify-center`;
  let variantClasses = '';

  switch (variant) {
    case 'outline':
      variantClasses = `border ${activeColors.borderMuted} ${activeColors.textPrimary} hover:bg-black/[0.03] dark:hover:bg-white/[0.04] focus-visible:ring-neutral-400`;
      break;
    case 'primary': 
    default:
      variantClasses = `${activeColors.bgAccentGreen} text-white ${activeColors.hoverBgAccentGreen} focus-visible:ring-emerald-500 shadow-sm`;
      break;
  }
  
  if (asChild && href) {
    return (
      <a href={href} target={target} rel={rel} className={`${baseClasses} ${variantClasses} ${className}`}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </button>
  );
};

// Modified Input to handle 'select' type better for styling consistency
const Input = ({ type = 'text', placeholder, value, onChange, className = '', children, as }) => {
  const { activeColors } = useTheme();
  const commonClasses = `w-full px-3 py-2 border ${activeColors.borderMuted} rounded-xl text-[13px] ${activeColors.textPrimary} bg-transparent dark:bg-[#1c1c1e] focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60 placeholder:text-[#86868b] transition-all duration-200`;
  if (as === 'select') {
    return (
      <select value={value} onChange={onChange} className={`${commonClasses} ${className} appearance-none`}>
        {children}
      </select>
    );
  }
  return (
    <input 
      type={type} 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange}
      className={`${commonClasses} ${className}`}
    />
  );
};


const Progress = ({ value, className = '' }) => {
  const { activeColors } = useTheme();
  return (
    <div className={`w-full rounded-full h-1.5 overflow-hidden bg-black/[0.06] dark:bg-white/[0.08] ${className}`}>
      <div
        className={`${activeColors.bgAccentGreen} h-1.5 rounded-full transition-all duration-1000 ease-out`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

// --- Components ---

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { activeColors, isDarkMode, toggleTheme } = useTheme(); // Use theme context

  const navItems = [
    { name: 'Home', page: '/' }, 
    { name: 'Timeline', page: '/timeline' },
    { name: 'Predictions', page: '/predictions' }, 
    { name: 'Blog', page: '/blog' },
    { name: 'About', page: '/about' },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`sticky top-0 z-20 flex items-center justify-between ${activeColors.navbarBackground} px-5 sm:px-8 py-3`}>
      <h1
        className={`text-[15px] font-semibold tracking-tight cursor-pointer ${activeColors.textPrimary}`}
        onClick={() => handleNavClick('/')}
      >
        AI 2027 <span className={activeColors.accentGreen}>Tracker</span>
      </h1>
      
      <div className="flex items-center">
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-5 mr-4">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => handleNavClick(item.page)}
            className={`text-[13px] font-medium ${activeColors.textSecondary} transition-colors hover:${activeColors.textPrimary}`}
          >
            {item.name}
          </button>
        ))}
        <a
          href="https://x.com/spicey_lemonade"
          target="_blank"
          rel="noopener noreferrer"
          className={`p-1.5 rounded-md ${activeColors.textSecondary} hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors`}
          aria-label="Follow on X (Twitter)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
      </div>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className={`p-1.5 rounded-md ${activeColors.textSecondary} hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            // Sun icon (classic, clear)
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <circle cx="12" cy="12" r="5" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="1.5">
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </g>
            </svg>
          ) : (
            // Moon icon (classic crescent)
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="currentColor" />
            </svg>
          )}
        </button>

        {/* Mobile Menu Button */}
        <div className="md:hidden ml-2">
          <Button 
              variant="outline" 
              size="sm" 
              className="px-2 py-1" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> 
              ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
        </svg>
        <span className="sr-only">Menu</span>
      </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className={`md:hidden absolute top-full left-0 right-0 ${activeColors.cardBackground} border-b ${activeColors.borderMuted} py-2 z-30`} style={{ backdropFilter: 'blur(20px)' }}>
          <div className="flex flex-col px-5">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleNavClick(item.page)}
                className={`w-full text-left py-2 text-[13px] font-medium ${activeColors.textSecondary} hover:${activeColors.textPrimary} transition-colors`}
              >
                {item.name}
              </button>
            ))}
            <a
              href="https://x.com/spicey_lemonade"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 py-2 text-[13px] font-medium ${activeColors.textSecondary}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              @spicey_lemonade
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer = () => {
  const { activeColors } = useTheme();
  return (
    <footer className={`border-t ${activeColors.borderMuted} ${activeColors.footerBackground} py-6 text-center`}>
      <p className={`text-[12px] ${activeColors.textSecondary}`}>© {new Date().getFullYear()} AI 2027 Tracker &middot; For analytical purposes</p>
    </footer>
  );
};

// PredictionCard specifically for Timeline (more compact)
const TimelinePredictionCard = ({ prediction }) => {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const { activeColors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the card is visible
      }
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      // It's safer to disconnect the observer entirely on cleanup
      observer.disconnect(); 
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const handleReadMore = () => {
    navigate(`/prediction/${prediction.id}`);
  };

  return (
    // Add ref and dynamic classes for animation
    <Card 
      ref={cardRef}
      className={`flex flex-col transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <CardHeader className="flex-1 !p-3 sm:!p-4"> {/* Reduced padding */}
        <CardTitle size="sm" className="line-clamp-2 !text-sm sm:!text-base">{prediction.text}</CardTitle> {/* Smaller title, tighter clamp */}
        <CardDescription className="mt-1 !text-xs">{prediction.predictedDate} - {prediction.originalScenario}</CardDescription>
      </CardHeader>
      <CardContent className="!p-3 sm:!p-4"> {/* Reduced padding */}
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 !text-xs font-semibold border ${getStatusClasses(prediction.status, isDarkMode)}`}>
          {prediction.status || 'Pending'} {/* Show pending if status is null */}
        </span>
        {prediction.accuracyScore !== null && (
          <span className={`ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 !text-xs font-semibold border bg-indigo-100 dark:bg-indigo-700/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600`}>
            Acc: {prediction.accuracyScore}%
          </span>
        )}
         <button 
            onClick={handleReadMore}
            className={`block mt-2 text-xs sm:text-sm ${activeColors.accentGreen} hover:underline font-semibold`}
        >
            View Details &rarr;
        </button>
      </CardContent>
    </Card>
  );
};


// General PredictionCard (used on Homepage, AllPredictions)
const PredictionCard = ({ prediction }) => {
  const { activeColors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col h-full group" hoverable={true}>
      <CardHeader className="flex-1">
        <CardTitle className="line-clamp-3 text-[14px] leading-snug">{prediction.text}</CardTitle>
        <CardDescription className="mt-2">{prediction.predictedDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${getStatusClasses(prediction.status, isDarkMode)}`}>
            {prediction.status || 'Pending'}
          </span>
          {prediction.accuracyScore !== null && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-[#d2d2d7] dark:border-[#38383d] text-[#86868b]">
              {prediction.accuracyScore}%
            </span>
          )}
        </div>
        <button
          onClick={() => navigate(`/prediction/${prediction.id}`)}
          className={`mt-3 text-[13px] font-medium ${activeColors.accentGreen} hover:underline`}
        >
          Details &rarr;
        </button>
      </CardContent>
    </Card>
  );
};


const BlogCard = ({ post }) => {
    const { activeColors } = useTheme();
    const navigate = useNavigate();

    return (
        <Card className="flex flex-col h-full group" hoverable={true}>
            <CardHeader className="flex-1">
                <CardTitle className="text-[14px] leading-snug">{post.title}</CardTitle>
                <CardDescription className="mt-1.5">{post.author} &middot; {formatDate(post.date)}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className={`${activeColors.textSecondary} text-[13px] leading-relaxed mb-3 line-clamp-3`}>{post.summary}</p>
                <button
                    onClick={() => navigate(`/blog/${post.id}`)}
                    className={`text-[13px] font-medium ${activeColors.accentGreen} hover:underline`}
                >
                    Read &rarr;
                </button>
            </CardContent>
        </Card>
    );
};

const MetrProgressChart = () => {
  const { activeColors, isDarkMode } = useTheme();
  const [showDanielCurve, setShowDanielCurve] = useState(true);
  const [showPublishedMetr, setShowPublishedMetr] = useState(true);
  const [showEciExtrapolations, setShowEciExtrapolations] = useState(true);
  const [showAeciExtrapolations, setShowAeciExtrapolations] = useState(true);
  const [showUncertainty, setShowUncertainty] = useState(false);
  const chartSvgRef = useRef(null);
  const dragStateRef = useRef(null);

  const c = useMemo(() => ({
    bg: isDarkMode ? '#0a0a0a' : '#fafafa',
    axis: isDarkMode ? '#38383d' : '#d2d2d7',
    grid: isDarkMode ? '#1c1c1e' : '#f0f0f2',
    curve: isDarkMode ? '#ff453a' : '#e63329',
    published: isDarkMode ? '#64d2ff' : '#0071e3',
    extrapolated: isDarkMode ? '#30d158' : '#28a745',
    aeci: isDarkMode ? '#bf8cff' : '#8050b0',
    label: isDarkMode ? '#86868b' : '#86868b',
    text: isDarkMode ? '#f5f5f7' : '#1d1d1f',
    today: isDarkMode ? '#48484a' : '#c7c7cc',
  }), [isDarkMode]);

  const W = 880;
  const H = 380;
  const pad = { t: 16, r: 20, b: 44, l: 58 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const fullXMin = parseUtcDate(METR_PROGRESS_DOMAIN.startDate);
  const fullXMax = parseUtcDate(METR_PROGRESS_DOMAIN.endDate);
  const fullYMinLog = Math.log10(METR_PROGRESS_DOMAIN.minHours);
  const fullYMaxLog = Math.log10(METR_PROGRESS_DOMAIN.maxHours);
  const fullViewBounds = useMemo(() => ({
    xMin: fullXMin,
    xMax: fullXMax,
    yMinLog: fullYMinLog,
    yMaxLog: fullYMaxLog,
  }), [fullXMin, fullXMax, fullYMinLog, fullYMaxLog]);
  const [viewBounds, setViewBounds] = useState(fullViewBounds);

  const getSvgPoint = (event) => {
    const rect = chartSvgRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    };
  };

  const xMin = viewBounds.xMin;
  const xMax = viewBounds.xMax;
  const yMinLog = viewBounds.yMinLog;
  const yMaxLog = viewBounds.yMaxLog;

  const sxTimestamp = (value) => pad.l + (((value - xMin) / (xMax - xMin)) * iW);
  const sx = (d) => sxTimestamp(parseUtcDate(d));
  const syLog = (logHours) => pad.t + ((1 - ((logHours - yMinLog) / (yMaxLog - yMinLog))) * iH);
  const sy = (h) => syLog(Math.log10(h));
  const danielCurve = useMemo(() => buildDanielCurveForViewport({
    ...viewBounds,
    yMinLog: viewBounds.yMinLog - SCENARIO_LOG10_OFFSET,
    yMaxLog: viewBounds.yMaxLog - SCENARIO_LOG10_OFFSET,
  }), [viewBounds]);
  const danielCurvePath = danielCurve.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${sxTimestamp(p.timestamp)},${syLog(p.logHours + SCENARIO_LOG10_OFFSET)}`).join(' ');

  const yTicks = buildHorizonTicks(yMinLog, yMaxLog);
  const xTicks = buildDateTicks(xMin, xMax);
  const todayX = sx(TODAY_REFERENCE_DATE);
  const danielCurveTodayY = sy(METR_PROGRESS_SNAPSHOT.danielCurveToday.hours);
  const isZoomed = viewBounds.xMin !== fullViewBounds.xMin
    || viewBounds.xMax !== fullViewBounds.xMax
    || viewBounds.yMinLog !== fullViewBounds.yMinLog
    || viewBounds.yMaxLog !== fullViewBounds.yMaxLog;

  useEffect(() => {
    const svg = chartSvgRef.current;
    if (!svg) return undefined;
    const onWheel = (event) => {
      const rect = svg.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * W;
      const y = ((event.clientY - rect.top) / rect.height) * H;
      if (x < pad.l || x > pad.l + iW || y < pad.t || y > pad.t + iH) return;
      event.preventDefault();
      setViewBounds(previous => wheelViewport(previous, event,
        { x: (x - pad.l) / iW, y: (y - pad.t) / iH },
        rect.width * iW / W, rect.height * iH / H));
    };
    // React's wheel listeners are passive; a native listener keeps the page
    // stationary while the graph consumes a wheel / trackpad gesture.
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [W, H, iW, iH, pad.l, pad.t]);

  const handleGraphKey = (event) => {
    const shifts = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, 0.15], ArrowDown: [0, -0.15] };
    if (shifts[event.key]) {
      event.preventDefault();
      setViewBounds(previous => panViewport(previous, ...shifts[event.key]));
    } else if (['+', '=', '-', 'Home'].includes(event.key)) {
      event.preventDefault();
      setViewBounds(previous => event.key === 'Home' ? fullViewBounds : zoomViewport(previous, event.key === '-' ? 1.5 : 1 / 1.5));
    }
  };

  const handlePointerDown = (event) => {
    const point = getSvgPoint(event);
    if (!point || point.x < pad.l || point.x > W - pad.r || point.y < pad.t || point.y > H - pad.b) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startPoint: point,
      startBounds: viewBounds,
    };
  };

  const handlePointerMove = (event) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = getSvgPoint(event);
    if (!point) return;

    const dx = point.x - drag.startPoint.x;
    const dy = point.y - drag.startPoint.y;
    setViewBounds(panViewport(drag.startBounds, -dx / iW, dy / iH));
  };

  const handlePointerEnd = (event) => {
    const drag = dragStateRef.current;
    if (drag?.pointerId === event.pointerId) {
      dragStateRef.current = null;
    }
  };

  const toggles = [
    { id: 'daniel', label: 'AI 2027 scenario', color: c.curve, active: showDanielCurve, toggle: () => setShowDanielCurve(v => !v) },
    { id: 'published', label: 'METR published', color: c.published, active: showPublishedMetr, toggle: () => setShowPublishedMetr(v => !v) },
    { id: 'extrapolated', label: 'ECI estimate', color: c.extrapolated, active: showEciExtrapolations, toggle: () => setShowEciExtrapolations(v => !v) },
    { id: 'aeci', label: 'AECI estimate', color: c.aeci, active: showAeciExtrapolations, toggle: () => setShowAeciExtrapolations(v => !v) },
    { id: 'uncertainty', label: 'Uncertainty', color: c.label, active: showUncertainty, toggle: () => setShowUncertainty(v => !v) },
  ];

  const StatBlock = ({ label, value, sub }) => (
    <div className="flex-1 min-w-0">
      <p className={`text-[11px] font-medium uppercase tracking-wider ${activeColors.textSecondary}`}>{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${activeColors.textPrimary}`}>{value}</p>
      <p className={`mt-0.5 text-[12px] ${activeColors.textSecondary}`}>{sub}</p>
    </div>
  );

  const UncertaintyBar = ({ x, low, high, color, estimated = false }) => (
    <g data-uncertainty={estimated ? 'estimate' : 'published'} stroke={color} strokeWidth="1.3" opacity="0.7">
      <line x1={x} x2={x} y1={sy(low)} y2={sy(high)} strokeDasharray={estimated ? '3 2' : undefined} />
      <path d={`M${x - 4},${sy(low)}h8 M${x - 4},${sy(high)}h8`} />
    </g>
  );
  const frontierFit = METR_PROGRESS_SNAPSHOT.frontierExtrapolation;
  const { lagWeeks, backtest } = horizonEstimates;
  const aeciOpus55 = AECI_EXTRAPOLATED_P80_POINTS.find(p => p.model === 'Claude Opus 5.5');
  const aeciModel4 = AECI_EXTRAPOLATED_P80_POINTS.find(p => p.internal);
  const sourceLinkClass = 'underline decoration-current/30 hover:decoration-current';
  const formatBounds = (low, high) => `${formatCompactMetrHours(low)}–${formatCompactMetrHours(high)}`;
  // Estimates this uncertain don't merit three significant figures.
  const roundEstimate = (hours) => Number(hours.toFixed(hours < 10 ? 1 : 0));
  const formatRange = (low, high) => `${roundEstimate(low)}–${roundEstimate(high)} h`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-xl font-semibold tracking-tight ${activeColors.textPrimary}`}>
          Task-Horizon Progress
        </h3>
        <p className={`mt-1 text-[13px] leading-relaxed ${activeColors.textSecondary} max-w-2xl`}>
          How long a task, in human time, AI agents can complete with 80% success on METR&apos;s software tasks.
          Data as of {TODAY_REFERENCE_DATE}.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {toggles.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={t.toggle}
            aria-pressed={t.active}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all duration-200"
            style={{
              color: t.active ? t.color : (isDarkMode ? '#86868b' : '#86868b'),
              backgroundColor: t.active ? (isDarkMode ? `${t.color}14` : `${t.color}0a`) : 'transparent',
              border: `1px solid ${t.active ? `${t.color}40` : (isDarkMode ? '#38383d' : '#d2d2d7')}`,
              opacity: t.active ? 1 : 0.7,
            }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: t.color, opacity: t.active ? 1 : 0.4 }} />
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setViewBounds(fullViewBounds)}
          disabled={!isZoomed}
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium transition-all duration-200 ${
            isZoomed ? activeColors.textPrimary : activeColors.textSecondary
          }`}
          style={{
            borderColor: isDarkMode ? '#38383d' : '#d2d2d7',
            opacity: isZoomed ? 1 : 0.45,
          }}
        >
          Reset view
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${isDarkMode ? '#38383d' : '#d2d2d7'}` }}>
        <svg
          ref={chartSvgRef}
          role="img"
          aria-label="Task horizons at 80% success, with published METR uncertainty and separate exploratory ECI and AECI estimates"
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full select-none cursor-grab active:cursor-grabbing"
          tabIndex={0}
          onKeyDown={handleGraphKey}
          data-view-x-min={xMin}
          data-view-x-max={xMax}
          data-view-y-min={yMinLog}
          data-view-y-max={yMaxLog}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onDoubleClick={() => setViewBounds(fullViewBounds)}
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif', touchAction: 'none' }}
        >
          <rect width={W} height={H} fill={c.bg} />
          <defs>
            <clipPath id="metr-chart-clip">
              <rect x={pad.l} y={pad.t} width={iW} height={iH} />
            </clipPath>
          </defs>

          {yTicks.map((tick) => (
            <g key={tick.logHours}>
              <line x1={pad.l} y1={syLog(tick.logHours)} x2={W - pad.r} y2={syLog(tick.logHours)} stroke={c.grid} strokeWidth="1" />
              <text x={pad.l - 8} y={syLog(tick.logHours) + 4} fill={c.label} fontSize="10" textAnchor="end" fontWeight="500">{tick.label}</text>
            </g>
          ))}

          {xTicks.map((tick) => (
            <g key={tick.value}>
              <line x1={sxTimestamp(tick.value)} y1={pad.t} x2={sxTimestamp(tick.value)} y2={H - pad.b} stroke={c.grid} strokeWidth="1" />
              <text x={sxTimestamp(tick.value)} y={H - pad.b + 20} fill={c.label} fontSize="10" textAnchor="middle" fontWeight="500">{tick.label}</text>
            </g>
          ))}

          <g clipPath="url(#metr-chart-clip)">
            <line x1={todayX} y1={pad.t} x2={todayX} y2={H - pad.b} stroke={c.today} strokeWidth="1" strokeDasharray="3 4" />

            {showDanielCurve && (
              <>
                <path data-scenario-curve="true" data-start-time={danielCurve[0]?.timestamp}
                  data-end-time={danielCurve[danielCurve.length - 1]?.timestamp}
                  d={danielCurvePath} fill="none" stroke={c.curve} strokeWidth="2.5" strokeDasharray="7 4" strokeLinecap="round" opacity="0.85" />
                <circle cx={todayX} cy={danielCurveTodayY} r="4" fill={c.curve} />
                <text
                  x={todayX - 10}
                  y={danielCurveTodayY - 18}
                  textAnchor="end"
                  fill={c.curve}
                  fontSize="9"
                  fontWeight="600"
                  opacity="0.85"
                >
                  AI 2027
                </text>
              </>
            )}

            {showPublishedMetr && (
              <>
                {PUBLISHED_METR_P80_POINTS.map((p) => (
                  <g key={p.id}>
                    <title>{`${p.label}: ${formatCompactMetrHours(p.hours)} p80; published interval ${formatCompactMetrHours(p.ciLowHours)}–${formatCompactMetrHours(p.ciHighHours)}`}</title>
                    {showUncertainty && <UncertaintyBar x={sx(p.releaseDate)} low={p.ciLowHours} high={p.ciHighHours} color={c.published} />}
                    <circle cx={sx(p.releaseDate)} cy={sy(p.hours)} r={p.showLabel ? 3.5 : 2.5} fill={c.published} opacity={p.showLabel ? 0.9 : 0.5} />
                  </g>
                ))}
                {PUBLISHED_METR_P80_POINTS.filter((p) => p.showLabel).map((p) => (
                  <text key={`${p.id}-l`} x={sx(p.releaseDate) + (p.labelDx || 0)} y={sy(p.hours) + (p.labelDy || 0)} fill={c.published} fontSize="9" fontWeight="600" opacity="0.85">{p.chartLabel || p.label}</text>
                ))}
              </>
            )}

            {showEciExtrapolations && ECI_EXTRAPOLATED_P80_POINTS.map((p) => {
              const px = sx(p.releaseDate), py = sy(p.hours);
              return (
                <g key={p.id}>
                  <title>{`${p.model}: about ${formatCompactMetrHours(p.hours)} p80, 90% range ${formatBounds(p.low, p.high)}. Epoch ECI ${p.eci}.`}</title>
                  {showUncertainty && <UncertaintyBar x={px} low={p.low} high={p.high} color={c.extrapolated} estimated />}
                  <polygon points={`${px},${py - 5.5} ${px + 5.5},${py} ${px},${py + 5.5} ${px - 5.5},${py}`} fill={c.extrapolated} opacity="0.9" />
                  <text x={px + (p.labelDx || 0)} y={py + (p.labelDy || 0)} fill={c.extrapolated} fontSize="9" fontWeight="600" opacity="0.85">{p.label}</text>
                </g>
              );
            })}

            {showAeciExtrapolations && AECI_EXTRAPOLATED_P80_POINTS.map((p) => {
              const px = sx(p.releaseDate), py = sy(p.hours);
              return <g key={p.id}>
                <title>{`${p.model}: about ${formatCompactMetrHours(p.hours)} p80, 90% range ${formatBounds(p.low, p.high)}. AECI ${p.aeci}.${p.internal ? ' Unreleased; plotted when it reached most Anthropic staff.' : ''}`}</title>
                {showUncertainty && <UncertaintyBar x={px} low={p.low} high={p.high} color={c.aeci} estimated />}
                <polygon points={`${px},${py - 5} ${px + 5},${py + 4} ${px - 5},${py + 4}`} fill={c.bg} stroke={c.aeci} strokeWidth="1.5" />
                <text x={px + p.labelDx} y={py + p.labelDy} fill={c.aeci} fontSize="9" fontWeight="600">{p.label}</text>
              </g>;
            })}
          </g>

          {todayX >= pad.l && todayX <= W - pad.r && <text x={todayX} y={H - pad.b + 34} fill={c.label} fontSize="9" textAnchor="middle" fontWeight="600">AS OF</text>}
          <text x={W / 2} y={H - 6} fill={c.label} fontSize="10" textAnchor="middle" fontWeight="500">Release date</text>
          <text transform={`translate(14 ${H / 2}) rotate(-90)`} fill={c.label} fontSize="10" textAnchor="middle" fontWeight="500">p80 human task horizon (log)</text>
        </svg>
      </div>
      <p className={`-mt-4 text-[11px] ${activeColors.textSecondary}`}>
        Drag to pan, scroll to zoom, Shift+scroll through dates. Double-click to reset.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBlock label="AI 2027 scenario" value={`${roundEstimate(METR_PROGRESS_SNAPSHOT.danielCurveToday.hours)} h`} sub={`${formatMonthYear(TODAY_REFERENCE_DATE)} level`} />
        <StatBlock label="Epoch ECI estimate" value={`≈${roundEstimate(frontierFit.hours)} h`}
          sub={<>{frontierFit.model}<br />90% range {formatRange(frontierFit.low, frontierFit.high)}</>} />
        <StatBlock label="AECI estimate" value={`≈${roundEstimate(aeciOpus55.hours)} h`}
          sub={<>Claude Opus 5.5<br />90% range {formatRange(aeciOpus55.low, aeciOpus55.high)}</>} />
      </div>

      <p className={`text-[13px] leading-relaxed ${activeColors.textSecondary}`}>
        METR&apos;s last published p80 is Mythos Preview (early), so everything after April 2026 is an estimate from a
        capability index, not a measurement. GPT-6 Astra lands about {Math.round(lagWeeks['GPT-6 Astra, ECI'])} weeks behind the
        AI 2027 curve, Opus 5.5 about level with it, and Anthropic&apos;s unreleased Model 4 about{' '}
        {Math.round(-lagWeeks['Anthropic Model 4, AECI'])} weeks ahead, but every 90% range includes the curve. Model 4&apos;s
        range is the widest, {formatRange(aeciModel4.low, aeciModel4.high)}: its score rests on only 15 benchmarks.
      </p>

      <details className={`text-[12px] leading-relaxed ${activeColors.textSecondary}`}>
        <summary className="cursor-pointer font-medium">How these estimates work</summary>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong>Method.</strong> Each estimate regresses METR&apos;s published p80 on a capability index:{' '}
            <a href="https://epoch.ai/eci" target="_blank" rel="noopener noreferrer" className={sourceLinkClass}>Epoch&apos;s ECI</a>{' '}
            across {ECI_FIT.n} models (R² {ECI_FIT.rSquared.toFixed(2)}), and Anthropic&apos;s AECI across {AECI_FIT.n} Claude models
            from one fit (R² {AECI_FIT.rSquared.toFixed(2)}). Ranges are 90% predictive intervals. METR treats measurements
            above 16 h as unreliable, so its tasks could not currently confirm the higher estimates.
          </li>
          <li>
            <strong>Testing.</strong> Predicting each model from earlier ones only, the ECI fit was typically off by a factor of
            about {backtest.rmseFactor.toFixed(1)}, and its ranges held {Math.round(backtest.coverage * backtest.tests)} of {backtest.tests} results.
            The last 7 came in below prediction, though Mythos Preview (early), which has no Epoch score, came in about 1.45× above
            on an interpolated one. Other reasonable fits put Astra anywhere from about 4 to 14 h. AECI has fewer measured models,
            and 3 of its 5 forward tests fell inside the range.
          </li>
          <li>
            <strong>Why ECI and AECI differ.</strong> They agree within 2 points on the Claude models METR has measured and both
            score, and split by up to 6 points only on later models, so METR&apos;s data can&apos;t show which is right. ECI does
            include long-running agentic tests: 7 of Astra&apos;s 24 benchmarks, such as MirrorCode and FrontierSWE. Indexes built
            only from software or agentic benchmarks predicted METR worse than the full ECI. AECI relies mostly on Anthropic&apos;s
            internal benchmarks and is vendor-run. Its p80 estimates stayed within about 10% across Anthropic&apos;s July, September
            and October refits, even as raw scores moved several points.
          </li>
          <li>
            <strong>AI 2027 line.</strong> The scenario curve is on METR&apos;s older TH1.0 scale. It is scaled by 0.78 to match
            TH1.1 at Claude 3.7 Sonnet, the best model when the scenario was published. Its authors make the same adjustment in{' '}
            <a href="https://blog.aifutures.org/p/q25-2026-timelines-update-uplift" target="_blank" rel="noopener noreferrer" className={sourceLinkClass}>their own grading</a>{' '}
            using 2/3, which would move every point about 2 weeks further ahead.
          </li>
          <li>
            <strong>Acceleration.</strong>{' '}
            <a href="https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/" target="_blank" rel="noopener noreferrer" className={sourceLinkClass}>METR estimates</a>{' '}
            Anthropic&apos;s AECI has grown about 1.9× as fast since October 2025 (95% CI 1.5–2.8×). Its comparison across methods
            runs from 0.99× to 1.90×, and Anthropic redacted most of the evidence METR found most informative.
          </li>
        </ul>
        <p className="mt-2">
          <a href="https://github.com/spicylemonade/AI-2027-tracker/blob/master/docs/methodology.md" target="_blank" rel="noopener noreferrer" className={sourceLinkClass}>Full methodology and data</a>
        </p>
      </details>
    </div>
  );
};

const HomePage = ({ predictions, posts }) => {
  const { activeColors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const recentlyEvaluated = predictions
    .filter(p => p.lastEvaluated && p.timelineSegment?.includes('2026'))
    .sort((a, b) => new Date(b.lastEvaluated) - new Date(a.lastEvaluated))
    .slice(0, 3);

  const totalPredictions = predictions.length;
  const evaluatedPredictionsCount = predictions.filter(p => p.status !== null && p.status !== 'Pending Evaluation' && p.status !== 'Too Early to Tell / Not Yet Assessable').length;
  const overallAccuracy = useMemo(() => {
    const scoredPredictions = predictions.filter(
      p => typeof p.accuracyScore === 'number' && !isNaN(p.accuracyScore)
    );
    if (scoredPredictions.length === 0) return 0;
    const sum = scoredPredictions.reduce((acc, p) => acc + p.accuracyScore, 0);
    return Math.round(sum / scoredPredictions.length);
  }, [predictions]);
  const evaluatedPercent = totalPredictions > 0 ? Math.round((evaluatedPredictionsCount / totalPredictions) * 100) : 0;

  return (
    <div className={`mx-auto max-w-5xl px-5 sm:px-8 py-8 ${activeColors.textPrimary}`}>
      {/* HERO */}
      <section className="mx-auto max-w-3xl space-y-5 py-20 sm:py-28 text-center animate-fade-in-up">
        <h2 className={`text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] ${activeColors.textPrimary}`}>
          AI 2027 <span className={activeColors.accentGreen}>Tracker</span>
        </h2>
        <p className={`mx-auto max-w-xl text-[17px] leading-relaxed ${activeColors.textSecondary}`}>
          How accurate is the <em>AI 2027</em> scenario? We track each prediction against reality.
        </p>
        <div className="pt-2">
          <Button asChild size="lg">
            <a href="https://www.ai-2027.com/" target="_blank" rel="noopener noreferrer">
              Read the scenario <ChevronRightIcon />
            </a>
          </Button>
        </div>
      </section>

      {/* DASHBOARD */}
      <section className="mb-16">
        <div className={`grid gap-px overflow-hidden rounded-2xl border ${activeColors.borderMuted}`} style={{ borderColor: isDarkMode ? '#38383d' : '#d2d2d7' }}>
          <div className="grid sm:grid-cols-3 gap-px" style={{ backgroundColor: isDarkMode ? '#38383d' : '#d2d2d7' }}>
            <div className={`${activeColors.cardBackground} p-6 text-center`}>
              <p className={`text-[11px] font-medium uppercase tracking-wider ${activeColors.textSecondary}`}>Predictions</p>
              <p className={`mt-2 text-3xl font-semibold tracking-tight ${activeColors.textPrimary}`}>{totalPredictions}</p>
            </div>
            <div className={`${activeColors.cardBackground} p-6 text-center`}>
              <p className={`text-[11px] font-medium uppercase tracking-wider ${activeColors.textSecondary}`}>Evaluated</p>
              <p className={`mt-2 text-3xl font-semibold tracking-tight ${activeColors.textPrimary}`}>{evaluatedPercent}%</p>
              <Progress value={evaluatedPercent} className="mt-3 mx-auto max-w-[120px]" />
            </div>
            <div className={`${activeColors.cardBackground} p-6 text-center`}>
              <p className={`text-[11px] font-medium uppercase tracking-wider ${activeColors.textSecondary}`}>Accuracy</p>
              <div className="mt-2 mx-auto h-16 w-16 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-full w-full">
                  <path strokeWidth="3" stroke={isDarkMode ? '#38383d' : '#e5e5ea'} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path strokeWidth="3" strokeDasharray={`${overallAccuracy}, 100`} strokeLinecap="round" stroke={isDarkMode ? '#30d158' : '#28a745'} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="21" fill={isDarkMode ? '#f5f5f7' : '#1d1d1f'} textAnchor="middle" fontSize="9" fontWeight="600">{overallAccuracy}%</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METR CHART */}
      <section className="mb-16">
        <MetrProgressChart />
      </section>

      {/* RECENTLY EVALUATED */}
      <section className="mb-16">
        <h3 className={`text-lg font-semibold tracking-tight ${activeColors.textPrimary} mb-5`}>
          Recently evaluated
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {recentlyEvaluated.map((item) => (
            <PredictionCard key={item.id} prediction={item} />
          ))}
        </div>
      </section>

      {/* FEATURED BLOG POSTS */}
      <section className="mb-16">
        <h3 className={`text-lg font-semibold tracking-tight ${activeColors.textPrimary} mb-5`}>
          Analysis
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {posts.slice(0,2).map((item) => (
            <BlogCard key={item.id} post={item} />
          ))}
        </div>
      </section>

      <section className={`flex flex-col items-center justify-center gap-3 border-t py-10 sm:flex-row sm:gap-4 ${activeColors.borderMuted}`}>
        <Button onClick={() => navigate('/timeline')} variant="outline">Timeline</Button>
        <Button onClick={() => navigate('/predictions')}>All predictions</Button>
      </section>
    </div>
  );
};

const TimelinePage = ({ predictions, orderedTimelineSegments }) => {
    const { activeColors, isDarkMode } = useTheme();
    const navigate = useNavigate();

    const predictionsBySegment = useMemo(() => {
        const grouped = {};
        orderedTimelineSegments.forEach(segment => {
            grouped[segment] = predictions.filter(p => p.timelineSegment === segment);
        });
        return grouped;
    }, [predictions, orderedTimelineSegments]);

    const segmentAccuracies = useMemo(() => {
      const accuracies = {};
      orderedTimelineSegments.forEach(segment => {
        const segmentPredictions = predictionsBySegment[segment] || [];
        const scoredPredictions = segmentPredictions.filter(p => p.accuracyScore !== null);
        if (scoredPredictions.length === 0) {
          accuracies[segment] = null;
        } else {
          const sum = scoredPredictions.reduce((acc, p) => acc + p.accuracyScore, 0);
          accuracies[segment] = Math.round(sum / scoredPredictions.length);
        }
      });
      return accuracies;
    }, [predictionsBySegment, orderedTimelineSegments]);


    return (
        <div className={`container mx-auto px-4 sm:px-6 py-8 ${activeColors.textPrimary}`}>
            <h1 className={`text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center ${activeColors.textPrimary}`}>
                Scenario Timeline
            </h1>
            
            <section className={`mb-10 p-4 sm:p-5 ${activeColors.cardBackground} rounded-xl shadow-sm border ${activeColors.borderMuted}`}>
                <h3 className={`text-lg font-semibold tracking-tight ${activeColors.textPrimary} mb-4`}>
                    Timeline Overview
                </h3>
                <div className="flex overflow-x-auto space-x-4 sm:space-x-6 pb-2">
                    {orderedTimelineSegments.map((segLabel) => {
                        const accuracy = segmentAccuracies[segLabel];
                        const hasPredictions = predictionsBySegment[segLabel]?.length > 0;
                        return (
                            <div key={segLabel} className="min-w-[100px] sm:min-w-[120px] flex flex-col items-center text-center">
                                <span className={`font-medium text-xs sm:text-sm ${activeColors.textPrimary}`}>{segLabel}</span>
                                {hasPredictions ? (
                                    accuracy !== null ? (
                                    <>
                                        <Progress value={accuracy} className="mt-1.5 h-1.5 sm:h-2 w-full" />
                                            <span className={`mt-1 text-xs ${activeColors.textSecondary}`}>{accuracy}%</span>
                                    </>
                                ) : (
                                         <span className={`mt-1 text-xs italic ${activeColors.textSecondary}`}>Pending</span>
                                    )
                                ) : (
                                    <span className={`mt-1 text-xs italic ${activeColors.textSecondary}`}>No Data</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="space-y-8"> {/* Reduced space between segment sections */}
                {orderedTimelineSegments.map(segment => (
                    predictionsBySegment[segment] && predictionsBySegment[segment].length > 0 && (
                        <section key={segment} id={segment.toLowerCase().replace(/\s+/g, '-')} className="pt-1">
                            <h2 className={`text-lg sm:text-xl font-semibold tracking-tight ${activeColors.textPrimary} mb-4 border-b ${activeColors.borderMuted} pb-2`}>{segment}</h2>
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4"> {/* Grid layout for cards */}
                                {predictionsBySegment[segment].map(prediction => (
                                    <TimelinePredictionCard // Using the compact card
                                        key={prediction.id} 
                                        prediction={prediction} 
                                    />
                                ))}
                            </div>
                        </section>
                    )
                ))}
            </div>
        </div>
    );
};

const AllPredictionsPage = ({ predictions, orderedTimelineSegments }) => {
  const { activeColors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('predictedDate'); // Default sort

  const allCategories = useMemo(() => {
    const categoryCounts = {};
    predictions.forEach(p => {
      p.categories?.forEach(cat => {
        if (cat && typeof cat === 'string' && cat.trim() !== '') { // Ensure valid category
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      });
    });

    const sortedCategoriesByFrequency = Object.entries(categoryCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([category]) => category);

    const topCategories = sortedCategoriesByFrequency.slice(0, 12);

    return topCategories.sort(); // Sort alphabetically for display
  }, [predictions]);

  const allStatuses = useMemo(() => {
    // Include 'Pending' for null statuses
    const statusSet = new Set(predictions.map(p => p.status || 'Pending'));
    return Array.from(statusSet).sort((a, b) => {
        // Custom sort: place 'Pending' first or last if desired, otherwise alphabetical
        if (a === 'Pending') return -1;
        if (b === 'Pending') return 1;
        return a.localeCompare(b);
    });
  }, [predictions]);

  const filteredPredictions = useMemo(() => {
    return predictions
      .filter(p => 
        (p.text?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.originalScenario?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .filter(p => statusFilter ? (p.status || 'Pending') === statusFilter : true) // Filter by status or 'Pending'
      .filter(p => categoryFilter ? p.categories?.includes(categoryFilter) : true)
      .sort((a, b) => {
        if (sortBy === 'accuracyScore') { return (b.accuracyScore ?? -1) - (a.accuracyScore ?? -1); } // Use ?? for nullish coalescing
        if (sortBy === 'lastEvaluated') { return new Date(b.lastEvaluated || 0) - new Date(a.lastEvaluated || 0); }
        // Sort by timeline segment first, then predicted date within segment
        const segmentA = orderedTimelineSegments.indexOf(a.timelineSegment);
        const segmentB = orderedTimelineSegments.indexOf(b.timelineSegment);
        if (segmentA !== segmentB) {
            return (segmentA === -1 ? Infinity : segmentA) - (segmentB === -1 ? Infinity : segmentB);
        }
        // Fallback to text comparison if dates are identical or non-standard
        return a.text.localeCompare(b.text);
      });
  }, [predictions, searchTerm, statusFilter, categoryFilter, sortBy, orderedTimelineSegments]);


  return (
    <div className={`container mx-auto px-4 sm:px-6 py-8 ${activeColors.textPrimary}`}>
      <h1 className={`text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center ${activeColors.textPrimary}`}>
        Prediction Hub
      </h1>
      
      <Card className="mb-8"> {/* Filters now inside a Card for consistency */}
        <CardContent className="p-4"> {/* Adjusted padding for filter card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <Input 
                type="text"
                placeholder="Search predictions…"
                className="pl-10 !py-2" // Ensure consistent height with selects
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Using Input component with 'as="select"' for consistent styling */}
            <Input as="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="!py-2">
              <option value="">All Statuses</option>
              {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </Input>
            <Input as="select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="!py-2">
              <option value="">All Categories</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </Input>
            <Input as="select" value={sortBy} onChange={e => setSortBy(e.target.value)} className="!py-2">
              <option value="predictedDate">Sort by Timeline</option>
              <option value="lastEvaluated">Sort by Last Evaluated</option>
              <option value="accuracyScore">Sort by Accuracy Score</option>
            </Input>
          </div>
        </CardContent>
      </Card>

      {filteredPredictions.length > 0 ? (
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPredictions.map(prediction => (
            <PredictionCard // Using the general PredictionCard here
              key={prediction.id} 
              prediction={prediction} 
            />
          ))}
        </div>
      ) : (
        <p className={`text-center ${activeColors.textSecondary} text-lg py-10`}>No predictions match your current filters.</p>
      )}
    </div>
  );
};

// PredictionDetailPage, AboutPage remain largely the same as previous version,
// but will benefit from the updated Card, Button, Input component styling, and use imported data.

const PredictionDetailPage = ({ predictions }) => {
  const { id } = useParams();
  const prediction = predictions.find(p => p.id === id);
  const { activeColors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  if (!prediction) {
    return (
      <div className={`container mx-auto p-6 text-center ${activeColors.textPrimary}`}>
        <h1 className="text-xl font-semibold text-red-600">Prediction not found.</h1>
        <button onClick={() => navigate('/predictions')} className="mt-4">Back to All Predictions</button>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 sm:px-6 py-8 ${activeColors.textPrimary}`}>
      <button 
        onClick={() => navigate('/predictions')}
        className={`mb-6 ${activeColors.accentGreen} hover:underline font-semibold text-sm`}
      >
        &larr; Back to All Predictions
      </button>

      <Card>
        <CardHeader>
          <CardDescription className="text-xs">{prediction.predictedDate} - From: "{prediction.originalScenario}"</CardDescription>
          <CardTitle className="text-2xl sm:text-3xl mt-1">{prediction.text}</CardTitle>
          <div className="mt-3.5">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${getStatusClasses(prediction.status, isDarkMode)}`}>
              Status: {prediction.status || 'Pending'}
            </span>
            {prediction.accuracyScore !== null && (
              <span className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border bg-indigo-100 text-indigo-700 border-indigo-300`}>
                Accuracy Score: {prediction.accuracyScore}%
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-5">
          <section>
            <h4 className="text-sm font-semibold tracking-tight mb-1.5">Core Information</h4>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li><strong>Prediction ID:</strong> {prediction.id}</li>
              <li><strong>Categories:</strong> {prediction.categories?.join(', ') || 'N/A'}</li> {/* Handle potential null categories */}
              <li><strong>Last Evaluated:</strong> {formatDate(prediction.lastEvaluated)}</li>
            </ul>
          </section>
          <section>
            <h4 className="text-sm font-semibold tracking-tight mb-1.5">Evaluation &amp; Tracking</h4>
            {prediction.qualitativeAccuracy && <p className="mb-1"><strong>Qualitative Summary:</strong> {prediction.qualitativeAccuracy}</p>}
            {prediction.actualOutcome && <p className="mb-1"><strong>Actual Outcome:</strong> {prediction.actualOutcome}</p>}
            {prediction.supportingEvidence && prediction.supportingEvidence.length > 0 && (
              <div className="mt-2">
                <h5 className="text-xs font-semibold mb-1">Supporting Evidence:</h5>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  {prediction.supportingEvidence.map((item, index) => (
                    <li key={index}><a href={item.url} target="_blank" rel="noopener noreferrer" className={`${activeColors.accentGreen} hover:underline`}>{item.text}</a></li>
                  ))}
                </ul>
              </div>
            )}
             {!prediction.qualitativeAccuracy && !prediction.actualOutcome && (!prediction.supportingEvidence || prediction.supportingEvidence.length === 0) && (
              <p className="text-xs italic ${activeColors.textSecondary}">No evaluation details available yet.</p>
            )}
          </section>
          {prediction.analystCommentary && prediction.analystCommentary.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold tracking-tight mb-2">Tracker&apos;s Log</h4>
              <div className="space-y-3">
                {prediction.analystCommentary.map((entry, index) => (
                  <div key={index} className={`p-3 ${isDarkMode ? 'bg-neutral-700' : 'bg-gray-50'} rounded-lg border ${activeColors.borderMuted} text-xs`}>
                    <p className={`${activeColors.textSecondary} font-medium`}>{formatDate(entry.date)}</p>
                    <p className={`mt-1 ${activeColors.textPrimary}`}>{entry.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
           {(!prediction.analystCommentary || prediction.analystCommentary.length === 0) && (
               <section>
                   <h4 className="text-sm font-semibold tracking-tight mb-2">Tracker&apos;s Log</h4>
                   <p className="text-xs italic ${activeColors.textSecondary}">No commentary added yet.</p>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const BlogPage = ({ posts }) => {
    const { activeColors } = useTheme();
    return (
        <div className={`container mx-auto px-4 sm:px-6 py-8 ${activeColors.textPrimary}`}>
            <h1 className={`text-3xl sm:text-4xl font-semibold tracking-tight mb-8 text-center ${activeColors.textPrimary}`}>
                AI 2027 Tracker Blog
            </h1>
            {posts.length > 0 ? (
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    {posts.map(post => ( <BlogCard key={post.id} post={post} /> ))}
                </div>
            ) : ( <p className={`text-center ${activeColors.textSecondary} text-lg`}>No blog posts available yet.</p> )}
        </div>
    );
};

// --- Updated BlogPostPage ---
const BlogPostPage = ({ posts }) => {
  const { id } = useParams();
  const post = posts.find(p => p.id === id);
  const { activeColors, isDarkMode } = useTheme();
  const navigate = useNavigate();

    if (!post) {
        return (
      <div className={`container mx-auto p-6 text-center ${activeColors.textPrimary}`}>
                <h1 className="text-xl font-semibold text-red-600">Blog post not found.</h1>
        <button onClick={() => navigate('/blog')} className="mt-4">Back to Blog</button>
            </div>
        );
    }

    return (
    <div className={`container mx-auto px-4 sm:px-6 py-8 ${activeColors.textPrimary} max-w-4xl`}> 
      <button onClick={() => navigate('/blog')} className={`mb-6 ${activeColors.accentGreen} hover:underline font-semibold text-sm`}>
                &larr; Back to Blog
            </button>
            <Card>
        <CardHeader className={`border-b ${activeColors.borderMuted}`}>
                    <CardTitle className="text-3xl sm:text-4xl">{post.title}</CardTitle>
                    <CardDescription className="mt-2 text-xs">
                        By <span className="font-semibold">{post.author}</span> on <span className="font-semibold">{formatDate(post.date)}</span>
                    </CardDescription>
                    {post.tags && post.tags.length > 0 && (
                        <div className="mt-3">
                            {post.tags.map(tag => (
                <span key={tag} className={`mr-1.5 mb-1.5 inline-block ${isDarkMode ? 'bg-neutral-700' : 'bg-gray-100'} ${activeColors.textPrimary} text-xs font-medium px-2 py-0.5 rounded-md border ${activeColors.borderMuted}`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </CardHeader>
        {/* Use ReactMarkdown with prose styling and GFM plugin */}
        <CardContent className="pt-6">
          <div className={`prose prose-sm sm:prose-base max-w-none ${activeColors.isDarkMode ? 'prose-invert' : ''} dark:prose-headings:text-neutral-100 dark:prose-p:text-neutral-300 dark:prose-a:text-emerald-400 dark:prose-strong:text-neutral-100 dark:prose-ul:text-neutral-300 dark:prose-ol:text-neutral-300 dark:prose-li:text-neutral-300 dark:prose-blockquote:text-neutral-400 dark:prose-code:text-neutral-300 dark:prose-pre:bg-neutral-700 dark:prose-th:text-neutral-100 dark:prose-td:text-neutral-300` }>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ''}</ReactMarkdown>
          </div>
                </CardContent>
            </Card>
        </div>
    );
};


const AboutPage = () => {
  const { activeColors } = useTheme();
  return (
    <div className={`container mx-auto px-4 sm:px-6 py-8 ${activeColors.textPrimary}`}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl sm:text-4xl">About the AI 2027 Prediction Tracker</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-5 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-1.5">Our Mission</h2>
            <p>The AI 2027 Prediction Tracker is dedicated to systematically tracking and evaluating the predictions made in the "AI 2027" scenario, a fictional yet thought-provoking narrative about the near-term future of artificial intelligence. Our goal is to provide a clear, data-driven perspective on how reality is unfolding compared to the scenario's projections.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-1.5">The &ldquo;AI 2027&rdquo; Scenario</h2>
            <p>This tracker is based on the "AI 2027" scenario. We highly recommend reading the original work for context. A link is available on our homepage.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-1.5">Our Methodology</h2>
             <p>Our process involves several key steps, detailed further in our methodology blog post:</p>
            <ul className="list-disc list-inside space-y-1 pl-4 mt-2">
              <li><strong>Prediction Extraction:</strong> We carefully extract specific, trackable, and falsifiable claims from the scenario text.</li>
              <li><strong>Categorization:</strong> Each prediction is tagged with relevant categories (e.g., Compute, Agent Capabilities, Geopolitics) to facilitate analysis.</li>
              <li><strong>Status Assignment:</strong> Predictions are assigned a status reflecting their current state (e.g., Pending, In Progress, Confirmed Accurate, Partially Accurate, Inaccurate, Too Early to Tell).</li>
              <li><strong>Accuracy Scoring:</strong> For evaluated predictions, we provide a qualitative summary and, where appropriate, a quantitative accuracy score (0-100%) based on the degree of match between the prediction and observed reality.</li>
              <li><strong>Evidence & Commentary:</strong> We link to credible public sources (news articles, reports, company announcements) as supporting evidence and provide analyst commentary explaining the reasoning behind the evaluation.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-1.5">Disclaimers</h2>
            <p>This tracker is for informational and analytical purposes only and does not constitute financial or investment advice. Evaluating predictions about the future inherently involves subjective judgment, especially when assessing qualitative aspects or partial accuracy. Our assessments are based on publicly available information and may evolve as new data emerges.</p>
          </section>
           
          <section>
            <h2 className="text-lg font-semibold tracking-tight mb-1.5">Contact &amp; Feedback</h2>
            <p>We welcome feedback and suggestions. Please reach out via Github issues or @spicey_lemonade on twitter/X.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Google Analytics Hook ---
function useGoogleAnalytics() {
  useEffect(() => {
    if (!window.gtagScriptLoaded) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-7EBD7JJMBS';
      document.head.appendChild(script);
      window.gtagScriptLoaded = true;
    }
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-7EBD7JJMBS');
  }, []);
}

const AppContent = () => {
  useGoogleAnalytics();
  const { activeColors, isDarkMode } = useTheme(); // Get activeColors from context
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamically get unique timeline segments from imported data
  const uniqueTimelineSegments = useMemo(() => {
    const allSegments = predictionsData.map(p => p.timelineSegment);
    const validSegments = allSegments.filter(segment => segment && typeof segment === 'string' && segment.trim() !== '');
    const segmentsSet = new Set(validSegments);
    const sortOrder = [ "Mid 2025", "Late 2025", "Early 2026", "Mid 2026", "Late 2026", "January 2027", "February 2027", "March 2027", "April 2027", "May 2027", "June 2027", "July 2027", "August 2027", "September 2027", "October 2027" ];
    return Array.from(segmentsSet).sort((a, b) => {
      const indexA = sortOrder.indexOf(a);
      const indexB = sortOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, []); // predictionsData is constant, so empty dependency array is fine

  useEffect(() => {
    window.scrollTo(0, 0);
    // Apply global background and manage .dark class on <html> for Tailwind
    document.body.className = `${activeColors.background} font-sans ${activeColors.textPrimary}`;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [location.pathname, activeColors, isDarkMode]);

  // SPA Redirect logic from 404.html
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get('p');

    if (redirectPath) {
      // Preserve other query parameters and the hash
      params.delete('p'); // Remove the 'p' parameter itself
      let newSearch = params.toString();
      if (newSearch) {
        newSearch = '?' + newSearch;
      }
      
      // Navigate to the intended path, appending original search (minus 'p') and hash
      navigate(redirectPath + newSearch + location.hash, { replace: true });
    }
  }, [location.search, location.hash, navigate]); // Depend on location to re-check if URL changes

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage predictions={predictionsData} posts={blogPostsData} />} />
          <Route path="/timeline" element={<TimelinePage predictions={predictionsData} orderedTimelineSegments={uniqueTimelineSegments} />} />
          <Route path="/predictions" element={<AllPredictionsPage predictions={predictionsData} orderedTimelineSegments={uniqueTimelineSegments} />} />
          <Route path="/prediction/:id" element={<PredictionDetailPage predictions={predictionsData} />} />
          <Route path="/blog" element={<BlogPage posts={blogPostsData} />} />
          <Route path="/blog/:id" element={<BlogPostPage posts={blogPostsData} />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedPreference = localStorage.getItem('theme');
    return storedPreference === 'dark';
  });

  const toggleTheme = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  const activeColors = isDarkMode ? darkColors : lightColors;

  return (
    <BrowserRouter basename="/">
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme, activeColors, lightColors, darkColors }}>
        <AppContent />
      </ThemeContext.Provider>
    </BrowserRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// No export default App needed if this is the main entry point executed directly
