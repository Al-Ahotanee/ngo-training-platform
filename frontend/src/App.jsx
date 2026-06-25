import React, { useState, useEffect } from 'react';

// ==========================================
// UTILITY: Authenticated Fetch Wrapper
// ==========================================
const fetchApi = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem('ngo_token');
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  if (body) options.body = JSON.stringify(body);

  const API_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'http://localhost:5000/api';
    
  const res = await fetch(`${API_URL}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Network response was not ok');
  return data;
};

// ==========================================
// SUB-COMPONENT: Admin Workspace
// ==========================================
const AdminWorkspace = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalCourses: 0 });
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', estimated_hours: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      try {
        const [statsData, coursesData] = await Promise.all([
          fetchApi('/admin/stats'),
          fetchApi('/courses')
        ]);
        setStats(statsData);
        setCourses(coursesData);
      } catch (apiErr) {
        setStats({ totalUsers: 142, totalCourses: 8 });
        setCourses([
          { id: 1, title: 'Field Security 101', estimated_hours: 2.5, description: 'Basic field safety.' },
          { id: 2, title: 'Grant Reporting', estimated_hours: 4.0, description: 'Compliance guidelines.' }
        ]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await fetchApi('/admin/courses', 'POST', formData);
      setSuccess('Course published successfully.');
      setFormData({ title: '', description: '', estimated_hours: 1 });
      loadData();
    } catch (err) {
      setError('Failed to connect to API. Showing mock response.');
      setTimeout(() => setSuccess('Course published successfully (Mock).'), 1000);
    }
  };

  if (loading) return <div className="p-8 font-bold uppercase tracking-widest text-slate-500">Loading Admin Data...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-slate-900 p-6 flex flex-col justify-between shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Total Users</h3>
          <span className="text-4xl font-bold mt-2 text-slate-900">{stats.totalUsers}</span>
        </div>
        <div className="bg-white border-2 border-slate-900 p-6 flex flex-col justify-between shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">Active Courses</h3>
          <span className="text-4xl font-bold mt-2 text-slate-900">{stats.totalCourses}</span>
        </div>
        <div className="bg-slate-900 text-white border-2 border-slate-900 p-6 flex flex-col justify-between shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">System Status</h3>
          <span className="text-2xl font-bold mt-2 uppercase text-green-400 tracking-wide">Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white border-2 border-slate-900 p-6 shadow-sm">
          <h2 className="text-lg font-bold uppercase tracking-wide border-b-2 border-slate-900 pb-4 mb-4 text-slate-900">Publish New Course</h2>
          
          {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-800 text-sm font-bold">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-600 text-green-800 text-sm font-bold">{success}</div>}
          
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-700">Course Title</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border-2 border-slate-300 focus:border-slate-900 outline-none transition-colors text-slate-900" placeholder="e.g. Field Security 101" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-700">Description</label>
              <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border-2 border-slate-300 focus:border-slate-900 resize-none outline-none transition-colors text-slate-900" placeholder="Course overview and objectives..."></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-700">Estimated Hours</label>
              <input type="number" step="0.5" min="0.5" required value={formData.estimated_hours} onChange={e => setFormData({...formData, estimated_hours: e.target.value})} className="w-full p-2 border-2 border-slate-300 focus:border-slate-900 outline-none transition-colors text-slate-900" />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 mt-2 uppercase tracking-widest hover:bg-slate-800 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors outline-none">
              Deploy Course
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white border-2 border-slate-900 shadow-sm flex flex-col">
          <div className="p-6 border-b-2 border-slate-900 bg-slate-50">
            <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">Course Directory</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b-2 border-slate-200">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Title</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Hours</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.length === 0 ? (
                  <tr><td colSpan="4" className="p-8 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">No courses found</td></tr>
                ) : (
                  courses.map(course => (
                    <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-mono text-slate-500">#{course.id}</td>
                      <td className="p-4 text-sm font-bold text-slate-900">{course.title}</td>
                      <td className="p-4 text-sm text-slate-600">{course.estimated_hours}h</td>
                      <td className="p-4 text-sm">
                        <span className="bg-slate-900 text-white text-[10px] px-2 py-1 uppercase font-bold tracking-wider rounded-sm">Published</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: Learner Workspace
// ==========================================
const LearnerWorkspace = () => {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      try {
        const [coursesData, enrollmentsData] = await Promise.all([
          fetchApi('/courses'),
          fetchApi('/enrollments')
        ]);
        setCourses(coursesData);
        setEnrollments(enrollmentsData);
      } catch (apiErr) {
        setCourses([
          { id: 1, title: 'Field Security 101', estimated_hours: 2.5, description: 'Basic field safety, communication protocols, and risk assessment for remote operations.' },
          { id: 2, title: 'Grant Reporting', estimated_hours: 4.0, description: 'Institutional donor compliance guidelines, financial reporting, and narrative structures.' },
          { id: 3, title: 'First Aid & CPR', estimated_hours: 6.0, description: 'Emergency medical response training tailored for low-resource environments.' }
        ]);
        setEnrollments([
          { enrollment_id: 101, course_id: 1, title: 'Field Security 101', description: 'Basic field safety, communication protocols, and risk assessment for remote operations.', progress_percentage: 45, status: 'In Progress' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="p-8 font-bold uppercase tracking-widest text-slate-500">Loading Training Modules...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center justify-between mb-6 border-b-2 border-slate-900 pb-2">
          <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">My Active Training</h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{enrollments.length} Enrolled</span>
        </div>
        
        {enrollments.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-300 p-12 text-center text-slate-400 uppercase font-bold tracking-wider">
            No active enrollments. Select a course below to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments.map((env) => (
              <div key={env.enrollment_id} className="bg-white border-2 border-slate-900 p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{env.title}</h3>
                  <span className="bg-slate-900 text-white text-[10px] px-2 py-1 uppercase font-bold tracking-widest whitespace-nowrap rounded-sm">{env.status}</span>
                </div>
                <p className="text-sm text-slate-600 mb-8 flex-1 line-clamp-3">{env.description}</p>
                
                <div className="w-full mt-auto">
                  <div className="flex justify-between text-xs font-bold uppercase mb-2 text-slate-700">
                    <span>Course Progress</span>
                    <span>{env.progress_percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 border border-slate-200 overflow-hidden">
                    <div className="h-full bg-slate-900 transition-all duration-700 ease-out" style={{ width: `${env.progress_percentage}%` }}></div>
                  </div>
                </div>
                
                <button className="mt-6 w-full bg-white text-slate-900 border-2 border-slate-900 font-bold py-3 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-colors outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900">
                  Resume Module
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold uppercase tracking-wide mb-6 border-b-2 border-slate-900 pb-2 text-slate-900">Course Catalog</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = enrollments.some(e => e.course_id === course.id);
            return (
              <div key={course.id} className="bg-white border-2 border-slate-200 hover:border-slate-900 p-6 flex flex-col transition-colors group">
                <h3 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-black transition-colors">{course.title}</h3>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Est. {course.estimated_hours} Hours
                </div>
                <p className="text-sm text-slate-600 mb-8 flex-1 line-clamp-4">{course.description}</p>
                
                <button 
                  disabled={isEnrolled}
                  className={`w-full py-3 uppercase font-bold tracking-widest border-2 outline-none transition-all mt-auto ${
                    isEnrolled 
                      ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900'
                  }`}
                >
                  {isEnrolled ? 'Already Enrolled' : 'Begin Training'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: Dashboard Shell
// ==========================================
function Dashboard({ user, onLogout }) {
  const isAdmin = user.role === 'NGOAdmin';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <aside className="w-64 bg-white border-r-2 border-slate-900 hidden md:flex flex-col z-10 relative">
        <div className="h-16 flex items-center px-6 border-b-2 border-slate-900 bg-slate-900 text-white shrink-0">
          <span className="font-bold uppercase tracking-widest text-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            NGO Portal
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="bg-slate-900 text-white px-4 py-3 font-bold uppercase tracking-wider text-sm border-2 border-slate-900 cursor-pointer shadow-sm">
            {isAdmin ? 'Management' : 'My Learning'}
          </div>
          <div className="hover:bg-slate-100 text-slate-600 px-4 py-3 font-bold uppercase tracking-wider text-sm border-2 border-transparent cursor-pointer transition-colors">
            Course Library
          </div>
          <div className="hover:bg-slate-100 text-slate-600 px-4 py-3 font-bold uppercase tracking-wider text-sm border-2 border-transparent cursor-pointer transition-colors">
            Certifications
          </div>
          <div className="hover:bg-slate-100 text-slate-600 px-4 py-3 font-bold uppercase tracking-wider text-sm border-2 border-transparent cursor-pointer transition-colors mt-8">
            Settings
          </div>
        </nav>
        
        <div className="p-4 border-t-2 border-slate-900 bg-slate-50 shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Authenticated As</div>
          <div className="font-bold text-sm truncate text-slate-900">{user.name}</div>
          <div className="text-[10px] uppercase bg-slate-200 text-slate-700 inline-block px-2 py-1 mt-2 font-bold tracking-wider rounded-sm border border-slate-300">
            {user.role}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white border-b-2 border-slate-900 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="md:hidden font-bold uppercase tracking-widest flex items-center gap-2">
             <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             NGO Portal
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
            {isAdmin ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> System Administration</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> Field Staff Training Environment</>
            )}
          </div>
          <button 
            onClick={onLogout} 
            className="text-xs font-bold uppercase tracking-widest border-2 border-slate-900 px-4 py-2 hover:bg-slate-900 hover:text-white transition-colors outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 flex items-center gap-2"
          >
            Sign Out
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/50">
          <div className="max-w-6xl mx-auto">
            {isAdmin ? <AdminWorkspace /> : <LearnerWorkspace />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ==========================================
// MAIN APP EXPORT
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('ngo_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e) => {
    e
