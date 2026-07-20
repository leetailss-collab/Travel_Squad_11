import React, { useState, useEffect } from 'react';

// Fallback Mock Data
const DEFAULT_MOCK_PLANS = [
  {
    id: 1,
    title: "여름 가족 제주도 여행",
    startDate: "2026-08-15",
    endDate: "2026-08-18",
    members: ["이현수", "양슬기", "이준성", "이은성", "이해성", "이정우", "홍영숙"],
    itinerary: [
      {
        day: 1,
        date: "2026-08-15",
        places: [
          { 
            id: 1001, 
            time: "10:00", 
            name: "제주공항 도착", 
            description: "렌터카 수령 및 출발", 
            comments: [
              { id: 1, author: "이현수", text: "도착해서 게이트 5번 앞으로 모여주세요!", time: "오전 10:05" }
            ] 
          },
          { id: 1002, time: "12:30", name: "자매국수", description: "점심 식사 (고기국수)", comments: [] },
          { 
            id: 1003, 
            time: "15:00", 
            name: "함덕해수욕장", 
            description: "바다 구경 및 카페 휴식", 
            comments: [
              { id: 2, author: "양슬기", text: "아이들 돗자리랑 여벌 옷 챙겨갈게요.", time: "오후 1:15" }
            ] 
          },
          { id: 1004, time: "18:00", name: "숙소 체크인", description: "서귀포 가족 펜션", comments: [] }
        ]
      }
    ],
    expenses: [
      { id: 101, title: "항공권 예약", amount: 450000, payer: "이현수", date: "2026-07-10" },
      { id: 102, title: "렌터카 4일", amount: 180000, payer: "양슬기", date: "2026-07-12" }
    ],
    checklists: [
      { id: 201, title: "신분증 및 등본 (아이들 동반 확인)", checked: true, assignee: "양슬기" },
      { id: 202, title: "비상약 (멀미약, 소화제, 밴드)", checked: false, assignee: "홍영숙" }
    ]
  }
];

function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // General App State
  const [view, setView] = useState('home'); // 'home' | 'detail'
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [plan, setPlan] = useState(null); // Detailed state of the active plan
  const [activeTab, setActiveTab] = useState('itinerary'); // 'itinerary' | 'checklist' | 'expense' | 'members'
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // Modal inside tabs (Add Itinerary / Expense / Checklist)
  const [showAddTripModal, setShowAddTripModal] = useState(false); // Modal for creating a new travel plan

  // Comment section toggle state map: { [placeId]: boolean }
  const [toggledComments, setToggledComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({}); // { [placeId]: string }

  // Form States for adding new trip
  const [newTrip, setNewTrip] = useState({ title: '', startDate: '', endDate: '', membersInput: '' });

  // Form States inside detail tabs
  const [newPlace, setNewPlace] = useState({ day: 1, time: '', name: '', description: '' });
  const [newCheck, setNewCheck] = useState({ title: '', assignee: '' });
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', payer: '', date: '' });

  // Load User and Plans on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('family_travel_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.warn("Using offline fallback for plan list:", err);
      const saved = localStorage.getItem('family_travel_plans');
      if (saved) {
        setPlans(JSON.parse(saved));
      } else {
        setPlans(DEFAULT_MOCK_PLANS);
        localStorage.setItem('family_travel_plans', JSON.stringify(DEFAULT_MOCK_PLANS));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSinglePlan = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/plans/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPlan(data);
        setSelectedPlanId(id);
        setView('detail');
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.warn("Offline single plan fetch fallback:", err);
      const currentPlan = plans.find(p => p.id === id);
      if (currentPlan) {
        setPlan(currentPlan);
        setSelectedPlanId(id);
        setView('detail');
      }
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        localStorage.setItem('family_travel_user', JSON.stringify(data.user));
      } else {
        const errData = await response.json();
        setLoginError(errData.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      console.warn("Offline authentication fallback:");
      // Simulating login offline using preset list
      const OFFLINE_USERS = [
        { name: "이정우", pin: "570413", role: "user" },
        { name: "홍영숙", pin: "630124", role: "user" },
        { name: "이진수", pin: "850119", role: "user" },
        { name: "이아름", pin: "880803", role: "user" },
        { name: "이현수", pin: "870707", role: "admin" },
        { name: "양슬기", pin: "871214", role: "user" },
        { name: "이준성", pin: "110324", role: "user" },
        { name: "이은성", pin: "140813", role: "user" },
        { name: "이해성", pin: "200220", role: "user" }
      ];
      const matched = OFFLINE_USERS.find(u => u.name === loginForm.username && u.pin === loginForm.password);
      if (matched) {
        const userObj = { name: matched.name, role: matched.role };
        setCurrentUser(userObj);
        localStorage.setItem('family_travel_user', JSON.stringify(userObj));
      } else {
        setLoginError("아이디 또는 비밀번호가 올바르지 않습니다. (오프라인 모드)");
      }
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('family_travel_user');
    setView('home');
  };

  const saveUpdatedPlan = (updatedPlan) => {
    setPlan(updatedPlan);
    
    // Update local plans array
    const updatedPlans = plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    setPlans(updatedPlans);
    localStorage.setItem('family_travel_plans', JSON.stringify(updatedPlans));
    
    // Sync with backend API
    fetch(`/api/plans/${updatedPlan.id}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPlan)
    }).catch(err => console.log('Offline: sync postponed...'));
  };

  // Add New Travel Plan (Trip) - Accessible to all members
  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!newTrip.title || !newTrip.startDate || !newTrip.endDate) return;

    const members = newTrip.membersInput
      ? newTrip.membersInput.split(',').map(m => m.trim()).filter(Boolean)
      : [currentUser.name];

    if (!members.includes(currentUser.name)) {
      members.unshift(currentUser.name);
    }

    const newPlanData = {
      title: newTrip.title,
      startDate: newTrip.startDate,
      endDate: newTrip.endDate,
      members,
      itinerary: [],
      expenses: [],
      checklists: []
    };

    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlanData)
      });
      if (response.ok) {
        const createdPlan = await response.json();
        setPlans([...plans, createdPlan]);
        localStorage.setItem('family_travel_plans', JSON.stringify([...plans, createdPlan]));
        
        // Navigate directly to the new plan
        setPlan(createdPlan);
        setSelectedPlanId(createdPlan.id);
        setView('detail');
      } else {
        throw new Error('Server failed to create plan');
      }
    } catch (err) {
      console.warn("Offline: creating plan locally:", err);
      const offlineCreatedPlan = {
        id: Date.now(),
        ...newPlanData
      };
      const updatedPlans = [...plans, offlineCreatedPlan];
      setPlans(updatedPlans);
      localStorage.setItem('family_travel_plans', JSON.stringify(updatedPlans));
      
      // Navigate to the offline plan
      setPlan(offlineCreatedPlan);
      setSelectedPlanId(offlineCreatedPlan.id);
      setView('detail');
    }

    // Reset forms
    setNewTrip({ title: '', startDate: '', endDate: '', membersInput: '' });
    setShowAddTripModal(false);
  };

  // Add Itinerary Place
  const handleAddItinerary = (e) => {
    e.preventDefault();
    if (!newPlace.name || !newPlace.time) return;

    const updatedPlan = { ...plan };
    let dayNumber = parseInt(newPlace.day);
    let dayIndex = updatedPlan.itinerary.findIndex(item => item.day === dayNumber);
    
    // Calculate date for the day
    const getTargetDate = (start, dayNo) => {
      try {
        const date = new Date(start);
        date.setDate(date.getDate() + (dayNo - 1));
        return date.toISOString().split('T')[0];
      } catch (e) {
        return start;
      }
    };
    
    const targetDateStr = getTargetDate(plan.startDate, dayNumber);
    const newPlaceObj = {
      id: Date.now(),
      time: newPlace.time,
      name: newPlace.name,
      description: newPlace.description,
      comments: []
    };

    if (dayIndex === -1) {
      updatedPlan.itinerary.push({
        day: dayNumber,
        date: targetDateStr,
        places: [newPlaceObj]
      });
    } else {
      updatedPlan.itinerary[dayIndex].places.push(newPlaceObj);
      updatedPlan.itinerary[dayIndex].places.sort((a, b) => a.time.localeCompare(b.time));
    }

    saveUpdatedPlan(updatedPlan);
    setNewPlace({ day: 1, time: '', name: '', description: '' });
    setShowModal(false);
  };

  // Add Comment to Place
  const handleAddComment = async (placeId) => {
    const text = commentInputs[placeId];
    if (!text || !text.trim()) return;

    const author = currentUser.name;
    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    // Optimistically update local state first
    const updatedPlan = { ...plan };
    let targetPlace = null;
    for (const dayItem of updatedPlan.itinerary) {
      const pItem = dayItem.places.find(p => p.id === placeId);
      if (pItem) {
        targetPlace = pItem;
        break;
      }
    }

    if (targetPlace) {
      const newComment = {
        id: Date.now(),
        author,
        text,
        time: timeStr
      };
      if (!targetPlace.comments) targetPlace.comments = [];
      targetPlace.comments.push(newComment);
      
      saveUpdatedPlan(updatedPlan);
      
      // Clear input
      setCommentInputs({ ...commentInputs, [placeId]: '' });

      // Send to server
      try {
        await fetch(`/api/plans/${plan.id}/places/${placeId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ author, text })
        });
      } catch (err) {
        console.warn("Saved comment locally, offline sync queued.");
      }
    }
  };

  // Toggle Comment section drawer
  const toggleCommentsDrawer = (placeId) => {
    setToggledComments({
      ...toggledComments,
      [placeId]: !toggledComments[placeId]
    });
  };

  // Add Checklist Item
  const handleAddChecklist = (e) => {
    e.preventDefault();
    if (!newCheck.title) return;

    const updatedPlan = { ...plan };
    const newItem = {
      id: Date.now(),
      title: newCheck.title,
      checked: false,
      assignee: newCheck.assignee || '미지정'
    };
    updatedPlan.checklists.push(newItem);
    
    saveUpdatedPlan(updatedPlan);
    setNewCheck({ title: '', assignee: '' });
    setShowModal(false);
  };

  // Add Expense Item
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;

    const updatedPlan = { ...plan };
    const newItem = {
      id: Date.now(),
      title: newExpense.title,
      amount: parseInt(newExpense.amount),
      payer: newExpense.payer || plan.members[0],
      date: newExpense.date || new Date().toISOString().split('T')[0]
    };
    updatedPlan.expenses.push(newItem);

    saveUpdatedPlan(updatedPlan);
    setNewExpense({ title: '', amount: '', payer: '', date: '' });
    setShowModal(false);
  };

  // Toggle Checklist Checked State
  const handleToggleCheck = (itemId) => {
    const updatedPlan = { ...plan };
    const checkItem = updatedPlan.checklists.find(c => c.id === itemId);
    if (checkItem) {
      checkItem.checked = !checkItem.checked;
      saveUpdatedPlan(updatedPlan);
    }
  };

  // Current Date Helper to divide plans
  const today = new Date().toISOString().split('T')[0];
  const activeTrips = plans.filter(p => p.endDate >= today);
  const pastTrips = plans.filter(p => p.endDate < today);

  // Calculate total expense
  const totalExpense = plan ? plan.expenses.reduce((sum, item) => sum + item.amount, 0) : 0;

  // Render Login Screen if not authenticated
  if (!currentUser) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', minHeight: '100vh', background: 'radial-gradient(circle at top right, #e0e7ff 0%, var(--bg-app) 70%)' }}>
        <div className="login-card">
          <div className="login-header">
            <span style={{ fontSize: '3rem' }}>✈️</span>
            <h1>우리 가족 여행</h1>
            <p>가족 전용 일정 및 경비 소통 공간</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>이름 (아이디)</label>
              <input 
                type="text" 
                required 
                placeholder="예: 이현수, 홍영숙" 
                className="form-control" 
                value={loginForm.username} 
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} 
              />
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>비밀번호 (생년월일 6자리)</label>
              <input 
                type="password" 
                required 
                placeholder="예: 870707" 
                className="form-control" 
                value={loginForm.password} 
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} 
              />
            </div>
            {loginError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: '500' }}>⚠️ {loginError}</div>}
            <button type="submit" className="submit-btn" style={{ padding: '16px' }}>가족 공간 입장하기</button>
          </form>
          <div className="login-footer">
            이 앱은 사전에 가등록된 가족 구성원만 로그인할 수 있습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* ========================================================================= */}
      {/* 1. HOME SCREEN VIEW */}
      {/* ========================================================================= */}
      {view === 'home' && (
        <>
          <header className="app-header">
            <div className="logo">
              <span>🏡</span> 가족 여행 홈
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="user-welcome">👋 <b>{currentUser.name}</b>님</span>
              <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          </header>

          <main className="app-content">
            <div className="home-hero-card">
              <h2>가족과 함께하는 다음 여행지는 어디인가요?</h2>
              <p>일정, 준비물, 경비를 공유해 완벽한 가족 여행을 디자인해 보세요.</p>
              <button className="btn-primary-rect" onClick={() => setShowAddTripModal(true)}>+ 새 여행 만들기</button>
            </div>

            {/* Active & Upcoming Trips */}
            <div className="section-title">📅 예정된 & 진행 중인 여행</div>
            {activeTrips.length === 0 ? (
              <div className="empty-state">진행 예정인 여행이 없습니다. 아래 버튼으로 새로 등록해 보세요!</div>
            ) : (
              activeTrips.map(p => (
                <div key={p.id} className="trip-card" onClick={() => fetchSinglePlan(p.id)}>
                  <div className="trip-card-header">
                    <span className="badge badge-active">예정됨</span>
                    <span className="trip-date">{p.startDate} ~ {p.endDate}</span>
                  </div>
                  <h3>{p.title}</h3>
                  <div className="trip-card-footer">
                    <div className="avatar-group" style={{ margin: 0 }}>
                      {p.members.map((m, idx) => (
                        <div key={idx} className="avatar">{m[0]}</div>
                      ))}
                    </div>
                    <span className="go-arrow">더 보기 ➔</span>
                  </div>
                </div>
              ))
            )}

            {/* Past Trips */}
            <div className="section-title" style={{ marginTop: '28px' }}>📜 지난 가족 추억</div>
            {pastTrips.length === 0 ? (
              <div className="empty-state">아직 지난 여행 내역이 없습니다.</div>
            ) : (
              pastTrips.map(p => (
                <div key={p.id} className="trip-card past-trip" onClick={() => fetchSinglePlan(p.id)}>
                  <div className="trip-card-header">
                    <span className="badge badge-past">다녀옴</span>
                    <span className="trip-date">{p.startDate} ~ {p.endDate}</span>
                  </div>
                  <h3>{p.title}</h3>
                  <div className="trip-card-footer">
                    <div className="avatar-group" style={{ margin: 0 }}>
                      {p.members.map((m, idx) => (
                        <div key={idx} className="avatar">{m[0]}</div>
                      ))}
                    </div>
                    <span className="go-arrow">기록 보기 ➔</span>
                  </div>
                </div>
              ))
            )}
          </main>

          {/* Floating Action Button on Home Screen */}
          <button className="fab" onClick={() => setShowAddTripModal(true)}>+</button>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. PLAN DETAIL VIEW (Tabs) */}
      {/* ========================================================================= */}
      {view === 'detail' && plan && (
        <>
          {/* Header */}
          <header className="app-header">
            <button className="back-btn" onClick={() => setView('home')}>← 홈</button>
            <div className="logo" style={{ fontSize: '1.05rem' }}>
              <span>✈️</span> {plan.title}
            </div>
            <div className="avatar-group">
              {plan.members.slice(0, 3).map((m, idx) => (
                <div key={idx} className="avatar">{m[0]}</div>
              ))}
              {plan.members.length > 3 && (
                <div className="avatar">+{plan.members.length - 3}</div>
              )}
            </div>
          </header>

          {/* Main Content Area */}
          <main className="app-content">
            <div className="tabs">
              <button className={`tab-btn ${activeTab === 'itinerary' ? 'active' : ''}`} onClick={() => setActiveTab('itinerary')}>📅 일정</button>
              <button className={`tab-btn ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')}>🎒 준비물</button>
              <button className={`tab-btn ${activeTab === 'expense' ? 'active' : ''}`} onClick={() => setActiveTab('expense')}>🪙 경비</button>
              <button className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>👥 가족</button>
            </div>

            {/* 1. ITINERARY TAB */}
            {activeTab === 'itinerary' && (
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  💡 여행 일정: {plan.startDate} ~ {plan.endDate}
                </div>
                {plan.itinerary.length === 0 ? (
                  <div className="empty-state">
                    아직 등록된 일정이 없습니다. 우측 하단의 + 버튼을 눌러 첫 일정을 등록해 보세요!
                  </div>
                ) : (
                  plan.itinerary.map((dayItem) => (
                    <div key={dayItem.day} className="card" style={{ padding: '20px 16px' }}>
                      <h3 className="card-title">Day {dayItem.day} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>({dayItem.date})</span></h3>
                      <div className="timeline">
                        {dayItem.places.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>아직 등록된 일정이 없습니다.</div>
                        ) : (
                          dayItem.places.map((place) => (
                            <div key={place.id} className="timeline-item" style={{ marginBottom: '8px' }}>
                              <div className="timeline-dot"></div>
                              <div className="timeline-content">
                                <div className="timeline-time">{place.time}</div>
                                <div className="timeline-place">{place.name}</div>
                                {place.description && <div className="timeline-desc">{place.description}</div>}
                                
                                {/* Comments Toggle Button */}
                                <div className="comments-toggle" onClick={() => toggleCommentsDrawer(place.id)}>
                                  💬 코멘트 {place.comments ? place.comments.length : 0}개
                                  <span style={{ marginLeft: '4px', fontSize: '0.7rem' }}>
                                    {toggledComments[place.id] ? '▲ 접기' : '▼ 보기'}
                                  </span>
                                </div>

                                {/* Comments Drawer */}
                                {toggledComments[place.id] && (
                                  <div className="comments-drawer">
                                    <div className="comments-list">
                                      {(!place.comments || place.comments.length === 0) ? (
                                        <div className="empty-comments">첫 댓글을 달아 가족과 소통해 보세요!</div>
                                      ) : (
                                        place.comments.map((comment) => (
                                          <div key={comment.id} className={`comment-bubble ${comment.author === currentUser.name ? 'my-comment' : ''}`}>
                                            <div className="comment-meta">
                                              <span className="comment-author">{comment.author}</span>
                                              <span className="comment-time">{comment.time}</span>
                                            </div>
                                            <div className="comment-text">{comment.text}</div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                    <div className="comment-input-box">
                                      <input 
                                        type="text" 
                                        placeholder="가족들과 이야기 나누기..." 
                                        className="form-control comment-input"
                                        value={commentInputs[place.id] || ''}
                                        onChange={e => setCommentInputs({ ...commentInputs, [place.id]: e.target.value })}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleAddComment(place.id);
                                        }}
                                      />
                                      <button className="comment-send-btn" onClick={() => handleAddComment(place.id)}>전송</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. CHECKLIST TAB */}
            {activeTab === 'checklist' && (
              <div className="card">
                <h3 className="card-title">🎒 체크리스트</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {plan.checklists.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>준비물이 없습니다. 추가해 보세요!</div>
                  ) : (
                    plan.checklists.map((item) => (
                      <div key={item.id} className="checklist-item" onClick={() => handleToggleCheck(item.id)}>
                        <div className={`checkbox-custom ${item.checked ? 'checked' : ''}`}></div>
                        <div className={`checklist-text ${item.checked ? 'checked' : ''}`}>{item.title}</div>
                        <div className="checklist-assignee">{item.assignee}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. EXPENSE TAB */}
            {activeTab === 'expense' && (
              <div>
                <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white' }}>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>총 지출액</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px' }}>
                    {totalExpense.toLocaleString()} 원
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '8px' }}>
                    인당 평균: {Math.round(totalExpense / plan.members.length).toLocaleString()} 원 ({plan.members.length}명 기준)
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title">🪙 경비 상세 내역</h3>
                  <div>
                    {plan.expenses.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>등록된 경비 내역이 없습니다.</div>
                    ) : (
                      plan.expenses.map((item) => (
                        <div key={item.id} className="expense-item">
                          <div className="expense-info">
                            <h4>{item.title}</h4>
                            <p>{item.date}</p>
                            <span className="expense-payer">{item.payer} 결제</span>
                          </div>
                          <div className="expense-amount">{item.amount.toLocaleString()} 원</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. MEMBERS TAB */}
            {activeTab === 'members' && (
              <div className="card">
                <h3 className="card-title">👥 함께하는 가족</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {plan.members.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                      <div className="avatar" style={{ margin: 0, width: '40px', height: '40px', fontSize: '1.1rem' }}>{m[0]}</div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{m}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {m === '이현수' ? '👑 여행 총괄 관리자' : '참여자'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Floating Action Button inside Details */}
          {activeTab !== 'members' && (
            <button className="fab" onClick={() => setShowModal(true)}>+</button>
          )}

          {/* Bottom Navigation */}
          <nav className="bottom-nav">
            <div className={`nav-item ${activeTab === 'itinerary' ? 'active' : ''}`} onClick={() => setActiveTab('itinerary')}>
              <span className="nav-icon">📅</span>
              <span>일정</span>
            </div>
            <div className={`nav-item ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')}>
              <span className="nav-icon">🎒</span>
              <span>준비물</span>
            </div>
            <div className={`nav-item ${activeTab === 'expense' ? 'active' : ''}`} onClick={() => setActiveTab('expense')}>
              <span className="nav-icon">🪙</span>
              <span>경비</span>
            </div>
            <div className={`nav-item ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
              <span className="nav-icon">👥</span>
              <span>가족</span>
            </div>
          </nav>

          {/* Add Item Modal */}
          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>
                    {activeTab === 'itinerary' && '📅 일정 추가'}
                    {activeTab === 'checklist' && '🎒 준비물 추가'}
                    {activeTab === 'expense' && '🪙 경비 추가'}
                  </h3>
                  <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                </div>

                {/* 1. Add Place Form */}
                {activeTab === 'itinerary' && (
                  <form onSubmit={handleAddItinerary}>
                    <div className="form-group">
                      <label>여행 일자 선택</label>
                      <select className="form-control" value={newPlace.day} onChange={e => setNewPlace({ ...newPlace, day: e.target.value })}>
                        {Array.from({ length: Math.max(1, Math.ceil((new Date(plan.endDate) - new Date(plan.startDate)) / (1000 * 60 * 60 * 24)) + 1) }).map((_, i) => (
                          <option key={i} value={i + 1}>Day {i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>시간 (HH:MM)</label>
                      <input type="time" required className="form-control" value={newPlace.time} onChange={e => setNewPlace({ ...newPlace, time: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>장소/일정 이름</label>
                      <input type="text" required placeholder="예: 함덕 해수욕장" className="form-control" value={newPlace.name} onChange={e => setNewPlace({ ...newPlace, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>메모/설명</label>
                      <textarea placeholder="예: 바다 구경 및 망고주스 마시기" className="form-control" value={newPlace.description} onChange={e => setNewPlace({ ...newPlace, description: e.target.value })}></textarea>
                    </div>
                    <button type="submit" className="submit-btn">일정 등록하기</button>
                  </form>
                )}

                {/* 2. Add Checklist Form */}
                {activeTab === 'checklist' && (
                  <form onSubmit={handleAddChecklist}>
                    <div className="form-group">
                      <label>준비물 품목</label>
                      <input type="text" required placeholder="예: 방수 팩, 유모차" className="form-control" value={newCheck.title} onChange={e => setNewCheck({ ...newCheck, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>담당자</label>
                      <select className="form-control" value={newCheck.assignee} onChange={e => setNewCheck({ ...newCheck, assignee: e.target.value })}>
                        <option value="">미지정</option>
                        {plan.members.map((m, idx) => (
                          <option key={idx} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="submit-btn">준비물 등록하기</button>
                  </form>
                )}

                {/* 3. Add Expense Form */}
                {activeTab === 'expense' && (
                  <form onSubmit={handleAddExpense}>
                    <div className="form-group">
                      <label>내역</label>
                      <input type="text" required placeholder="예: 렌터카 주유비" className="form-control" value={newExpense.title} onChange={e => setNewExpense({ ...newExpense, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>금액 (원)</label>
                      <input type="number" required placeholder="금액 입력" className="form-control" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>결제자</label>
                      <select className="form-control" value={newExpense.payer} onChange={e => setNewExpense({ ...newExpense, payer: e.target.value })}>
                        {plan.members.map((m, idx) => (
                          <option key={idx} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>결제일</label>
                      <input type="date" className="form-control" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} />
                    </div>
                    <button type="submit" className="submit-btn">경비 등록하기</button>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 3. CREATE NEW TRIP MODAL (Global) */}
      {/* ========================================================================= */}
      {showAddTripModal && (
        <div className="modal-overlay" onClick={() => setShowAddTripModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🆕 새 가족 여행 생성</h3>
              <button className="close-btn" onClick={() => setShowAddTripModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateTrip}>
              <div className="form-group">
                <label>여행 제목</label>
                <input type="text" required placeholder="예: 2026 우리가족 추억 만들기" className="form-control" value={newTrip.title} onChange={e => setNewTrip({ ...newTrip, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>시작일</label>
                <input type="date" required className="form-control" value={newTrip.startDate} onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>종료일</label>
                <input type="date" required className="form-control" value={newTrip.endDate} onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>참여 가족 구성원 (쉼표로 구분)</label>
                <input 
                  type="text" 
                  placeholder="예: 이현수, 양슬기, 이정우" 
                  className="form-control" 
                  value={newTrip.membersInput} 
                  onChange={e => setNewTrip({ ...newTrip, membersInput: e.target.value })} 
                />
              </div>
              <button type="submit" className="submit-btn">여행 추가 및 일정 짜러가기</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
