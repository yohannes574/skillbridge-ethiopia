import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { apiGetCourses, apiGetMentors, apiRequestEnrollment, apiGetEnrollmentRequests } from '../../api';
import toast from 'react-hot-toast';
import { BookOpen, Search, Users, Clock, Star, Filter, ChevronRight, Layers, Award, X, Send, GraduationCap, Code2, Cpu, Database, Palette, Briefcase, Sparkles } from 'lucide-react';

const levelColor = { Beginner: '#10b981', Intermediate: '#f59e0b', Advanced: '#ef4444' };
const levelBg = { Beginner: '#ecfdf5', Intermediate: '#fffbeb', Advanced: '#fef2f2' };

const StarRating = ({ rating, size = 14 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={size} fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} color={i <= Math.round(rating) ? '#f59e0b' : '#d1d5db'} />
    ))}
  </div>
);

const skillThemes = [
  { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', iconBg: '#dbeafe', icon: Code2 },
  { bg: '#ecfdf5', border: '#a7f3d0', color: '#047857', iconBg: '#d1fae5', icon: Cpu },
  { bg: '#fef3c7', border: '#fde68a', color: '#b45309', iconBg: '#fef9c3', icon: Database },
  { bg: '#f5f3ff', border: '#ddd6fe', color: '#6d28d9', iconBg: '#ede9fe', icon: Palette },
  { bg: '#fff1f2', border: '#fecdd3', color: '#be123c', iconBg: '#ffe4e6', icon: Briefcase },
];

const getSkillTheme = (skill, isMatch) => {
  if (isMatch) {
    return { bg: 'linear-gradient(90deg,#ecfdf5,#d1fae5)', border: '#6ee7b7', color: '#065f46', iconBg: '#a7f3d0', icon: Sparkles };
  }
  const idx = skill.length % skillThemes.length;
  return skillThemes[idx];
};

const BrowseCourses = () => {
  const [courses, setCourses] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Course detail view
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Mentor selection flow
  const [showMentorSelect, setShowMentorSelect] = useState(false);
  const [mentorSearch, setMentorSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [reviewModalMentor, setReviewModalMentor] = useState(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [cRes, mRes, rRes] = await Promise.all([
          apiGetCourses(),
          apiGetMentors(),
          apiGetEnrollmentRequests(),
        ]);
        setCourses(cRes.data.data || []);
        setMentors(mRes.data.data || []);
        setRequests(rRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const getRequestStatus = (courseId) => requests.find((r) => r.courseId?._id === courseId);

  const handleSendRequest = async () => {
    if (!selectedMentor) return toast.error('Please select a mentor');
    setSubmitting(true);
    try {
      await apiRequestEnrollment({
        courseId: selectedCourse._id,
        mentorId: selectedMentor._id,
        message: requestMsg,
      });
      toast.success('Enrollment request sent! Waiting for mentor approval.');
      const rRes = await apiGetEnrollmentRequests();
      setRequests(rRes.data.data || []);
      setShowMentorSelect(false);
      setSelectedMentor(null);
      setRequestMsg('');
      setSelectedCourse(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Get unique categories
  const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];
  const allSkills = [...new Set(mentors.flatMap(m => m.skills || []))];

  const filtered = courses.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (levelFilter && c.level !== levelFilter) return false;
    if (categoryFilter && c.category !== categoryFilter) return false;
    return true;
  });

  const filteredMentors = mentors.filter(m => {
    if (mentorSearch && !m.name.toLowerCase().includes(mentorSearch.toLowerCase())) return false;
    if (skillFilter && !(m.skills || []).some(s => s.toLowerCase().includes(skillFilter.toLowerCase()))) return false;
    return true;
  });

  if (loading) return <DashboardLayout><div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><div className="spinner" /></div></DashboardLayout>;

  // ── Smart recommendation: compute relevance of a mentor to selected course
  const getMentorRelevance = (mentor) => {
    if (!selectedCourse) return 0;
    const courseKeywords = selectedCourse.title.toLowerCase().split(/\s+/).concat(
      (selectedCourse.category || '').toLowerCase().split(/\s+/)
    );
    const mentorKeywords = [
      ...(mentor.skills || []).map(s => s.toLowerCase()),
      (mentor.currentRole || '').toLowerCase(),
      (mentor.bio || '').toLowerCase(),
    ].join(' ');
    return courseKeywords.reduce((score, kw) => score + (mentorKeywords.includes(kw) ? 1 : 0), 0);
  };

  if (showMentorSelect && selectedCourse) {
    const sortedMentors = [...filteredMentors].sort((a, b) => getMentorRelevance(b) - getMentorRelevance(a));

    return (
      <DashboardLayout>
        <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 120 }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 32 }}>
            <button onClick={() => { setShowMentorSelect(false); setSelectedMentor(null); }}
              style={{ width: 42, height: 42, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 4 }}>
              <X size={18} color="#6b7280" />
            </button>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a2e24', margin: '0 0 6px' }}>Choose Your Mentor</h1>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                To enroll in <strong style={{ color: '#2d6a4f' }}>"{selectedCourse.title}"</strong>, select a mentor to guide you through the journey.
                Mentors marked <span style={{ background: 'linear-gradient(90deg,#ecfdf5,#d1fae5)', color: '#059669', fontWeight: 700, fontSize: 12, padding: '2px 8px', borderRadius: 8, border: '1px solid #6ee7b7' }}>✨ Recommended</span> have skills matching this course.
              </p>
            </div>
          </div>

          {/* ── Filters ── */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '10px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <Search size={16} color="#9ca3af" />
              <input placeholder="Search mentors by name..." value={mentorSearch} onChange={e => setMentorSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 14, color: '#374151', width: '100%', background: 'none', fontFamily: "'Inter',sans-serif" }} />
            </div>
            <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: 14, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 14, color: '#374151', cursor: 'pointer', fontFamily: "'Inter',sans-serif", boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <option value="">All Skills</option>
              {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* ── Mentor Grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
            {sortedMentors.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 64, color: '#9ca3af' }}>
                <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontSize: 16, fontWeight: 600 }}>No mentors found</p>
                <p style={{ fontSize: 13 }}>Try adjusting your search</p>
              </div>
            ) : sortedMentors.map(mentor => {
              const isSelected = selectedMentor?._id === mentor._id;
              const relevance = getMentorRelevance(mentor);
              const isRecommended = relevance > 0;
              const hasReviews = (mentor.recentReviews || []).length > 0;

              return (
                <div key={mentor._id}
                  onClick={() => setSelectedMentor(isSelected ? null : mentor)}
                  style={{
                    background: isSelected ? 'linear-gradient(135deg,#ecfdf5,#d1fae5)' : '#fff',
                    border: isSelected ? '2px solid #2d6a4f' : '2px solid #f3f4f6',
                    borderRadius: 22, padding: 24, cursor: 'pointer', position: 'relative',
                    transition: 'all 0.2s', overflow: 'hidden',
                    boxShadow: isSelected ? '0 12px 40px rgba(45,106,79,0.18)' : '0 2px 12px rgba(0,0,0,0.05)',
                    transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#d1d5db'; }}}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#f3f4f6'; }}}
                >
                  {/* Recommended badge */}
                  {isRecommended && (
                    <div style={{
                      position: 'absolute', top: 14, right: 14,
                      background: 'linear-gradient(90deg,#059669,#0d9488)', color: '#fff',
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                      boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
                    }}>
                      ✨ Recommended
                    </div>
                  )}

                  {/* Selected check */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 14, right: 14, width: 28, height: 28,
                      borderRadius: '50%', background: '#2d6a4f',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(45,106,79,0.4)',
                    }}>
                      <span style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>✓</span>
                    </div>
                  )}

                  {/* Avatar + Name + Role */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 60, height: 60, borderRadius: 18, flexShrink: 0,
                      background: mentor.avatar ? `url(${mentor.avatar}) center/cover` : 'linear-gradient(135deg,#2d6a4f,#40916c)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 24, color: '#fff',
                      boxShadow: '0 4px 12px rgba(45,106,79,0.25)',
                    }}>
                      {!mentor.avatar && mentor.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a2e24', margin: 0, truncate: true }}>{mentor.name}</h3>
                        {/* Verified badge */}
                        <span title="Verified Mentor" style={{ width: 18, height: 18, borderRadius: '50%', background: '#2d6a4f', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>
                        </span>
                      </div>
                      {mentor.currentRole && (
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0', fontWeight: 500 }}>{mentor.currentRole}</p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <StarRating rating={mentor.rating || 0} size={12} />
                        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                          {(mentor.rating || 0).toFixed(1)} ({mentor.reviewCount || 0} {mentor.reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stat pills */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: '5px 10px' }}>
                      <Award size={13} color="#2d6a4f" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{mentor.yearsOfExperience || 0}+ yrs</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10, padding: '5px 10px' }}>
                      <GraduationCap size={13} color="#7c3aed" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Mentor</span>
                    </div>
                    {mentor.reviewCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '5px 10px' }}>
                        <Star size={13} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>{(mentor.rating || 0).toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {mentor.bio && (
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {mentor.bio}
                    </p>
                  )}

                  {/* Divider */}
                  <div style={{ height: 1, background: '#f3f4f6', marginBottom: 12 }} />

                  {/* Skills */}
                  {(mentor.skills || []).length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {mentor.skills.slice(0, 6).map((skill, i) => {
                        const courseWords = selectedCourse.title.toLowerCase().split(/\s+/);
                        const isMatch = courseWords.some(kw => skill.toLowerCase().includes(kw));
                        const theme = getSkillTheme(skill, isMatch);
                        const SkillIcon = theme.icon;
                        return (
                          <span key={i} style={{
                            padding: '4px 10px 4px 6px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                            background: theme.bg,
                            color: theme.color,
                            border: `1px solid ${theme.border}`,
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                          }}>
                            <span style={{
                              width: 16, height: 16, borderRadius: '50%', background: theme.iconBg,
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <SkillIcon size={10} color={theme.color} />
                            </span>
                            <span>{skill}</span>
                          </span>
                        );
                      })}
                      {mentor.skills.length > 6 && (
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#f3f4f6', color: '#6b7280' }}>
                          +{mentor.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>No skills listed</p>
                  )}

                  {/* Recent Reviews */}
                  {hasReviews && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ height: 1, background: '#f3f4f6', marginBottom: 10 }} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviewModalMentor(mentor);
                        }}
                        style={{
                          width: '100%',
                          border: '1px solid #e5e7eb',
                          background: '#fff',
                          color: '#374151',
                          borderRadius: 10,
                          padding: '8px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>See Student Reviews</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{mentor.reviewCount || mentor.recentReviews.length} total</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {reviewModalMentor && (
            <div
              onClick={() => setReviewModalMentor(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15,23,42,0.45)',
                backdropFilter: 'blur(4px)',
                zIndex: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: 620,
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 24px 56px rgba(0,0,0,0.22)',
                  padding: 22,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a2e24' }}>
                      Student Reviews
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
                      {reviewModalMentor.name} · {reviewModalMentor.reviewCount || reviewModalMentor.recentReviews?.length || 0} total
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewModalMentor(null)}
                    style={{ border: 'none', background: '#f3f4f6', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', color: '#6b7280' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(reviewModalMentor.recentReviews || []).map((rev, i) => (
                    <div key={i} style={{ background: '#f9fafb', borderRadius: 12, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#2d6a4f,#40916c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {rev.studentName?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1f2937' }}>{rev.studentName}</span>
                        <div style={{ display: 'flex', gap: 1, marginLeft: 'auto' }}>
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={11} fill={s <= rev.rating ? '#f59e0b' : 'none'} color={s <= rev.rating ? '#f59e0b' : '#d1d5db'} />
                          ))}
                        </div>
                      </div>
                      {rev.comment ? (
                        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55, margin: 0 }}>
                          "{rev.comment}"
                        </p>
                      ) : (
                        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, fontStyle: 'italic' }}>
                          No comment provided.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Sticky Bottom Action Bar ── */}
          {selectedMentor && (
            <div style={{
              position: 'fixed', bottom: 0, left: 240, right: 0, zIndex: 50,
              background: '#fff', borderTop: '2px solid #e5e7eb',
              padding: '14px 32px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
            }}>
              <div style={{
                maxWidth: 960, margin: '0 auto',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                {/* Mentor mini-card */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
                  background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                  borderRadius: 14, padding: '8px 14px',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: selectedMentor.avatar
                      ? `url(${selectedMentor.avatar}) center/cover`
                      : 'linear-gradient(135deg,#2d6a4f,#40916c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 16, color: '#fff',
                  }}>
                    {!selectedMentor.avatar && selectedMentor.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#1a4731', margin: 0, lineHeight: 1.2 }}>
                      {selectedMentor.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#059669', margin: 0, fontWeight: 600 }}>
                      ⭐ {(selectedMentor.rating || 0).toFixed(1)} · {selectedMentor.yearsOfExperience || 0}+ yrs
                    </p>
                  </div>
                </div>

                {/* Message input */}
                <div style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 14,
                  padding: '8px 14px',
                }}>
                  <textarea
                    value={requestMsg}
                    onChange={e => setRequestMsg(e.target.value)}
                    placeholder="Add an optional message to your mentor..."
                    rows={1}
                    style={{
                      flex: 1, border: 'none', outline: 'none', background: 'transparent',
                      fontSize: 13, resize: 'none', fontFamily: "'Inter',sans-serif",
                      color: '#374151', lineHeight: 1.5, maxHeight: 80,
                    }}
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                    }}
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={handleSendRequest}
                  disabled={submitting}
                  style={{
                    padding: '12px 28px', borderRadius: 14, flexShrink: 0,
                    background: submitting ? '#9ca3af' : 'linear-gradient(135deg,#2d6a4f,#1a4731)',
                    color: '#fff', fontWeight: 800, fontSize: 14, border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: submitting ? 'none' : '0 4px 14px rgba(45,106,79,0.3)',
                    transition: 'all 0.2s', whiteSpace: 'nowrap',
                  }}
                >
                  <Send size={16} /> {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }


  // ─── COURSE DETAIL VIEW ────────────────────────────────
  if (selectedCourse) {
    const req = getRequestStatus(selectedCourse._id);
    const moduleCount = selectedCourse.modules?.length || 0;
    return (
      <DashboardLayout>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Back */}
          <button onClick={() => setSelectedCourse(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 24, padding: 0 }}>
            ← Back to courses
          </button>

          {/* Hero Card */}
          <div style={{
            borderRadius: 24, overflow: 'hidden', background: '#fff',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6',
          }}>
            {/* Thumbnail */}
            <div style={{
              height: 220, background: selectedCourse.thumbnail
                ? `url(${selectedCourse.thumbnail}) center/cover`
                : 'linear-gradient(135deg, #1a4731 0%, #2d6a4f 50%, #40916c 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            }}>
              {!selectedCourse.thumbnail && <BookOpen size={64} color="rgba(255,255,255,0.15)" />}
              <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 8 }}>
                <span style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: levelBg[selectedCourse.level] || '#f3f4f6',
                  color: levelColor[selectedCourse.level] || '#374151',
                }}>
                  {selectedCourse.level}
                </span>
                <span style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: 'rgba(255,255,255,0.9)', color: '#374151',
                }}>
                  {selectedCourse.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a2e24', margin: '0 0 12px 0', lineHeight: 1.2 }}>
                {selectedCourse.title}
              </h1>
              <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, margin: '0 0 24px 0' }}>
                {selectedCourse.description}
              </p>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                <div style={{ background: '#f8faf9', borderRadius: 16, padding: '16px 20px', textAlign: 'center' }}>
                  <Layers size={22} color="#2d6a4f" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#1a2e24', margin: 0 }}>{moduleCount}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Modules</p>
                </div>
                <div style={{ background: '#f8faf9', borderRadius: 16, padding: '16px 20px', textAlign: 'center' }}>
                  <Clock size={22} color="#2d6a4f" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#1a2e24', margin: 0 }}>{selectedCourse.durationWeeks || 4}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Weeks</p>
                </div>
                <div style={{ background: '#f8faf9', borderRadius: 16, padding: '16px 20px', textAlign: 'center' }}>
                  <GraduationCap size={22} color="#2d6a4f" style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#1a2e24', margin: 0 }}>{selectedCourse.level?.[0]}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{selectedCourse.level}</p>
                </div>
              </div>

              {/* Mentor info */}
              {selectedCourse.mentorId && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                  background: '#f0fdf4', borderRadius: 16, marginBottom: 28, border: '1px solid #bbf7d0',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 18, color: '#fff', flexShrink: 0,
                  }}>
                    {selectedCourse.mentorId.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1a2e24', margin: 0 }}>Created by {selectedCourse.mentorId.name}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{selectedCourse.mentorId.email}</p>
                  </div>
                </div>
              )}

              {/* Action */}
              {req ? (
                <div style={{
                  padding: '16px 24px', borderRadius: 16, textAlign: 'center',
                  background: req.status === 'pending' ? '#fffbeb' : req.status === 'accepted' ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${req.status === 'pending' ? '#fde68a' : req.status === 'accepted' ? '#86efac' : '#fecaca'}`,
                }}>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: req.status === 'pending' ? '#92400e' : req.status === 'accepted' ? '#15803d' : '#dc2626' }}>
                    {req.status === 'pending' ? '⏳ Request Pending — Waiting for mentor approval' :
                     req.status === 'accepted' ? '✅ Enrolled — You have full access!' :
                     '❌ Request Declined — Try a different mentor'}
                  </p>
                  {req.status === 'rejected' && req.rejectionReason && (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: '#fff', borderRadius: 12, border: '1px solid #fecaca', textAlign: 'left' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Mentor's Reason</p>
                      <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>"{req.rejectionReason}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowMentorSelect(true)}
                  style={{
                    width: '100%', padding: '16px 24px', borderRadius: 16,
                    background: 'linear-gradient(135deg, #2d6a4f, #1a4731)',
                    color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 6px 24px rgba(45,106,79,0.3)', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Users size={20} /> Enroll — Choose Your Mentor
                </button>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── MAIN COURSE GRID ──────────────────────────────────
  return (
    <DashboardLayout>
      <PageHeader title="Browse Courses" subtitle="Find courses and request a mentor to begin your learning journey" />

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{
          flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '10px 16px',
        }}>
          <Search size={16} color="#9ca3af" />
          <input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 14, color: '#374151', width: '100%', background: 'none', fontFamily: "'Inter', sans-serif" }} />
        </div>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 14, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          <option value="">All Levels</option>
          <option value="Beginner">🟢 Beginner</option>
          <option value="Intermediate">🟡 Intermediate</option>
          <option value="Advanced">🔴 Advanced</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 14, border: '1px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses found" description="No approved courses available yet. Check back later." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {filtered.map((course) => {
            const req = getRequestStatus(course._id);
            return (
              <div key={course._id}
                onClick={() => setSelectedCourse(course)}
                style={{
                  background: '#fff', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                  border: '1px solid #f3f4f6', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#2d6a4f';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  e.currentTarget.style.borderColor = '#f3f4f6';
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: 160, position: 'relative',
                  background: course.thumbnail
                    ? `url(${course.thumbnail}) center/cover`
                    : 'linear-gradient(135deg, #1a4731 0%, #2d6a4f 40%, #52b788 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!course.thumbnail && <BookOpen size={40} color="rgba(255,255,255,0.12)" />}

                  {/* Level badge */}
                  <div style={{ position: 'absolute', top: 14, right: 14 }}>
                    <span style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: levelBg[course.level] || '#f3f4f6',
                      color: levelColor[course.level] || '#374151',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}>
                      {course.level}
                    </span>
                  </div>

                  {/* Status overlay */}
                  {req && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 16px',
                      background: req.status === 'pending' ? 'rgba(245,158,11,0.9)' : req.status === 'accepted' ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)',
                      color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center',
                    }}>
                      {req.status === 'pending' ? '⏳ Pending Approval' : req.status === 'accepted' ? '✅ Enrolled' : '❌ Rejected'}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '20px 22px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 6px 0' }}>
                    {course.category}
                  </p>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a2e24', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                    {course.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.description}
                  </p>

                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {course.mentorId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 12, color: '#fff',
                        }}>
                          {course.mentorId.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{course.mentorId.name}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Layers size={13} color="#9ca3af" />
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{course.modules?.length || 0} modules</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default BrowseCourses;
