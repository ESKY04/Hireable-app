'use client';

import React, { useState, useEffect } from 'react';
import { FileText, LogOut, Zap, Check, ArrowRight, Upload } from 'lucide-react';

const PROMPTS = {
  resumeFromInfo: (userInfo) => `
You are an expert resume writer. Create a professional resume from the following information.
Format it as a clean, ATS-friendly resume. Use bullet points for achievements.
Keep it to 1 page if possible.

USER INFORMATION:
${JSON.stringify(userInfo, null, 2)}

Generate the resume in a clean, professional format that's ready to copy/paste or download.
Start with CONTACT INFORMATION, then PROFESSIONAL SUMMARY, EXPERIENCE, SKILLS, EDUCATION.
`,

  tailorResume: (resume, jobPosting) => `
You are an expert resume optimizer. Your job is to tailor this resume for a specific job posting.

IMPORTANT RULES:
1. Keep all information TRUE to the candidate's actual experience
2. Reorder and rewrite bullet points to emphasize relevant accomplishments
3. Use keywords from the job posting naturally
4. Highlight the most relevant experience first
5. Keep the same person and accomplishments - just reorganize for this specific job
6. Maintain professional formatting

ORIGINAL RESUME:
${resume}

JOB POSTING:
${jobPosting}

Provide the tailored resume. Format it professionally and ready to use.
Make it specific to this job while staying true to the candidate's actual experience.
`,

  generateCoverLetter: (resume, jobPosting, userInfo) => `
You are an expert cover letter writer. Write a personalized, compelling cover letter based on the candidate's resume and the specific job posting.

IMPORTANT:
1. Reference the specific company name
2. Reference the specific role
3. Show genuine understanding of what the company does
4. Connect 2-3 specific accomplishments from their resume to the job requirements
5. Keep it to 3-4 paragraphs
6. Professional but personable tone
7. Make them stand out - don't be generic

CANDIDATE'S RESUME:
${resume}

JOB POSTING:
${jobPosting}

CANDIDATE INFO:
${userInfo}

Write the cover letter. Start with "Dear Hiring Manager," and format it professionally.
Make it compelling and specific to this role.
`
};

async function callClaude(model, maxTokens, prompt) {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) throw new Error('API Error');
  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export default function CareerApp() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleSignup = (e) => {
    e.preventDefault();
    if (email && password) {
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        createdAt: new Date().toISOString(),
        freetierUsedThisMonth: 0,
        isPaid: false
      };
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setCurrentPage('dashboard');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.email === email) {
        setUser(parsed);
        setCurrentPage('dashboard');
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
    setEmail('');
    setPassword('');
  };

  if (currentPage === 'landing') return <LandingPage setCurrentPage={setCurrentPage} />;
  if (currentPage === 'signup') return (
    <AuthPage isSignup email={email} setEmail={setEmail} password={password} setPassword={setPassword} onSubmit={handleSignup} setCurrentPage={setCurrentPage} />
  );
  if (currentPage === 'login') return (
    <AuthPage isSignup={false} email={email} setEmail={setEmail} password={password} setPassword={setPassword} onSubmit={handleLogin} setCurrentPage={setCurrentPage} />
  );
  if (currentPage === 'resume-builder' && user) return (
    <ResumeBuilder
      user={user}
      onComplete={(resumeText) => { localStorage.setItem(`resume_${user.id}`, resumeText); setCurrentPage('dashboard'); }}
      onLogout={handleLogout}
      setCurrentPage={setCurrentPage}
    />
  );
  if (currentPage === 'tailor' && user) return (
    <TailorApp user={user} onLogout={handleLogout} setCurrentPage={setCurrentPage} />
  );
  if (currentPage === 'dashboard' && user) return (
    <Dashboard user={user} onLogout={handleLogout} setCurrentPage={setCurrentPage} />
  );

  return null;
}

function LandingPage({ setCurrentPage }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <nav className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold tracking-tight">Hireable</div>
          <button onClick={() => setCurrentPage('login')} className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Sign In
          </button>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="space-y-6 mb-12">
          <div className="inline-block bg-green-50 border border-green-200 px-3 py-1 rounded text-sm font-medium text-green-900">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Free for your first application
            </span>
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Get a tailored resume
            <br />
            <span className="text-blue-600">for any job. In minutes.</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
            Stop sending the same generic resume to every job. Upload yours (or answer a few questions), tell us the job you're applying for, and we'll tailor it + write a cover letter—for free, right now.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">For Every Job</h3>
            </div>
            <p className="text-sm text-slate-600">
              Each job gets a fresh resume and cover letter tailored to that specific posting. No more generic applications.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">In Minutes</h3>
            </div>
            <p className="text-sm text-slate-600">
              Upload your resume or tell us about yourself. Paste the job posting. Get a tailored resume + cover letter in minutes.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Always Free to Try</h3>
            </div>
            <p className="text-sm text-slate-600">
              Free tier: 1 tailored resume/month. Need more? Upgrade to unlimited for $9.99/month.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-slate-900 text-white rounded-lg p-12 space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold">Try it free. Right now.</h2>
            <p className="text-blue-100">No credit card. No commitment. Get your first tailored resume in 10 minutes.</p>
          </div>
          <div className="flex gap-4 max-w-md">
            <button onClick={() => setCurrentPage('signup')} className="flex-1 bg-white text-blue-600 font-semibold py-3 rounded hover:bg-blue-50 transition">
              Sign Up Free
            </button>
            <button onClick={() => setCurrentPage('login')} className="flex-1 border-2 border-white text-white font-semibold py-3 rounded hover:bg-white hover:bg-opacity-10 transition">
              Sign In
            </button>
          </div>
          <p className="text-sm text-blue-100">
            <strong>Privacy first.</strong> We don&apos;t sell your data. Period.
          </p>
        </div>
      </section>
    </div>
  );
}

function AuthPage({ isSignup, email, setEmail, password, setPassword, onSubmit, setCurrentPage }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Hireable</h1>
          <p className="text-slate-600">{isSignup ? 'Create your account' : 'Welcome back'}</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
            {isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <div className="text-center text-sm">
          {isSignup ? (
            <>Already have an account?{' '}<button onClick={() => setCurrentPage('login')} className="text-blue-600 hover:underline">Sign in</button></>
          ) : (
            <>Don&apos;t have an account?{' '}<button onClick={() => setCurrentPage('signup')} className="text-blue-600 hover:underline">Sign up</button></>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout, setCurrentPage }) {
  const savedResume = localStorage.getItem(`resume_${user.id}`);
  const usageThisMonth = user.freetierUsedThisMonth || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Hireable</div>
          <button onClick={onLogout} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-slate-600">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-lg p-8 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Your Resume</h2>
                <p className="text-sm text-slate-600">{savedResume ? 'Resume saved ✓' : 'No resume yet'}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            {!savedResume ? (
              <button onClick={() => setCurrentPage('resume-builder')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition">
                Create Resume
              </button>
            ) : (
              <button onClick={() => setCurrentPage('resume-builder')} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-2 rounded-lg transition">
                Edit Resume
              </button>
            )}
          </div>

          <div className="border border-blue-200 rounded-lg p-8 space-y-4 bg-blue-50">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Tailor for a Job</h2>
                <p className="text-sm text-slate-600">
                  {usageThisMonth === 0 ? <>1 free tailor available this month</> : <>Free tailors used this month: {usageThisMonth}/1</>}
                </p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            {savedResume ? (
              <button onClick={() => setCurrentPage('tailor')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2">
                Tailor Resume <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <p className="text-sm text-slate-600">Create a resume first to start tailoring.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-100 rounded-lg p-8 space-y-4">
          <h3 className="font-bold">Your Plan</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600">Free tailors per month</p>
              <p className="font-bold text-lg">1</p>
            </div>
            <div>
              <p className="text-slate-600">Job market analysis</p>
              <p className="font-bold">—</p>
            </div>
          </div>
          <button className="w-full border border-blue-600 text-blue-600 font-semibold py-2 rounded-lg hover:bg-blue-50 transition">
            Upgrade to Unlimited ($9.99/mo)
          </button>
        </div>
      </div>
    </div>
  );
}

function ResumeBuilder({ user, onComplete, onLogout, setCurrentPage }) {
  const [step, setStep] = useState('method');
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    experience: [{ company: '', role: '', dates: '', description: '' }],
    skills: '',
    education: ''
  });
  const [generatedResume, setGeneratedResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => onComplete(event.target?.result || '');
      reader.readAsText(file);
    }
  };

  const generateResume = async () => {
    setLoading(true);
    setError('');
    try {
      const text = await callClaude('claude-opus-4-6', 2000, PROMPTS.resumeFromInfo(userInfo));
      setGeneratedResume(text);
      setStep('preview');
    } catch {
      setError('Something went wrong generating your resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'method') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <nav className="border-b border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => setCurrentPage('dashboard')} className="text-sm text-slate-600 hover:text-slate-900">← Back</button>
            <button onClick={onLogout} className="text-sm text-slate-600 hover:text-slate-900">Sign Out</button>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-8">Create Your Resume</h1>
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-blue-500 transition cursor-pointer">
              <label className="cursor-pointer block">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="font-semibold mb-1">Upload Existing Resume</p>
                <p className="text-sm text-slate-600">Drag and drop or click to select (.txt files)</p>
                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-600">Or</span></div>
            </div>
            <button onClick={() => setStep('build')} className="w-full border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-lg p-8 text-center transition">
              <p className="font-semibold mb-1">Build a Resume</p>
              <p className="text-sm text-slate-600">Answer a few questions and we'll create one for you</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'build') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <nav className="border-b border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => setStep('method')} className="text-sm text-slate-600 hover:text-slate-900">← Back</button>
            <button onClick={onLogout} className="text-sm text-slate-600 hover:text-slate-900">Sign Out</button>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-8">Tell Us About Yourself</h1>
          <form onSubmit={(e) => { e.preventDefault(); generateResume(); }} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Full Name</label>
              <input type="text" value={userInfo.fullName} onChange={(e) => setUserInfo({ ...userInfo, fullName: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-sm font-semibold">Email</label>
                <input type="email" value={userInfo.email} onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold">Phone</label>
                <input type="tel" value={userInfo.phone} onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Location (City, State)</label>
              <input type="text" value={userInfo.location} onChange={(e) => setUserInfo({ ...userInfo, location: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Work Experience</label>
              <p className="text-sm text-slate-600 mb-2">List your jobs, roles, dates, and key accomplishments</p>
              <textarea
                value={userInfo.experience[0].description}
                onChange={(e) => { const newExp = [...userInfo.experience]; newExp[0].description = e.target.value; setUserInfo({ ...userInfo, experience: newExp }); }}
                placeholder={`e.g., Forklift Operator at Warehouse Co | 2020-2022\n- Operated forklifts safely and efficiently\n- Managed inventory counts`}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 font-mono text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Skills</label>
              <textarea value={userInfo.skills} onChange={(e) => setUserInfo({ ...userInfo, skills: e.target.value })} placeholder="e.g., Forklift certification, Inventory management, Customer service, Microsoft Office" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold">Education</label>
              <textarea value={userInfo.education} onChange={(e) => setUserInfo({ ...userInfo, education: e.target.value })} placeholder={`e.g., B.S. in Finance, Western Governors University, 2025\nHigh School Diploma, 2016`} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition">
              {loading ? 'Generating Resume...' : 'Generate Resume'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <nav className="border-b border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => setStep('build')} className="text-sm text-slate-600 hover:text-slate-900">← Back</button>
            <button onClick={onLogout} className="text-sm text-slate-600 hover:text-slate-900">Sign Out</button>
          </div>
        </nav>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Your Resume</h1>
            <div className="space-x-3">
              <button
                onClick={() => {
                  const el = document.createElement('a');
                  el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(generatedResume));
                  el.setAttribute('download', 'resume.txt');
                  el.style.display = 'none';
                  document.body.appendChild(el);
                  el.click();
                  document.body.removeChild(el);
                }}
                className="inline-block bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                Download
              </button>
              <button onClick={() => { navigator.clipboard.writeText(generatedResume); alert('Copied to clipboard!'); }} className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
                Copy
              </button>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-8">
            <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">{generatedResume}</div>
          </div>
          <button onClick={() => onComplete(generatedResume)} className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
            Save & Continue
          </button>
        </div>
      </div>
    );
  }
}

function TailorApp({ user, onLogout, setCurrentPage }) {
  const [jobPosting, setJobPosting] = useState('');
  const [tailoredResume, setTailoredResume] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const savedResume = localStorage.getItem(`resume_${user.id}`) || '';

  const handleTailor = async (e) => {
    e.preventDefault();
    if (!jobPosting.trim()) { alert('Please paste a job posting'); return; }

    setLoading(true);
    setError('');
    try {
      const tailored = await callClaude('claude-opus-4-6', 2000, PROMPTS.tailorResume(savedResume, jobPosting));
      setTailoredResume(tailored);

      const letter = await callClaude('claude-opus-4-6', 1000, PROMPTS.generateCoverLetter(savedResume, jobPosting, JSON.stringify({ email: user.email })));
      setCoverLetter(letter);

      const updatedUser = { ...user, freetierUsedThisMonth: (user.freetierUsedThisMonth || 0) + 1 };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowResults(true);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <nav className="border-b border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <button onClick={() => setCurrentPage('dashboard')} className="text-sm text-slate-600 hover:text-slate-900">← Back</button>
            <button onClick={onLogout} className="text-sm text-slate-600 hover:text-slate-900">Sign Out</button>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Your Tailored Resume</h2>
              <button onClick={() => { navigator.clipboard.writeText(tailoredResume); alert('Copied!'); }} className="text-sm bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded">Copy</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-8">
              <div className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{tailoredResume}</div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Cover Letter</h2>
              <button onClick={() => { navigator.clipboard.writeText(coverLetter); alert('Copied!'); }} className="text-sm bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded">Copy</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-8">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{coverLetter}</div>
            </div>
          </div>
          <button onClick={() => { setShowResults(false); setJobPosting(''); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
            Tailor for Another Job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => setCurrentPage('dashboard')} className="text-sm text-slate-600 hover:text-slate-900">← Back</button>
          <button onClick={onLogout} className="text-sm text-slate-600 hover:text-slate-900">Sign Out</button>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Tailor Your Resume</h1>
        <p className="text-slate-600 mb-8">Paste the job posting below. We'll tailor your resume + generate a cover letter.</p>
        <form onSubmit={handleTailor} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Job Posting</label>
            <textarea value={jobPosting} onChange={(e) => setJobPosting(e.target.value)} placeholder="Paste the job posting here..." className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-64 text-sm" required />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
            {loading ? 'Tailoring...' : 'Generate Tailored Resume & Cover Letter'}
            {!loading && <Zap className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
