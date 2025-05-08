import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- Updated Color Palette ---
const colors = {
  background: 'bg-[#F8F5F2]', // Light cream for main page
  textPrimary: 'text-[#4A4441]', // Dark brown/charcoal
  textSecondary: 'text-[#7d746f]', // Slightly adjusted grey-brown for better contrast on cream
  accentGreen: 'text-emerald-700',
  bgAccentGreen: 'bg-emerald-700',
  hoverBgAccentGreen: 'hover:bg-emerald-800',
  borderMuted: 'border-gray-300', 
  cardBackground: 'bg-white', // White for cards
  navbarBackground: 'bg-[#F8F5F2]/90 backdrop-blur-md', // Cream with blur
  footerBackground: 'bg-gray-100', // Light neutral for footer
};

// --- Mock Data (Unchanged) ---
const mockPredictions = [
  { id: 'P001', text: 'The world sees its first glimpse of AI agents. Advertisements for computer-using agents emphasize the term "personal assistant".', originalScenario: 'Mid 2025: Stumbling Agents', predictedDate: 'Mid 2025', categories: ['Agent Capabilities', 'Market Introduction'], status: 'In Progress / Monitoring', accuracyScore: null, qualitativeAccuracy: 'Monitoring initial agent releases.', actualOutcome: 'Several companies have released early-stage AI personal assistants. Adoption is varied.', supportingEvidence: [{ text: 'TechCrunch: New AI Assistants Launch', url: '#' }], lastEvaluated: '2025-04-15', analystCommentary: [ { date: '2025-04-15', comment: 'Initial observations align with the prediction. Market penetration is still low.' }, { date: '2025-01-20', comment: 'Prediction added to tracker. Awaiting developments.' }, ], timelineSegment: 'Mid 2025', },
  { id: 'P002', text: 'OpenBrain is building the biggest datacenters the world has ever seen.', originalScenario: "Late 2025: The World's Most Expensive AI", predictedDate: 'Late 2025', categories: ['Compute', 'Infrastructure', 'OpenBrain'], status: 'Pending Evaluation', accuracyScore: null, qualitativeAccuracy: null, actualOutcome: null, supportingEvidence: [], lastEvaluated: null, analystCommentary: [{ date: '2025-01-20', comment: 'Prediction added. Awaiting news on datacenter constructions.' }], timelineSegment: 'Late 2025', },
  { id: 'P003', text: 'OpenBrain releases Agent-1, which is more capable and reliable.', originalScenario: 'Early 2026: Coding Automation', predictedDate: 'Early 2026', categories: ['Agent Capabilities', 'OpenBrain', 'AI Models'], status: 'Confirmed Accurate', accuracyScore: 90, qualitativeAccuracy: 'Agent-1 released, capabilities largely match description.', actualOutcome: 'OpenBrain launched Agent-1 in Feb 2026. It showed significant improvements in coding and reliability as per initial reviews.', supportingEvidence: [{ text: 'OpenBrain Blog: Announcing Agent-1', url: '#' }, { text: 'Wired: Agent-1 Review', url: '#' }], lastEvaluated: '2026-03-01', analystCommentary: [ { date: '2026-03-01', comment: 'Release confirmed. Accuracy set to 90% based on feature alignment.' }, { date: '2026-02-10', comment: 'Agent-1 announced by OpenBrain.' }, ], timelineSegment: 'Early 2026', },
  { id: 'P004', text: 'The stock market has gone up 30% in 2026, led by OpenBrain, Nvidia, and AI integrators.', originalScenario: 'Late 2026: AI Takes Some Jobs', predictedDate: 'Late 2026', categories: ['Market Impact', 'Economics'], status: 'Partially Accurate', accuracyScore: 60, qualitativeAccuracy: 'Stock market saw significant gains, AI sector influential but overall rise was 22%.', actualOutcome: 'The stock market increased by 22% in 2026. AI-related stocks, including OpenBrain and Nvidia, were major contributors, but other economic factors also played a significant role. The 30% target was not met.', supportingEvidence: [{ text: 'Financial Times: 2026 Market Review', url: '#' }], lastEvaluated: '2027-01-15', analystCommentary: [ { date: '2027-01-15', comment: 'Market data for 2026 analyzed. Prediction was directionally correct but overstated the magnitude.' }, ], timelineSegment: 'Late 2026', },
  { id: 'P005', text: 'China steals Agent-2 weights.', originalScenario: 'February 2027: China Steals Agent-2', predictedDate: 'February 2027', categories: ['Geopolitics', 'Security', 'AI Espionage'], status: 'Inaccurate / Debunked', accuracyScore: 0, qualitativeAccuracy: 'No credible reports of Agent-2 weight theft by China in Feb 2027.', actualOutcome: 'Extensive security measures reported by OpenBrain. Multiple cybersecurity firms and government agencies reported no evidence of such a theft during this period. Some minor unrelated cyber incidents were noted in the tech sector.', supportingEvidence: [{ text: 'Reuters: AI Security Report Q1 2027', url: '#' }, { text: 'OpenBrain Security Update', url: '#' }], lastEvaluated: '2027-03-05', analystCommentary: [ { date: '2027-03-05', comment: 'After thorough review of available intelligence and reports, this prediction is marked as inaccurate for the specified timeframe.' }, ], timelineSegment: 'February 2027', },
  { id: 'P006', text: 'Agent-3-mini is released to the public.', originalScenario: 'July 2027: The Cheap Remote Worker', predictedDate: 'July 2027', categories: ['AI Models', 'Public Release', 'Market Impact'], status: 'Too Early to Tell / Not Yet Assessable', accuracyScore: null, qualitativeAccuracy: null, actualOutcome: null, supportingEvidence: [], lastEvaluated: null, analystCommentary: [{ date: '2025-05-01', comment: 'Prediction added. Awaiting July 2027.' }], timelineSegment: 'July 2027', }
];
const mockBlogPosts = [
  { id: 'B001', title: 'The Early Days of AI Agents: A Mid-2025 Retrospective', date: '2025-07-01', author: 'Tracker Team', summary: 'Analyzing the initial rollout of AI personal assistants and comparing it to the AI 2027 scenario\'s predictions for Mid-2025.', content: 'Detailed content for the blog post about AI agents in Mid-2025... The scenario predicted "stumbling agents" and early signs point towards this. While some impressive demos exist, widespread, reliable utility is still on the horizon. We are seeing the predicted emphasis on "personal assistant" branding. The key challenge, as anticipated, seems to be reliability and cost for the average consumer. Specialized agents in coding and research, however, are showing more promise more quickly, aligning with the scenario\'s nuances.', tags: ['Mid 2025', 'AI Agents', 'Retrospective'], },
  { id: 'B002', title: 'Our Methodology: How We Track AI 2027 Predictions', date: '2025-05-10', author: 'Tracker Admin', summary: 'A deep dive into the process, criteria, and tools we use to evaluate the AI 2027 scenario predictions.', content: 'This post explains our methodology. We extract concrete, falsifiable predictions. Each prediction is categorized and assigned a timeline. Statuses like "Confirmed Accurate", "Partially Accurate", "Inaccurate", "In Progress", and "Too Early to Tell / Not Yet Assessable" are used. Accuracy scores are based on a rubric considering the directness of the match, scope, and impact. We rely on credible public sources for evidence. Analyst commentary provides context and reasoning. Our goal is transparency and objectivity.', tags: ['Methodology', 'Transparency', 'Prediction Tracking'], },
];
const timelineSegments = [ "Mid 2025", "Late 2025", "Early 2026", "Mid 2026", "Late 2026", "January 2027", "February 2027", "March 2027", "April 2027", "May 2027", "June 2027", "July 2027", "August 2027", "September 2027", "October 2027" ];

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const getStatusClasses = (status) => {
  switch (status) {
    case 'Confirmed Accurate': return `bg-emerald-100 ${colors.accentGreen} border-emerald-300`;
    case 'Partially Accurate': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'Inaccurate / Debunked': return 'bg-red-100 text-red-700 border-red-300';
    case 'In Progress / Monitoring': return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'Pending Evaluation': return 'bg-gray-100 text-gray-600 border-gray-300';
    case 'Too Early to Tell / Not Yet Assessable': return 'bg-purple-100 text-purple-700 border-purple-300';
    default: return 'bg-gray-100 text-gray-600 border-gray-300';
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
const Card = ({ children, className = '' }) => (
  <div className={`${colors.cardBackground} rounded-xl shadow-sm border ${colors.borderMuted} ${className}`}>
    {children}
  </div>
);
// Adjusted CardHeader padding for potentially more compact cards
const CardHeader = ({ children, className = '' }) => <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '', size = 'lg' }) => {
    const sizeClass = size === 'lg' ? 'text-lg' : 'text-base'; // Allow smaller title for compact cards
    return <h3 className={`font-serif font-semibold ${colors.textPrimary} ${sizeClass} ${className}`} style={{ fontFamily: 'Georgia, Times, serif' }}>{children}</h3>;
};
const CardDescription = ({ children, className = '' }) => <p className={`text-xs sm:text-sm ${colors.textSecondary} ${className}`}>{children}</p>;
// Adjusted CardContent padding
const CardContent = ({ children, className = '' }) => <div className={`p-4 sm:p-5 pt-0 ${className}`}>{children}</div>;


const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, asChild = false, href, target, rel }) => {
  const sizeClasses = size === 'lg' ? 'px-6 py-3 text-base' : size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const baseClasses = `font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${sizeClasses} inline-flex items-center justify-center`; // Added inline-flex and justify-center
  let variantClasses = '';

  switch (variant) {
    case 'outline':
      variantClasses = `border ${colors.borderMuted} ${colors.textPrimary} hover:bg-gray-100 focus:ring-gray-400`;
      break;
    case 'primary': 
    default:
      variantClasses = `${colors.bgAccentGreen} text-white ${colors.hoverBgAccentGreen} focus:ring-emerald-500`;
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
  const commonClasses = `w-full p-2.5 border ${colors.borderMuted} rounded-lg text-sm ${colors.textPrimary} focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-gray-400`;
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


const Progress = ({ value, className = '' }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
    <div className={`${colors.bgAccentGreen} h-2.5 rounded-full`} style={{ width: `${value}%` }}></div>
  </div>
);

// --- Components ---

const Navbar = ({ setCurrentPage }) => {
  const navItems = [
    { name: 'Home', page: 'home' }, { name: 'Timeline', page: 'timeline' },
    { name: 'Predictions', page: 'allPredictions' }, { name: 'Blog', page: 'blog' },
    { name: 'About', page: 'about' },
  ];

  return (
    <nav className={`sticky top-0 z-20 flex items-center justify-between border-b ${colors.borderMuted} ${colors.navbarBackground} px-4 sm:px-6 py-3.5`}>
      <h1 
        className="font-serif text-lg sm:text-xl font-bold tracking-tight cursor-pointer" // Slightly reduced size
        onClick={() => setCurrentPage('home')}
        style={{ fontFamily: 'Georgia, Times, serif' }}
      >
        <span className={colors.textPrimary}>AI 2027</span>&nbsp;
        <span className={colors.accentGreen}>Tracker</span>
      </h1>
      <div className="hidden md:flex items-center space-x-5"> {/* Reduced space */}
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => setCurrentPage(item.page)}
            className={`font-medium text-xs sm:text-sm ${colors.textPrimary} transition hover:${colors.accentGreen}`} // Reduced size
          >
            {item.name}
          </button>
        ))}
      </div>
       {/* Mobile Menu Button - Placeholder */}
      <Button variant="outline" size="sm" className="md:hidden px-2 py-1"> 
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        <span className="sr-only">Menu</span>
      </Button>
    </nav>
  );
};

const Footer = () => {
  return (
    <footer className={`border-t ${colors.borderMuted} ${colors.footerBackground} py-8 text-center text-sm ${colors.textSecondary}`}>
      <p>© {new Date().getFullYear()} AI 2027 Prediction Tracker.</p>
      <p className="mt-1">Inspired by the AI 2027 scenario. For analytical purposes.</p>
    </footer>
  );
};

// PredictionCard specifically for Timeline (more compact)
const TimelinePredictionCard = ({ prediction, setCurrentPage, setSelectedPredictionId }) => {
  const handleReadMore = () => {
    setSelectedPredictionId(prediction.id);
    setCurrentPage('predictionDetail');
  };

  return (
    <Card className="flex flex-col"> {/* Removed h-full to allow natural height */}
      <CardHeader className="flex-1 !p-3 sm:!p-4"> {/* Reduced padding */}
        <CardTitle size="sm" className="line-clamp-2 !text-sm sm:!text-base">{prediction.text}</CardTitle> {/* Smaller title, tighter clamp */}
        <CardDescription className="mt-1 !text-xs">{prediction.predictedDate} - {prediction.originalScenario}</CardDescription>
      </CardHeader>
      <CardContent className="!p-3 sm:!p-4"> {/* Reduced padding */}
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 !text-xs font-semibold border ${getStatusClasses(prediction.status)}`}>
          {prediction.status}
        </span>
        {prediction.accuracyScore !== null && (
          <span className={`ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 !text-xs font-semibold border bg-indigo-100 text-indigo-700 border-indigo-300`}>
            Acc: {prediction.accuracyScore}%
          </span>
        )}
         <button 
            onClick={handleReadMore}
            className={`block mt-2 text-xs sm:text-sm ${colors.accentGreen} hover:underline font-semibold`}
        >
            View Details &rarr;
        </button>
      </CardContent>
    </Card>
  );
};


// General PredictionCard (used on Homepage, AllPredictions)
const PredictionCard = ({ prediction, setCurrentPage, setSelectedPredictionId }) => {
  const handleReadMore = () => {
    setSelectedPredictionId(prediction.id);
    setCurrentPage('predictionDetail');
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-1">
        <CardTitle className="line-clamp-3 text-base">{prediction.text}</CardTitle>
        <CardDescription className="mt-1.5 text-xs">{prediction.predictedDate} - {prediction.originalScenario}</CardDescription>
      </CardHeader>
      <CardContent>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${getStatusClasses(prediction.status)}`}>
          {prediction.status}
        </span>
        {prediction.accuracyScore !== null && (
          <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border bg-indigo-100 text-indigo-700 border-indigo-300`}>
            Acc: {prediction.accuracyScore}%
          </span>
        )}
         <button 
            onClick={handleReadMore}
            className={`block mt-3 text-sm ${colors.accentGreen} hover:underline font-semibold`}
        >
            View Details &rarr;
        </button>
      </CardContent>
    </Card>
  );
};


const BlogCard = ({ post, setCurrentPage, setSelectedPostId }) => {
    const handleReadMore = () => {
        setSelectedPostId(post.id);
        setCurrentPage('blogPost');
    };
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex-1">
                <CardTitle className="text-lg">{post.title}</CardTitle>
                <CardDescription className="mt-1 text-xs">By {post.author} on {formatDate(post.date)}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className={`${colors.textPrimary} text-sm mb-3 line-clamp-3`}>{post.summary}</p>
                <button
                    onClick={handleReadMore}
                    className={`text-sm ${colors.accentGreen} hover:underline font-semibold`}
                >
                    Read More &rarr;
                </button>
            </CardContent>
        </Card>
    );
};

const HomePage = ({ predictions, posts, setCurrentPage, setSelectedPredictionId, setSelectedPostId }) => {
  const recentlyEvaluated = predictions
    .filter(p => p.lastEvaluated)
    .sort((a, b) => new Date(b.lastEvaluated) - new Date(a.lastEvaluated))
    .slice(0, 3);

  const totalPredictions = predictions.length;
  const evaluatedPredictionsCount = predictions.filter(p => p.status !== 'Pending Evaluation' && p.status !== 'Too Early to Tell / Not Yet Assessable').length;
  const overallAccuracy = useMemo(() => {
    const scoredPredictions = predictions.filter(p => p.accuracyScore !== null);
    if (scoredPredictions.length === 0) return 0;
    const sum = scoredPredictions.reduce((acc, p) => acc + p.accuracyScore, 0);
    return Math.round(sum / scoredPredictions.length);
  }, [predictions]);
  const evaluatedPercent = totalPredictions > 0 ? Math.round((evaluatedPredictionsCount / totalPredictions) * 100) : 0;

  return (
    <div className={`container mx-auto px-4 sm:px-6 py-8 ${colors.textPrimary}`}>
      {/* HERO */}
      <section className="mx-auto max-w-4xl space-y-4 py-12 text-center">
        <h2 className={`font-serif text-4xl font-bold leading-tight ${colors.textPrimary} sm:text-5xl`} style={{ fontFamily: 'Georgia, Times, serif' }}>
          AI 2027 Prediction Tracker
        </h2>
        <p className={`mx-auto max-w-2xl text-lg ${colors.textSecondary}`}>
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
            <CardContent><p className={`font-serif text-4xl font-semibold ${colors.textPrimary}`}>{totalPredictions}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Evaluated</CardTitle></CardHeader>
            <CardContent>
              <Progress value={evaluatedPercent} className="mb-2 h-3" />
              <p className={`text-sm ${colors.textSecondary}`}>{evaluatedPercent}% of predictions have been evaluated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Overall Accuracy</CardTitle></CardHeader>
            <CardContent>
              <div className="relative mx-auto h-20 w-20 sm:h-24 sm:w-24">
                <svg viewBox="0 0 36 36" className="h-full w-full">
                  <path className="text-gray-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={colors.accentGreen} strokeWidth="3" strokeDasharray={`${overallAccuracy}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="20.35" className={`text-xs fill-current ${colors.textPrimary} font-semibold`} textAnchor="middle">{overallAccuracy}%</text>
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* RECENTLY EVALUATED */}
      <section className="mx-auto mb-12 max-w-5xl space-y-5">
        <h3 className={`font-serif text-2xl font-semibold ${colors.textPrimary}`} style={{ fontFamily: 'Georgia, Times, serif' }}>
          Recently Evaluated Predictions
        </h3>
        <div className="grid gap-5 md:grid-cols-3">
          {recentlyEvaluated.map((item) => (
            <PredictionCard 
                key={item.id} 
                prediction={item} 
                setCurrentPage={setCurrentPage} 
                setSelectedPredictionId={setSelectedPredictionId} 
            />
          ))}
        </div>
      </section>

      {/* FEATURED BLOG POSTS */}
      <section className="mx-auto mb-12 max-w-5xl space-y-5">
        <h3 className={`font-serif text-2xl font-semibold ${colors.textPrimary}`} style={{ fontFamily: 'Georgia, Times, serif' }}>
          Featured Analysis
        </h3>
        <div className="grid gap-5 md:grid-cols-2">
          {posts.slice(0,2).map((item) => (
            <BlogCard 
                key={item.id} 
                post={item} 
                setCurrentPage={setCurrentPage} 
                setSelectedPostId={setSelectedPostId} 
            />
          ))}
        </div>
      </section>

      <section className="mt-10 py-6 border-t ${colors.borderMuted} flex flex-col sm:flex-row justify-center items-center gap-6">
        <Button onClick={() => setCurrentPage('timeline')} variant="outline">EXPLORE THE TIMELINE</Button>
        <Button onClick={() => setCurrentPage('allPredictions')}>VIEW ALL PREDICTIONS</Button>
      </section>
    </div>
  );
};

const TimelinePage = ({ predictions, setCurrentPage, setSelectedPredictionId }) => {
    const predictionsBySegment = useMemo(() => {
        const grouped = {};
        timelineSegments.forEach(segment => {
            grouped[segment] = predictions.filter(p => p.timelineSegment === segment);
        });
        return grouped;
    }, [predictions]);

    const segmentAccuracies = {
        "Mid 2025": 75, "Late 2025": 60, "Early 2026": 90, 
        "Late 2026": 60, "February 2027": 0, "July 2027": null 
    };

    return (
        <div className={`container mx-auto px-4 sm:px-6 py-8 ${colors.textPrimary}`}>
            <h1 className={`font-serif text-3xl sm:text-4xl font-bold mb-8 text-center ${colors.textPrimary}`} style={{ fontFamily: 'Georgia, Times, serif' }}>
                Scenario Timeline
            </h1>
            
            <section className={`mb-10 p-4 sm:p-5 ${colors.cardBackground} rounded-xl shadow-sm border ${colors.borderMuted}`}>
                <h3 className={`font-serif text-xl font-semibold ${colors.textPrimary} mb-4`} style={{ fontFamily: 'Georgia, Times, serif' }}>
                    Timeline Overview
                </h3>
                <div className="flex overflow-x-auto space-x-4 sm:space-x-6 pb-2">
                    {timelineSegments.map((segLabel) => {
                        const accuracy = segmentAccuracies[segLabel];
                        return (
                            <div key={segLabel} className="min-w-[100px] sm:min-w-[120px] flex flex-col items-center text-center">
                                <span className={`font-medium text-xs sm:text-sm ${colors.textPrimary}`}>{segLabel}</span>
                                {accuracy !== null ? (
                                    <>
                                        <Progress value={accuracy} className="mt-1.5 h-1.5 sm:h-2 w-full" />
                                        <span className={`mt-1 text-xs ${colors.textSecondary}`}>{accuracy}%</span>
                                    </>
                                ) : (
                                    <span className={`mt-1 text-xs italic ${colors.textSecondary}`}>Upcoming</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="space-y-8"> {/* Reduced space between segment sections */}
                {timelineSegments.map(segment => (
                    predictionsBySegment[segment] && predictionsBySegment[segment].length > 0 && (
                        <section key={segment} id={segment.toLowerCase().replace(/\s+/g, '-')} className="pt-1">
                            <h2 className={`text-xl sm:text-2xl font-serif font-semibold ${colors.textPrimary} mb-4 border-b-2 ${colors.borderMuted} pb-1.5`} style={{ fontFamily: 'Georgia, Times, serif' }}>{segment}</h2>
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4"> {/* Grid layout for cards */}
                                {predictionsBySegment[segment].map(prediction => (
                                    <TimelinePredictionCard // Using the compact card
                                        key={prediction.id} 
                                        prediction={prediction} 
                                        setCurrentPage={setCurrentPage}
                                        setSelectedPredictionId={setSelectedPredictionId}
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

const AllPredictionsPage = ({ predictions, setCurrentPage, setSelectedPredictionId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('predictedDate');

  const allCategories = useMemo(() => {
    const catSet = new Set();
    predictions.forEach(p => p.categories.forEach(cat => catSet.add(cat)));
    return Array.from(catSet).sort();
  }, [predictions]);

  const allStatuses = useMemo(() => {
    const statusSet = new Set();
    predictions.forEach(p => statusSet.add(p.status));
    return Array.from(statusSet).sort();
  }, [predictions]);

  const filteredPredictions = useMemo(() => {
    return predictions
      .filter(p => 
        p.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.originalScenario.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(p => statusFilter ? p.status === statusFilter : true)
      .filter(p => categoryFilter ? p.categories.includes(categoryFilter) : true)
      .sort((a, b) => {
        if (sortBy === 'accuracyScore') { return (b.accuracyScore || -1) - (a.accuracyScore || -1); }
        if (sortBy === 'lastEvaluated') { return new Date(b.lastEvaluated || 0) - new Date(a.lastEvaluated || 0); }
        return a.predictedDate.localeCompare(b.predictedDate);
      });
  }, [predictions, searchTerm, statusFilter, categoryFilter, sortBy]);

  return (
    <div className={`container mx-auto px-4 sm:px-6 py-8 ${colors.textPrimary}`}>
      <h1 className={`font-serif text-3xl sm:text-4xl font-bold mb-8 text-center ${colors.textPrimary}`} style={{ fontFamily: 'Georgia, Times, serif' }}>
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
              <option value="predictedDate">Sort by Predicted Date</option>
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
              setCurrentPage={setCurrentPage} 
              setSelectedPredictionId={setSelectedPredictionId} 
            />
          ))}
        </div>
      ) : (
        <p className={`text-center ${colors.textSecondary} text-lg py-10`}>No predictions match your current filters.</p>
      )}
    </div>
  );
};

// PredictionDetailPage, BlogPage, BlogPostPage, AboutPage remain largely the same as previous version,
// but will benefit from the updated Card, Button, Input component styling.
// For brevity, only showing changes to App, and the modified components.

const PredictionDetailPage = ({ predictionId, predictions, setCurrentPage }) => {
  const prediction = predictions.find(p => p.id === predictionId);

  if (!prediction) {
    return (
      <div className={`container mx-auto p-6 text-center ${colors.textPrimary}`}>
        <h1 className="text-xl font-semibold text-red-600">Prediction not found.</h1>
        <Button onClick={() => setCurrentPage('allPredictions')} className="mt-4">Back to All Predictions</Button>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 sm:px-6 py-8 ${colors.textPrimary}`}>
      <button 
        onClick={() => setCurrentPage('allPredictions')} 
        className={`mb-6 ${colors.accentGreen} hover:underline font-semibold text-sm`}
      >
        &larr; Back to All Predictions
      </button>

      <Card>
        <CardHeader>
          <CardDescription className="text-xs">{prediction.predictedDate} - From: "{prediction.originalScenario}"</CardDescription>
          <CardTitle className="text-2xl sm:text-3xl mt-1">{prediction.text}</CardTitle>
          <div className="mt-3.5">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${getStatusClasses(prediction.status)}`}>
              Status: {prediction.status}
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
              <li><strong>Categories:</strong> {prediction.categories.join(', ')}</li>
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
                    <li key={index}><a href={item.url} target="_blank" rel="noopener noreferrer" className={`${colors.accentGreen} hover:underline`}>{item.text}</a></li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          {prediction.analystCommentary && prediction.analystCommentary.length > 0 && (
            <section>
              <h4 className="font-serif text-md font-semibold mb-2" style={{ fontFamily: 'Georgia, Times, serif' }}>Tracker's Log</h4>
              <div className="space-y-3">
                {prediction.analystCommentary.map((entry, index) => (
                  <div key={index} className={`p-3 bg-gray-50 rounded-lg border ${colors.borderMuted} text-xs`}>
                    <p className={`${colors.textSecondary} font-medium`}>{formatDate(entry.date)}</p>
                    <p className="mt-1">{entry.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const BlogPage = ({ posts, setCurrentPage, setSelectedPostId }) => {
    return (
        <div className={`container mx-auto px-4 sm:px-6 py-8 ${colors.textPrimary}`}>
            <h1 className={`font-serif text-3xl sm:text-4xl font-bold mb-8 text-center ${colors.textPrimary}`} style={{ fontFamily: 'Georgia, Times, serif' }}>
                AI 2027 Tracker Blog
            </h1>
            {posts.length > 0 ? (
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    {posts.map(post => ( <BlogCard key={post.id} post={post} setCurrentPage={setCurrentPage} setSelectedPostId={setSelectedPostId} /> ))}
                </div>
            ) : ( <p className={`text-center ${colors.textSecondary} text-lg`}>No blog posts available yet.</p> )}
        </div>
    );
};

const BlogPostPage = ({ postId, posts, setCurrentPage }) => {
    const post = posts.find(p => p.id === postId);
    if (!post) {
        return (
            <div className={`container mx-auto p-6 text-center ${colors.textPrimary}`}>
                <h1 className="text-xl font-semibold text-red-600">Blog post not found.</h1>
                <Button onClick={() => setCurrentPage('blog')} className="mt-4">Back to Blog</Button>
            </div>
        );
    }
    return (
        <div className={`container mx-auto px-4 sm:px-6 py-8 ${colors.textPrimary}`}>
             <button onClick={() => setCurrentPage('blog')} className={`mb-6 ${colors.accentGreen} hover:underline font-semibold text-sm`}>
                &larr; Back to Blog
            </button>
            <Card>
                <CardHeader className={`border-b ${colors.borderMuted}`}>
                    <CardTitle className="text-3xl sm:text-4xl">{post.title}</CardTitle>
                    <CardDescription className="mt-2 text-xs">
                        By <span className="font-semibold">{post.author}</span> on <span className="font-semibold">{formatDate(post.date)}</span>
                    </CardDescription>
                    {post.tags && post.tags.length > 0 && (
                        <div className="mt-3">
                            {post.tags.map(tag => (
                                <span key={tag} className={`mr-1.5 mb-1.5 inline-block bg-gray-100 ${colors.textPrimary} text-xs font-medium px-2 py-0.5 rounded-md border ${colors.borderMuted}`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="prose prose-sm sm:prose-base max-w-none pt-6"> {/* Tailwind Typography for blog content */}
                    {post.content.split('\n').map((paragraph, index) => ( <p key={index} className="mb-3 leading-relaxed">{paragraph}</p> ))}
                </CardContent>
            </Card>
        </div>
    );
};

const AboutPage = () => {
  return (
    <div className={`container mx-auto px-4 sm:px-6 py-8 ${colors.textPrimary}`}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl sm:text-4xl">About the AI 2027 Prediction Tracker</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-5 leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>Our Mission</h2>
            <p>The AI 2027 Prediction Tracker is dedicated to systematically tracking and evaluating the predictions made in the "AI 2027" scenario...</p>
          </section>
          <section>
            <h2 className="font-serif text-xl font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>The "AI 2027" Scenario</h2>
            <p>This tracker is based on the "AI 2027" scenario... Link available on our homepage.</p>
          </section>
          <section>
            <h2 className="font-serif text-xl font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>Our Methodology</h2>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li><strong>Prediction Extraction:</strong> Specific, trackable claims.</li>
              <li><strong>Categorization:</strong> Tagged for analysis.</li>
              <li><strong>Status Assignment:</strong> Pending, In Progress, Confirmed Accurate, etc.</li>
              <li><strong>Accuracy Scoring:</strong> Qualitative assessment (0-100%).</li>
              <li><strong>Evidence & Commentary:</strong> Public sources and analyst notes.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-serif text-xl font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>Disclaimers</h2>
            <p>Informational and analytical purposes only. Evaluations involve subjective judgment.</p>
          </section>
          <section>
            <h2 className="font-serif text-xl font-semibold mb-1.5" style={{ fontFamily: 'Georgia, Times, serif' }}>Contact & Feedback</h2>
            <p>We welcome feedback at [Contact Method TBD].</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};


const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPredictionId, setSelectedPredictionId] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.className = `${colors.background} font-sans ${colors.textPrimary}`;
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage predictions={mockPredictions} posts={mockBlogPosts} setCurrentPage={setCurrentPage} setSelectedPredictionId={setSelectedPredictionId} setSelectedPostId={setSelectedPostId} />;
      case 'timeline': return <TimelinePage predictions={mockPredictions} setCurrentPage={setCurrentPage} setSelectedPredictionId={setSelectedPredictionId}/>;
      case 'allPredictions': return <AllPredictionsPage predictions={mockPredictions} setCurrentPage={setCurrentPage} setSelectedPredictionId={setSelectedPredictionId} />;
      case 'predictionDetail': return <PredictionDetailPage predictionId={selectedPredictionId} predictions={mockPredictions} setCurrentPage={setCurrentPage} />;
      case 'blog': return <BlogPage posts={mockBlogPosts} setCurrentPage={setCurrentPage} setSelectedPostId={setSelectedPostId} />;
      case 'blogPost': return <BlogPostPage postId={selectedPostId} posts={mockBlogPosts} setCurrentPage={setCurrentPage} />;
      case 'about': return <AboutPage />;
      default: return <HomePage predictions={mockPredictions} posts={mockBlogPosts} setCurrentPage={setCurrentPage} setSelectedPredictionId={setSelectedPredictionId} setSelectedPostId={setSelectedPostId} />;
    }
  };

  return (
    <div> 
      <Navbar setCurrentPage={setCurrentPage} />
      <main>{renderPage()}</main>
      <Footer />
    </div>
  );
};

export default App;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
