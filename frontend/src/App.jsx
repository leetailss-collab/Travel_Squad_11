import React, { useState, useEffect, useRef } from 'react';
import solarLunar from 'solarlunar';

// Korean Holiday Name Mapping
const HOLIDAY_NAMES_KO = {
  "New Year's Day": "신정",
  "Lunar New Year": "설날",
  "Independence Movement Day": "삼일절",
  "Labour Day": "근로자의 날",
  "Children's Day": "어린이날",
  "Buddha's Birthday": "석가탄신일",
  "Local Election Day": "선거일",
  "Memorial Day": "현충일",
  "Constitution Day": "제헌절",
  "Liberation Day": "광복절",
  "Chuseok": "추석",
  "National Foundation Day": "개천절",
  "Hangul Day": "한글날",
  "Christmas Day": "성탄절"
};

const CURRENCY_OPTIONS = {
  KRW: { code: 'KRW', symbol: '₩', name: '원' },
  JPY: { code: 'JPY', symbol: '¥', name: '엔' },
  USD: { code: 'USD', symbol: '$', name: '달러' },
  EUR: { code: 'EUR', symbol: '€', name: '유로' },
  GBP: { code: 'GBP', symbol: '£', name: '파운드' },
  CNY: { code: 'CNY', symbol: '¥', name: '위안' },
  THB: { code: 'THB', symbol: '฿', name: '바트' },
  VND: { code: 'VND', symbol: '₫', name: '동' },
  TWD: { code: 'TWD', symbol: 'NT$', name: '대만달러' },
  AUD: { code: 'AUD', symbol: 'A$', name: '호주달러' },
  CAD: { code: 'CAD', symbol: 'C$', name: '캐나다달러' },
  PHP: { code: 'PHP', symbol: '₱', name: '페소' },
  SGD: { code: 'SGD', symbol: 'S$', name: '싱가포르달러' }
};

const COUNTRY_CURRENCY_MAP = {
  일본: CURRENCY_OPTIONS.JPY,
  도쿄: CURRENCY_OPTIONS.JPY,
  오사카: CURRENCY_OPTIONS.JPY,
  미국: CURRENCY_OPTIONS.USD,
  유럽: CURRENCY_OPTIONS.EUR,
  영국: CURRENCY_OPTIONS.GBP,
  중국: CURRENCY_OPTIONS.CNY,
  태국: CURRENCY_OPTIONS.THB,
  베트남: CURRENCY_OPTIONS.VND,
  대만: CURRENCY_OPTIONS.TWD,
  호주: CURRENCY_OPTIONS.AUD,
  캐나다: CURRENCY_OPTIONS.CAD,
  필리핀: CURRENCY_OPTIONS.PHP,
  싱가포르: CURRENCY_OPTIONS.SGD
};

const FALLBACK_KRW_RATES = {
  KRW: 1, JPY: 9.3, USD: 1380, EUR: 1510, GBP: 1790, CNY: 190,
  THB: 41, VND: 0.054, TWD: 42, AUD: 910, CAD: 1010, PHP: 24, SGD: 1060
};

const detectTripCurrency = (title = '') => {
  const match = Object.entries(COUNTRY_CURRENCY_MAP).find(([keyword]) => title.includes(keyword));
  return match ? { country: match[0], ...match[1] } : { country: '국내', ...CURRENCY_OPTIONS.KRW };
};

// Pre-registered Family Users
const FAM_USERS = [
  { name: "이정우", pin: "570413", birth: "1957.04.13", engName: "LEE JUNG WOO", role: "user" },
  { name: "홍영숙", pin: "630124", birth: "1963.01.24", engName: "HONG YOUNGSOOK", role: "user" },
  { name: "이진수", pin: "850119", birth: "1985.01.19", engName: "LEE JINSOO", role: "user" },
  { name: "이아름", pin: "880803", birth: "1988.08.03", engName: "LEE AHREUM", role: "user" },
  { name: "이현수", pin: "870707", birth: "1987.07.07", engName: "LEE HYUNSOO", role: "admin" },
  { name: "양슬기", pin: "871214", birth: "1987.12.14", engName: "YANG SEULGI", role: "user" },
  { name: "이준성", pin: "110324", birth: "2011.03.24", engName: "LEE JUNSEONG", role: "user" },
  { name: "이은성", pin: "130813", birth: "2013.08.13", engName: "LEE EUNSEONG", role: "user" },
  { name: "이해성", pin: "200220", birth: "2020.02.20", engName: "LEE HAESEONG", role: "user" },
  { name: "이하성", pin: "210930", birth: "2021.09.30", engName: "LEE HASEONG", role: "user" },
  { name: "이주성", pin: "231110", birth: "2023.11.10", engName: "LEE JUSEONG", role: "user" }
];

// Calculate international (man) age based on 6-digit YYMMDD pin
const calculateManAge = (pin) => {
  if (!pin || pin.length !== 6) return null;
  const yy = parseInt(pin.substring(0, 2));
  const mm = parseInt(pin.substring(2, 4));
  const dd = parseInt(pin.substring(4, 6));
  if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return null;

  const birthYear = yy >= 30 ? 1900 + yy : 2000 + yy;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let age = currentYear - birthYear;
  if (currentMonth < mm || (currentMonth === mm && currentDay < dd)) {
    age--;
  }
  return age;
};

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

const getAnniversariesForYear = (year, anniversariesList) => {
  if (!anniversariesList || anniversariesList.length === 0) return [];
  return anniversariesList.map(ann => {
    const baseYear = Number(ann.year) || year;
    const diff = year - baseYear;
    let titleSuffix = '';
    if (diff > 0) {
      if (ann.type === 'birthday') {
        titleSuffix = ` (${diff}회)`;
      } else if (ann.type === 'memorial') {
        titleSuffix = ` (${diff}주기)`;
      } else {
        titleSuffix = ` (${diff}주년)`;
      }
    }

    if (ann.isLunar) {
      try {
        const result = solarLunar.lunar2solar(year, ann.month, ann.day);
        if (result && result.cYear && result.cMonth && result.cDay) {
          const monthStr = String(result.cMonth).padStart(2, '0');
          const dayStr = String(result.cDay).padStart(2, '0');
          return {
            id: ann.id || `ann-${ann.name}-${year}`,
            title: `${ann.name}${titleSuffix} (음력)`,
            dateStr: `${result.cYear}-${monthStr}-${dayStr}`,
            isAnniversary: true,
            isEvent: false,
            name: ann.name,
            year: baseYear,
            month: ann.month,
            day: ann.day,
            isLunar: true,
            type: ann.type || 'other',
            rawId: ann.id
          };
        }
      } catch (e) {
        console.error("Lunar conversion error:", e);
      }
      return null;
    } else {
      const monthStr = String(ann.month).padStart(2, '0');
      const dayStr = String(ann.day).padStart(2, '0');
      return {
        id: ann.id || `ann-${ann.name}-${year}`,
        title: `${ann.name}${titleSuffix}`,
        dateStr: `${year}-${monthStr}-${dayStr}`,
        isAnniversary: true,
        isEvent: false,
        name: ann.name,
        year: baseYear,
        month: ann.month,
        day: ann.day,
        isLunar: false,
        type: ann.type || 'other',
        rawId: ann.id
      };
    }
  }).filter(Boolean);
};

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [activeTab, setActiveTab] = useState('itinerary'); // 'itinerary' | 'checklist' | 'expense' | 'members'
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // Modal inside tabs (Add Itinerary / Expense / Checklist)
  const [showAddTripModal, setShowAddTripModal] = useState(false); // Modal for creating a new travel plan

  // Comment section toggle state map: { [placeId]: boolean }
  const [toggledComments, setToggledComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({}); // { [placeId]: string }

  // Form States for adding new trip
  const [newTrip, setNewTrip] = useState({ title: '', startDate: '', endDate: '', membersInput: '', currency: '' });

  // Form States inside detail tabs
  const [newPlace, setNewPlace] = useState({
    day: 1, time: '', name: '', address: '', description: '', category: '관광', estimatedCost: '',
    currency: '', needsReservation: false, isReservationCompleted: false, tip: '', payer: '', duration: 60, images: [],
    transportType: '', transportDuration: ''
  });

  const [editingPlace, setEditingPlace] = useState(null); // Place object currently being edited
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const pressTimerRef = useRef(null);
  const addImgInputRef = useRef(null);
  const editImgInputRef = useRef(null);
  const [newCheck, setNewCheck] = useState({ title: '', assignee: '', category: '공통' });
  const [editingCheck, setEditingCheck] = useState(null);
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', payer: '', date: '', category: '기타' });

  // Calendar & Event States
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', description: '', members: [] });
  const [showEditMembersModal, setShowEditMembersModal] = useState(false);
  const [tempMembers, setTempMembers] = useState([]);

  const [holidays, setHolidays] = useState([]);
  const [exchangeRate, setExchangeRate] = useState({ rate: 1, source: '기본값', updatedAt: null, loading: false });

  // Anniversary States
  const [anniversaries, setAnniversaries] = useState([]);
  const [editingAnniversary, setEditingAnniversary] = useState(null);
  const [showAddAnniversaryModal, setShowAddAnniversaryModal] = useState(false);
  const [newAnniversary, setNewAnniversary] = useState({ name: '', year: new Date().getFullYear(), month: 1, day: 1, isLunar: false, type: 'birthday' });

  // Trash States
  const [trashPlans, setTrashPlans] = useState([]);
  const [showTrashModal, setShowTrashModal] = useState(false);

  // Custom Confirm Modal State & Functions
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Trip Meta (Accommodation & Transportation) Edit States
  const [showEditMetaModal, setShowEditMetaModal] = useState(false);
  const [editMeta, setEditMeta] = useState({ title: '', accName: '', accLocation: '', accHighlight: '', transText: '', startDate: '', endDate: '' });

  // Sub-tabs filters
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');
  const [selectedChecklistFilter, setSelectedChecklistFilter] = useState('all');
  const [selectedExpenseFilter, setSelectedExpenseFilter] = useState('all');

  const openConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        closeConfirm();
      }
    });
  };

  const closeConfirm = () => {
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  // Fetch Korean national holidays dynamically when calendar year changes
  useEffect(() => {
    const fetchHolidays = async () => {
      const year = currentCalendarDate.getFullYear();
      try {
        const response = await fetch(`https://date.nager.at/api/v4/Holidays/KR/${year}`);
        if (response.ok) {
          const data = await response.json();
          setHolidays(data);
        }
      } catch (err) {
        console.warn("Failed to fetch holidays:", err);
      }
    };
    fetchHolidays();
  }, [currentCalendarDate.getFullYear()]);

  useEffect(() => {
    const currencyCode = plan?.currency || 'KRW';
    if (!plan || currencyCode === 'KRW') {
      setExchangeRate({ rate: 1, source: '원화', updatedAt: new Date(), loading: false });
      return;
    }

    let cancelled = false;
    const loadExchangeRate = async () => {
      setExchangeRate(prev => ({ ...prev, loading: true }));
      try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${currencyCode}`);
        if (!response.ok) throw new Error('환율 응답 오류');
        const data = await response.json();
        const rate = Number(data?.rates?.KRW);
        if (!rate) throw new Error('원화 환율 없음');
        if (!cancelled) setExchangeRate({ rate, source: '실시간', updatedAt: new Date(), loading: false });
      } catch (error) {
        if (!cancelled) {
          setExchangeRate({
            rate: FALLBACK_KRW_RATES[currencyCode] || 1,
            source: '기준 환율',
            updatedAt: new Date(),
            loading: false
          });
        }
      }
    };
    loadExchangeRate();
    return () => { cancelled = true; };
  }, [plan?.currency]);

  // Save states to sessionStorage for refresh recovery
  useEffect(() => {
    sessionStorage.setItem('travel_squad_view', view);
  }, [view]);

  useEffect(() => {
    if (selectedPlanId) {
      sessionStorage.setItem('travel_squad_selected_plan_id', String(selectedPlanId));
    } else {
      sessionStorage.removeItem('travel_squad_selected_plan_id');
    }
  }, [selectedPlanId]);

  useEffect(() => {
    sessionStorage.setItem('travel_squad_active_tab', activeTab);
  }, [activeTab]);

  // Body scroll lock effect when any modal is open
  useEffect(() => {
    const isModalOpen = showModal || showAddTripModal || showAddEventModal || showEditMembersModal || showAddAnniversaryModal || editingPlace || editingAnniversary || confirmModal.isOpen || showTrashModal || showEditMetaModal;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, showAddTripModal, showAddEventModal, showEditMembersModal, showAddAnniversaryModal, editingPlace, editingAnniversary, confirmModal.isOpen, showTrashModal, showEditMetaModal]);

  // Modal Back Button Handling (For Mobile Browser Back Gesture/Button)
  useEffect(() => {
    const isModalOpen = showModal || showAddTripModal || showAddEventModal || showEditMembersModal || showAddAnniversaryModal || !!editingPlace || !!editingAnniversary || confirmModal.isOpen || showTrashModal || showEditMetaModal;

    const handlePopState = (event) => {
      if (isModalOpen) {
        setShowModal(false);
        setShowAddTripModal(false);
        setShowAddEventModal(false);
        setShowEditMembersModal(false);
        setShowAddAnniversaryModal(false);
        setEditingPlace(null);
        setEditingAnniversary(null);
        setShowTrashModal(false);
        setShowEditMetaModal(false);
        closeConfirm();
      }
    };

    if (isModalOpen) {
      window.history.pushState({ modalOpen: true }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showModal, showAddTripModal, showAddEventModal, showEditMembersModal, showAddAnniversaryModal, editingPlace, editingAnniversary]);

  // Load User, Plans and restore state on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('family_travel_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    const restoreState = async () => {
      await fetchPlans();
      await fetchAnniversaries();
      await fetchTrashPlans();

      const savedView = sessionStorage.getItem('travel_squad_view');
      const savedPlanId = sessionStorage.getItem('travel_squad_selected_plan_id');
      const savedActiveTab = sessionStorage.getItem('travel_squad_active_tab');

      if (savedView === 'detail' && savedPlanId) {
        const id = Number(savedPlanId);
        try {
          const response = await fetch(`/api/plans/${id}`);
          if (response.ok) {
            const data = await response.json();
            setPlan(data);
            setSelectedPlanId(id);
            setView('detail');
          }
        } catch (e) {
          console.warn("Restore state single plan fetch failed", e);
        }
        if (savedActiveTab) {
          setActiveTab(savedActiveTab);
        }
      }
    };

    restoreState();
  }, []);

  const fetchTrashPlans = async () => {
    try {
      const response = await fetch('/api/trash');
      if (response.ok) {
        const data = await response.json();
        setTrashPlans(data);
      }
    } catch (err) {
      console.warn("Failed to fetch trash plans:", err);
    }
  };

  const handleRestorePlan = async (id) => {
    try {
      const response = await fetch(`/api/trash/${id}/restore`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchTrashPlans();
        await fetchPlans();
      }
    } catch (err) {
      console.error("Failed to restore plan:", err);
    }
  };

  const handleDeletePermanently = async (id) => {
    try {
      const response = await fetch(`/api/trash/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchTrashPlans();
      }
    } catch (err) {
      console.error("Failed to delete plan permanently:", err);
    }
  };

  const getAutoAccommodations = () => {
    if (!plan || !plan.itinerary) return [];
    const accList = [];
    const sortedDays = [...plan.itinerary].sort((a, b) => a.day - b.day);
    sortedDays.forEach(dayItem => {
      const sortedPlaces = [...dayItem.places].sort((a, b) => a.time.localeCompare(b.time));
      sortedPlaces.forEach(place => {
        if (place.category === '숙소') {
          accList.push({
            name: place.name,
            address: place.address,
            day: dayItem.day
          });
        }
      });
    });
    return accList;
  };

  const openEditMetaModal = () => {
    if (!plan) return;
    setEditMeta({
      title: plan.title || '',
      accName: plan.accommodation?.name || '',
      accLocation: plan.accommodation?.location || '',
      accHighlight: plan.accommodation?.highlight || '',
      transText: plan.transportation ? plan.transportation.map(t => {
        let parts = [t.type];
        if (t.route) parts.push(t.route);
        if (t.cost) parts.push(t.cost);
        return parts.join(' · ');
      }).join('\n') : '',
      startDate: plan.startDate || '',
      endDate: plan.endDate || ''
    });
    setShowEditMetaModal(true);
  };

  const handleSaveMeta = (e) => {
    e.preventDefault();
    if (!plan) return;

    // 0. Title & Date Validation
    const newTitle = editMeta.title ? editMeta.title.trim() : '';
    if (!newTitle) {
      alert("여행 제목을 입력해주세요.");
      return;
    }

    const startStr = editMeta.startDate;
    const endStr = editMeta.endDate;
    if (!startStr || !endStr) {
      alert("시작일과 종료일을 모두 입력해주세요.");
      return;
    }
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (start > end) {
      alert("시작일은 종료일보다 이전이거나 같아야 합니다.");
      return;
    }

    const updatedPlan = { ...plan, title: newTitle };

    // 1. Process Accommodation
    if (editMeta.accName.trim()) {
      updatedPlan.accommodation = {
        name: editMeta.accName.trim(),
        location: editMeta.accLocation.trim() || undefined,
        highlight: editMeta.accHighlight.trim() || undefined
      };
    } else {
      delete updatedPlan.accommodation;
    }

    // 2. Process Transportation
    if (editMeta.transText.trim()) {
      const lines = editMeta.transText.split('\n').map(l => l.trim()).filter(Boolean);
      updatedPlan.transportation = lines.map(line => {
        const parts = line.split('·').map(p => p.trim());
        return {
          type: parts[0] || '기타',
          route: parts[1] || '',
          cost: parts[2] ? Number(parts[2]) : 0,
          currency: plan.currency || 'KRW'
        };
      });
    } else {
      delete updatedPlan.transportation;
    }

    // 3. Process Date changes and Itinerary
    const calculateDays = (sStr, eStr) => {
      const s = new Date(sStr);
      const e = new Date(eStr);
      return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    };

    const oldDays = calculateDays(plan.startDate, plan.endDate);
    const newDays = calculateDays(startStr, endStr);

    const performSave = (finalPlan) => {
      finalPlan.startDate = startStr;
      finalPlan.endDate = endStr;

      // Rebuild itinerary
      const newItinerary = [];
      for (let d = 1; d <= newDays; d++) {
        const targetDate = new Date(startStr);
        targetDate.setDate(targetDate.getDate() + (d - 1));
        const dateStr = targetDate.toISOString().split('T')[0];
        const existing = plan.itinerary ? plan.itinerary.find(item => item.day === d) : null;
        if (existing) {
          newItinerary.push({ ...existing, date: dateStr });
        } else {
          newItinerary.push({ day: d, date: dateStr, places: [] });
        }
      }
      finalPlan.itinerary = newItinerary;

      saveUpdatedPlan(finalPlan);
      setShowEditMetaModal(false);
    };

    if (newDays < oldDays) {
      // Check if any deleted days contain places
      const affectedDays = (plan.itinerary || []).filter(item => item.day > newDays && item.places && item.places.length > 0);
      if (affectedDays.length > 0) {
        const deletedPlacesText = affectedDays.map(item => {
          const placeNames = item.places.map(p => p.name).join(', ');
          return `${item.day}일차: [${placeNames}]`;
        }).join('\n');

        openConfirm(
          "⚠️ 여행 기간 단축 경고",
          `여행 기간을 단축하면 아래 일정이 영구적으로 삭제됩니다. 계속하시겠습니까?\n\n${deletedPlacesText}`,
          () => performSave(updatedPlan)
        );
        return;
      }
    }

    // If days are not reduced or no places are lost, proceed immediately
    performSave(updatedPlan);
  };

  const fetchAnniversaries = async () => {
    try {
      const response = await fetch('/api/anniversaries');
      if (response.ok) {
        const data = await response.json();
        setAnniversaries(data);
      }
    } catch (err) {
      console.warn("Failed to fetch anniversaries:", err);
    }
  };

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
      // Simulating login offline using global FAM_USERS list
      const matched = FAM_USERS.find(u => u.name === loginForm.username && u.pin === loginForm.password);
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

  // Save updated travel plan title
  const handleSaveTitle = () => {
    if (!tempTitle || !tempTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    const updatedPlan = { ...plan, title: tempTitle.trim() };
    saveUpdatedPlan(updatedPlan);
    setIsEditingTitle(false);
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
      manager: currentUser.name,
      currency: newTrip.currency || detectTripCurrency(newTrip.title).code,
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
    setNewTrip({ title: '', startDate: '', endDate: '', membersInput: '', currency: '' });
    setShowAddTripModal(false);
  };

  // Add Custom Family Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    const newEventData = {
      title: newEvent.title,
      startDate: newEvent.date,
      endDate: newEvent.date,
      isEvent: true,
      members: newEvent.members.length > 0 ? newEvent.members : [currentUser.name],
      description: newEvent.description || '',
      itinerary: [],
      expenses: [],
      checklists: []
    };

    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEventData)
      });
      if (response.ok) {
        const createdEvent = await response.json();
        setPlans([...plans, createdEvent]);
        localStorage.setItem('family_travel_plans', JSON.stringify([...plans, createdEvent]));
      } else {
        throw new Error('Server failed to create event');
      }
    } catch (err) {
      console.warn("Offline: creating event locally:", err);
      const offlineCreatedEvent = {
        id: Date.now(),
        ...newEventData
      };
      const updatedPlans = [...plans, offlineCreatedEvent];
      setPlans(updatedPlans);
      localStorage.setItem('family_travel_plans', JSON.stringify(updatedPlans));
    }

    // Reset form
    setNewEvent({ title: '', date: '', description: '', members: [] });
    setShowAddEventModal(false);
    setSelectedCalendarDate(null);
  };

  // Delete Travel Plan or Family Event
  const handleDeletePlan = (id) => {
    openConfirm("🗑️ 일정 삭제", "정말로 이 일정(여행/행사)을 삭제하시겠습니까? 삭제된 일정은 복구할 수 없습니다.", async () => {
      // Optimistically update local state
      const updatedPlans = plans.filter(p => p.id !== id);
      setPlans(updatedPlans);
      localStorage.setItem('family_travel_plans', JSON.stringify(updatedPlans));
      
      // Clear selection if deleted plan was active
      if (selectedPlanId === id) {
        setPlan(null);
        setSelectedPlanId(null);
        setView('home');
      }

      try {
        const response = await fetch(`/api/plans/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error('Failed to delete on server');
        }
      } catch (err) {
        console.warn("Offline: deletion queued or failed on server:", err);
      }
    });
  };

  // Handle Multiple Image Uploads to server
  const uploadImages = async (files) => {
    if (!files || files.length === 0) return [];
    
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        setUploading(false);
        return data.urls || [];
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("이미지 업로드에 실패했습니다. (오프라인 모드에서는 이미지 업로드가 불가능합니다)");
      setUploading(false);
      return [];
    }
  };

  // Add uploaded URLs to the corresponding active form state (newPlace or editingPlace)
  const handleImageAttach = async (files, isEdit = false) => {
    const urls = await uploadImages(files);
    if (urls.length === 0) return;
    
    if (isEdit) {
      setEditingPlace(prev => ({
        ...prev,
        images: [...(prev.images || []), ...urls]
      }));
    } else {
      setNewPlace(prev => ({
        ...prev,
        images: [...(prev.images || []), ...urls]
      }));
    }
  };

  // Paste Event Handler (Ctrl+V)
  const handlePasteImages = (e, isEdit = false) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const filesToUpload = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) filesToUpload.push(file);
      }
    }
    if (filesToUpload.length > 0) {
      e.preventDefault();
      handleImageAttach(filesToUpload, isEdit);
    }
  };

  // Drop Event Handler
  const handleDropImages = (e, isEdit = false) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      handleImageAttach(imageFiles, isEdit);
    }
  };

  // Remove single image from temporary list
  const handleRemoveImage = (index, isEdit = false) => {
    if (isEdit) {
      setEditingPlace(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      setNewPlace(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  // Helper functions for time calculations and cascading shift
  const timeToMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (m) => {
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const shiftItineraryTimes = (places) => {
    // Sort by start time first
    const sorted = [...places].sort((a, b) => a.time.localeCompare(b.time));
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const currentStart = timeToMinutes(current.time);
      const duration = Number(current.duration) || 0;
      const currentEnd = currentStart + duration;
      
      const next = sorted[i + 1];
      const nextStart = timeToMinutes(next.time);
      
      if (nextStart < currentEnd) {
        next.time = minutesToTime(currentEnd);
      }
    }
    
    sorted.sort((a, b) => a.time.localeCompare(b.time));
    return sorted;
  };

  // Long-press event handlers for itinerary cards
  const handleStartPress = (e, place) => {
    if (e) e.stopPropagation();
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      setEditingPlace({ ...place, duration: place.duration || 0 });
    }, 700);
  };

  const handleCancelPress = (e) => {
    if (e) e.stopPropagation();
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
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
    const placeId = Date.now();
    const costValue = newPlace.estimatedCost ? Number(newPlace.estimatedCost) : 0;
    const costCurrency = newPlace.currency || plan.currency || 'KRW';
    const payerValue = newPlace.payer || currentUser.name;
    const durationValue = newPlace.duration ? Number(newPlace.duration) : 60; // default 1 hour

    const newPlaceObj = {
      id: placeId,
      time: newPlace.time,
      name: newPlace.name,
      address: newPlace.address || '',
      description: newPlace.description,
      category: newPlace.category,
      estimatedCost: costValue,
      currency: costCurrency,
      needsReservation: newPlace.needsReservation,
      isReservationCompleted: newPlace.isReservationCompleted || false,
      tip: newPlace.tip,
      payer: payerValue,
      duration: durationValue,
      comments: [],
      images: newPlace.images || [],
      transportType: newPlace.transportType || '',
      transportDuration: newPlace.transportDuration || ''
    };

    if (dayIndex === -1) {
      updatedPlan.itinerary.push({
        day: dayNumber,
        date: targetDateStr,
        places: [newPlaceObj]
      });
    } else {
      updatedPlan.itinerary[dayIndex].places.push(newPlaceObj);
      updatedPlan.itinerary[dayIndex].places = shiftItineraryTimes(updatedPlan.itinerary[dayIndex].places);
    }

    // Auto-sync to expenses if there is a positive cost
    if (costValue > 0) {
      const newExpenseItem = {
        id: placeId,
        placeId: placeId,
        title: `[일정] ${newPlace.name}`,
        amount: Math.round(costCurrency === 'KRW' ? costValue : costValue * (costCurrency === (plan.currency || 'KRW') ? exchangeRate.rate : (FALLBACK_KRW_RATES[costCurrency] || 1))),
        originalAmount: costValue,
        currency: costCurrency,
        payer: payerValue,
        date: targetDateStr
      };
      updatedPlan.expenses.push(newExpenseItem);
    }

    saveUpdatedPlan(updatedPlan);
    setNewPlace({
      day: 1, time: '', name: '', address: '', description: '', category: '관광', estimatedCost: '',
      currency: plan.currency || 'KRW', needsReservation: false, isReservationCompleted: false, tip: '', payer: '', duration: 60, images: [],
      transportType: '', transportDuration: ''
    });
    setShowModal(false);
  };

  // Edit Itinerary Place
  const handleEditItinerary = (e) => {
    e.preventDefault();
    if (!editingPlace || !editingPlace.name || !editingPlace.time) return;

    const updatedPlan = { ...plan };
    let found = false;
    let dayNo = 1;
    
    const getTargetDate = (start, dayNo) => {
      try {
        const date = new Date(start);
        date.setDate(date.getDate() + (dayNo - 1));
        return date.toISOString().split('T')[0];
      } catch (e) {
        return start;
      }
    };

    for (let d = 0; d < updatedPlan.itinerary.length; d++) {
      const dayItem = updatedPlan.itinerary[d];
      const idx = dayItem.places.findIndex(p => p.id === editingPlace.id);
      if (idx !== -1) {
        dayNo = dayItem.day;
        const costValue = editingPlace.estimatedCost ? Number(editingPlace.estimatedCost) : 0;
        const costCurrency = editingPlace.currency || plan.currency || 'KRW';
        const payerValue = editingPlace.payer || currentUser.name;
        const durationValue = editingPlace.duration ? Number(editingPlace.duration) : 0;

        dayItem.places[idx] = {
          ...dayItem.places[idx],
          time: editingPlace.time,
          name: editingPlace.name,
          address: editingPlace.address || '',
          duration: durationValue,
          category: editingPlace.category,
          description: editingPlace.description,
          estimatedCost: costValue,
          currency: costCurrency,
          needsReservation: editingPlace.needsReservation,
          isReservationCompleted: editingPlace.isReservationCompleted || false,
          tip: editingPlace.tip,
          payer: payerValue,
          images: editingPlace.images || [],
          transportType: editingPlace.transportType || '',
          transportDuration: editingPlace.transportDuration || ''
        };

        // Cascade shifting for this specific day
        dayItem.places = shiftItineraryTimes(dayItem.places);
        found = true;

        // Auto-sync or update linked expense
        const targetDateStr = getTargetDate(plan.startDate, dayNo);
        const expenseIdx = updatedPlan.expenses.findIndex(exp => exp.placeId === editingPlace.id || exp.id === editingPlace.id);
        
        if (costValue > 0) {
          const expenseAmount = Math.round(costCurrency === 'KRW' ? costValue : costValue * (costCurrency === (plan.currency || 'KRW') ? exchangeRate.rate : (FALLBACK_KRW_RATES[costCurrency] || 1)));
          const updatedExpenseItem = {
            id: editingPlace.id,
            placeId: editingPlace.id,
            title: `[일정] ${editingPlace.name}`,
            amount: expenseAmount,
            originalAmount: costValue,
            currency: costCurrency,
            payer: payerValue,
            date: targetDateStr
          };
          if (expenseIdx !== -1) {
            updatedPlan.expenses[expenseIdx] = updatedExpenseItem;
          } else {
            updatedPlan.expenses.push(updatedExpenseItem);
          }
        } else {
          // If cost became 0 or empty, delete the linked expense
          if (expenseIdx !== -1) {
            updatedPlan.expenses.splice(expenseIdx, 1);
          }
        }
        break;
      }
    }

    if (found) {
      saveUpdatedPlan(updatedPlan);
    }
    setEditingPlace(null);
  };

  // Delete Itinerary Place
  const handleDeletePlace = (placeId) => {
    openConfirm("🗑️ 일정 삭제", "정말로 이 세부 일정을 삭제하시겠습니까?", () => {
      const updatedPlan = { ...plan };
    let found = false;

    for (let d = 0; d < updatedPlan.itinerary.length; d++) {
      const dayItem = updatedPlan.itinerary[d];
      const idx = dayItem.places.findIndex(p => p.id === placeId);
      if (idx !== -1) {
        dayItem.places.splice(idx, 1);
        found = true;
        break;
      }
    }

    // Also delete any linked expense
    const expenseIdx = updatedPlan.expenses.findIndex(exp => exp.placeId === placeId || exp.id === placeId);
    if (expenseIdx !== -1) {
      updatedPlan.expenses.splice(expenseIdx, 1);
    }

    if (found) {
      saveUpdatedPlan(updatedPlan);
    }
    setEditingPlace(null);
    });
  };

  // Toggle Reservation Complete state directly
  const handleToggleReservationComplete = (e, placeId) => {
    e.stopPropagation();
    const updatedPlan = { ...plan };
    let found = false;
    for (const dayItem of updatedPlan.itinerary) {
      const place = dayItem.places.find(p => p.id === placeId);
      if (place) {
        place.isReservationCompleted = !place.isReservationCompleted;
        found = true;
        break;
      }
    }
    if (found) {
      saveUpdatedPlan(updatedPlan);
    }
  };

  // Anniversary Handlers
  const handleAddAnniversary = async (e) => {
    e.preventDefault();
    if (!newAnniversary.name) return;

    try {
      const response = await fetch('/api/anniversaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnniversary)
      });
      if (response.ok) {
        await fetchAnniversaries();
        setShowAddAnniversaryModal(false);
      }
    } catch (err) {
      console.error("Failed to add anniversary:", err);
    }
  };

  const handleSaveAnniversaryEdit = async (e) => {
    e.preventDefault();
    if (!editingAnniversary || !editingAnniversary.name) return;

    try {
      const response = await fetch('/api/anniversaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAnniversary.rawId,
          name: editingAnniversary.name,
          year: editingAnniversary.year,
          month: editingAnniversary.month,
          day: editingAnniversary.day,
          isLunar: editingAnniversary.isLunar,
          type: editingAnniversary.type
        })
      });
      if (response.ok) {
        await fetchAnniversaries();
        setEditingAnniversary(null);
      }
    } catch (err) {
      console.error("Failed to update anniversary:", err);
    }
  };

  const handleDeleteAnniversary = (id) => {
    openConfirm("🗑️ 기념일 삭제", "정말로 이 기념일을 삭제하시겠습니까?", async () => {
      try {
        const response = await fetch(`/api/anniversaries/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await fetchAnniversaries();
          setEditingAnniversary(null);
        }
      } catch (err) {
        console.error("Failed to delete anniversary:", err);
      }
    });
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
      assignee: newCheck.assignee || '미지정',
      category: newCheck.category || '공통'
    };
    updatedPlan.checklists.push(newItem);
    
    saveUpdatedPlan(updatedPlan);
    setNewCheck({ title: '', assignee: '', category: '공통' });
    setShowModal(false);
  };

  // Edit Checklist Item
  const handleEditChecklist = (e) => {
    e.preventDefault();
    if (!editingCheck || !editingCheck.title) return;

    const updatedPlan = { ...plan };
    const idx = updatedPlan.checklists.findIndex(c => c.id === editingCheck.id);
    if (idx !== -1) {
      updatedPlan.checklists[idx] = {
        ...updatedPlan.checklists[idx],
        title: editingCheck.title,
        assignee: editingCheck.assignee || '미지정',
        category: editingCheck.category || '공통'
      };
      saveUpdatedPlan(updatedPlan);
    }
    setEditingCheck(null);
  };

  // Delete Checklist Item
  const handleDeleteChecklist = (itemId) => {
    const updatedPlan = { ...plan };
    updatedPlan.checklists = updatedPlan.checklists.filter(c => c.id !== itemId);
    saveUpdatedPlan(updatedPlan);
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
      date: newExpense.date || new Date().toISOString().split('T')[0],
      category: newExpense.category || '기타'
    };
    updatedPlan.expenses.push(newItem);

    saveUpdatedPlan(updatedPlan);
    setNewExpense({ title: '', amount: '', payer: '', date: '', category: '기타' });
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
  const activeTrips = plans.filter(p => (currentUser?.role === 'admin' || p.members.includes(currentUser?.name)) && !p.isEvent && p.endDate >= today);
  const pastTrips = plans.filter(p => (currentUser?.role === 'admin' || p.members.includes(currentUser?.name)) && !p.isEvent && p.endDate < today);

  // Calculate total expense
  const totalExpense = plan ? plan.expenses.reduce((sum, item) => sum + item.amount, 0) : 0;
  const planCurrency = plan?.currency || detectTripCurrency(plan?.title).code;
  const planCurrencyMeta = CURRENCY_OPTIONS[planCurrency] || CURRENCY_OPTIONS.KRW;
  const detectedTrip = detectTripCurrency(newTrip.title);
  const selectedTripCurrency = CURRENCY_OPTIONS[newTrip.currency] || detectedTrip;

  const formatCurrency = (amount, currencyCode = planCurrency) => {
    const meta = CURRENCY_OPTIONS[currencyCode] || { symbol: currencyCode, name: currencyCode };
    return `${meta.symbol}${Number(amount || 0).toLocaleString('ko-KR', { maximumFractionDigits: 2 })} ${meta.name}`;
  };

  const formatCostComparison = (amount, currencyCode = planCurrency) => {
    const value = Number(amount || 0);
    if (!value) return '';
    if (currencyCode === 'KRW') {
      if (planCurrency === 'KRW') return formatCurrency(value, 'KRW');
      const foreign = Math.round(value / (exchangeRate.rate || FALLBACK_KRW_RATES[planCurrency] || 1));
      return `${formatCurrency(value, 'KRW')} (≈ ${formatCurrency(foreign, planCurrency)})`;
    }
    const rate = currencyCode === planCurrency
      ? exchangeRate.rate
      : (FALLBACK_KRW_RATES[currencyCode] || 1);
    return `${formatCurrency(value, currencyCode)} (≈ ${formatCurrency(Math.round(value * rate), 'KRW')})`;
  };

  // Render Login Screen if not authenticated
  if (!currentUser) {
    return (
      <div 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh', 
          width: '100vw',
          maxWidth: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          background: 'radial-gradient(circle at top right, #e0e7ff 0%, var(--bg-app) 70%)',
          zIndex: 9999
        }}
      >
        <div className="login-card">
          <div className="login-header">
            <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '8px' }}>📅</span>
            <h1>Travel Squad11</h1>
            <p>가족 전용 소통 공간</p>
          </div>
          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <div className="form-group">
              <label>이름</label>
              <input 
                type="text" 
                required 
                placeholder="" 
                className="form-control" 
                value={loginForm.username} 
                onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} 
              />
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>생년월일</label>
              <input 
                type="password" 
                required 
                placeholder="" 
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
            <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📋</span> 일정 보드
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="user-welcome">👋 <b>{currentUser.name}</b>님</span>
              <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          </header>

          <main className="app-content">
            <button 
              className="submit-btn" 
              style={{ marginBottom: '24px' }} 
              onClick={() => setShowAddTripModal(true)}
            >
              + 새 여행 만들기
            </button>

            {/* 1. Monthly Calendar */}
            {(() => {
              const calendarCells = [];
              const year = currentCalendarDate.getFullYear();
              const month = currentCalendarDate.getMonth();
              
              const firstDayIndex = new Date(year, month, 1).getDay();
              const totalDays = new Date(year, month + 1, 0).getDate();
              const prevMonthTotalDays = new Date(year, month, 0).getDate();

              // Trailing days from previous month
              for (let i = firstDayIndex - 1; i >= 0; i--) {
                const day = prevMonthTotalDays - i;
                const cellYear = month === 0 ? year - 1 : year;
                const cellMonth = month === 0 ? 12 : month;
                calendarCells.push({
                  dateStr: `${cellYear}-${String(cellMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                  dayNum: day,
                  isCurrentMonth: false
                });
              }

              // Days of current month
              for (let i = 1; i <= totalDays; i++) {
                calendarCells.push({
                  dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
                  dayNum: i,
                  isCurrentMonth: true
                });
              }

              // Leading days of next month
              const totalGridCells = calendarCells.length > 35 ? 42 : 35;
              const remainingCells = totalGridCells - calendarCells.length;
              for (let i = 1; i <= remainingCells; i++) {
                const cellYear = month === 11 ? year + 1 : year;
                const cellMonth = month === 11 ? 1 : month + 2;
                calendarCells.push({
                  dateStr: `${cellYear}-${String(cellMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
                  dayNum: i,
                  isCurrentMonth: false
                });
              }

              const getCellEvents = (dateStr) => {
                const yearAnniversaries = getAnniversariesForYear(year, anniversaries);
                const cellAnniversaries = yearAnniversaries.filter(a => a.dateStr === dateStr);

                const normalEvents = plans.filter(p => {
                  const hasAccess = currentUser?.role === 'admin' || p.members.includes(currentUser?.name);
                  if (!hasAccess) return false;
                  return p.startDate <= dateStr && dateStr <= p.endDate;
                });

                return [...cellAnniversaries, ...normalEvents];
              };

              const getHoliday = (dateStr) => {
                return holidays.find(h => h.date === dateStr);
              };

              const handlePrevMonth = () => {
                setCurrentCalendarDate(new Date(year, month - 1, 1));
              };

              const handleNextMonth = () => {
                setCurrentCalendarDate(new Date(year, month + 1, 1));
              };

              const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
              const todayStr = new Date().toISOString().split('T')[0];
              const selectedEvents = selectedCalendarDate ? getCellEvents(selectedCalendarDate) : [];

              return (
                <div className="calendar-card">
                  <div className="calendar-header">
                    <h3>📅 {year}년 {month + 1}월</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="calendar-nav-btn" onClick={handlePrevMonth}>&lt;</button>
                      <button className="calendar-nav-btn" onClick={handleNextMonth}>&gt;</button>
                    </div>
                  </div>

                  <div className="calendar-grid">
                    {weekdays.map((w, idx) => (
                      <div 
                        key={w} 
                        className="calendar-day-label"
                        style={{ color: idx === 0 ? 'var(--danger)' : idx === 6 ? '#2563eb' : 'var(--text-muted)' }}
                      >
                        {w}
                      </div>
                    ))}
                    {calendarCells.map((cell, idx) => {
                      const isToday = cell.dateStr === todayStr;
                      const isSelected = cell.dateStr === selectedCalendarDate;
                      const cellEvents = getCellEvents(cell.dateStr);

                      // Check day of week
                      const parts = cell.dateStr.split('-');
                      const cellDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                      const dayOfWeek = cellDate.getDay();

                      // Check holiday
                      const holiday = getHoliday(cell.dateStr);
                      const isHoliday = !!holiday;

                      // Style day number
                      let dayColor = 'var(--text-main)';
                      if (dayOfWeek === 0 || isHoliday) {
                        dayColor = 'var(--danger)'; // Red for Sunday or Holiday
                      } else if (dayOfWeek === 6) {
                        dayColor = '#2563eb'; // Blue for Saturday
                      }

                      return (
                        <div
                          key={idx}
                          className={`calendar-day ${cell.isCurrentMonth ? '' : 'inactive'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedCalendarDate(cell.dateStr)}
                        >
                          <span className="day-number" style={{ color: isSelected ? 'white' : dayColor }}>
                            {cell.dayNum}
                          </span>

                          {/* Holiday label */}
                          {isHoliday && (
                            <span 
                              style={{ 
                                fontSize: '0.52rem', 
                                color: isSelected ? 'rgba(255,255,255,0.9)' : 'var(--danger)', 
                                fontWeight: 'bold',
                                textAlign: 'center',
                                display: 'block',
                                marginTop: '1px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                width: '100%'
                              }}
                              title={HOLIDAY_NAMES_KO[holiday.name] || holiday.name}
                            >
                              {HOLIDAY_NAMES_KO[holiday.name] || holiday.name}
                            </span>
                          )}

                          <div className="calendar-events">
                            {cellEvents.map(e => (
                              <div
                                key={e.id}
                                className={`calendar-dot ${e.isAnniversary ? 'anniversary' : (e.isEvent ? 'event' : 'trip')}`}
                                title={e.title}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Date Details & Actions */}
                  {selectedCalendarDate && (
                    <div className="selected-day-panel">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0 }}>📌 {selectedCalendarDate} 일정 목록</h4>
                        <button className="close-btn" style={{ fontSize: '1.25rem', padding: '0 4px', cursor: 'pointer' }} onClick={() => setSelectedCalendarDate(null)}>×</button>
                      </div>
                      {selectedEvents.length === 0 ? (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>등록된 일정이 없습니다.</div>
                      ) : (
                        <div className="selected-day-events-list">
                          {selectedEvents.map(e => (
                            <div
                              key={e.id}
                              className="selected-day-event-item"
                              onClick={() => {
                                if (e.isAnniversary) {
                                  if (currentUser?.role === 'admin') {
                                    setEditingAnniversary(e);
                                  }
                                } else if (!e.isEvent) {
                                  fetchSinglePlan(e.id);
                                }
                              }}
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                cursor: e.isAnniversary 
                                  ? (currentUser?.role === 'admin' ? 'pointer' : 'default') 
                                  : 'pointer' 
                              }}
                            >
                              <span>
                                <span className={`event-type-tag ${e.isAnniversary ? 'anniversary' : (e.isEvent ? 'event' : 'trip')}`} style={{ marginRight: '6px' }}>
                                  {e.isAnniversary ? '기념일' : (e.isEvent ? '행사' : '여행')}
                                </span>
                                {e.title}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {!e.isEvent && !e.isAnniversary && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>자세히 ➔</span>}
                                {e.isAnniversary && currentUser?.role === 'admin' && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>수정 ➔</span>}
                                {!e.isAnniversary && (
                                  <button
                                    className="logout-btn"
                                    style={{
                                      padding: '2px 8px',
                                      fontSize: '0.7rem',
                                      margin: 0,
                                      border: '1px solid var(--danger)',
                                      borderRadius: '6px',
                                      color: 'var(--danger)',
                                      background: 'transparent',
                                      cursor: 'pointer'
                                    }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleDeletePlan(e.id);
                                    }}
                                  >
                                    삭제
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="selected-day-actions">
                        <button
                          className="btn-secondary-sm"
                          onClick={() => {
                            setNewEvent({
                              title: '',
                              date: selectedCalendarDate,
                              description: '',
                              members: [currentUser.name]
                            });
                            setShowAddEventModal(true);
                          }}
                        >
                          🔔 가족 행사 등록
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            className="btn-secondary-sm"
                            style={{ border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent' }}
                            onClick={() => {
                              setNewAnniversary({
                                name: '',
                                year: new Date().getFullYear(),
                                month: 1,
                                day: 1,
                                isLunar: false,
                                type: 'birthday'
                              });
                              setShowAddAnniversaryModal(true);
                            }}
                          >
                            🎉 기념일 등록
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })() }

            {/* Active & Upcoming Trips */}
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📅 예정된 & 진행 중인 여행</span>
              <button 
                className="btn-secondary-sm" 
                style={{ flex: 'none', padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => {
                  fetchTrashPlans();
                  setShowTrashModal(true);
                }}
              >
                🗑️ 휴지통
              </button>
            </div>
            {activeTrips.length === 0 ? (
              <div className="empty-state">진행 예정인 여행이 없습니다.</div>
            ) : (
              activeTrips.map(p => (
                <div key={p.id} className="trip-card" onClick={() => fetchSinglePlan(p.id)}>
                  <div className="trip-card-header">
                    <span className="badge badge-active">예정됨</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                      <span className="trip-date">{p.startDate} ~ {p.endDate}</span>
                      <button
                        className="delete-trip-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlan(p.id);
                        }}
                        title="일정 삭제"
                      >
                        ✕
                      </button>
                    </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                      <span className="trip-date">{p.startDate} ~ {p.endDate}</span>
                      <button
                        className="delete-trip-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlan(p.id);
                        }}
                        title="일정 삭제"
                      >
                        ✕
                      </button>
                    </div>
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
          <header className="app-header" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '12px 16px', 
            gap: '8px',
            position: 'sticky',
            top: 0,
            zIndex: 999,
            backgroundColor: 'var(--bg-app, #ffffff)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            borderBottom: '1px solid var(--border)'
          }}>
            <button className="back-btn" onClick={() => setView('home')} style={{ fontSize: '1.25rem', padding: '6px', margin: 0, display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }} title="홈으로 이동">🏠</button>
            <div className="header-tabs" style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              <button className={`tab-btn ${activeTab === 'itinerary' ? 'active' : ''}`} style={{ padding: '8px 10px', fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', whiteSpace: 'nowrap' }} onClick={() => setActiveTab('itinerary')}>
                <span>📅</span><span>일정</span>
              </button>
              <button className={`tab-btn ${activeTab === 'checklist' ? 'active' : ''}`} style={{ padding: '8px 10px', fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', whiteSpace: 'nowrap' }} onClick={() => setActiveTab('checklist')}>
                <span>🎒</span><span>준비물</span>
              </button>
              <button className={`tab-btn ${activeTab === 'expense' ? 'active' : ''}`} style={{ padding: '8px 10px', fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', whiteSpace: 'nowrap' }} onClick={() => setActiveTab('expense')}>
                <span>💰</span><span>경비</span>
              </button>
              <button className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} style={{ padding: '8px 10px', fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', whiteSpace: 'nowrap' }} onClick={() => {
                setActiveTab('members');
                // Reset sub-filters on changing tabs
                setSelectedDayFilter('all');
                setSelectedChecklistFilter('all');
                setSelectedExpenseFilter('all');
              }}>
                <span>👥</span><span>가족</span>
              </button>
            </div>
            <div style={{ width: '32px' }}></div>
          </header>

          {/* Main Content Area */}
          <main className="app-content" style={{ marginTop: '0' }}>
            {/* 1. ITINERARY TAB */}
            {activeTab === 'itinerary' && (
              <div>
                <div className="trip-summary-panel">
                  <div className="trip-summary-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '12px' }}>
                    <h2 className="trip-summary-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 'bold' }}>
                      {plan.title}
                    </h2>
                    <button 
                      className="btn-secondary-sm" 
                      style={{ 
                        flex: 'none', 
                        width: 'fit-content', 
                        padding: '6px 12px', 
                        fontSize: '0.75rem', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '4px', 
                        margin: 0,
                        marginLeft: 'auto'
                      }}
                      onClick={openEditMetaModal}
                    >
                      ✏️정보 편집
                    </button>
                  </div>
                  <div className="trip-date-summary">🗓️ {plan.startDate} ~ {plan.endDate}</div>
                  <div className="exchange-rate-line">
                    💱 현재 환율: 1{planCurrencyMeta.name} ≈ {exchangeRate.rate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}원
                    <span className={`rate-source ${exchangeRate.source === '실시간' ? 'live' : ''}`}>
                      {exchangeRate.loading ? '조회 중' : exchangeRate.source}
                    </span>
                    {exchangeRate.updatedAt && <small>{exchangeRate.updatedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 갱신</small>}
                  </div>
                  {(plan.accommodation || getAutoAccommodations().length > 0 || plan.transportation?.length > 0) && (
                    <div className="travel-meta-grid">
                      {(plan.accommodation || getAutoAccommodations().length > 0) && (() => {
                        const autoAccs = getAutoAccommodations();
                        const hasManualAcc = !!plan.accommodation;
                        return (
                          <div className="travel-meta-card">
                            <strong>🏨 숙소</strong>
                            {hasManualAcc ? (
                              <>
                                <span>{plan.accommodation.name}</span>
                                <small>{[plan.accommodation.location, plan.accommodation.highlight].filter(Boolean).join(' · ')}</small>
                              </>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {autoAccs.length === 1 ? (
                                  <>
                                    <span>{autoAccs[0].name}</span>
                                    <small style={{ color: 'var(--success)', fontWeight: 600 }}>
                                      [{autoAccs[0].day}일차 일정 자동 반영{autoAccs[0].address ? ` · ${autoAccs[0].address}` : ''}]
                                    </small>
                                  </>
                                ) : (
                                  autoAccs.map((acc, idx) => (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', borderBottom: idx < autoAccs.length - 1 ? '1px dashed var(--border)' : 'none', paddingBottom: idx < autoAccs.length - 1 ? '4px' : '0', marginBottom: idx < autoAccs.length - 1 ? '4px' : '0' }}>
                                      <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{idx + 1}차: {acc.name}</span>
                                      <small style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.72rem' }}>
                                        [{acc.day}일차 일정{acc.address ? ` · ${acc.address}` : ''}]
                                      </small>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      {plan.transportation?.length > 0 && (
                        <div className="travel-meta-card">
                          <strong>🚇 교통</strong>
                          {plan.transportation.map((item, index) => (
                            <span key={`${item.type}-${index}`}>
                              {item.type}{item.route ? ` · ${item.route}` : ''}
                              {item.cost ? ` · ${formatCostComparison(item.cost, item.currency)}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* 2차 Day 필터 바 */}
                {plan.itinerary.length > 0 && (
                  <div className="sub-filter-bar" style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    overflowX: 'auto', 
                    padding: '12px 4px 16px 4px', 
                    scrollbarWidth: 'none',
                    position: 'sticky',
                    top: '58px',
                    zIndex: 90,
                    backgroundColor: 'var(--bg-app)'
                  }}>
                    <button 
                      className={`filter-chip ${selectedDayFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedDayFilter('all')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: '1px solid var(--border)',
                        background: selectedDayFilter === 'all' ? 'var(--primary)' : 'var(--bg-card)',
                        color: selectedDayFilter === 'all' ? '#fff' : 'var(--text)',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      전체 일정
                    </button>
                    {Array.from({ length: Math.max(1, Math.ceil((new Date(plan.endDate) - new Date(plan.startDate)) / (1000 * 60 * 60 * 24)) + 1) }).map((_, i) => {
                      const dVal = i + 1;
                      const isActive = selectedDayFilter === String(dVal);
                      return (
                        <button 
                          key={dVal}
                          className={`filter-chip ${isActive ? 'active' : ''}`}
                          onClick={() => setSelectedDayFilter(String(dVal))}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            background: isActive ? 'var(--primary)' : 'var(--bg-card)',
                            color: isActive ? '#fff' : 'var(--text)',
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          {dVal}일차
                        </button>
                      );
                    })}
                  </div>
                )}

                {plan.itinerary.length === 0 ? (
                  <div className="empty-state">
                    아직 등록된 일정이 없습니다. 우측 하단의 + 버튼을 눌러 첫 일정을 등록해 보세요!
                  </div>
                ) : (
                  (() => {
                    const filteredItinerary = selectedDayFilter === 'all'
                      ? plan.itinerary
                      : plan.itinerary.filter(d => d.day === Number(selectedDayFilter));
                    
                    if (filteredItinerary.length === 0) {
                      return <div className="empty-state">선택한 날짜에 등록된 일정이 없습니다.</div>;
                    }

                    return filteredItinerary.map((dayItem) => (
                      <div key={dayItem.day} className="card" style={{ padding: '20px 16px' }}>
                      <h3 className="card-title day-heading">
                        {dayItem.day}일차
                        {dayItem.title && <span className="day-theme">{dayItem.title}</span>}
                        <span className="day-date">({dayItem.date})</span>
                      </h3>
                      <div className="timeline">
                        {dayItem.places.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>아직 등록된 일정이 없습니다.</div>
                        ) : (
                          dayItem.places.map((place, idx) => (
                            <React.Fragment key={place.id}>
                              <div className="timeline-item" style={{ marginBottom: '8px' }}>
                                <div className="timeline-dot"></div>
                              <div 
                                className="timeline-content"
                                onMouseDown={(e) => handleStartPress(e, place)}
                                onMouseUp={(e) => handleCancelPress(e)}
                                onMouseLeave={(e) => handleCancelPress(e)}
                                onTouchStart={(e) => handleStartPress(e, place)}
                                onTouchEnd={(e) => handleCancelPress(e)}
                                onTouchMove={(e) => handleCancelPress(e)}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlace({ ...place, duration: place.duration || 0 });
                                }}
                                title="더블클릭 또는 길게 눌러 일정 수정"
                              >
                                <div className="timeline-time">
                                  {place.time}
                                  {place.duration > 0 && (
                                    <span className="timeline-duration">
                                      🕒 {place.duration >= 60 
                                        ? `${Math.floor(place.duration / 60)}시간${place.duration % 60 > 0 ? ` ${place.duration % 60}분` : ''}` 
                                        : `${place.duration}분`} 체류
                                    </span>
                                  )}
                                </div>
                                <div className="timeline-title-row">
                                  <div className="timeline-place">{place.name}</div>
                                  {place.category && <span className={`category-badge category-${place.category}`}>{place.category}</span>}
                                </div>
                                {place.description && <div className="timeline-desc">{place.description}</div>}
                                
                                {place.images && place.images.length > 0 && (
                                  <div className="timeline-images-gallery" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 0', scrollbarWidth: 'thin' }}>
                                    {place.images.map((url, imgIdx) => (
                                      <img
                                        key={imgIdx}
                                        src={url}
                                        alt={`${place.name} ${imgIdx}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLightboxImage(url);
                                        }}
                                        style={{
                                          width: '100px',
                                          height: '100px',
                                          objectFit: 'cover',
                                          borderRadius: '8px',
                                          cursor: 'pointer',
                                          border: '1px solid var(--border)',
                                          flexShrink: 0,
                                          transition: 'transform 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'scale(1.0)'}
                                      />
                                    ))}
                                  </div>
                                )}

                                {(place.estimatedCost > 0 || place.cost > 0) && (
                                  <div className="timeline-cost">
                                    💴 {formatCostComparison(place.estimatedCost ?? place.cost, place.currency || (place.estimatedCost ? planCurrency : 'KRW'))}
                                    {place.payer && <span> · {place.payer} 결제</span>}
                                  </div>
                                )}
                                {place.tip && <div className="timeline-tip">💡 {place.tip}</div>}
                                
                                {/* Unified Action Buttons Row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                  {/* Map Icon Link */}
                                  <a
                                    href={planCurrency === 'KRW'
                                      ? `https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(place.address || place.name)}`
                                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address || place.name)}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    title={place.address ? `지도 보기: ${place.address}` : '지도 검색'}
                                    className="comments-toggle"
                                    style={{ marginTop: 0, padding: '4px 8px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none' }}
                                  >
                                    <span>🗺️</span><span>보기</span>
                                  </a>

                                  {/* Comments Toggle Button */}
                                  <div 
                                    className="comments-toggle" 
                                    onClick={() => toggleCommentsDrawer(place.id)}
                                    style={{ marginTop: 0 }}
                                  >
                                    💬 {place.comments ? place.comments.length : 0}개 보기
                                  </div>

                                  {/* Reservation Badge */}
                                  {place.needsReservation && (
                                    place.isReservationCompleted ? (
                                      <div 
                                        className="reservation-completed" 
                                        onClick={(e) => handleToggleReservationComplete(e, place.id)}
                                        title="클릭하여 예약 필요로 상태 전환"
                                        style={{ 
                                          marginTop: 0, 
                                          padding: '4px 8px', 
                                          borderRadius: '6px', 
                                          color: '#047857', 
                                          backgroundColor: '#d1fae5', 
                                          fontSize: '0.75rem', 
                                          fontWeight: 700, 
                                          display: 'inline-block',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        ✅ 예약 완료
                                      </div>
                                    ) : (
                                      <div 
                                        className="reservation-required" 
                                        onClick={(e) => handleToggleReservationComplete(e, place.id)}
                                        title="클릭하여 예약 완료로 상태 전환"
                                        style={{ marginTop: 0, padding: '4px 8px', cursor: 'pointer' }}
                                      >
                                        🎫 예약 필요
                                      </div>
                                    )
                                  )}
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
                            {idx < dayItem.places.length - 1 && !(
                              place.address && 
                              dayItem.places[idx+1]?.address && 
                              place.address.trim() !== '' && 
                              place.address.trim().toLowerCase() === dayItem.places[idx+1].address.trim().toLowerCase()
                            ) && (
                              <div className="route-recommend-box" style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                margin: '2px 0 2px 42px', 
                                gap: '8px',
                                position: 'relative' 
                              }}>
                                <div style={{ 
                                  position: 'absolute', 
                                  left: '-26px', 
                                  top: '-18px', 
                                  bottom: '-10px', 
                                  width: '2px', 
                                  borderLeft: '2px dashed var(--primary)', 
                                  opacity: 0.3 
                                }}></div>
                                
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border)',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  boxShadow: 'var(--shadow-sm)'
                                }}>
                                  {/* Transit info text */}
                                  {place.transportType ? (
                                    <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                                      {place.transportType === '대중교통' && '🚌 '}
                                      {place.transportType === '자차' && '🚗 '}
                                      {place.transportType === '도보' && '🚶 '}
                                      {place.transportType === '기타' && '🚇 '}
                                      {place.transportType} {place.transportDuration ? `${place.transportDuration}분` : ''} 이동
                                    </span>
                                  ) : (
                                    <span 
                                      style={{ cursor: 'pointer', opacity: 0.7 }} 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingPlace({ ...place, duration: place.duration || 0 });
                                      }}
                                      title="클릭하여 이동 정보 입력"
                                    >
                                      🚇 이동 정보 기입
                                    </span>
                                  )}

                                  <span style={{ color: 'var(--border)' }}>|</span>

                                  {/* Maps link */}
                                  <a
                                    href={planCurrency === 'KRW'
                                      ? `https://map.naver.com/p/directions/${encodeURIComponent(place.address || place.name)},,/${encodeURIComponent(dayItem.places[idx+1].address || dayItem.places[idx+1].name)},,/transit`
                                      : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(place.address || place.name)}&destination=${encodeURIComponent(dayItem.places[idx+1].address || dayItem.places[idx+1].name)}&travelmode=transit`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      color: 'var(--primary)',
                                      textDecoration: 'none',
                                      fontWeight: '700',
                                      fontSize: '0.72rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px'
                                    }}
                                    title="지도 검색 열기"
                                  >
                                    🗺️ 이동경로(test) ➔
                                  </a>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        ))
                        )}
                      </div>
                    </div>
                  ))
                })()
              )}
              </div>
            )}

            {/* 2. CHECKLIST TAB */}
            {activeTab === 'checklist' && (
              <div className="card">
                <h3 className="card-title">🎒 체크리스트</h3>
                
                {/* 2차 준비물 필터 바 */}
                <div className="sub-filter-bar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 0 16px 0', scrollbarWidth: 'none' }}>
                  {['all', '공통', '개인', '예약', '기타'].map(cat => (
                    <button
                      key={cat}
                      className={`filter-chip ${selectedChecklistFilter === cat ? 'active' : ''}`}
                      onClick={() => setSelectedChecklistFilter(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: '1px solid var(--border)',
                        background: selectedChecklistFilter === cat ? 'var(--primary)' : 'var(--bg-card)',
                        color: selectedChecklistFilter === cat ? '#fff' : 'var(--text)',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {cat === 'all' ? '전체' : cat}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {(() => {
                    const filtered = plan.checklists.filter(item => {
                      const itemCat = item.category || '공통';
                      return selectedChecklistFilter === 'all' || itemCat === selectedChecklistFilter;
                    });

                    if (filtered.length === 0) {
                      return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>선택한 분류의 준비물이 없습니다.</div>;
                    }

                    return filtered.map((item) => (
                      <div key={item.id} className="checklist-item" onClick={() => handleToggleCheck(item.id)}>
                        <div className={`checkbox-custom ${item.checked ? 'checked' : ''}`}></div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div className={`checklist-text ${item.checked ? 'checked' : ''}`}>{item.title}</div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🏷️ {item.category || '공통'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="checklist-assignee" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.assignee}</div>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCheck(item);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              padding: '4px',
                              opacity: 0.7
                            }}
                            title="수정"
                          >
                            ✏️
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`"${item.title}" 준비물을 삭제하시겠습니까?`)) {
                                handleDeleteChecklist(item.id);
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '0.9rem',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '4px',
                              opacity: 0.7
                            }}
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* 3. EXPENSE TAB */}
            {activeTab === 'expense' && (
              (() => {
                const filteredExpenses = plan.expenses.filter(item => {
                  const itemCat = item.category || '기타';
                  return selectedExpenseFilter === 'all' || itemCat === selectedExpenseFilter;
                });
                const filteredTotal = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

                return (
                  <div>
                    {/* 2차 경비 필터 바 */}
                    <div className="sub-filter-bar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 4px 16px 4px', scrollbarWidth: 'none' }}>
                      {['all', '교통', '숙박', '식비', '쇼핑', '관광', '기타'].map(cat => (
                        <button
                          key={cat}
                          className={`filter-chip ${selectedExpenseFilter === cat ? 'active' : ''}`}
                          onClick={() => setSelectedExpenseFilter(cat)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            background: selectedExpenseFilter === cat ? 'var(--primary)' : 'var(--bg-card)',
                            color: selectedExpenseFilter === cat ? '#fff' : 'var(--text)',
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          {cat === 'all' ? '전체' : cat}
                        </button>
                      ))}
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white' }}>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                        {selectedExpenseFilter === 'all' ? '총 지출액' : `${selectedExpenseFilter} 지출액`}
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px' }}>
                        {filteredTotal.toLocaleString()} 원
                      </div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '8px' }}>
                        인당 평균: {Math.round(filteredTotal / plan.members.length).toLocaleString()} 원 ({plan.members.length}명 기준)
                      </div>
                    </div>

                    <div className="card">
                      <h3 className="card-title">💰 경비 상세 내역</h3>
                      <div>
                        {filteredExpenses.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>등록된 경비 내역이 없습니다.</div>
                        ) : (
                          filteredExpenses.map((item) => (
                            <div key={item.id} className="expense-item">
                              <div className="expense-info">
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  {item.title} 
                                  <span style={{ fontSize: '0.68rem', fontWeight: 'normal', color: 'var(--text-muted)', backgroundColor: 'var(--border)', padding: '2px 6px', borderRadius: '4px' }}>
                                    {item.category || '기타'}
                                  </span>
                                </h4>
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
                );
              })()
            )}

            {/* 4. MEMBERS TAB */}
            {activeTab === 'members' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="card-title" style={{ margin: 0 }}>👥 함께하는 가족</h3>
                  {(currentUser.role === 'admin' || plan.members.includes(currentUser.name)) && (
                    <button 
                      className="btn-secondary-sm"
                      style={{ fontSize: '0.85rem', padding: '8px 16px', flex: 'none', width: 'auto' }}
                      onClick={() => {
                        setTempMembers([...plan.members]);
                        setShowEditMembersModal(true);
                      }}
                    >
                      ⚙️ 가족 추가/제외
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(() => {
                    const sortedMembers = [...plan.members].sort((a, b) => {
                      const uA = FAM_USERS.find(u => u.name === a);
                      const uB = FAM_USERS.find(u => u.name === b);
                      const ageA = uA ? calculateManAge(uA.pin) : -1;
                      const ageB = uB ? calculateManAge(uB.pin) : -1;
                      return ageB - ageA;
                    });
                    return sortedMembers.map((m, idx) => {
                      const isPlanManager = m === (plan.manager || '이현수');
                      const userObj = FAM_USERS.find(u => u.name === m);
                      const age = userObj ? calculateManAge(userObj.pin) : null;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                          <div className="avatar" style={{ margin: 0, width: '40px', height: '40px', fontSize: '1.1rem' }}>{m[0]}</div>
                          <div>
                            <div style={{ fontWeight: '600' }}>
                              {m} 
                              {userObj?.engName && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 'normal' }}>{userObj.engName}</span>}
                              {age !== null && <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '6px' }}>(만 {age}세)</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                              <span>{isPlanManager ? '👑 여행 총괄 관리자' : '참여자'}</span>
                              {userObj?.birth && (
                                <>
                                  <span style={{ opacity: 0.5 }}>|</span>
                                  <span>🎂 {userObj.birth}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </main>

          {/* Floating Action Button inside Details */}
          {activeTab !== 'members' && (
            <button className="fab" onClick={() => setShowModal(true)}>+</button>
          )}

          {/* Bottom Navigation removed and merged to Header */}

          {/* Add Item Modal */}
          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>
                    {activeTab === 'itinerary' && '📅 일정 추가'}
                    {activeTab === 'checklist' && '🎒 준비물 추가'}
                    {activeTab === 'expense' && '💰 경비 추가'}
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
                          <option key={i} value={i + 1}>{i + 1}일차</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>시간 (HH:MM)</label>
                      <input type="time" required className="form-control" value={newPlace.time} onChange={e => setNewPlace({ ...newPlace, time: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>체류 시간 (점유 시간)</label>
                      <select className="form-control" value={newPlace.duration} onChange={e => setNewPlace({ ...newPlace, duration: Number(e.target.value) })}>
                        <option value={0}>설정 안 함 (0분)</option>
                        <option value={30}>30분</option>
                        <option value={60}>1시간</option>
                        <option value={90}>1시간 30분</option>
                        <option value={120}>2시간</option>
                        <option value={150}>2시간 30분</option>
                        <option value={180}>3시간</option>
                        <option value={240}>4시간</option>
                        <option value={300}>5시간</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>장소/일정 이름</label>
                      <input type="text" required placeholder="예: 함덕 해수욕장" className="form-control" value={newPlace.name} onChange={e => setNewPlace({ ...newPlace, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>주소 (선택사항)</label>
                      <input type="text" placeholder="예: 제주 제주시 조천읍 함덕리" className="form-control" value={newPlace.address || ''} onChange={e => setNewPlace({ ...newPlace, address: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>카테고리</label>
                      <select className="form-control" value={newPlace.category} onChange={e => setNewPlace({ ...newPlace, category: e.target.value })}>
                        {['관광', '식사', '쇼핑', '이동', '숙소', '기타'].map(category => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>메모/설명</label>
                      <textarea placeholder="예: 바다 구경 및 망고주스 마시기" className="form-control" value={newPlace.description} onChange={e => setNewPlace({ ...newPlace, description: e.target.value })}></textarea>
                    </div>
                    <div className="form-group">
                      <label>예상 비용 (선택사항)</label>
                      <div className="cost-input-row">
                        <select className="form-control currency-select" value={newPlace.currency || planCurrency} onChange={e => setNewPlace({ ...newPlace, currency: e.target.value })}>
                          <option value={planCurrency}>{planCurrencyMeta.symbol} {planCurrencyMeta.name}</option>
                          {planCurrency !== 'KRW' && <option value="KRW">₩ 원</option>}
                        </select>
                        <input type="number" min="0" placeholder="금액 입력" className="form-control" value={newPlace.estimatedCost} onChange={e => setNewPlace({ ...newPlace, estimatedCost: e.target.value })} />
                      </div>
                      {newPlace.estimatedCost && <div className="cost-preview">{formatCostComparison(newPlace.estimatedCost, newPlace.currency || planCurrency)}</div>}
                    </div>
                    <label className="reservation-check">
                      <input type="checkbox" checked={newPlace.needsReservation} onChange={e => setNewPlace({ ...newPlace, needsReservation: e.target.checked })} />
                      🎫 사전 예약이 필요한 일정
                    </label>
                    {newPlace.needsReservation && (
                      <label className="reservation-check" style={{ marginTop: '8px', marginLeft: '16px' }}>
                        <input type="checkbox" checked={newPlace.isReservationCompleted || false} onChange={e => setNewPlace({ ...newPlace, isReservationCompleted: e.target.checked })} />
                        ✅ 예약 완료함
                      </label>
                    )}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', marginBottom: '12px' }}>
                      <div className="form-group" style={{ flex: 1.5, marginBottom: 0 }}>
                        <label>다음 장소 이동 수단</label>
                        <select className="form-control" value={newPlace.transportType || ''} onChange={e => setNewPlace({ ...newPlace, transportType: e.target.value })}>
                          <option value="">설정 안 함</option>
                          <option value="대중교통">🚌 대중교통</option>
                          <option value="자차">🚗 자차</option>
                          <option value="도보">🚶 도보</option>
                          <option value="기타">🚇 기타</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>소요 시간 (분)</label>
                        <input type="number" min="0" placeholder="예: 15" className="form-control" value={newPlace.transportDuration || ''} onChange={e => setNewPlace({ ...newPlace, transportDuration: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>팁/메모</label>
                      <textarea placeholder="예: 해질 무렵 방문, 온라인 예매 권장" className="form-control" value={newPlace.tip} onChange={e => setNewPlace({ ...newPlace, tip: e.target.value })}></textarea>
                    </div>
                    <div className="form-group">
                      <label>결제자</label>
                      <select className="form-control" value={newPlace.payer || currentUser.name} onChange={e => setNewPlace({ ...newPlace, payer: e.target.value })}>
                        <option value="미지정">미지정</option>
                        {plan.members.map((m, idx) => (
                          <option key={idx} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>📸 사진 첨부 (클릭하여 파일 선택 / Ctrl+V 붙여넣기 / 드래그앤드롭)</label>
                      <div 
                        className={`image-upload-zone ${uploading ? 'uploading' : ''}`}
                        onClick={() => addImgInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropImages(e, false)}
                        onPaste={(e) => handlePasteImages(e, false)}
                        tabIndex={0}
                        style={{
                          border: '2px dashed var(--border)',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          backgroundColor: 'var(--bg-muted, #f9f9f9)',
                          transition: 'all 0.2s',
                          outline: 'none',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {uploading ? '⏳ 이미지 업로드 중...' : '🖼️ 복사한 이미지를 여기에 붙여넣거나 클릭해서 업로드'}
                      </div>
                      <input 
                        type="file" 
                        ref={addImgInputRef} 
                        style={{ display: 'none' }} 
                        multiple 
                        accept="image/*" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleImageAttach(e.target.files, false);
                          }
                        }} 
                      />
                      {newPlace.images && newPlace.images.length > 0 && (
                        <div className="image-preview-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                          {newPlace.images.map((url, index) => (
                            <div key={index} className="image-preview-wrapper" style={{ position: 'relative', width: '70px', height: '70px' }}>
                              <img 
                                src={url} 
                                alt="preview" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} 
                              />
                              <button 
                                type="button" 
                                className="remove-img-btn" 
                                onClick={() => handleRemoveImage(index, false)}
                                style={{
                                  position: 'absolute',
                                  top: '-6px',
                                  right: '-6px',
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(0,0,0,0.6)',
                                  color: '#fff',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  padding: 0
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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
                    <div className="form-group">
                      <label>분류</label>
                      <select className="form-control" value={newCheck.category || '공통'} onChange={e => setNewCheck({ ...newCheck, category: e.target.value })}>
                        <option value="공통">공통 준비물</option>
                        <option value="개인">개인 준비물</option>
                        <option value="예약">예약 관련 (티켓 등)</option>
                        <option value="기타">기타</option>
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
                      <label>분류</label>
                      <select className="form-control" value={newExpense.category || '기타'} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>
                        <option value="교통">교통비 (항공/주유/택시 등)</option>
                        <option value="숙박">숙박비 (호텔/펜션 등)</option>
                        <option value="식비">식비 (식사/카페/마트 등)</option>
                        <option value="쇼핑">쇼핑 (선물/기념품 등)</option>
                        <option value="관광">관광 (입장료/체험 등)</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>결제자</label>
                      <select className="form-control" value={newExpense.payer} onChange={e => setNewExpense({ ...newExpense, payer: e.target.value })}>
                        <option value="미지정">미지정</option>
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

          {/* Edit Place Modal */}
          {editingPlace && (
            <div className="modal-overlay" onClick={() => setEditingPlace(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>📅 일정 상세 수정</h3>
                  <button className="close-btn" onClick={() => setEditingPlace(null)}>×</button>
                </div>
                <form onSubmit={handleEditItinerary}>
                  <div className="form-group">
                    <label>시간 (HH:MM)</label>
                    <input type="time" required className="form-control" value={editingPlace.time} onChange={e => setEditingPlace({ ...editingPlace, time: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>체류 시간 (점유 시간)</label>
                    <select className="form-control" value={editingPlace.duration} onChange={e => setEditingPlace({ ...editingPlace, duration: Number(e.target.value) })}>
                      <option value={0}>설정 안 함 (0분)</option>
                      <option value={30}>30분</option>
                      <option value={60}>1시간</option>
                      <option value={90}>1시간 30분</option>
                      <option value={120}>2시간</option>
                      <option value={150}>2시간 30분</option>
                      <option value={180}>3시간</option>
                      <option value={240}>4시간</option>
                      <option value={300}>5시간</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>장소/일정 이름</label>
                    <input type="text" required placeholder="예: 함덕 해수욕장" className="form-control" value={editingPlace.name} onChange={e => setEditingPlace({ ...editingPlace, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>주소 (선택사항)</label>
                    <input type="text" placeholder="예: 제주 제주시 조천읍 함덕리" className="form-control" value={editingPlace.address || ''} onChange={e => setEditingPlace({ ...editingPlace, address: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>카테고리</label>
                    <select className="form-control" value={editingPlace.category} onChange={e => setEditingPlace({ ...editingPlace, category: e.target.value })}>
                      {['관광', '식사', '쇼핑', '이동', '숙소', '기타'].map(category => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>메모/설명</label>
                    <textarea placeholder="예: 바다 구경 및 망고주스 마시기" className="form-control" value={editingPlace.description || ''} onChange={e => setEditingPlace({ ...editingPlace, description: e.target.value })}></textarea>
                  </div>
                  <div className="form-group">
                    <label>예상 비용 (선택사항)</label>
                    <div className="cost-input-row">
                      <select className="form-control currency-select" value={editingPlace.currency || planCurrency} onChange={e => setEditingPlace({ ...editingPlace, currency: e.target.value })}>
                        <option value={planCurrency}>{planCurrencyMeta.symbol} {planCurrencyMeta.name}</option>
                        {planCurrency !== 'KRW' && <option value="KRW">₩ 원</option>}
                      </select>
                      <input type="number" min="0" placeholder="금액 입력" className="form-control" value={editingPlace.estimatedCost || ''} onChange={e => setEditingPlace({ ...editingPlace, estimatedCost: e.target.value })} />
                    </div>
                    {editingPlace.estimatedCost && <div className="cost-preview">{formatCostComparison(editingPlace.estimatedCost, editingPlace.currency || planCurrency)}</div>}
                  </div>
                  <label className="reservation-check">
                    <input type="checkbox" checked={editingPlace.needsReservation || false} onChange={e => setEditingPlace({ ...editingPlace, needsReservation: e.target.checked })} />
                    🎫 사전 예약이 필요한 일정
                  </label>
                  {editingPlace.needsReservation && (
                    <label className="reservation-check" style={{ marginTop: '8px', marginLeft: '16px' }}>
                      <input type="checkbox" checked={editingPlace.isReservationCompleted || false} onChange={e => setEditingPlace({ ...editingPlace, isReservationCompleted: e.target.checked })} />
                      ✅ 예약 완료함
                    </label>
                  )}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', marginBottom: '12px' }}>
                    <div className="form-group" style={{ flex: 1.5, marginBottom: 0 }}>
                      <label>다음 장소 이동 수단</label>
                      <select className="form-control" value={editingPlace.transportType || ''} onChange={e => setEditingPlace({ ...editingPlace, transportType: e.target.value })}>
                        <option value="">설정 안 함</option>
                        <option value="대중교통">🚌 대중교통</option>
                        <option value="자차">🚗 자차</option>
                        <option value="도보">🚶 도보</option>
                        <option value="기타">🚇 기타</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>소요 시간 (분)</label>
                      <input type="number" min="0" placeholder="예: 15" className="form-control" value={editingPlace.transportDuration || ''} onChange={e => setEditingPlace({ ...editingPlace, transportDuration: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>팁/메모</label>
                    <textarea placeholder="예: 해질 무렵 방문, 온라인 예매 권장" className="form-control" value={editingPlace.tip || ''} onChange={e => setEditingPlace({ ...editingPlace, tip: e.target.value })}></textarea>
                  </div>
                  <div className="form-group">
                    <label>결제자</label>
                    <select className="form-control" value={editingPlace.payer || currentUser.name} onChange={e => setEditingPlace({ ...editingPlace, payer: e.target.value })}>
                      <option value="미지정">미지정</option>
                      {plan.members.map((m, idx) => (
                        <option key={idx} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>📸 사진 첨부 (클릭하여 파일 선택 / Ctrl+V 붙여넣기 / 드래그앤드롭)</label>
                    <div 
                      className={`image-upload-zone ${uploading ? 'uploading' : ''}`}
                      onClick={() => editImgInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropImages(e, true)}
                      onPaste={(e) => handlePasteImages(e, true)}
                      tabIndex={0}
                      style={{
                        border: '2px dashed var(--border)',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: 'var(--bg-muted, #f9f9f9)',
                        transition: 'all 0.2s',
                        outline: 'none',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {uploading ? '⏳ 이미지 업로드 중...' : '🖼️ 복사한 이미지를 여기에 붙여넣거나 클릭해서 업로드'}
                    </div>
                    <input 
                      type="file" 
                      ref={editImgInputRef} 
                      style={{ display: 'none' }} 
                      multiple 
                      accept="image/*" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleImageAttach(e.target.files, true);
                        }
                      }} 
                    />
                    {editingPlace.images && editingPlace.images.length > 0 && (
                      <div className="image-preview-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {editingPlace.images.map((url, index) => (
                          <div key={index} className="image-preview-wrapper" style={{ position: 'relative', width: '70px', height: '70px' }}>
                            <img 
                              src={url} 
                              alt="preview" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} 
                            />
                            <button 
                              type="button" 
                              className="remove-img-btn" 
                              onClick={() => handleRemoveImage(index, true)}
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                  backgroundColor: 'rgba(0,0,0,0.6)',
                                  color: '#fff',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  padding: 0
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button type="submit" className="submit-btn" style={{ flex: 1 }}>수정 완료</button>
                    <button type="button" className="delete-btn-danger" onClick={() => handleDeletePlace(editingPlace.id)} style={{ width: 'auto', marginTop: 0, padding: '10px 16px' }}>일정 삭제</button>
                  </div>
                </form>
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
                {newTrip.title && (
                  <div className="currency-detection-message">
                    🌏 {detectedTrip.country} 여행으로 인식 → 기본 통화: {detectedTrip.symbol} {detectedTrip.name}({detectedTrip.code})
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>기본 통화</label>
                <select className="form-control" value={selectedTripCurrency.code} onChange={e => setNewTrip({ ...newTrip, currency: e.target.value })}>
                  {Object.values(CURRENCY_OPTIONS).map(currency => (
                    <option key={currency.code} value={currency.code}>{currency.symbol} {currency.name} ({currency.code})</option>
                  ))}
                </select>
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
                <label>참여 가족 구성원</label>
                <div className="members-checkbox-group">
                  {FAM_USERS.map((user) => {
                    const name = user.name;
                    const age = calculateManAge(user.pin);
                    const currentMembers = newTrip.membersInput 
                      ? newTrip.membersInput.split(',').map(m => m.trim()).filter(Boolean)
                      : [];
                    const isChecked = currentMembers.includes(name);
                    return (
                      <label key={name} className="member-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let updated = [...currentMembers];
                            if (e.target.checked) {
                              if (!updated.includes(name)) updated.push(name);
                            } else {
                              updated = updated.filter(m => m !== name);
                            }
                            setNewTrip({ ...newTrip, membersInput: updated.join(', ') });
                          }}
                        />
                        {name} {age !== null && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(만 {age}세)</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
              <button type="submit" className="submit-btn">여행 추가 및 일정 짜러가기</button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CREATE NEW FAMILY EVENT MODAL (Global) */}
      {/* ========================================================================= */}
      {showAddEventModal && (
        <div className="modal-overlay" onClick={() => { setShowAddEventModal(false); setSelectedCalendarDate(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔔 새 가족 행사 등록</h3>
              <button className="close-btn" onClick={() => { setShowAddEventModal(false); setSelectedCalendarDate(null); }}>×</button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>행사 제목</label>
                <input
                  type="text"
                  required
                  placeholder="예: 할머니 칠순 식사, 가족 대청소"
                  className="form-control"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>날짜</label>
                <input
                  type="date"
                  required
                  className="form-control"
                  value={newEvent.date}
                  onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>설명/메모</label>
                <textarea
                  placeholder="예: 오후 6시 서라벌 한정식 예약"
                  className="form-control"
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>참여 가족 구성원</label>
                <div className="members-checkbox-group">
                  {FAM_USERS.map((user) => {
                    const name = user.name;
                    const age = calculateManAge(user.pin);
                    const isChecked = newEvent.members.includes(name);
                    return (
                      <label key={name} className="member-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let updatedMembers = [...newEvent.members];
                            if (e.target.checked) {
                              if (!updatedMembers.includes(name)) {
                                updatedMembers.push(name);
                              }
                            } else {
                              updatedMembers = updatedMembers.filter(m => m !== name);
                            }
                            setNewEvent({ ...newEvent, members: updatedMembers });
                          }}
                        />
                        {name} {age !== null && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(만 {age}세)</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
              <button type="submit" className="submit-btn">가족 행사 등록하기</button>
            </form>
          </div>
        </div>
      )}
      {/* Edit Members Modal */}
      {showEditMembersModal && plan && (
        <div className="modal-overlay" onClick={() => setShowEditMembersModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👥 함께하는 가족 편집</h3>
              <button className="close-btn" onClick={() => setShowEditMembersModal(false)}>×</button>
            </div>
            <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              이 여행에 참가하거나 제외할 가족 구성원을 선택해 주세요.<br/>
              (여행 총괄 관리자는 제외할 수 없습니다.)
            </div>
            <div className="form-group">
              <label>참여 가족 구성원</label>
              <div className="members-checkbox-group">
                {FAM_USERS.map((user) => {
                  const name = user.name;
                  const isChecked = tempMembers.includes(name);
                  const isPlanManager = name === (plan.manager || '이현수');

                  return (
                    <label key={name} className="member-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isPlanManager}
                        onChange={(e) => {
                          let updatedMembers = [...tempMembers];
                          if (e.target.checked) {
                            if (!updatedMembers.includes(name)) {
                              updatedMembers.push(name);
                            }
                          } else {
                            updatedMembers = updatedMembers.filter(m => m !== name);
                          }
                          setTempMembers(updatedMembers);
                        }}
                      />
                      {name} {isPlanManager && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>(관리자)</span>}
                    </label>
                  );
                })}
              </div>
            </div>
            <button 
              className="submit-btn" 
              onClick={() => {
                const updatedPlan = { ...plan, members: tempMembers };
                saveUpdatedPlan(updatedPlan);
                setShowEditMembersModal(false);
              }}
            >
              변경사항 저장하기
            </button>
          </div>
        </div>
      )}

      {/* Add Anniversary Modal */}
      {showAddAnniversaryModal && (
        <div className="modal-overlay" onClick={() => setShowAddAnniversaryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎉 신규 가족 기념일 등록</h3>
              <button className="close-btn" onClick={() => setShowAddAnniversaryModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddAnniversary}>
              <div className="form-group">
                <label>기념일 구분</label>
                <select className="form-control" value={newAnniversary.type} onChange={e => setNewAnniversary({ ...newAnniversary, type: e.target.value })}>
                  <option value="birthday">생일 (생신)</option>
                  <option value="memorial">기일 (사망일)</option>
                  <option value="other">기타 기념일</option>
                </select>
              </div>
              <div className="form-group">
                <label>기념일 이름</label>
                <input type="text" required placeholder="예: 할머니 생신" className="form-control" value={newAnniversary.name} onChange={e => setNewAnniversary({ ...newAnniversary, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>기준 연도 (태어난 해 / 사망한 해 / 기준년도)</label>
                <input type="number" required placeholder="예: 1985" className="form-control" value={newAnniversary.year} onChange={e => setNewAnniversary({ ...newAnniversary, year: Number(e.target.value) })} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>월</label>
                  <select className="form-control" value={newAnniversary.month} onChange={e => setNewAnniversary({ ...newAnniversary, month: Number(e.target.value) })}>
                    {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i + 1}>{i + 1}월</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>일</label>
                  <select className="form-control" value={newAnniversary.day} onChange={e => setNewAnniversary({ ...newAnniversary, day: Number(e.target.value) })}>
                    {Array.from({ length: 31 }).map((_, i) => <option key={i} value={i + 1}>{i + 1}일</option>)}
                  </select>
                </div>
              </div>
              <label className="reservation-check" style={{ marginBottom: '16px', display: 'block' }}>
                <input type="checkbox" checked={newAnniversary.isLunar} onChange={e => setNewAnniversary({ ...newAnniversary, isLunar: e.target.checked })} />
                🌙 음력 기념일 (매년 변환)
              </label>
              <button type="submit" className="submit-btn">등록하기</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Anniversary Modal */}
      {editingAnniversary && (
        <div className="modal-overlay" onClick={() => setEditingAnniversary(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🛠️ 기념일 수정</h3>
              <button className="close-btn" onClick={() => setEditingAnniversary(null)}>×</button>
            </div>
            <form onSubmit={handleSaveAnniversaryEdit}>
              <div className="form-group">
                <label>기념일 구분</label>
                <select className="form-control" value={editingAnniversary.type || 'other'} onChange={e => setEditingAnniversary({ ...editingAnniversary, type: e.target.value })}>
                  <option value="birthday">생일 (생신)</option>
                  <option value="memorial">기일 (사망일)</option>
                  <option value="other">기타 기념일</option>
                </select>
              </div>
              <div className="form-group">
                <label>기념일 이름</label>
                <input type="text" required className="form-control" value={editingAnniversary.name} onChange={e => setEditingAnniversary({ ...editingAnniversary, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>기준 연도 (태어난 해 / 사망한 해 / 기준년도)</label>
                <input type="number" required className="form-control" value={editingAnniversary.year || ''} onChange={e => setEditingAnniversary({ ...editingAnniversary, year: Number(e.target.value) })} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>월</label>
                  <select className="form-control" value={editingAnniversary.month} onChange={e => setEditingAnniversary({ ...editingAnniversary, month: Number(e.target.value) })}>
                    {Array.from({ length: 12 }).map((_, i) => <option key={i} value={i + 1}>{i + 1}월</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>일</label>
                  <select className="form-control" value={editingAnniversary.day} onChange={e => setEditingAnniversary({ ...editingAnniversary, day: Number(e.target.value) })}>
                    {Array.from({ length: 31 }).map((_, i) => <option key={i} value={i + 1}>{i + 1}일</option>)}
                  </select>
                </div>
              </div>
              <label className="reservation-check" style={{ marginBottom: '16px', display: 'block' }}>
                <input type="checkbox" checked={editingAnniversary.isLunar} onChange={e => setEditingAnniversary({ ...editingAnniversary, isLunar: e.target.checked })} />
                🌙 음력 기념일 (매년 변환)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="submit-btn" style={{ flex: 1 }}>수정 완료</button>
                <button type="button" className="delete-btn-danger" onClick={() => handleDeleteAnniversary(editingAnniversary.rawId)} style={{ width: 'auto', marginTop: 0, padding: '10px 16px' }}>삭제</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 2000, display: 'flex', alignItems: 'center' }}>
          <div className="modal-content custom-confirm-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <h3>{confirmModal.title}</h3>
              <button className="close-btn" onClick={closeConfirm}>×</button>
            </div>
            <div style={{ marginBottom: '24px', fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              {confirmModal.message}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary-sm" onClick={closeConfirm} style={{ padding: '12px', fontSize: '0.9rem', margin: 0 }}>취소</button>
              <button className="delete-btn-danger" onClick={confirmModal.onConfirm} style={{ flex: 1, marginTop: 0, padding: '12px', fontSize: '0.9rem' }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Trash Modal */}
      {showTrashModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxHeight: '85dvh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ 휴지통 (15일 보관)</h3>
              <button className="close-btn" onClick={() => setShowTrashModal(false)}>×</button>
            </div>
            
            {trashPlans.length === 0 ? (
              <div className="empty-state" style={{ margin: '20px 0' }}>휴지통이 비어 있습니다.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
                {trashPlans.map(p => {
                  const deletedDate = new Date(p.deletedAt);
                  const now = new Date();
                  const diffTime = now - deletedDate;
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  const daysLeft = Math.max(0, 15 - diffDays);
                  
                  return (
                    <div key={p.id} className="card" style={{ margin: 0, padding: '16px', background: 'var(--bg-app)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>{p.startDate} ~ {p.endDate}</span>
                        <span style={{ color: daysLeft <= 3 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>
                          {daysLeft}일 후 영구 삭제
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>{p.title}</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-secondary-sm" 
                          style={{ padding: '8px', fontSize: '0.8rem', margin: 0 }}
                          onClick={() => handleRestorePlan(p.id)}
                        >
                          복구
                        </button>
                        <button 
                          className="delete-btn-danger" 
                          style={{ flex: 1, marginTop: 0, padding: '8px', fontSize: '0.8rem' }}
                          onClick={() => {
                            openConfirm(
                              "⚠️ 영구 삭제", 
                              `"${p.title}" 일정을 영구히 삭제하시겠습니까? 삭제된 정보는 다시는 복구할 수 없습니다.`, 
                              () => handleDeletePermanently(p.id)
                            );
                          }}
                        >
                          영구 삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <button className="submit-btn" style={{ marginTop: '16px' }} onClick={() => setShowTrashModal(false)}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Edit Meta (Accommodation & Transportation) Modal */}
      {showEditMetaModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxHeight: '85dvh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>여행일정 및 요약</h3>
              <button className="close-btn" onClick={() => setShowEditMetaModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveMeta}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                여행 제목과 날짜, 숙소, 교통 수단 정보를 수정할 수 있습니다.
              </div>
              
              <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>여행 타이틀</div>
              <div className="form-group">
                <input type="text" placeholder="예: 우리 가족 도쿄 여행" className="form-control" value={editMeta.title} onChange={e => setEditMeta({ ...editMeta, title: e.target.value })} required />
              </div>

              <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>📅 여행 일정 설정</div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>시작일</label>
                  <input type="date" className="form-control" value={editMeta.startDate} onChange={e => setEditMeta({ ...editMeta, startDate: e.target.value })} required />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>종료일</label>
                  <input type="date" className="form-control" value={editMeta.endDate} onChange={e => setEditMeta({ ...editMeta, endDate: e.target.value })} required />
                </div>
              </div>

              <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>🏨 숙소 설정</div>
              <div className="form-group">
                <label>숙소 이름</label>
                <input type="text" placeholder="예: 토요코인 도쿄 호텔" className="form-control" value={editMeta.accName} onChange={e => setEditMeta({ ...editMeta, accName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>숙소 위치/설명</label>
                <input type="text" placeholder="예: 신주쿠역 도보 5분" className="form-control" value={editMeta.accLocation} onChange={e => setEditMeta({ ...editMeta, accLocation: e.target.value })} />
              </div>
              <div className="form-group">
                <label>추가 특징 (하이라이트)</label>
                <input type="text" placeholder="예: 조식 무료 제공" className="form-control" value={editMeta.accHighlight} onChange={e => setEditMeta({ ...editMeta, accHighlight: e.target.value })} />
              </div>

              <div style={{ fontWeight: 'bold', marginTop: '20px', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>🚇 교통수단 설정</div>
              <div className="form-group">
                <label>교통 내역 (줄바꿈으로 여러 개 입력 가능)</label>
                <textarea 
                  placeholder="입력형식: 교통종류 · 상세설명 · 예상비용&#10;예: 비행기 · 인천-나리타 왕복 · 450000&#10;예: 넥스 열차 · 나리타공항-도쿄 · 3200" 
                  rows="4" 
                  className="form-control" 
                  value={editMeta.transText} 
                  onChange={e => setEditMeta({ ...editMeta, transText: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary-sm" style={{ padding: '12px', fontSize: '0.95rem', margin: 0 }} onClick={() => setShowEditMetaModal(false)}>취소</button>
                <button type="submit" className="submit-btn" style={{ flex: 1, padding: '12px', fontSize: '0.95rem' }}>저장 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Checklist Item Modal */}
      {editingCheck && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ 준비물 수정</h3>
              <button className="close-btn" onClick={() => setEditingCheck(null)}>×</button>
            </div>
            <form onSubmit={handleEditChecklist}>
              <div className="form-group">
                <label>준비물 품목</label>
                <input 
                  type="text" 
                  required 
                  placeholder="예: 방수 팩, 유모차" 
                  className="form-control" 
                  value={editingCheck.title} 
                  onChange={e => setEditingCheck({ ...editingCheck, title: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>담당자</label>
                <select 
                  className="form-control" 
                  value={editingCheck.assignee || ''} 
                  onChange={e => setEditingCheck({ ...editingCheck, assignee: e.target.value })}
                >
                  <option value="">미지정</option>
                  {plan.members.map((m, idx) => (
                    <option key={idx} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>분류</label>
                <select 
                  className="form-control" 
                  value={editingCheck.category || '공통'} 
                  onChange={e => setEditingCheck({ ...editingCheck, category: e.target.value })}
                >
                  <option value="공통">공통 준비물</option>
                  <option value="개인">개인 준비물</option>
                  <option value="예약">예약 관련 (티켓 등)</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary-sm" style={{ padding: '12px', fontSize: '0.95rem', margin: 0 }} onClick={() => setEditingCheck(null)}>취소</button>
                <button type="submit" className="submit-btn" style={{ flex: 1, padding: '12px', fontSize: '0.95rem' }}>수정 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="modal-overlay" 
          onClick={() => setLightboxImage(null)}
          style={{ zIndex: 1200, backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <div 
            style={{ 
              position: 'relative', 
              maxWidth: '90vw', 
              maxHeight: '90vh', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightboxImage} 
              alt="Enlarged view" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '85vh', 
                objectFit: 'contain', 
                borderRadius: '8px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)' 
              }} 
            />
            <button 
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '32px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
