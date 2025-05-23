import './index.css';
import React, { useState, useEffect, useMemo, useRef, forwardRef, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import predictionsData from './data/predictions.json';
import blogPostsData from './data/blogPosts.json';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Theme Context ---
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

// --- Color Palettes ---
const lightColors = {
  background: 'bg-[#F8F5F2]', 
  textPrimary: 'text-[#4A4441]', 
  textSecondary: 'text-[#7d746f]',
  accentGreen: 'text-emerald-700',
  bgAccentGreen: 'bg-emerald-700',
  hoverBgAccentGreen: 'hover:bg-emerald-800',
  borderMuted: 'border-gray-300', 
  cardBackground: 'bg-white',
  navbarBackground: 'bg-[#F8F5F2]/90 backdrop-blur-md',
  footerBackground: 'bg-gray-100',
  // Specific for Tailwind prose dark mode (these are base colors, dark mode will invert)
  proseText: 'text-gray-700', // Example, adjust as needed
  proseHeadings: 'text-gray-900',
  proseLinks: 'text-emerald-600',
};

const darkColors = {
  background: 'bg-slate-900',      // Dark background
  textPrimary: 'text-slate-200',   // Light text
  textSecondary: 'text-slate-400', // Muted light text
  accentGreen: 'text-emerald-500', // Slightly brighter green for dark bg
  bgAccentGreen: 'bg-emerald-600',
  hoverBgAccentGreen: 'hover:bg-emerald-700',
  borderMuted: 'border-slate-700', // Darker border
  cardBackground: 'bg-slate-800',  // Dark card background
  navbarBackground: 'bg-slate-900/90 backdrop-blur-md', // Dark navbar
  footerBackground: 'bg-slate-800', // Dark footer
  proseText: 'text-slate-300',
  proseHeadings: 'text-slate-100',
  proseLinks: 'text-emerald-400',
};

// Helper function to get current theme's colors
// This is not strictly needed if components use useTheme and select colors directly,
// but can be a utility if some logic needs to access colors outside components directly.
// For now, we'll have components use `useTheme` to get the active color palette.

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

const getStatusClasses = (status, isDarkMode) => {
  // Base classes that don't change with theme much
  // Or, you can have completely different sets
  switch (status) {
    case 'Confirmed Accurate': return `${isDarkMode ? 'bg-emerald-800/50 text-emerald-300 border-emerald-700' : 'bg-emerald-100 text-emerald-700 border-emerald-300'}`;
    case 'Partially Accurate': return `${isDarkMode ? 'bg-yellow-700/50 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`;
    case 'Inaccurate / Debunked': return `${isDarkMode ? 'bg-red-800/50 text-red-300 border-red-700' : 'bg-red-100 text-red-700 border-red-300'}`;
    case 'In Progress / Monitoring': return `${isDarkMode ? 'bg-blue-700/50 text-blue-300 border-blue-600' : 'bg-blue-100 text-blue-700 border-blue-300'}`;
    case 'Pending Evaluation': return `${isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-gray-100 text-gray-600 border-gray-300'}`;
    case 'Too Early to Tell / Not Yet Assessable': return `${isDarkMode ? 'bg-purple-700/50 text-purple-300 border-purple-600' : 'bg-purple-100 text-purple-700 border-purple-300'}`;
    default: return `${isDarkMode ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-gray-100 text-gray-600 border-gray-300'}`;
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


// --- Reusable UI Components (Styled with Tailwind) ---
const Card = forwardRef(({ children, className = '' }, ref) => {
  const { activeColors } = useTheme();
  return (
    <div ref={ref} className={`${activeColors.cardBackground} rounded-xl shadow-sm border ${activeColors.borderMuted} ${className}`}>
    {children}
  </div>
);
});
// Adjusted CardHeader padding for potentially more compact cards
const CardHeader = ({ children, className = '' }) => <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '', size = 'lg' }) => {
    const { activeColors } = useTheme();
    const sizeClass = size === 'lg' ? 'text-lg' : 'text-base'; // Allow smaller title for compact cards
    return <h3 className={`font-serif font-semibold ${activeColors.textPrimary} ${sizeClass} ${className}`} style={{ fontFamily: 'Georgia, Times, serif' }}>{children}</h3>;
};
const CardDescription = ({ children, className = '' }) => {
    const { activeColors } = useTheme();
    return <p className={`text-xs sm:text-sm ${activeColors.textSecondary} ${className}`}>{children}</p>;
};
// Adjusted CardContent padding
const CardContent = ({ children, className = '' }) => <div className={`p-4 sm:p-5 pt-0 ${className}`}>{children}</div>;


const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, asChild = false, href, target, rel }) => {
  const { activeColors } = useTheme();
  const sizeClasses = size === 'lg' ? 'px-6 py-3 text-base' : size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const baseClasses = `font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${sizeClasses} inline-flex items-center justify-center`; // Added inline-flex and justify-center
  let variantClasses = '';

  switch (variant) {
    case 'outline':
      variantClasses = `border ${activeColors.borderMuted} ${activeColors.textPrimary} hover:bg-gray-100 dark:hover:bg-slate-700 focus:ring-gray-400 dark:focus:ring-slate-500`;
      break;
    case 'primary': 
    default:
      variantClasses = `${activeColors.bgAccentGreen} text-white ${activeColors.hoverBgAccentGreen} focus:ring-emerald-500`;
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
  const commonClasses = `w-full p-2.5 border ${activeColors.borderMuted} rounded-lg text-sm ${activeColors.textPrimary} bg-transparent dark:bg-slate-700 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-gray-400 dark:placeholder:text-slate-500`;
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
    <div className={`w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 ${className}`}>
      <div className={`${activeColors.bgAccentGreen} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
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
    <nav className={`sticky top-0 z-20 flex items-center justify-between border-b ${activeColors.borderMuted} ${activeColors.navbarBackground} px-4 sm:px-6 py-3.5`}>
      <h1 
        className={`font-serif text-lg sm:text-xl font-bold tracking-tight cursor-pointer ${activeColors.textPrimary}`}
        onClick={() => handleNavClick('/')}
        style={{ fontFamily: 'Georgia, Times, serif' }}
      >
        <span>AI 2027</span>&nbsp;
        <span className={`${activeColors.accentGreen}`}>Tracker</span>
      </h1>
      
      <div className="flex items-center">
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-5 mr-4"> 
        {navItems.map((item) => (
          <button
            key={item.page}
              onClick={() => handleNavClick(item.page)}
              className={`font-medium text-xs sm:text-sm ${activeColors.textPrimary} transition hover:${activeColors.accentGreen}`}
          >
            {item.name}
          </button>
        ))}
      </div>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className={`p-1.5 rounded-md ${activeColors.textSecondary} hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors`}
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

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className={`md:hidden absolute top-full left-0 right-0 ${activeColors.navbarBackground} border-b ${activeColors.borderMuted} shadow-lg py-2 z-30`}>
          <div className="flex flex-col space-y-1 px-4">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleNavClick(item.page)}
                className={`block w-full text-left py-2 px-3 rounded-md text-sm font-medium ${activeColors.textPrimary} hover:bg-gray-100 dark:hover:bg-slate-700 hover:${activeColors.accentGreen} transition`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer = () => {
  const { activeColors } = useTheme();
  return (
    <footer className={`border-t ${activeColors.borderMuted} ${activeColors.footerBackground} py-8 text-center text-sm ${activeColors.textSecondary}`}>
      <p>© {new Date().getFullYear()} AI 2027 Prediction Tracker.</p>
      <p className="mt-1">Inspired by the AI 2027 scenario. For analytical purposes.</p>
    </footer>
  );
};

// PredictionCard specifically for Timeline (more compact)
const TimelinePredictionCard = ({ prediction, setCurrentPage, setSelectedPredictionId }) => {
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
const PredictionCard = ({ prediction, setCurrentPage, setSelectedPredictionId }) => {
  const { activeColors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const handleReadMore = () => {
    navigate(`/prediction/${prediction.id}`);
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-1">
        <CardTitle className="line-clamp-3 text-base">{prediction.text}</CardTitle>
        <CardDescription className="mt-1.5 text-xs">{prediction.predictedDate} - {prediction.originalScenario}</CardDescription>
      </CardHeader>
      <CardContent>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${getStatusClasses(prediction.status, isDarkMode)}`}>
           {prediction.status || 'Pending'} {/* Show pending if status is null */}
        </span>
        {prediction.accuracyScore !== null && (
          <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border bg-indigo-100 dark:bg-indigo-700/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600`}>
            Acc: {prediction.accuracyScore}%
          </span>
        )}
         <button 
            onClick={handleReadMore}
            className={`block mt-3 text-sm ${activeColors.accentGreen} hover:underline font-semibold`}
        >
            View Details &rarr;
        </button>
      </CardContent>
    </Card>
  );
};


const BlogCard = ({ post, setCurrentPage, setSelectedPostId }) => {
    const { activeColors } = useTheme();
    const navigate = useNavigate();

    const handleReadMore = () => {
        navigate(`/blog/${post.id}`);
    };
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex-1">
                <CardTitle className="text-lg">{post.title}</CardTitle>
                <CardDescription className="mt-1 text-xs">By {post.author} on {formatDate(post.date)}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className={`${activeColors.textPrimary} text-sm mb-3 line-clamp-3`}>{post.summary}</p>
                <button
                    onClick={handleReadMore}
                    className={`text-sm ${activeColors.accentGreen} hover:underline font-semibold`}
                >
                    Read More &rarr;
                </button>
            </CardContent>
        </Card>
    );
};

const HomePage = ({ predictions, posts }) => {
  const { activeColors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const recentlyEvaluated = predictions
    .filter(p => p.lastEvaluated)
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
    <div className={`container mx-auto px-4 sm:px-6 py-8 ${activeColors.textPrimary}`}>
      {/* HERO */}
      <section className="mx-auto max-w-4xl space-y-4 py-12 text-center">
        <h2 className={`font-serif text-4xl font-bold leading-tight ${activeColors.textPrimary} sm:text-5xl`} style={{ fontFamily: 'Georgia, Times, serif' }}>
          AI 2027 Prediction Tracker
        </h2>
        <p className={`mx-auto max-w-2xl text-lg ${activeColors.textSecondary}`}>
          Tracking the future of AI, one prediction at a time. How accurate is the 
          <em className="mx-1 italic">AI 2027</em> scenario?
        </p>
        <Button 
            asChild 
            size="lg" 
            className="rounded-xl"
        >
          <a href="https://www.ai-2027.com/" target="_blank" rel="noopener noreferrer">
            View Original Scenario <ChevronRightIcon />
          </a>
        </Button>
      </section>

      {/* DASHBOARD */}
      <section className="mx-auto mb-12 max-w-5xl">
        <div className="grid gap-5 sm:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Total Predictions</CardTitle></CardHeader>
            <CardContent><p className={`font-serif text-4xl font-semibold ${activeColors.textPrimary}`}>{totalPredictions}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Evaluated</CardTitle></CardHeader>
            <CardContent>
              <Progress value={evaluatedPercent} className="mb-2 h-3" />
              <p className={`text-sm ${activeColors.textSecondary}`}>{evaluatedPercent}% of predictions have been evaluated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Overall Accuracy</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32"> {/* Center content and set height */}
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-full w-full">
                    <path className="text-gray-200 dark:text-slate-700" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className={`${activeColors.accentGreen}`} strokeWidth="3" strokeDasharray={`${overallAccuracy}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <text x="18" y="21" className={`fill-current ${activeColors.textPrimary} font-semibold`} textAnchor="middle" style={{ fontSize: '10px' }}>{overallAccuracy}%</text>
                </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* RECENTLY EVALUATED */}
      <section className="mx-auto mb-12 max-w-5xl space-y-5">
        <h3 className={`font-serif text-2xl font-semibold ${activeColors.textPrimary}`} style={{ fontFamily: 'Georgia, Times, serif' }}>
          Recently Evaluated Predictions
        </h3>
        <div className="grid gap-5 md:grid-cols-3">
          {recentlyEvaluated.map((item) => (
            <PredictionCard 
                key={item.id} 
                prediction={item} 
            />
          ))}
        </div>
      </section>

      {/* FEATURED BLOG POSTS */}
      <section className="mx-auto mb-12 max-w-5xl space-y-5">
        <h3 className={`font-serif text-2xl font-semibold ${activeColors.textPrimary}`} style={{ fontFamily: 'Georgia, Times, serif' }}>
          Featured Analysis
        </h3>
        <div className="grid gap-5 md:grid-cols-2">
          {posts.slice(0,2).map((item) => (
            <BlogCard 
                key={item.id} 
                post={item} 
            />
          ))}
        </div>
      </section>

      <section className="mt-10 py-6 border-t ${activeColors.borderMuted} flex flex-col sm:flex-row justify-center items-center gap-6">
        <Button onClick={() => navigate('/timeline')} variant="outline">EXPLORE THE TIMELINE</Button>
        <Button onClick={() => navigate('/predictions')}>VIEW ALL PREDICTIONS</Button>
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
            <h1 className={`font-serif text-3xl sm:text-4xl font-bold mb-8 text-center ${activeColors.textPrimary}`} style={{ fontFamily: 'Georgia, Times, serif' }}>
                Scenario Timeline
            </h1>
            
            <section className={`mb-10 p-4 sm:p-5 ${activeColors.cardBackground} rounded-xl shadow-sm border ${activeColors.borderMuted}`}>
                <h3 className={`font-serif text-xl font-semibold ${activeColors.textPrimary} mb-4`} style={{ fontFamily: 'Georgia, Times, serif' }}>
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
                            <h2 className={`text-xl sm:text-2xl font-serif font-semibold ${activeColors.textPrimary} mb-4 border-b-2 ${activeColors.borderMuted} pb-1.5`} style={{ fontFamily: 'Georgia, Times, serif' }}>{segment}</h2>
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
      <h1 className={`font-serif text-3xl sm:text-4xl font-bold mb-8 text-center ${activeColors.textPrimary}`} style={{ fontFamily: 'Georgia, Times, serif' }}>
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
            <h4 className="font-serif text-md font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>Core Information</h4>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li><strong>Prediction ID:</strong> {prediction.id}</li>
              <li><strong>Categories:</strong> {prediction.categories?.join(', ') || 'N/A'}</li> {/* Handle potential null categories */}
              <li><strong>Last Evaluated:</strong> {formatDate(prediction.lastEvaluated)}</li>
            </ul>
          </section>
          <section>
            <h4 className="font-serif text-md font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>Evaluation & Tracking</h4>
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
              <h4 className="font-serif text-md font-semibold mb-2" style={{ fontFamily: 'Georgia, Times, serif' }}>Tracker's Log</h4>
              <div className="space-y-3">
                {prediction.analystCommentary.map((entry, index) => (
                  <div key={index} className={`p-3 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg border ${activeColors.borderMuted} text-xs`}>
                    <p className={`${activeColors.textSecondary} font-medium`}>{formatDate(entry.date)}</p>
                    <p className={`mt-1 ${activeColors.textPrimary}`}>{entry.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
           {(!prediction.analystCommentary || prediction.analystCommentary.length === 0) && (
               <section>
                   <h4 className="font-serif text-md font-semibold mb-2" style={{ fontFamily: 'Georgia, Times, serif' }}>Tracker's Log</h4>
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
            <h1 className={`font-serif text-3xl sm:text-4xl font-bold mb-8 text-center ${activeColors.textPrimary}`} style={{ fontFamily: 'Georgia, Times, serif' }}>
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
                <span key={tag} className={`mr-1.5 mb-1.5 inline-block ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'} ${activeColors.textPrimary} text-xs font-medium px-2 py-0.5 rounded-md border ${activeColors.borderMuted}`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </CardHeader>
        {/* Use ReactMarkdown with prose styling and GFM plugin */}
        <CardContent className="pt-6">
          <div className={`prose prose-sm sm:prose-base max-w-none ${activeColors.isDarkMode ? 'prose-invert' : ''} dark:prose-headings:text-slate-100 dark:prose-p:text-slate-300 dark:prose-a:text-emerald-400 dark:prose-strong:text-slate-100 dark:prose-ul:text-slate-300 dark:prose-ol:text-slate-300 dark:prose-li:text-slate-300 dark:prose-blockquote:text-slate-400 dark:prose-code:text-slate-300 dark:prose-pre:bg-slate-700 dark:prose-th:text-slate-100 dark:prose-td:text-slate-300` }>
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
            <h2 className="font-serif text-xl font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>Our Mission</h2>
            <p>The AI 2027 Prediction Tracker is dedicated to systematically tracking and evaluating the predictions made in the "AI 2027" scenario, a fictional yet thought-provoking narrative about the near-term future of artificial intelligence. Our goal is to provide a clear, data-driven perspective on how reality is unfolding compared to the scenario's projections.</p>
          </section>
          <section>
            <h2 className="font-serif text-xl font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>The "AI 2027" Scenario</h2>
            <p>This tracker is based on the "AI 2027" scenario. We highly recommend reading the original work for context. A link is available on our homepage.</p>
          </section>
          <section>
            <h2 className="font-serif text-xl font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>Our Methodology</h2>
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
            <h2 className="font-serif text-xl font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>Disclaimers</h2>
            <p>This tracker is for informational and analytical purposes only and does not constitute financial or investment advice. Evaluating predictions about the future inherently involves subjective judgment, especially when assessing qualitative aspects or partial accuracy. Our assessments are based on publicly available information and may evolve as new data emerges.</p>
          </section>
           
          <section>
            <h2 className="font-serif text-xl font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>Contact & Feedback</h2>
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
    <BrowserRouter basename="/AI-2027-tracker">
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
