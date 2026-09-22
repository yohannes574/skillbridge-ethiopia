import { useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { apiGetMyBadges, apiGetMyCertificates, apiGetEnrolledCourses, apiUpdateProfile } from '../api';
import { User, Mail, Award, BookOpen, Star, Loader2, Link as LinkIcon, CheckCircle, Code, Globe, Activity, ArrowRight, Edit3, ShieldCheck, Briefcase, X, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const toSafeArray = (value) => (Array.isArray(value) ? value : []);

const normalizeSkills = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((skill) => (typeof skill === 'string' ? skill.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

const inferExperienceLevel = (profile) => {
  if (profile?.experienceLevel) return profile.experienceLevel;
  const years = Number(profile?.yearsOfExperience || 0);
  if (years >= 4) return 'Advanced';
  if (years >= 2) return 'Intermediate';
  return 'Beginner';
};

const formatReadableDate = (value, fallback = 'Date not available') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const normalizeEnrolledCourses = (items) => {
  return toSafeArray(items)
    .map((item) => {
      if (!item) return null;
      if (item.courseId && typeof item.courseId === 'object') {
        return {
          _id: item._id,
          createdAt: item.createdAt,
          courseId: item.courseId,
        };
      }

      // Backward compatibility if API returns raw course documents
      if (item._id) {
        return {
          _id: item._id,
          createdAt: item.createdAt,
          courseId: item,
        };
      }

      return null;
    })
    .filter(Boolean);
};

const buildCompletion = (profile) => {
  const normalized = {
    ...profile,
    skills: normalizeSkills(profile?.skills),
    experienceLevel: inferExperienceLevel(profile),
  };

  let score = 20; // base account setup
  const missingItems = [];

  if (normalized.bio) {
    score += 20;
  } else {
    missingItems.push({ key: 'bio', label: 'Add bio', hint: 'Write a short professional summary.' });
  }

  if (normalized.skills.length > 0) {
    score += 20;
  } else {
    missingItems.push({ key: 'skills', label: 'Add skills', hint: 'List your technical stack.' });
  }

  if (normalized.portfolioUrl || normalized.githubUrl) {
    score += 20;
  } else {
    missingItems.push({ key: 'portfolioUrl', label: 'Upload portfolio', hint: 'Add GitHub or portfolio links.' });
  }

  if (normalized.experienceLevel) {
    score += 20;
  } else {
    missingItems.push({ key: 'experienceLevel', label: 'Set experience level', hint: 'Beginner, Intermediate, or Advanced.' });
  }

  return { score: Math.min(score, 100), missingItems };
};

const pageShellClass = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-10';
const cardBaseClass = 'bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 transition-all duration-200 hover:shadow-md';
const sectionTitleClass = 'text-lg font-extrabold text-slate-800 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [badges, setBadges] = useState([]);
  const [certs, setCerts] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [focusField, setFocusField] = useState('');
  const [form, setForm] = useState({
    name: '',
    bio: '',
    skillsInput: '',
    experienceLevel: 'Beginner',
    yearsOfExperience: 0,
    githubUrl: '',
    portfolioUrl: '',
  });

  const nameInputRef = useRef(null);
  const bioInputRef = useRef(null);
  const skillsInputRef = useRef(null);
  const experienceInputRef = useRef(null);
  const githubInputRef = useRef(null);
  const portfolioInputRef = useRef(null);

  const syncFormFromUser = (data) => {
    const normalizedSkills = normalizeSkills(data?.skills);
    setForm({
      name: data?.name || '',
      bio: data?.bio || '',
      skillsInput: normalizedSkills.join(', '),
      experienceLevel: inferExperienceLevel(data),
      yearsOfExperience: Number(data?.yearsOfExperience || 0),
      githubUrl: data?.githubUrl || '',
      portfolioUrl: data?.portfolioUrl || '',
    });
  };

  useEffect(() => {
    syncFormFromUser(user);
  }, [user]);

  const profilePreview = useMemo(() => {
    if (!user) return null;
    if (!editingProfile) {
      return {
        ...user,
        skills: normalizeSkills(user.skills),
        experienceLevel: inferExperienceLevel(user),
      };
    }

    return {
      ...user,
      ...form,
      skills: normalizeSkills(form.skillsInput),
      yearsOfExperience: Number(form.yearsOfExperience || 0),
    };
  }, [user, editingProfile, form]);

  const { score: completionScore, missingItems } = useMemo(
    () => buildCompletion(profilePreview || user || {}),
    [profilePreview, user]
  );

  useEffect(() => {
    if (user?.role === 'student') {
      Promise.allSettled([
        apiGetMyBadges(),
        apiGetMyCertificates(),
        apiGetEnrolledCourses(),
      ])
        .then(([badgesResult, certsResult, enrollmentsResult]) => {
          const badgesData = badgesResult.status === 'fulfilled' ? badgesResult.value?.data?.data : [];
          const certsData = certsResult.status === 'fulfilled' ? certsResult.value?.data?.data : [];
          const enrolledData = enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value?.data?.data : [];

          setBadges(toSafeArray(badgesData));
          setCerts(toSafeArray(certsData));
          setEnrolledCourses(normalizeEnrolledCourses(enrolledData));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setTimeout(() => setLoading(false), 0);
    }
  }, [user]);

  useEffect(() => {
    if (!editingProfile || !focusField) return;

    const refs = {
      name: nameInputRef,
      bio: bioInputRef,
      skills: skillsInputRef,
      experienceLevel: experienceInputRef,
      githubUrl: githubInputRef,
      portfolioUrl: portfolioInputRef,
    };

    const targetRef = refs[focusField];
    if (targetRef?.current) {
      targetRef.current.focus();
    }
  }, [editingProfile, focusField]);

  const openEditor = (field = '') => {
    setSaveError('');
    setSaveSuccess('');
    setFocusField(field);
    setEditingProfile(true);
  };

  const closeEditor = () => {
    setEditingProfile(false);
    setFocusField('');
    setSaveError('');
    syncFormFromUser(user);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    setSavingProfile(true);

    try {
      const payload = {
        name: form.name.trim(),
        bio: form.bio.trim(),
        skills: normalizeSkills(form.skillsInput),
        experienceLevel: form.experienceLevel,
        yearsOfExperience: Math.max(0, Number(form.yearsOfExperience || 0)),
        githubUrl: form.githubUrl.trim(),
        portfolioUrl: form.portfolioUrl.trim(),
      };

      const response = await apiUpdateProfile(payload);
      const updatedProfile = response?.data?.data;
      if (updatedProfile) {
        updateUser(updatedProfile);
      }
      setSaveSuccess('Profile updated successfully.');
      setEditingProfile(false);
    } catch (error) {
      setSaveError(error?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className={`${pageShellClass} mb-8`}>
        <PageHeader title="My Profile" subtitle="Manage your account details and view achievements" />
      </div>

      <div className={`${pageShellClass} grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 lg:gap-8 items-start`}>
        
        {/* ======================= LEFT COLUMN ======================= */}
        <div className="space-y-6 xl:sticky xl:top-24 self-start">
          
          {/* Identity Card */}
          <div className={`${cardBaseClass} flex flex-col items-center text-center relative overflow-hidden`}>
            <button
              type="button"
              onClick={() => openEditor('name')}
              className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              <Edit3 size={12} /> Edit
            </button>
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 -z-10" />
            
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-emerald-900/20 mb-6 border-4 border-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-1.5 justify-center leading-tight">
              {user?.name}
              {user?.role === 'student' && <ShieldCheck size={18} className="text-blue-500" />}
            </h2>
            <p className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">{user?.role}</p>
            <p className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {inferExperienceLevel(profilePreview)}
            </p>

            <div className="w-full h-px bg-slate-100 my-6" />

            <div className="w-full space-y-3 text-left">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium truncate">Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : 'Recently'}</p>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={16} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium truncate">{Number(profilePreview?.yearsOfExperience || 0)} years experience</p>
              </div>
            </div>
          </div>

          {/* Completion Indicator */}
          {completionScore < 100 && (
            <div className={cardBaseClass}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-800 text-base">Profile Completion</h3>
                <span className="font-black text-emerald-600 text-base">{completionScore}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full mb-5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                  style={{ width: `${completionScore}%` }}
                />
              </div>
              
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2">Boost your visibility</p>
                <div className="space-y-3">
                  {missingItems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3 bg-white/80 border border-amber-100 rounded-lg px-3 py-2.5">
                      <div className="pr-2">
                        <p className="text-xs font-bold text-amber-700">{item.label}</p>
                        <p className="text-[11px] text-amber-700/80">{item.hint}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditor(item.key)}
                        className="shrink-0 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                      >
                        Action
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {completionScore >= 100 && (
            <div className={`${cardBaseClass} bg-emerald-50 border-emerald-200`}>
              <p className="text-sm font-bold text-emerald-700">Profile is 100% complete. Great work.</p>
            </div>
          )}

          {/* About Me */}
          <div className={cardBaseClass}>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Edit3 size={14} /> Professional Bio
            </h3>
            {user?.bio ? (
              <p className="text-sm text-slate-600 leading-relaxed font-medium pb-2">{profilePreview?.bio}</p>
            ) : (
              <p className="text-sm text-slate-400 italic pb-2">No bio added yet.</p>
            )}
          </div>

          {/* Skills */}
          <div className={cardBaseClass}>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity size={14} /> Technical Skills
            </h3>
            {toSafeArray(profilePreview?.skills).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {toSafeArray(profilePreview?.skills).map((skill, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 border border-slate-200 py-1.5 px-3 rounded-xl text-xs font-bold">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No skills listed.</p>
            )}
          </div>

          {/* Links */}
          <div className={cardBaseClass}>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe size={14} /> Connect
            </h3>
            <div className="space-y-3">
              {profilePreview?.githubUrl ? (
                <a href={profilePreview.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 text-slate-700 font-medium text-sm">
                  <Code size={18} className="text-slate-900" /> GitHub Profile
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 font-medium text-sm opacity-50">
                  <Code size={18} /> GitHub not linked
                </div>
              )}

              {profilePreview?.portfolioUrl ? (
                <a href={profilePreview.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 text-slate-700 font-medium text-sm">
                  <LinkIcon size={18} className="text-slate-900" /> Portfolio Website
                </a>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 font-medium text-sm opacity-50">
                  <LinkIcon size={18} /> Portfolio not linked
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ======================= RIGHT COLUMN ======================= */}
        <div className="space-y-6 min-w-0">
          
          {user?.role === 'student' ? (
            <>
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`${cardBaseClass} p-5 flex flex-col items-center justify-center text-center hover:-translate-y-0.5`}>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                    <BookOpen size={20} className="text-emerald-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-800">{enrolledCourses.length}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Courses</p>
                </div>
                <div className={`${cardBaseClass} p-5 flex flex-col items-center justify-center text-center hover:-translate-y-0.5`}>
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                    <Star size={20} className="text-amber-500" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-800">{badges.length}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Badges</p>
                </div>
                <div className={`${cardBaseClass} p-5 flex flex-col items-center justify-center text-center hover:-translate-y-0.5`}>
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                    <Award size={20} className="text-blue-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-800">{certs.length}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Certs</p>
                </div>
              </div>

              {/* Badges Box */}
              <div className={cardBaseClass}>
                <h3 className={sectionTitleClass}>
                  <Star className="text-amber-500" /> Earned Badges
                </h3>
                {badges.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl">
                    <Star size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-sm">No badges earned yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {badges.map((b, i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 text-center shadow-sm relative overflow-hidden group hover:border-amber-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${b.badgeId?.level === 'gold' ? 'from-amber-400 to-amber-500' : b.badgeId?.level === 'silver' ? 'from-slate-300 to-slate-400' : 'from-orange-400 to-orange-500'}`} />
                        <div className="text-4xl mb-3 flex justify-center">{b.badgeId?.icon}</div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1 leading-tight">{b.badgeId?.title || b.badgeId?.name || 'Badge'}</h4>
                        <p className="text-[11px] font-medium text-slate-400 mb-2">{formatReadableDate(b.earnedAt || b.awardedAt)}</p>
                        <p className="text-xs text-slate-500 line-clamp-2">{b.badgeId?.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Certificates Box */}
              <div className={cardBaseClass}>
                <h3 className={sectionTitleClass}>
                  <Award className="text-blue-500" /> Platform Certificates
                </h3>
                {certs.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl">
                    <Award size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-sm">Keep learning to earn your first certificate.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {certs.map((cert) => (
                      <div key={cert._id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm group hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <CheckCircle size={20} className="text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 leading-tight">{cert.courseId?.title}</h4>
                            <p className="text-xs font-semibold text-emerald-600 mt-0.5">SkillBridge Certified</p>
                          </div>
                        </div>
                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{formatReadableDate(cert.issuedAt)}</span>
                          <a href={`${API_BASE_URL}/certificates/${cert._id}/view`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-700">
                            Verify <LinkIcon size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enrolled Courses / Activity */}
              <div className={cardBaseClass}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <Activity className="text-emerald-500" /> Active Learning Path
                  </h3>
                  <Link to="/student/courses" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    View All <ArrowRight size={12} />
                  </Link>
                </div>
                
                {enrolledCourses.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl">
                    <BookOpen size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-sm">You have not enrolled in any courses yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrolledCourses.slice(0, 3).map((enrollment, i) => (
                      <Link key={i} to={enrollment.courseId?._id ? `/student/course/${enrollment.courseId._id}` : '/student/courses'} className="block bg-white border border-slate-100 rounded-xl p-4 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-slate-800">{enrollment.courseId?.title || 'Course not found'}</h4>
                            <p className="text-xs text-slate-500 font-medium mt-1">Started: {formatReadableDate(enrollment.createdAt)}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                            <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-500" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`${cardBaseClass} p-12 text-center flex flex-col items-center justify-center`}>
              <ShieldCheck size={48} className="text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">Staff Portal Configuration</h3>
              <p className="text-slate-500 max-w-sm mx-auto">This account oversees administrative operations. Achievements and Badges are configured natively for Student profiles.</p>
            </div>
          )}

        </div>
      </div>

      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" onClick={closeEditor} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-auto">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-6 md:px-8 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">Edit Profile</h3>
              <button type="button" onClick={closeEditor} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitProfile} className="p-6 md:p-8 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Basic Info</h4>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Full Name</label>
                  <input
                    ref={nameInputRef}
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Professional Bio</label>
                  <textarea
                    ref={bioInputRef}
                    value={form.bio}
                    onChange={(e) => handleFormChange('bio', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm min-h-28 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                    placeholder="Tell mentors and employers about your goals and strengths"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Skills</h4>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Technical Skills</label>
                  <input
                    ref={skillsInputRef}
                    value={form.skillsInput}
                    onChange={(e) => handleFormChange('skillsInput', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                    placeholder="React, Node.js, MongoDB"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">Use commas to separate skills.</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Experience</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Experience Level</label>
                    <select
                      ref={experienceInputRef}
                      value={form.experienceLevel}
                      onChange={(e) => handleFormChange('experienceLevel', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Years Of Experience</label>
                    <input
                      type="number"
                      min="0"
                      value={form.yearsOfExperience}
                      onChange={(e) => handleFormChange('yearsOfExperience', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Links</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">GitHub URL</label>
                    <input
                      ref={githubInputRef}
                      value={form.githubUrl}
                      onChange={(e) => handleFormChange('githubUrl', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                      placeholder="https://github.com/username"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Portfolio URL</label>
                    <input
                      ref={portfolioInputRef}
                      value={form.portfolioUrl}
                      onChange={(e) => handleFormChange('portfolioUrl', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                      placeholder="https://your-portfolio.com"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-2">
                  <span>Completion Preview</span>
                  <span>{buildCompletion({ ...user, ...form, skills: normalizeSkills(form.skillsInput) }).score}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${buildCompletion({ ...user, ...form, skills: normalizeSkills(form.skillsInput) }).score}%` }}
                  />
                </div>
              </div>

              {saveError && <p className="text-sm font-semibold text-red-600">{saveError}</p>}
              {saveSuccess && <p className="text-sm font-semibold text-emerald-600">{saveSuccess}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-70"
                >
                  {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;
