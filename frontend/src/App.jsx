import React, { useState, useEffect, useRef } from 'react';
import KoreanLunarCalendar from 'korean-lunar-calendar';

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

const API_BASE = typeof window !== 'undefined' && (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
  ? (import.meta.env.VITE_API_BASE || 'https://34-45-73-57.sslip.io')
  : '';

const FALLBACK_KRW_RATES = {
  KRW: 1, JPY: 9.3, USD: 1380, EUR: 1510, GBP: 1790, CNY: 190,
  THB: 41, VND: 0.054, TWD: 42, AUD: 910, CAD: 1010, PHP: 24, SGD: 1060
};

const detectTripCurrency = (title = '') => {
  const match = Object.entries(COUNTRY_CURRENCY_MAP).find(([keyword]) => title.includes(keyword));
  return match ? { country: match[0], ...match[1] } : { country: '국내', ...CURRENCY_OPTIONS.KRW };
};

// Utility: Format Date object or string into YYYY-MM-DD in local timezone (KST)
const getLocalDateStr = (d = new Date()) => {
  if (!d) d = new Date();
  const dateObj = typeof d === 'string' && d.length === 10 ? new Date(`${d}T00:00:00`) : new Date(d);
  if (isNaN(dateObj.getTime())) return new Date().toLocaleDateString('sv-SE');
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Utility: Convert text containing web URLs (http/https/www) into clickable <a> link elements
const renderTextWithLinks = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);
  if (parts.length <= 1) return text;
  
  return parts.map((part, index) => {
    if (part.match(/^(https?:\/\/|www\.)/i)) {
      const href = part.toLowerCase().startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            color: '#2563eb',
            textDecoration: 'underline',
            wordBreak: 'break-all',
            fontWeight: '600'
          }}
        >
          {part} 🔗
        </a>
      );
    }
    return part;
  });
};

// Pre-registered Family Users
const FAM_USERS = [
  { name: "guest", pin: "guest0000", nickname: "게스트 (조회전용)", role: "guest" },
  { name: "이정우", pin: "570413", birth: "1957.04.11", passportBirth: "1957.04.13", engName: "LEE JUNG WOO", role: "user", isLunar: true },
  { name: "홍영숙", pin: "630124", birth: "1963.01.24", engName: "HONG YOUNGSOOK", role: "user", isLunar: true },
  { name: "이진수", pin: "850119", birth: "1985.01.19", engName: "LEE JINSOO", role: "user", isLunar: false },
  { name: "이아름", pin: "880803", birth: "1988.08.03", engName: "LEE AHREUM", role: "user", isLunar: false },
  { name: "이현수", pin: "870707", birth: "1987.07.07", engName: "LEE HYUNSOO", role: "admin", isLunar: false },
  { name: "양슬기", pin: "871214", birth: "1987.12.14", engName: "YANG SEULGI", role: "user", isLunar: false },
  { name: "이준성", pin: "110324", birth: "2011.03.24", engName: "LEE JUNSEONG", role: "user", isLunar: false },
  { name: "이은성", pin: "130813", birth: "2013.08.13", engName: "LEE EUNSEONG", role: "user", isLunar: false },
  { name: "이해성", pin: "200220", birth: "2020.02.20", engName: "LEE HAESEONG", role: "user", isLunar: false },
  { name: "이하성", pin: "210930", birth: "2021.09.30", engName: "LEE HASEONG", role: "user", isLunar: false },
  { name: "이주성", pin: "231110", birth: "2023.11.10", engName: "LEE JUSEONG", role: "user", isLunar: false }
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

const getFamilyRelationName = (viewerName, targetName) => {
  if (!viewerName) return targetName;
  if (viewerName === targetName) return '나';

  const relations = {
    '이정우': {
      '이서구': '아버지',
      '방예선': '어머니',
      '홍영숙': '아내',
      '이진수': '큰아들',
      '이아름': '큰며느리',
      '이현수': '둘째아들',
      '양슬기': '작은며느리',
      '이준성': '손자(준성)',
      '이은성': '손자(은성)',
      '이해성': '손자(해성)',
      '이하성': '손자(하성)',
      '이주성': '손자(주성)',
      '박경희': '사돈어른'
    },
    '홍영숙': {
      '박경희': '어머니',
      '이정우': '남편',
      '이서구': '시아버지',
      '방예선': '시어머니',
      '이진수': '큰아들',
      '이아름': '큰며느리',
      '이현수': '둘째아들',
      '양슬기': '작은며느리',
      '이준성': '손자(준성)',
      '이은성': '손자(은성)',
      '이해성': '손자(해성)',
      '이하성': '손자(하성)',
      '이주성': '손자(주성)'
    },
    '이진수': {
      '이정우': '아버지',
      '홍영숙': '어머니',
      '이서구': '친할아버지',
      '방예선': '친할머니',
      '박경희': '외할머니',
      '이아름': '아내',
      '이현수': '동생(현수)',
      '양슬기': '제수씨',
      '이준성': '첫째아들(준성)',
      '이은성': '둘째아들(은성)',
      '이해성': '셋째아들(해성)',
      '이하성': '조카(하성)',
      '이주성': '조카(주성)'
    },
    '이아름': {
      '이정우': '아버님',
      '홍영숙': '어머님',
      '이서구': '시할아버지',
      '방예선': '시할머니',
      '박경희': '시외할머니',
      '이진수': '남편',
      '이현수': '도련님',
      '양슬기': '동서',
      '이준성': '첫째아들(준성)',
      '이은성': '둘째아들(은성)',
      '이해성': '셋째아들(해성)',
      '이하성': '조카(하성)',
      '이주성': '조카(주성)'
    },
    '이현수': {
      '이정우': '아버지',
      '홍영숙': '어머니',
      '이서구': '친할아버지',
      '방예선': '친할머니',
      '박경희': '외할머니',
      '이진수': '형(진수)',
      '이아름': '형수님',
      '양슬기': '아내',
      '이준성': '조카(준성)',
      '이은성': '조카(은성)',
      '이해성': '조카(해성)',
      '이하성': '첫째아들(하성)',
      '이주성': '둘째아들(주성)'
    },
    '양슬기': {
      '이정우': '아버님',
      '홍영숙': '어머님',
      '이서구': '시할아버지',
      '방예선': '시할머니',
      '박경희': '시외할머니',
      '이진수': '아주버님',
      '이아름': '형님',
      '이현수': '남편',
      '이준성': '조카(준성)',
      '이은성': '조카(은성)',
      '이해성': '조카(해성)',
      '이하성': '첫째아들(하성)',
      '이주성': '둘째아들(주성)'
    },
    '이준성': {
      '이정우': '친할아버지', '홍영숙': '친할머니',
      '이서구': '증조할아버지', '방예선': '증조할머니', '박경희': '증외할머니',
      '이진수': '아빠', '이아름': '엄마',
      '이현수': '삼촌', '양슬기': '숙모',
      '이은성': '남동생(은성)', '이해성': '남동생(해성)',
      '이하성': '사촌동생(하성)', '이주성': '사촌동생(주성)'
    },
    '이은성': {
      '이정우': '친할아버지', '홍영숙': '친할머니',
      '이서구': '증조할아버지', '방예선': '증조할머니', '박경희': '증외할머니',
      '이진수': '아빠', '이아름': '엄마',
      '이현수': '삼촌', '양슬기': '숙모',
      '이준성': '형(준성)', '이해성': '남동생(해성)',
      '이하성': '사촌동생(하성)', '이주성': '사촌동생(주성)'
    },
    '이해성': {
      '이정우': '친할아버지', '홍영숙': '친할머니',
      '이서구': '증조할아버지', '방예선': '증조할머니', '박경희': '증외할머니',
      '이진수': '아빠', '이아름': '엄마',
      '이현수': '삼촌', '양슬기': '숙모',
      '이준성': '형(준성)', '이은성': '형(은성)',
      '이하성': '사촌동생(하성)', '이주성': '사촌동생(주성)'
    },
    '이하성': {
      '이정우': '친할아버지', '홍영숙': '친할머니',
      '이서구': '증조할아버지', '방예선': '증조할머니', '박경희': '증외할머니',
      '이진수': '큰아빠', '이아름': '큰엄마',
      '이현수': '아빠', '양슬기': '엄마',
      '이준성': '사촌형(준성)', '이은성': '사촌형(은성)', '이해성': '사촌형(해성)',
      '이주성': '남동생(주성)'
    },
    '이주성': {
      '이정우': '친할아버지', '홍영숙': '친할머니',
      '이서구': '증조할아버지', '방예선': '증조할머니', '박경희': '증외할머니',
      '이진수': '큰아빠', '이아름': '큰엄마',
      '이현수': '아빠', '양슬기': '엄마',
      '이준성': '사촌형(준성)', '이은성': '사촌형(은성)', '이해성': '사촌형(해성)',
      '이하성': '형(하성)'
    }
  };

  return relations[viewerName]?.[targetName] || targetName;
};

const getAnniversariesForYear = (year, anniversariesList, viewerName) => {
  if (!anniversariesList || anniversariesList.length === 0) return [];
  return anniversariesList.map(ann => {
    const baseYear = Number(ann.year);
    const hasYear = baseYear && baseYear > 0;
    const diff = hasYear ? (year - baseYear) : null;
    
    let titleSuffix = '';
    if (diff !== null && diff > 0) {
      if (ann.type === 'birthday') {
        titleSuffix = ` (만 ${diff}세)`;
      }
    }

    const cleanName = ann.name.replace(/생일|생신|기일/g, '').trim();
    const relationName = getFamilyRelationName(viewerName, cleanName);
    
    let formattedName = ann.name;
    if (relationName !== cleanName) {
      if (relationName === '나') {
        formattedName = '내 생일';
      } else {
        const suffix = ann.name.includes('생신') ? '생신' : (ann.name.includes('생일') ? '생일' : (ann.name.includes('기일') ? '기일' : ''));
        formattedName = suffix ? `${relationName} ${suffix}` : `${relationName} (${ann.name})`;
      }
    }

    if (ann.isLunar) {
      try {
        const calendar = new KoreanLunarCalendar();
        calendar.setLunarDate(year, ann.month, ann.day, false);
        const result = calendar.getSolarCalendar();
        if (result && result.year && result.month && result.day) {
          const monthStr = String(result.month).padStart(2, '0');
          const dayStr = String(result.day).padStart(2, '0');
          return {
            id: ann.id || `ann-${ann.name}-${year}`,
            title: `${formattedName}${titleSuffix} (음력)`,
            dateStr: `${result.year}-${monthStr}-${dayStr}`,
            isAnniversary: true,
            isEvent: false,
            name: formattedName,
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
        title: `${formattedName}${titleSuffix}`,
        dateStr: `${year}-${monthStr}-${dayStr}`,
        isAnniversary: true,
        isEvent: false,
        name: formattedName,
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
  // Universal Map Search Helper (Handles Mobile App 1st priority, Mobile Web 2nd priority in new window, PC Web in new window)
  const handleMapSearch = (e, query, currency) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!query) return;

    const cleanQuery = query.replace(/\/출발|\/도착/g, '').trim();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (currency === 'KRW') {
      if (isMobile) {
        // 1st Priority: Mobile Naver Map App
        const appUrl = `nmap://search?query=${encodeURIComponent(cleanQuery)}&appname=travelsquad`;
        // 2nd Priority: Mobile Naver Map Web Search (opens in a new tab)
        const webUrl = `https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(cleanQuery)}`;
        
        const start = Date.now();
        window.location.href = appUrl;
        setTimeout(() => {
          if (Date.now() - start < 1500) {
            window.open(webUrl, '_blank');
          }
        }, 1000);
      } else {
        // PC: Naver Map PC Web Search in a new window
        const pcUrl = `https://map.naver.com/p/search/${encodeURIComponent(cleanQuery)}`;
        window.open(pcUrl, '_blank');
      }
    } else {
      // Overseas: Google Maps Web Search in a new window
      const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery)}`;
      window.open(googleUrl, '_blank');
    }
  };

  // Universal Route Navigation Helper (Departure to Destination)
  const handleRouteNav = (e, originQuery, destQuery, currency = 'KRW', transportType = '') => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!destQuery) return;

    const sname = originQuery ? originQuery.replace(/\/출발|\/도착/g, '').trim() : '';
    const dname = destQuery.replace(/\/출발|\/도착/g, '').trim();

    if (!sname) {
      handleMapSearch(e, dname, currency);
      return;
    }

    const googleMode = transportType === '자차' ? 'driving' : (transportType === '도보' ? 'walking' : 'transit');

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (currency === 'KRW') {
      const pcUrl = `https://map.naver.com/p/directions?stext=${encodeURIComponent(sname)}&etext=${encodeURIComponent(dname)}&menu=route`;
      if (isMobile) {
        const queryText = `${sname}에서 ${dname} 길찾기`;
        const appUrl = `nmap://search?query=${encodeURIComponent(queryText)}&appname=travelsquad`;
        const webFallback = `https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(queryText)}`;
        const start = Date.now();
        window.location.href = appUrl;
        setTimeout(() => {
          if (Date.now() - start < 1500) {
            window.open(webFallback, '_blank');
          }
        }, 1000);
      } else {
        window.open(pcUrl, '_blank');
      }
    } else {
      const googleUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(sname)}&destination=${encodeURIComponent(dname)}&travelmode=${googleMode}`;
      window.open(googleUrl, '_blank');
    }
  };

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Profile State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ nickname: '', profileImage: null, password: '' });
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [usersMap, setUsersMap] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);

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
  const [isFabVisible, setIsFabVisible] = useState(true);

  // Auto-hide FAB on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY && currentScrollY > 60) {
            setIsFabVisible(false); // Scroll Down -> hide FAB
          } else {
            setIsFabVisible(true);  // Scroll Up or top -> show FAB
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Comment section toggle state map: { [placeId]: boolean }
  const [toggledComments, setToggledComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({}); // { [placeId]: string }

  // Form States for adding new trip
  const [newTrip, setNewTrip] = useState({ title: '', startDate: '', endDate: '', membersInput: '', currency: '' });

  // Form States inside detail tabs
  const [newPlace, setNewPlace] = useState({
    day: 1, time: '', name: '', address: '', description: '', category: '관광', estimatedCost: '',
    currency: '', needsReservation: false, isReservationCompleted: false, tip: '', payer: '미지정', duration: 0, images: [], mapImages: [],
    transportType: '', transportDuration: ''
  });

  const [editingPlace, setEditingPlace] = useState(null); // Place object currently being edited
  const [openMenuPlaceId, setOpenMenuPlaceId] = useState(null); // Place ID of active kebab menu
  const [selectedDetailPlace, setSelectedDetailPlace] = useState(null); // Currently open detail place modal
  const [alternativeForm, setAlternativeForm] = useState(null); // Alternative place form state: { mode, placeId, alt }
  const [newSavedPlace, setNewSavedPlace] = useState({ name: '', category: '관광', address: '', description: '', tip: '', url: '', images: [] });
  const [editingSavedPlace, setEditingSavedPlace] = useState(null);
  const [showAddSavedPlaceModal, setShowAddSavedPlaceModal] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [naverMapLoaded, setNaverMapLoaded] = useState(false);
  const [naverMapAuthFailed, setNaverMapAuthFailed] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const naverMapInstanceRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxImagesList, setLightboxImagesList] = useState([]); // Array of image URLs
  const [lightboxActiveIndex, setLightboxActiveIndex] = useState(0); // Current active image index in lightbox
  const [activeImageIndexes, setActiveImageIndexes] = useState({}); // { [placeId]: number }
  const [activeMapImageIndexes, setActiveMapImageIndexes] = useState({}); // { [placeId]: number }
  const [editingCommentId, setEditingCommentId] = useState(null); // ID of comment being edited
  const [editingCommentText, setEditingCommentText] = useState(''); // Text of comment being edited
  const pressTimerRef = useRef(null);
  const addImgInputRef = useRef(null);
  const addMapImgInputRef = useRef(null);
  const editImgInputRef = useRef(null);
  const editMapImgInputRef = useRef(null);
  const addSavedPlaceImgInputRef = useRef(null);
  const editSavedPlaceImgInputRef = useRef(null);
  const altImgInputRef = useRef(null);
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

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuPlaceId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else if (window.L) {
      setLeafletLoaded(true);
    }

    // Dynamic loading of Naver Map SDK
    const loadNaverMap = async () => {
      try {
        window.navermap_authFailure = () => {
          console.warn("Naver Map API authentication failed. Switching to Leaflet map fallback.");
          setNaverMapAuthFailed(true);
        };

        const res = await fetch(`${API_BASE}/api/config/naver-client-id`);
        if (res.ok) {
          const { clientId } = await res.json();
          if (clientId && clientId.trim() !== '') {
            // Remove stale script tag if Naver maps is not attached
            const existingScript = document.getElementById('naver-map-js');
            if (existingScript && (!window.naver || !window.naver.maps)) {
              existingScript.remove();
            }

            if (!window.naver || !window.naver.maps) {
              const script = document.createElement('script');
              script.id = 'naver-map-js';
              script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
              script.onload = () => {
                setNaverMapAuthFailed(false);
                setNaverMapLoaded(true);
              };
              script.onerror = () => {
                setNaverMapAuthFailed(true);
              };
              document.body.appendChild(script);
            } else {
              setNaverMapAuthFailed(false);
              setNaverMapLoaded(true);
            }
          } else {
            setNaverMapAuthFailed(true);
          }
        } else {
          setNaverMapAuthFailed(true);
        }
      } catch (err) {
        console.warn("Failed to load Naver Map SDK:", err);
        setNaverMapAuthFailed(true);
      }
    };
    loadNaverMap();
  }, []);

  // Auto-Repair Geocoding for savedPlaces missing lat/lng
  useEffect(() => {
    if (activeTab === 'places' && plan && plan.savedPlaces && plan.savedPlaces.length > 0) {
      const missingPlaces = plan.savedPlaces.filter(sp => !sp.lat || !sp.lng);
      if (missingPlaces.length === 0) return;

      const repairGeocodes = async () => {
        let hasChanges = false;
        const updatedPlan = JSON.parse(JSON.stringify(plan));

        for (const sp of missingPlaces) {
          const queryStr = sp.address && sp.address.trim() !== '' ? sp.address : sp.name;
          if (!queryStr) continue;

          try {
            const res = await fetch(`${API_BASE}/api/geocoding?query=${encodeURIComponent(queryStr)}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.lat && data.lng) {
                const target = updatedPlan.savedPlaces.find(item => item.id === sp.id);
                if (target) {
                  target.lat = data.lat;
                  target.lng = data.lng;
                  hasChanges = true;
                }
              }
            }
          } catch (err) {
            console.warn("Auto geocode repair failed for:", sp.name, err);
          }
        }

        if (hasChanges) {
          saveUpdatedPlan(updatedPlan);
        }
      };

      repairGeocodes();
    }
  }, [activeTab, plan?.id]);

  useEffect(() => {
    const initLeafletMap = (center, zoom, validPlaces) => {
      try {
        const map = window.L.map(mapRef.current).setView(center, zoom);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        validPlaces.forEach(p => {
          const popupContent = `
            <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4; padding: 4px;">
              <h4 style="margin: 0 0 4px 0; color: var(--primary, #6366f1); font-size: 14px;">${p.name}</h4>
              <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #eee; font-weight: bold; display: inline-block; margin-bottom: 6px;">${p.category}</span>
              <p style="margin: 0; color: #555; font-size: 11px;">${p.address || '주소 정보가 없습니다.'}</p>
              ${p.description ? `<p style="margin: 4px 0 0 0; font-style: italic; color: #777; font-size: 11px; border-top: 1px solid #eee; padding-top: 4px;">${p.description}</p>` : ''}
              ${p.url ? `<a href="${p.url}" target="_blank" style="display: block; margin-top: 8px; text-decoration: none; color: #fff; background: var(--primary, #6366f1); font-size: 11px; font-weight: bold; text-align: center; padding: 4px; border-radius: 4px;">지도에서 열기</a>` : ''}
            </div>
          `;
          window.L.marker([p.lat, p.lng])
            .addTo(map)
            .bindPopup(popupContent);
        });

        if (validPlaces.length > 1) {
          const bounds = validPlaces.map(p => [p.lat, p.lng]);
          map.fitBounds(bounds, { padding: [30, 30] });
        }

        mapInstanceRef.current = map;
      } catch (err) {
        console.error("Leaflet initialization failed:", err);
      }
    };

    if (activeTab === 'places' && mapRef.current) {
      if (mapInstanceRef.current) {
        if (typeof mapInstanceRef.current.remove === 'function') {
          mapInstanceRef.current.remove();
        }
        mapInstanceRef.current = null;
      }
      if (naverMapInstanceRef.current) {
        if (mapRef.current) mapRef.current.innerHTML = '';
        naverMapInstanceRef.current = null;
      }

      const savedPlaces = plan?.savedPlaces || [];
      let center = [33.4996, 126.5312]; // Default Jeju
      let zoom = 10;

      const validPlaces = savedPlaces.filter(p => p.lat && p.lng);
      if (validPlaces.length > 0) {
        center = [validPlaces[0].lat, validPlaces[0].lng];
        zoom = 12;
      } else if (plan && plan.title) {
        if (plan.title.includes('서울')) center = [37.5665, 126.9780];
        else if (plan.title.includes('부산')) center = [35.1796, 129.0756];
        else if (plan.title.includes('강릉')) center = [37.7518, 128.8761];
        else if (plan.title.includes('도쿄')) center = [35.6762, 139.6503];
        else if (plan.title.includes('오사카')) center = [34.6937, 135.5023];
        else if (plan.title.includes('후쿠오카')) center = [33.5902, 130.4017];
      }

      // If naverMapLoaded is true, and coordinate center is in Korea, use Naver Map!
      const isKorea = center[0] >= 33 && center[0] <= 39 && center[1] >= 124 && center[1] <= 132;

      if (naverMapLoaded && !naverMapAuthFailed && window.naver && window.naver.maps && isKorea) {
        try {
          const naverZoom = zoom === 12 ? 14 : 10;
          const map = new window.naver.maps.Map(mapRef.current, {
            center: new window.naver.maps.LatLng(center[0], center[1]),
            zoom: naverZoom,
            mapTypeControl: true
          });

          validPlaces.forEach(p => {
            const marker = new window.naver.maps.Marker({
              position: new window.naver.maps.LatLng(p.lat, p.lng),
              map: map,
              title: p.name
            });

            const popupContent = `
              <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4; padding: 10px; min-width: 150px; background: #fff; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                <h4 style="margin: 0 0 4px 0; color: #6366f1; font-size: 14px; font-weight: bold;">${p.name}</h4>
                <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #eee; font-weight: bold; display: inline-block; margin-bottom: 6px; color: #555;">${p.category}</span>
                <p style="margin: 0; color: #555; font-size: 11px;">${p.address || '주소 정보가 없습니다.'}</p>
                ${p.description ? `<p style="margin: 6px 0 0 0; font-style: italic; color: #777; font-size: 11px; border-top: 1px solid #eee; padding-top: 6px;">${p.description}</p>` : ''}
                ${p.url ? `<a href="${p.url}" target="_blank" style="display: block; margin-top: 8px; text-decoration: none; color: #fff; background: #6366f1; font-size: 11px; font-weight: bold; text-align: center; padding: 5px 8px; border-radius: 4px;">지도에서 열기</a>` : ''}
              </div>
            `;

            const infoWindow = new window.naver.maps.InfoWindow({
              content: popupContent,
              borderWidth: 0,
              backgroundColor: "transparent",
              disableAnchor: true
            });

            window.naver.maps.Event.addListener(marker, "click", () => {
              if (infoWindow.getMap()) {
                infoWindow.close();
              } else {
                infoWindow.open(map, marker);
              }
            });
          });

          if (validPlaces.length > 1) {
            const bounds = new window.naver.maps.LatLngBounds();
            validPlaces.forEach(p => {
              bounds.extend(new window.naver.maps.LatLng(p.lat, p.lng));
            });
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }

          naverMapInstanceRef.current = map;
        } catch (err) {
          console.error("Naver native map initialization failed, falling back to Leaflet:", err);
          setNaverMapAuthFailed(true);
          if (leafletLoaded && window.L) {
            initLeafletMap(center, zoom, validPlaces);
          }
        }
      } else if (leafletLoaded && window.L) {
        initLeafletMap(center, zoom, validPlaces);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        if (typeof mapInstanceRef.current.remove === 'function') {
          mapInstanceRef.current.remove();
        }
        mapInstanceRef.current = null;
      }
      if (naverMapInstanceRef.current) {
        if (mapRef.current) mapRef.current.innerHTML = '';
        naverMapInstanceRef.current = null;
      }
    };
  }, [activeTab, plan?.savedPlaces, leafletLoaded, naverMapLoaded]);

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
    const isModalOpen = Boolean(
      showModal || 
      showAddTripModal || 
      showAddEventModal || 
      showEditMembersModal || 
      showAddAnniversaryModal || 
      editingPlace || 
      editingAnniversary || 
      confirmModal.isOpen || 
      showTrashModal || 
      showEditMetaModal || 
      selectedDetailPlace || 
      showProfileModal || 
      (lightboxImagesList && lightboxImagesList.length > 0) ||
      showAddSavedPlaceModal ||
      editingSavedPlace ||
      showNotifModal
    );
    console.log("=== Scroll Lock Debug ===", {
      isModalOpen,
      showModal,
      showAddTripModal,
      showAddEventModal,
      showEditMembersModal,
      showAddAnniversaryModal,
      editingPlace: !!editingPlace,
      editingAnniversary: !!editingAnniversary,
      confirmModalIsOpen: confirmModal?.isOpen,
      showTrashModal,
      showEditMetaModal,
      selectedDetailPlace: !!selectedDetailPlace,
      showProfileModal,
      lightboxOpen: lightboxImagesList && lightboxImagesList.length > 0,
      showAddSavedPlaceModal,
      editingSavedPlace: !!editingSavedPlace,
      showNotifModal
    });
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [
    showModal, showAddTripModal, showAddEventModal, showEditMembersModal, showAddAnniversaryModal, 
    editingPlace, editingAnniversary, confirmModal.isOpen, showTrashModal, showEditMetaModal, 
    selectedDetailPlace, showProfileModal, lightboxImagesList, showAddSavedPlaceModal, editingSavedPlace,
    showNotifModal
  ]);

  // Modal Back Button Handling (For Mobile Browser Back Gesture/Button)
  useEffect(() => {
    const isModalOpen = Boolean(
      showModal || 
      showAddTripModal || 
      showAddEventModal || 
      showEditMembersModal || 
      showAddAnniversaryModal || 
      editingPlace || 
      editingAnniversary || 
      confirmModal.isOpen || 
      showTrashModal || 
      showEditMetaModal || 
      selectedDetailPlace || 
      showProfileModal || 
      (lightboxImagesList && lightboxImagesList.length > 0) ||
      showAddSavedPlaceModal ||
      editingSavedPlace ||
      showNotifModal
    );

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
        setSelectedDetailPlace(null);
        setShowProfileModal(false);
        setLightboxImagesList([]);
        setShowAddSavedPlaceModal(false);
        setEditingSavedPlace(null);
        setShowNotifModal(false);
      }
    };

    if (isModalOpen) {
      window.history.pushState({ modalOpen: true }, '');
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    showModal, showAddTripModal, showAddEventModal, showEditMembersModal, showAddAnniversaryModal, 
    editingPlace, editingAnniversary, confirmModal.isOpen, showTrashModal, showEditMetaModal, 
    selectedDetailPlace, showProfileModal, lightboxImagesList, showAddSavedPlaceModal, editingSavedPlace,
    showNotifModal
  ]);

  // Fetch and build users profile mapping with offline fallback
  useEffect(() => {
    const fetchUsers = async () => {
      const defaultMapping = {};
      FAM_USERS.forEach(u => {
        defaultMapping[u.name] = {
          nickname: u.name,
          profileImage: null
        };
      });

      // Merge local currentUser into defaults first
      if (currentUser) {
        defaultMapping[currentUser.name] = {
          nickname: currentUser.nickname || currentUser.name,
          profileImage: currentUser.profileImage || null
        };
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/users`);
        if (res.ok) {
          const data = await res.json();
          const mapping = {};
          data.forEach(u => {
            mapping[u.name] = {
              nickname: u.nickname || u.name,
              profileImage: u.profileImage || null
            };
          });
          // Merge local currentUser over fetched data to preserve latest local updates
          if (currentUser) {
            mapping[currentUser.name] = {
              nickname: currentUser.nickname || currentUser.name,
              profileImage: currentUser.profileImage || null
            };
          }
          setUsersMap({ ...defaultMapping, ...mapping });
        } else {
          setUsersMap(defaultMapping);
        }
      } catch (err) {
        console.warn("Failed to fetch users map, using offline defaults:", err);
        setUsersMap(defaultMapping);
      }
    };

    if (currentUser) {
      fetchUsers();
    } else {
      setUsersMap({});
    }
  }, [currentUser]);

  // Fetch and sync notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  // Trigger a new notification
  const triggerNotification = async (type, targetId, targetName, tab, targetPlanId, targetPlanTitle) => {
    const pId = targetPlanId || plan?.id;
    const pTitle = targetPlanTitle || plan?.title || '';
    if (!pId) return;

    let message = '';
    const actorName = currentUser.nickname || currentUser.name;
    if (type === 'place_add') {
      message = `${actorName}님이 [일정]에 '${targetName}'을(를) 추가했습니다.`;
    } else if (type === 'place_edit') {
      message = `${actorName}님이 [일정]의 '${targetName}'을(를) 수정했습니다.`;
    } else if (type === 'comment_add') {
      message = `${actorName}님이 '${targetName}'에 댓글을 남겼습니다.`;
    } else if (type === 'checklist_add') {
      message = `${actorName}님이 [준비물]에 '${targetName}'을(를) 추가했습니다.`;
    } else if (type === 'expense_add') {
      message = `${actorName}님이 [경비]에 '${targetName}' 내역을 추가했습니다.`;
    } else if (type === 'trip_create') {
      message = `${actorName}님이 새로운 여행 계획 '${pTitle}'을(를) 생성했습니다.`;
    }

    try {
      const response = await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: pId,
          planTitle: pTitle,
          actor: currentUser.name,
          type,
          targetId: String(targetId),
          targetName,
          tab,
          message,
          createdAt: Date.now(),
          readBy: [currentUser.name]
        })
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.warn("Failed to create notification:", err);
    }
  };

  // Jump to notification target
  const handleNotificationClick = async (notif) => {
    // 1. Mark as read
    try {
      await fetch(`${API_BASE}/api/notifications/${notif.id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.name })
      });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, readBy: [...(n.readBy || []), currentUser.name] } : n));
    } catch (err) {
      console.warn("Failed to mark notification as read on server:", err);
    }

    setShowNotifModal(false);

    // 2. Navigate to target
    const targetPlanId = Number(notif.planId);
    let targetPlan = plans.find(p => Number(p.id) === targetPlanId);
    
    if (!targetPlan) {
      try {
        const res = await fetch(`${API_BASE}/api/plans/${targetPlanId}`);
        if (res.ok) {
          targetPlan = await res.json();
        }
      } catch (err) {
        console.warn("Failed to fetch target plan:", err);
      }
    }

    if (!targetPlan) {
      alert("해당 여행 계획을 찾을 수 없거나 이미 삭제되었습니다.");
      return;
    }

    setPlan(targetPlan);
    setSelectedPlanId(targetPlanId);
    setView('detail');

    const targetTab = notif.tab || 'itinerary';
    setActiveTab(targetTab);

    if (targetTab === 'itinerary') {
      let matchedPlace = null;
      let matchedDay = 1;

      for (const dayItem of targetPlan.itinerary) {
        const foundPlace = dayItem.places.find(p => String(p.id) === String(notif.targetId));
        if (foundPlace) {
          matchedPlace = foundPlace;
          matchedDay = dayItem.day;
          break;
        }
      }

      if (matchedPlace) {
        setSelectedDayFilter(String(matchedDay));
        setTimeout(() => {
          setSelectedDetailPlace(matchedPlace);
        }, 150);
      }
    } else if (targetTab === 'checklist') {
      setTimeout(() => {
        const element = document.getElementById(`checklist-item-${notif.targetId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.transition = 'background-color 0.5s';
          element.style.backgroundColor = 'var(--primary-light)';
          setTimeout(() => {
            element.style.backgroundColor = '';
          }, 2000);
        }
      }, 300);
    } else if (targetTab === 'expense') {
      setTimeout(() => {
        const element = document.getElementById(`expense-item-${notif.targetId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.transition = 'background-color 0.5s';
          element.style.backgroundColor = 'var(--primary-light)';
          setTimeout(() => {
            element.style.backgroundColor = '';
          }, 2000);
        }
      }, 300);
    }
  };

  // Load User, Plans and restore state on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('family_travel_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);

      // Proactive silent profile sync to Firestore (so offline profile images sync immediately when backend is up)
      if (parsedUser.name && (parsedUser.profileImage || parsedUser.nickname)) {
        fetch(`${API_BASE}/api/auth/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: parsedUser.name,
            nickname: parsedUser.nickname,
            profileImage: parsedUser.profileImage
          })
        }).then(res => {
          if (res.ok) {
            console.log("Silent profile sync succeeded on mount");
          }
        }).catch(err => {
          console.warn("Silent profile sync failed (offline):", err);
        });
      }
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
          const response = await fetch(`${API_BASE}/api/plans/${id}`);
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
      const response = await fetch(`${API_BASE}/api/trash`);
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
      const response = await fetch(`${API_BASE}/api/trash/${id}/restore`, {
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
      const response = await fetch(`${API_BASE}/api/trash/${id}`, {
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
        const dateStr = getLocalDateStr(targetDate);
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
      const response = await fetch(`${API_BASE}/api/anniversaries`);
      if (response.ok) {
        const dbAnns = await response.json();
        setAnniversaries(dbAnns);
      }
    } catch (err) {
      console.warn("Failed to fetch anniversaries:", err);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/plans`);
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
      const response = await fetch(`${API_BASE}/api/plans/${id}`);
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
      const response = await fetch(`${API_BASE}/api/auth/login`, {
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

  // Profile update handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileUpdating(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.name,
          nickname: profileForm.nickname,
          profileImage: profileForm.profileImage,
          password: profileForm.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        localStorage.setItem('family_travel_user', JSON.stringify(data.user));
        setUsersMap(prev => ({
          ...prev,
          [data.user.name]: {
            nickname: data.user.nickname,
            profileImage: data.user.profileImage
          }
        }));
        setShowProfileModal(false);
      } else {
        const errData = await response.json();
        setProfileError(errData.message || '프로필 수정에 실패했습니다.');
      }
    } catch (err) {
      console.warn("Offline profile update fallback:");
      const updatedUser = {
        ...currentUser,
        nickname: profileForm.nickname || currentUser.name,
        profileImage: profileForm.profileImage || currentUser.profileImage
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('family_travel_user', JSON.stringify(updatedUser));
      setUsersMap(prev => ({
        ...prev,
        [updatedUser.name]: {
          nickname: updatedUser.nickname,
          profileImage: updatedUser.profileImage
        }
      }));
      setShowProfileModal(false);
    } finally {
      setProfileUpdating(false);
    }
  };

  // Helper to handle profile image file upload with compression and base64 fallback
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfileUpdating(true);
    setProfileError('');

    // Browser-side image resizing and compression
    const compressImage = (inputFile) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(inputFile);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 150; // Resize to max 150x150 for profile avatar
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const base64Str = canvas.toDataURL('image/jpeg', 0.75); // 75% quality JPEG
            canvas.toBlob((blob) => {
              resolve({ blob, base64: base64Str });
            }, 'image/jpeg', 0.75);
          };
        };
      });
    };

    try {
      const { blob, base64 } = await compressImage(file);

      // Create FormData with compressed blob
      const formData = new FormData();
      formData.append('files', blob, 'profile.jpg');

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.urls && data.urls.length > 0) {
          setProfileForm(prev => ({ ...prev, profileImage: data.urls[0] }));
        } else {
          // Empty URLs, fallback to compressed base64
          setProfileForm(prev => ({ ...prev, profileImage: base64 }));
        }
      } else {
        console.warn("Upload endpoint returned error code, falling back to base64.");
        setProfileForm(prev => ({ ...prev, profileImage: base64 }));
      }
    } catch (err) {
      console.error("Profile image upload failed, falling back to base64:", err);
      // Fallback: convert original file to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setProfileUpdating(false);
    }
  };

  const saveUpdatedPlan = (updatedPlan) => {
    setPlan(updatedPlan);
    
    // Update local plans array
    const updatedPlans = plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    setPlans(updatedPlans);
    localStorage.setItem('family_travel_plans', JSON.stringify(updatedPlans));
    
    // Sync with backend API
    fetch(`${API_BASE}/api/plans/${updatedPlan.id}/sync`, {
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
      const response = await fetch(`${API_BASE}/api/plans`, {
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
      const response = await fetch(`${API_BASE}/api/plans`, {
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
        const response = await fetch(`${API_BASE}/api/plans/${id}`, {
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
      const response = await fetch(`${API_BASE}/api/upload`, {
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
  const handleImageAttach = async (files, isEdit = false, isMap = false) => {
    const urls = await uploadImages(files);
    if (urls.length === 0) return;
    
    if (isEdit) {
      if (isMap) {
        setEditingPlace(prev => ({
          ...prev,
          mapImages: [...(prev.mapImages || []), ...urls]
        }));
      } else {
        setEditingPlace(prev => ({
          ...prev,
          images: [...(prev.images || []), ...urls]
        }));
      }
    } else {
      if (isMap) {
        setNewPlace(prev => ({
          ...prev,
          mapImages: [...(prev.mapImages || []), ...urls]
        }));
      } else {
        setNewPlace(prev => ({
          ...prev,
          images: [...(prev.images || []), ...urls]
        }));
      }
    }
  };

  // Paste Event Handler (Ctrl+V)
  const handlePasteImages = (e, isEdit = false, isMap = false) => {
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
      handleImageAttach(filesToUpload, isEdit, isMap);
    }
  };

  // Drop Event Handler
  const handleDropImages = (e, isEdit = false, isMap = false) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      handleImageAttach(imageFiles, isEdit, isMap);
    }
  };

  // Saved Places Paste & Drop Handlers
  const handleSavedPlaceImageAttach = async (files, isEdit = false) => {
    const urls = await uploadImages(files);
    if (urls.length === 0) return;
    if (isEdit) {
      setEditingSavedPlace(prev => ({
        ...prev,
        images: [...(prev.images || []), ...urls]
      }));
    } else {
      setNewSavedPlace(prev => ({
        ...prev,
        images: [...(prev.images || []), ...urls]
      }));
    }
  };

  const handleSavedPlacePaste = (e, isEdit = false) => {
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
      handleSavedPlaceImageAttach(filesToUpload, isEdit);
    }
  };

  const handleSavedPlaceDrop = (e, isEdit = false) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      handleSavedPlaceImageAttach(imageFiles, isEdit);
    }
  };

  // Alternative Places Paste & Drop Handlers
  const handleAltImageAttach = async (files) => {
    const urls = await uploadImages(files);
    if (urls.length === 0) return;
    setAlternativeForm(prev => ({
      ...prev,
      alt: {
        ...prev.alt,
        images: [...(prev.alt?.images || []), ...urls]
      }
    }));
  };

  const handleAltPaste = (e) => {
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
      handleAltImageAttach(filesToUpload);
    }
  };

  const handleAltDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      handleAltImageAttach(imageFiles);
    }
  };

  // Remove single image from temporary list
  const handleRemoveImage = (index, isEdit = false, isMap = false) => {
    if (isEdit) {
      if (isMap) {
        setEditingPlace(prev => ({
          ...prev,
          mapImages: (prev.mapImages || []).filter((_, i) => i !== index)
        }));
      } else {
        setEditingPlace(prev => ({
          ...prev,
          images: (prev.images || []).filter((_, i) => i !== index)
        }));
      }
    } else {
      if (isMap) {
        setNewPlace(prev => ({
          ...prev,
          mapImages: (prev.mapImages || []).filter((_, i) => i !== index)
        }));
      } else {
        setNewPlace(prev => ({
          ...prev,
          images: (prev.images || []).filter((_, i) => i !== index)
        }));
      }
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

  const prepareEditingPlace = (place) => {
    if (!place) return null;
    let costsList = place.costs ? [...place.costs] : [];
    if (costsList.length === 0 && Number(place.estimatedCost) > 0) {
      costsList = [{
        id: `${place.id}_c0`,
        title: place.name,
        amount: Number(place.estimatedCost),
        category: place.category || '관광',
        payer: place.payer || '미지정'
      }];
    }
    return {
      ...place,
      duration: place.duration || 0,
      costs: costsList
    };
  };

  // Long-press event handlers for itinerary cards
  const handleStartPress = (e, place) => {
    if (e) e.stopPropagation();
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      setEditingPlace(prepareEditingPlace(place));
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
        return getLocalDateStr(date);
      } catch (e) {
        return start;
      }
    };
    
    const targetDateStr = getTargetDate(plan.startDate, dayNumber);
    const placeId = Date.now();
    const durationValue = newPlace.duration ? Number(newPlace.duration) : 0; // default 0 minutes
    const costCurrency = newPlace.currency || plan.currency || 'KRW';

    // Process costs breakdown
    let costsList = newPlace.costs ? newPlace.costs.filter(c => Number(c.amount) > 0) : [];
    if (costsList.length === 0 && Number(newPlace.estimatedCost) > 0) {
      costsList = [{
        id: `${placeId}_c0`,
        title: newPlace.name,
        amount: Number(newPlace.estimatedCost),
        category: newPlace.category || '관광',
        payer: newPlace.payer || '미지정'
      }];
    }
    const totalCostValue = costsList.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const primaryPayer = costsList.length === 1 ? costsList[0].payer : (newPlace.payer || '미지정');

    const newPlaceObj = {
      id: placeId,
      time: newPlace.time,
      name: newPlace.name,
      address: newPlace.address || '',
      description: newPlace.description,
      category: newPlace.category,
      estimatedCost: totalCostValue,
      currency: costCurrency,
      needsReservation: newPlace.needsReservation,
      isReservationCompleted: newPlace.needsReservation ? newPlace.isReservationCompleted : false,
      tip: newPlace.tip,
      payer: primaryPayer,
      duration: durationValue,
      costs: costsList,
      comments: [],
      images: newPlace.images || [],
      mapImages: newPlace.mapImages || [],
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

    // Auto-sync costs breakdown to plan.expenses
    if (costsList.length > 0) {
      costsList.forEach((cItem, cIdx) => {
        const cAmount = Number(cItem.amount || 0);
        if (cAmount > 0) {
          const expenseAmount = Math.round(costCurrency === 'KRW' ? cAmount : cAmount * (costCurrency === (plan.currency || 'KRW') ? exchangeRate.rate : (FALLBACK_KRW_RATES[costCurrency] || 1)));
          const expenseItem = {
            id: cItem.id || `${placeId}_c${cIdx}`,
            placeId: placeId,
            title: `[일정] ${newPlace.name}${cItem.title ? ` - ${cItem.title}` : ''}`,
            amount: expenseAmount,
            originalAmount: cAmount,
            currency: costCurrency,
            payer: cItem.payer || '미지정',
            date: targetDateStr,
            category: cItem.category || newPlace.category || '기타'
          };
          updatedPlan.expenses.push(expenseItem);
        }
      });
    }

    saveUpdatedPlan(updatedPlan);
    triggerNotification('place_add', placeId, newPlaceObj.name, 'itinerary');
    setNewPlace({
      day: 1, time: '', name: '', address: '', description: '', category: '관광', estimatedCost: '',
      currency: plan.currency || 'KRW', needsReservation: false, isReservationCompleted: false, tip: '', payer: '미지정', duration: 0, costs: [], images: [],
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
        return getLocalDateStr(date);
      } catch (e) {
        return start;
      }
    };

    for (let d = 0; d < updatedPlan.itinerary.length; d++) {
      const dayItem = updatedPlan.itinerary[d];
      const idx = dayItem.places.findIndex(p => p.id === editingPlace.id);
      if (idx !== -1) {
        dayNo = dayItem.day;
        const durationValue = editingPlace.duration ? Number(editingPlace.duration) : 0;
        const costCurrency = editingPlace.currency || plan.currency || 'KRW';

        // Process costs breakdown
        let costsList = editingPlace.costs ? editingPlace.costs.filter(c => Number(c.amount) > 0) : [];
        if (costsList.length === 0 && Number(editingPlace.estimatedCost) > 0) {
          costsList = [{
            id: `${editingPlace.id}_c0`,
            title: editingPlace.name,
            amount: Number(editingPlace.estimatedCost),
            category: editingPlace.category || '관광',
            payer: editingPlace.payer || '미지정'
          }];
        }
        const totalCostValue = costsList.reduce((sum, c) => sum + Number(c.amount || 0), 0);
        const primaryPayer = costsList.length === 1 ? costsList[0].payer : (editingPlace.payer || '미지정');

        dayItem.places[idx] = {
          ...dayItem.places[idx],
          time: editingPlace.time,
          name: editingPlace.name,
          address: editingPlace.address || '',
          duration: durationValue,
          category: editingPlace.category,
          description: editingPlace.description,
          estimatedCost: totalCostValue,
          currency: costCurrency,
          needsReservation: editingPlace.needsReservation,
          isReservationCompleted: editingPlace.isReservationCompleted || false,
          tip: editingPlace.tip,
          payer: primaryPayer,
          costs: costsList,
          images: editingPlace.images || [],
          mapImages: editingPlace.mapImages || [],
          transportType: editingPlace.transportType || '',
          transportDuration: editingPlace.transportDuration || ''
        };

        // Cascade shifting for this specific day
        dayItem.places = shiftItineraryTimes(dayItem.places);
        found = true;

        // Auto-sync or update linked expenses: remove old ones for this place first
        const targetDateStr = getTargetDate(plan.startDate, dayNo);
        updatedPlan.expenses = updatedPlan.expenses.filter(exp => exp.placeId !== editingPlace.id && exp.id !== editingPlace.id && !(typeof exp.id === 'string' && exp.id.startsWith(`${editingPlace.id}_`)));

        if (costsList.length > 0) {
          costsList.forEach((cItem, cIdx) => {
            const cAmount = Number(cItem.amount || 0);
            if (cAmount > 0) {
              const expenseAmount = Math.round(costCurrency === 'KRW' ? cAmount : cAmount * (costCurrency === (plan.currency || 'KRW') ? exchangeRate.rate : (FALLBACK_KRW_RATES[costCurrency] || 1)));
              const expenseItem = {
                id: cItem.id || `${editingPlace.id}_c${cIdx}`,
                placeId: editingPlace.id,
                title: `[일정] ${editingPlace.name}${cItem.title ? ` - ${cItem.title}` : ''}`,
                amount: expenseAmount,
                originalAmount: cAmount,
                currency: costCurrency,
                payer: cItem.payer || '미지정',
                date: targetDateStr,
                category: cItem.category || editingPlace.category || '기타'
              };
              updatedPlan.expenses.push(expenseItem);
            }
          });
        }
        break;
      }
    }

    if (found) {
      saveUpdatedPlan(updatedPlan);
      triggerNotification('place_edit', editingPlace.id, editingPlace.name, 'itinerary');
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
      if (selectedDetailPlace && selectedDetailPlace.id === placeId) {
        setSelectedDetailPlace({ ...selectedDetailPlace, isReservationCompleted: !selectedDetailPlace.isReservationCompleted });
      }
    }
  };

  // Add Saved Place (Places Tab)
  const handleAddSavedPlace = async (e) => {
    e.preventDefault();
    if (!newSavedPlace.name) return;

    const updatedPlan = { ...plan };
    if (!updatedPlan.savedPlaces) {
      updatedPlan.savedPlaces = [];
    }

    let lat = null;
    let lng = null;
    const queryStr = newSavedPlace.address && newSavedPlace.address.trim() !== '' ? newSavedPlace.address : newSavedPlace.name;
    if (queryStr && queryStr.trim() !== '') {
      try {
        const response = await fetch(`${API_BASE}/api/geocoding?query=${encodeURIComponent(queryStr)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.lat && data.lng) {
            lat = parseFloat(data.lat);
            lng = parseFloat(data.lng);
          }
        }
      } catch (err) {
        console.warn("Geocoding failed:", err);
      }
    }

    const newObj = {
      id: `sp-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      name: newSavedPlace.name,
      category: newSavedPlace.category,
      address: newSavedPlace.address,
      description: newSavedPlace.description,
      tip: newSavedPlace.tip,
      url: newSavedPlace.url || (planCurrency === 'KRW'
        ? `https://map.naver.com/p/search/${encodeURIComponent(newSavedPlace.address || newSavedPlace.name)}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newSavedPlace.address || newSavedPlace.name)}`),
      images: newSavedPlace.images ? [...newSavedPlace.images] : [],
      lat,
      lng
    };

    updatedPlan.savedPlaces.push(newObj);
    saveUpdatedPlan(updatedPlan);
    setShowAddSavedPlaceModal(false);
    setNewSavedPlace({ name: '', category: '관광', address: '', description: '', tip: '', url: '', images: [] });
  };

  // Edit Saved Place (Places Tab)
  const handleEditSavedPlace = async (e) => {
    e.preventDefault();
    if (!editingSavedPlace || !editingSavedPlace.name) return;

    const updatedPlan = { ...plan };
    const idx = updatedPlan.savedPlaces.findIndex(sp => sp.id === editingSavedPlace.id);
    if (idx === -1) return;

    let lat = editingSavedPlace.lat;
    let lng = editingSavedPlace.lng;
    const oldAddr = plan.savedPlaces[idx].address;
    const oldName = plan.savedPlaces[idx].name;

    if (!lat || !lng || editingSavedPlace.address !== oldAddr || editingSavedPlace.name !== oldName) {
      const queryStr = editingSavedPlace.address && editingSavedPlace.address.trim() !== '' ? editingSavedPlace.address : editingSavedPlace.name;
      if (queryStr && queryStr.trim() !== '') {
        try {
          const response = await fetch(`${API_BASE}/api/geocoding?query=${encodeURIComponent(queryStr)}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.lat && data.lng) {
              lat = parseFloat(data.lat);
              lng = parseFloat(data.lng);
            }
          }
        } catch (err) {
          console.warn("Geocoding failed:", err);
        }
      }
    }

    const updatedObj = {
      ...editingSavedPlace,
      lat,
      lng,
      url: editingSavedPlace.url || (planCurrency === 'KRW'
        ? `https://map.naver.com/p/search/${encodeURIComponent(editingSavedPlace.address || editingSavedPlace.name)}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(editingSavedPlace.address || editingSavedPlace.name)}`)
    };

    updatedPlan.savedPlaces[idx] = updatedObj;
    saveUpdatedPlan(updatedPlan);
    setEditingSavedPlace(null);
  };

  // Delete Saved Place (Places Tab)
  const handleDeleteSavedPlace = (spId) => {
    openConfirm("🗑️ 장소 삭제", "정말로 이 후보 장소를 삭제하시겠습니까?", () => {
      const updatedPlan = { ...plan };
      updatedPlan.savedPlaces = (updatedPlan.savedPlaces || []).filter(sp => sp.id !== spId);
      saveUpdatedPlan(updatedPlan);
    });
  };

  // Save Alternative (Schedule Detail Modal)
  const handleSaveAlternative = (e) => {
    e.preventDefault();
    if (!alternativeForm) return;

    const { mode, placeId, alt } = alternativeForm;
    if (!alt.name) return;

    const updatedPlan = { ...plan };
    let foundPlace = null;
    for (const dayItem of updatedPlan.itinerary) {
      const p = dayItem.places.find(item => item.id === placeId);
      if (p) {
        foundPlace = p;
        break;
      }
    }

    if (!foundPlace) return;

    if (!foundPlace.alternatives) {
      foundPlace.alternatives = [];
    }

    if (mode === 'add') {
      const newAltObj = {
        id: `alt-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        name: alt.name,
        category: alt.category,
        address: alt.address,
        description: alt.description,
        tip: alt.tip,
        estimatedCost: alt.estimatedCost ? Number(alt.estimatedCost) : 0,
        currency: alt.currency || planCurrency,
        payer: alt.payer || '미지정',
        needsReservation: alt.needsReservation || false,
        isReservationCompleted: alt.isReservationCompleted || false,
        images: alt.images ? [...alt.images] : [],
        mapImages: []
      };
      foundPlace.alternatives.push(newAltObj);
    } else if (mode === 'edit') {
      const altIdx = foundPlace.alternatives.findIndex(item => item.id === alt.id);
      if (altIdx !== -1) {
        foundPlace.alternatives[altIdx] = {
          ...foundPlace.alternatives[altIdx],
          name: alt.name,
          category: alt.category,
          address: alt.address,
          description: alt.description,
          tip: alt.tip,
          estimatedCost: alt.estimatedCost ? Number(alt.estimatedCost) : 0,
          currency: alt.currency || planCurrency,
          payer: alt.payer || '미지정',
          needsReservation: alt.needsReservation || false,
          isReservationCompleted: alt.isReservationCompleted || false,
          images: alt.images ? [...alt.images] : (foundPlace.alternatives[altIdx].images || [])
        };
      }
    }

    saveUpdatedPlan(updatedPlan);
    
    // Refresh modal place state
    setSelectedDetailPlace({ ...foundPlace });
    setAlternativeForm(null);
  };

  // Delete Alternative (Schedule Detail Modal)
  const handleDeleteAlternative = (placeId, altId) => {
    openConfirm("🗑️ 대안 일정 삭제", "정말로 이 대안 후보 일정을 삭제하시겠습니까?", () => {
      const updatedPlan = { ...plan };
      let foundPlace = null;
      for (const dayItem of updatedPlan.itinerary) {
        const p = dayItem.places.find(item => item.id === placeId);
        if (p) {
          foundPlace = p;
          break;
        }
      }

      if (foundPlace && foundPlace.alternatives) {
        foundPlace.alternatives = foundPlace.alternatives.filter(a => a.id !== altId);
        saveUpdatedPlan(updatedPlan);
        setSelectedDetailPlace({ ...foundPlace });
      }
    });
  };

  // Import Saved Place as Alternative (Schedule Detail Modal)
  const handleImportFromSavedPlaces = (placeId, savedPlaceObj) => {
    const updatedPlan = { ...plan };
    let foundPlace = null;
    for (const dayItem of updatedPlan.itinerary) {
      const p = dayItem.places.find(item => item.id === placeId);
      if (p) {
        foundPlace = p;
        break;
      }
    }

    if (!foundPlace) return;
    if (!foundPlace.alternatives) {
      foundPlace.alternatives = [];
    }

    if (foundPlace.alternatives.some(a => a.name === savedPlaceObj.name && a.address === savedPlaceObj.address)) {
      alert("이미 대안 리스트에 동일한 이름/주소의 장소가 존재합니다.");
      return;
    }

    const newAltObj = {
      id: `alt-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      name: savedPlaceObj.name,
      category: savedPlaceObj.category,
      address: savedPlaceObj.address,
      description: savedPlaceObj.description,
      tip: savedPlaceObj.tip,
      estimatedCost: 0,
      currency: planCurrency,
      payer: '미지정',
      needsReservation: false,
      isReservationCompleted: false,
      images: savedPlaceObj.images ? [...savedPlaceObj.images] : [],
      mapImages: []
    };

    foundPlace.alternatives.push(newAltObj);
    saveUpdatedPlan(updatedPlan);
    setSelectedDetailPlace({ ...foundPlace });
  };

  // Swap Main Place with Alternative (Schedule Detail Modal)
  const handleSwapPlaceWithAlternative = (placeId, altId) => {
    const updatedPlan = { ...plan };
    let foundDayItem = null;
    let foundPlaceIndex = -1;
    let foundPlace = null;

    for (const dayItem of updatedPlan.itinerary) {
      const idx = dayItem.places.findIndex(p => p.id === placeId);
      if (idx !== -1) {
        foundDayItem = dayItem;
        foundPlaceIndex = idx;
        foundPlace = dayItem.places[idx];
        break;
      }
    }

    if (!foundPlace || foundPlaceIndex === -1) return;
    if (!foundPlace.alternatives) return;

    const altIndex = foundPlace.alternatives.findIndex(a => a.id === altId);
    if (altIndex === -1) return;

    const selectedAlt = foundPlace.alternatives[altIndex];

    const oldMainData = {
      name: foundPlace.name,
      category: foundPlace.category,
      address: foundPlace.address,
      description: foundPlace.description,
      tip: foundPlace.tip,
      estimatedCost: foundPlace.estimatedCost || foundPlace.cost || 0,
      currency: foundPlace.currency || planCurrency,
      payer: foundPlace.payer || '미지정',
      needsReservation: foundPlace.needsReservation || false,
      isReservationCompleted: foundPlace.isReservationCompleted || false,
      images: foundPlace.images ? [...foundPlace.images] : [],
      mapImages: foundPlace.mapImages ? [...foundPlace.mapImages] : [],
      transportType: foundPlace.transportType || '',
      transportDuration: foundPlace.transportDuration || ''
    };

    const newMainPlace = {
      ...foundPlace,
      name: selectedAlt.name,
      category: selectedAlt.category,
      address: selectedAlt.address,
      description: selectedAlt.description,
      tip: selectedAlt.tip,
      estimatedCost: selectedAlt.estimatedCost || 0,
      currency: selectedAlt.currency || planCurrency,
      payer: selectedAlt.payer || '미지정',
      needsReservation: selectedAlt.needsReservation || false,
      isReservationCompleted: selectedAlt.isReservationCompleted || false,
      images: selectedAlt.images ? [...selectedAlt.images] : [],
      mapImages: selectedAlt.mapImages ? [...selectedAlt.mapImages] : [],
      transportType: selectedAlt.transportType || '',
      transportDuration: selectedAlt.transportDuration || ''
    };

    const newAlt = {
      id: selectedAlt.id,
      name: oldMainData.name,
      category: oldMainData.category,
      address: oldMainData.address,
      description: oldMainData.description,
      tip: oldMainData.tip,
      estimatedCost: oldMainData.estimatedCost,
      currency: oldMainData.currency,
      payer: oldMainData.payer,
      needsReservation: oldMainData.needsReservation,
      isReservationCompleted: oldMainData.isReservationCompleted,
      images: oldMainData.images,
      mapImages: oldMainData.mapImages
    };

    const updatedAlts = [...foundPlace.alternatives];
    updatedAlts[altIndex] = newAlt;
    newMainPlace.alternatives = updatedAlts;

    foundDayItem.places[foundPlaceIndex] = newMainPlace;

    saveUpdatedPlan(updatedPlan);
    setSelectedDetailPlace(newMainPlace); // Refresh Detail Modal
  };

  // Anniversary Handlers
  const handleAddAnniversary = async (e) => {
    e.preventDefault();
    if (!newAnniversary.name) return;

    try {
      const response = await fetch(`${API_BASE}/api/anniversaries`, {
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
      const response = await fetch(`${API_BASE}/api/anniversaries`, {
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
        const response = await fetch(`${API_BASE}/api/anniversaries/${id}`, {
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
      triggerNotification('comment_add', placeId, targetPlace.name, 'itinerary');
      
      if (selectedDetailPlace && selectedDetailPlace.id === placeId) {
        setSelectedDetailPlace({ ...targetPlace });
      }
      
      // Clear input
      setCommentInputs({ ...commentInputs, [placeId]: '' });

      // Send to server
      try {
        await fetch(`${API_BASE}/api/plans/${plan.id}/places/${placeId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ author, text })
        });
      } catch (err) {
        console.warn("Saved comment locally, offline sync queued.");
      }
    }
  };

  // Edit Comment in Place
  const handleUpdateComment = async (placeId, commentId, newText) => {
    if (!newText || !newText.trim()) return;

    // Optimistically update local state first
    const updatedPlan = { ...plan };
    let foundComment = null;
    let foundPlace = null;
    for (const dayItem of updatedPlan.itinerary) {
      const pItem = dayItem.places.find(p => p.id === placeId);
      if (pItem && pItem.comments) {
        foundComment = pItem.comments.find(c => c.id === commentId);
        if (foundComment) {
          foundPlace = pItem;
          break;
        }
      }
    }

    if (foundComment && foundPlace) {
      foundComment.text = newText;
      saveUpdatedPlan(updatedPlan);
      
      if (selectedDetailPlace && selectedDetailPlace.id === placeId) {
        setSelectedDetailPlace({ ...foundPlace });
      }
      
      setEditingCommentId(null);
      setEditingCommentText('');

      // Send to server
      try {
        await fetch(`${API_BASE}/api/plans/${plan.id}/places/${placeId}/comments/${commentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newText })
        });
      } catch (err) {
        console.warn("Updated comment locally, offline sync queued.");
      }
    }
  };

  // Delete Comment in Place
  const handleDeleteComment = async (placeId, commentId) => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;

    // Optimistically update local state first
    const updatedPlan = { ...plan };
    let updated = false;
    let targetPlace = null;
    for (const dayItem of updatedPlan.itinerary) {
      const pItem = dayItem.places.find(p => p.id === placeId);
      if (pItem && pItem.comments) {
        const initialLen = pItem.comments.length;
        pItem.comments = pItem.comments.filter(c => c.id !== commentId);
        if (pItem.comments.length !== initialLen) {
          targetPlace = pItem;
          updated = true;
          break;
        }
      }
    }

    if (updated && targetPlace) {
      saveUpdatedPlan(updatedPlan);
      
      if (selectedDetailPlace && selectedDetailPlace.id === placeId) {
        setSelectedDetailPlace({ ...targetPlace });
      }

      // Send to server
      try {
        await fetch(`${API_BASE}/api/plans/${plan.id}/places/${placeId}/comments/${commentId}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn("Deleted comment locally, offline sync queued.");
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
    triggerNotification('checklist_add', newItem.id, newItem.title, 'checklist');
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
      date: newExpense.date || getLocalDateStr(),
      category: newExpense.category || '기타'
    };
    updatedPlan.expenses.push(newItem);

    saveUpdatedPlan(updatedPlan);
    triggerNotification('expense_add', newItem.id, newItem.title, 'expense');
    setNewExpense({ title: '', amount: '', payer: '', date: '', category: '기타' });
    setShowModal(false);
  };

  // Delete Standalone Expense Item
  const handleDeleteExpense = (expenseId) => {
    const updatedPlan = { ...plan };
    updatedPlan.expenses = updatedPlan.expenses.filter(e => e.id !== expenseId);
    saveUpdatedPlan(updatedPlan);
  };

  const isGuest = currentUser?.role === 'guest';

  // Toggle Checklist Checked State
  const handleToggleCheck = (itemId) => {
    if (isGuest) {
      alert('게스트(조회 전용) 계정은 수정 권한이 없습니다.');
      return;
    }
    const updatedPlan = { ...plan };
    const checkItem = updatedPlan.checklists.find(c => c.id === itemId);
    if (checkItem) {
      checkItem.checked = !checkItem.checked;
      saveUpdatedPlan(updatedPlan);
    }
  };

  // Current Date Helper to divide plans
  const today = getLocalDateStr();
  const activeTrips = plans.filter(p => (currentUser?.role === 'admin' || isGuest || p.members.includes(currentUser?.name)) && !p.isEvent && p.endDate >= today);
  const pastTrips = plans.filter(p => (currentUser?.role === 'admin' || isGuest || p.members.includes(currentUser?.name)) && !p.isEvent && p.endDate < today);

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

  const unreadCount = notifications.filter(n => !n.readBy || !n.readBy.includes(currentUser.name)).length;

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
              <div 
                className="user-profile-trigger" 
                onClick={() => {
                  setProfileForm({
                    nickname: currentUser.nickname || currentUser.name,
                    profileImage: currentUser.profileImage || null,
                    password: ''
                  });
                  setShowProfileModal(true);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 10px', borderRadius: '20px', background: 'var(--primary-light)', transition: 'background-color 0.2s', border: '1px solid var(--border)' }}
              >
                {currentUser.profileImage ? (
                  <img 
                    src={currentUser.profileImage} 
                    alt="profile" 
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--primary)' }}
                  />
                ) : (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {(currentUser.nickname || currentUser.name).slice(0, 1)}
                  </div>
                )}
                <span className="user-welcome" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                  {currentUser.nickname || currentUser.name}님
                </span>
                {isGuest && (
                  <span style={{ fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    👁️ 조회전용
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⚙️</span>
              </div>
              <button 
                onClick={() => setShowNotifModal(true)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '1.2rem', 
                  cursor: 'pointer', 
                  position: 'relative',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text)',
                  marginRight: '4px'
                }}
                title="알림 센터"
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '2px', 
                    right: '2px', 
                    background: 'var(--danger)', 
                    color: '#fff', 
                    fontSize: '0.62rem', 
                    borderRadius: '50%', 
                    width: '15px', 
                    height: '15px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 'bold',
                    boxShadow: '0 0 0 2px var(--bg-card)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              <button className="logout-btn" onClick={handleLogout} style={{ margin: 0, padding: '6px 12px', fontSize: '0.82rem' }}>로그아웃</button>
            </div>
          </header>

          <main className="app-content">


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
                // Generate virtual birthdays from FAM_USERS configuration (the single source of truth!)
                const virtualBirthdays = FAM_USERS.filter(user => user.role !== 'guest').map(user => {
                  const parts = user.birth.split('.').map(Number);
                  const y = parts[0];
                  const m = parts[1];
                  const d = parts[2];
                  const isElder = y < 1970;
                  return {
                    id: `virtual-birthday-${user.name}`,
                    name: isElder ? `${user.name}생신` : `${user.name}생일`,
                    year: y,
                    month: m,
                    day: d,
                    isLunar: user.isLunar || false,
                    type: 'birthday'
                  };
                });

                // Filter out database birthdays that correspond to family members in FAM_USERS to prevent duplication
                const memberNames = FAM_USERS.map(u => u.name);
                const filteredDbAnns = (anniversaries || []).filter(ann => {
                  if (ann.type === 'birthday') {
                    const cleanName = ann.name.replace(/생일|생신/g, '').trim();
                    if (memberNames.includes(cleanName)) return false;
                  }
                  return true;
                });

                const combinedAnniversaries = [...filteredDbAnns, ...virtualBirthdays];
                const yearAnniversaries = getAnniversariesForYear(year, combinedAnniversaries, currentUser?.name);
                const cellAnniversaries = yearAnniversaries.filter(a => a.dateStr === dateStr);

                const normalEvents = plans.filter(p => {
                  const hasAccess = currentUser?.role === 'admin' || isGuest || p.members.includes(currentUser?.name);
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
              const todayStr = getLocalDateStr();
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
                                  {e.isAnniversary ? (
                                    e.type === 'birthday' ? (e.name.includes('생신') ? '생신' : '생일') :
                                    e.type === 'memorial' ? '기일' :
                                    e.type === 'ritual' ? '제사' : '기념일'
                                  ) : (e.isEvent ? '행사' : '여행')}
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
                      {p.members.map((m, idx) => {
                        const mInfo = usersMap[m] || { nickname: m, profileImage: null };
                        return (
                          <div key={idx} className="avatar" title={mInfo.nickname} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {mInfo.profileImage ? (
                              <img src={mInfo.profileImage} alt={mInfo.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              mInfo.nickname.slice(0, 1)
                            )}
                          </div>
                        );
                      })}
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
                      {p.members.map((m, idx) => {
                        const mInfo = usersMap[m] || { nickname: m, profileImage: null };
                        return (
                          <div key={idx} className="avatar" title={mInfo.nickname} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {mInfo.profileImage ? (
                              <img src={mInfo.profileImage} alt={mInfo.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              mInfo.nickname.slice(0, 1)
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <span className="go-arrow">기록 보기 ➔</span>
                  </div>
                </div>
              ))
            )}
          </main>

          {/* Floating Action Button on Home Screen */}
          {!isGuest && <button className={`fab ${isFabVisible ? '' : 'hidden'}`} onClick={() => setShowAddTripModal(true)}>+</button>}
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
            padding: '10px 12px', 
            gap: '4px',
            position: 'sticky',
            top: 0,
            zIndex: 999,
            backgroundColor: 'var(--bg-app, #ffffff)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            borderBottom: '1px solid var(--border)'
          }}>
            <button 
              className="back-btn" 
              onClick={() => setView('home')} 
              style={{ 
                minWidth: '54px', 
                padding: '6px 10px', 
                fontSize: '0.8rem', 
                fontWeight: '600', 
                color: 'var(--text)', 
                backgroundColor: 'var(--bg-card, #ffffff)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                whiteSpace: 'nowrap', 
                flexShrink: 0,
                margin: 0
              }} 
              title="홈으로 이동"
            >
              홈
            </button>
            <div className="header-tabs" style={{ display: 'flex', flex: 1, justifyContent: 'flex-start', gap: '5px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', padding: '4px 0' }}>
              <button 
                className={`tab-btn ${activeTab === 'itinerary' ? 'active' : ''}`} 
                style={{ 
                  minWidth: '54px', 
                  padding: '6px 10px', 
                  fontSize: '0.8rem', 
                  fontWeight: activeTab === 'itinerary' ? '700' : '600', 
                  color: activeTab === 'itinerary' ? '#ffffff' : 'var(--text-muted)', 
                  backgroundColor: activeTab === 'itinerary' ? 'var(--primary)' : 'var(--bg-card, #ffffff)', 
                  border: `1px solid ${activeTab === 'itinerary' ? 'var(--primary)' : 'var(--border)'}`, 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  whiteSpace: 'nowrap', 
                  flexShrink: 0,
                  margin: 0 
                }} 
                onClick={() => setActiveTab('itinerary')}
              >
                일정
              </button>
              <button 
                className={`tab-btn ${activeTab === 'places' ? 'active' : ''}`} 
                style={{ 
                  minWidth: '54px', 
                  padding: '6px 10px', 
                  fontSize: '0.8rem', 
                  fontWeight: activeTab === 'places' ? '700' : '600', 
                  color: activeTab === 'places' ? '#ffffff' : 'var(--text-muted)', 
                  backgroundColor: activeTab === 'places' ? 'var(--primary)' : 'var(--bg-card, #ffffff)', 
                  border: `1px solid ${activeTab === 'places' ? 'var(--primary)' : 'var(--border)'}`, 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  whiteSpace: 'nowrap', 
                  flexShrink: 0,
                  margin: 0 
                }} 
                onClick={() => {
                  setActiveTab('places');
                  setSelectedDayFilter('all');
                  setSelectedChecklistFilter('all');
                  setSelectedExpenseFilter('all');
                }}
              >
                장소
              </button>
              <button 
                className={`tab-btn ${activeTab === 'checklist' ? 'active' : ''}`} 
                style={{ 
                  minWidth: '54px', 
                  padding: '6px 10px', 
                  fontSize: '0.8rem', 
                  fontWeight: activeTab === 'checklist' ? '700' : '600', 
                  color: activeTab === 'checklist' ? '#ffffff' : 'var(--text-muted)', 
                  backgroundColor: activeTab === 'checklist' ? 'var(--primary)' : 'var(--bg-card, #ffffff)', 
                  border: `1px solid ${activeTab === 'checklist' ? 'var(--primary)' : 'var(--border)'}`, 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  whiteSpace: 'nowrap', 
                  flexShrink: 0,
                  margin: 0 
                }} 
                onClick={() => setActiveTab('checklist')}
              >
                준비물
              </button>
              <button 
                className={`tab-btn ${activeTab === 'expense' ? 'active' : ''}`} 
                style={{ 
                  minWidth: '54px', 
                  padding: '6px 10px', 
                  fontSize: '0.8rem', 
                  fontWeight: activeTab === 'expense' ? '700' : '600', 
                  color: activeTab === 'expense' ? '#ffffff' : 'var(--text-muted)', 
                  backgroundColor: activeTab === 'expense' ? 'var(--primary)' : 'var(--bg-card, #ffffff)', 
                  border: `1px solid ${activeTab === 'expense' ? 'var(--primary)' : 'var(--border)'}`, 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  whiteSpace: 'nowrap', 
                  flexShrink: 0,
                  margin: 0 
                }} 
                onClick={() => setActiveTab('expense')}
              >
                경비
              </button>
              <button 
                className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} 
                style={{ 
                  minWidth: '54px', 
                  padding: '6px 10px', 
                  fontSize: '0.8rem', 
                  fontWeight: activeTab === 'members' ? '700' : '600', 
                  color: activeTab === 'members' ? '#ffffff' : 'var(--text-muted)', 
                  backgroundColor: activeTab === 'members' ? 'var(--primary)' : 'var(--bg-card, #ffffff)', 
                  border: `1px solid ${activeTab === 'members' ? 'var(--primary)' : 'var(--border)'}`, 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  whiteSpace: 'nowrap', 
                  flexShrink: 0,
                  margin: 0 
                }} 
                onClick={() => {
                  setActiveTab('members');
                  // Reset sub-filters on changing tabs
                  setSelectedDayFilter('all');
                  setSelectedChecklistFilter('all');
                  setSelectedExpenseFilter('all');
                }}
              >
                가족
              </button>
            </div>
            <button 
              onClick={() => setShowNotifModal(true)}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '1.2rem', 
                cursor: 'pointer', 
                position: 'relative',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)',
                width: '32px',
                height: '32px',
                margin: 0
              }}
              title="알림 센터"
            >
              🔔
              {unreadCount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '2px', 
                  right: '2px', 
                  background: 'var(--danger)', 
                  color: '#fff', 
                  fontSize: '0.62rem', 
                  borderRadius: '50%', 
                  width: '15px', 
                  height: '15px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 'bold',
                  boxShadow: '0 0 0 2px var(--bg-card)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
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
                    {!isGuest && (
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
                    )}
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
                              <div className="timeline-item" style={{ marginBottom: '4px' }}>
                                <div className="timeline-dot"></div>
                              <div 
                                className="timeline-content"
                                onClick={() => setSelectedDetailPlace(place)}
                                style={{ cursor: 'pointer', position: 'relative' }}
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

                                <div className="timeline-title-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                  <div className="timeline-place" style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>{place.name}</div>
                                  {place.category && <span className={`category-badge category-${place.category}`} style={{ padding: '2px 6px', fontSize: '0.75rem' }}>{place.category}</span>}
                                </div>

                                {place.description && (
                                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                    {renderTextWithLinks(place.description)}
                                  </div>
                                )}

                                {/* Image Gallery Preview */}
                                {place.images && place.images.length > 0 && (
                                  <div className="timeline-images-gallery" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 0', scrollbarWidth: 'thin' }}>
                                    {place.images.map((imgUrl, imgIdx) => (
                                      <img
                                        key={imgIdx}
                                        src={imgUrl}
                                        alt={`${place.name} ${imgIdx + 1}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLightboxImagesList(place.images);
                                          setLightboxActiveIndex(imgIdx);
                                        }}
                                        style={{
                                          width: '70px',
                                          height: '70px',
                                          objectFit: 'cover',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          border: '1px solid var(--border)',
                                          flexShrink: 0
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* Tip / Precautions */}
                                {place.tip && (
                                  <div style={{ fontSize: '0.8rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fef3c7', padding: '6px 10px', borderRadius: '6px', marginTop: '6px', whiteSpace: 'pre-wrap' }}>
                                    💡 {renderTextWithLinks(place.tip)}
                                  </div>
                                )}

                                {/* Action Buttons and Indicators Row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }} onClick={e => e.stopPropagation()}>
                                  {/* Map Search / View */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleMapSearch(e, place.address || place.name, planCurrency)}
                                    title={place.address ? `지도 보기: ${place.address}` : '지도 검색'}
                                    style={{ 
                                      fontSize: '0.75rem', 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: '4px', 
                                      textDecoration: 'none', 
                                      color: 'var(--primary)', 
                                      background: 'var(--primary-light)', 
                                      padding: '4px 8px', 
                                      borderRadius: '6px',
                                      fontWeight: 'bold',
                                      border: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    🗺️{place.address ? '보기' : '찾기'}
                                  </button>

                                  {/* Reservation badge toggle */}
                                  {place.needsReservation && (
                                    place.isReservationCompleted ? (
                                      <div 
                                        onClick={(e) => { e.stopPropagation(); handleToggleReservationComplete(e, place.id); }}
                                        title="클릭하여 예약 필요로 상태 전환"
                                        style={{ 
                                          padding: '4px 8px', 
                                          borderRadius: '6px', 
                                          color: '#047857', 
                                          backgroundColor: '#d1fae5', 
                                          fontSize: '0.75rem', 
                                          fontWeight: 700, 
                                          cursor: 'pointer'
                                        }}
                                      >
                                        ✅ 예약 완료
                                      </div>
                                    ) : (
                                      <div 
                                        onClick={(e) => { e.stopPropagation(); handleToggleReservationComplete(e, place.id); }}
                                        title="클릭하여 예약 완료로 상태 전환"
                                        style={{ 
                                          padding: '4px 8px', 
                                          borderRadius: '6px', 
                                          color: '#b91c1c', 
                                          backgroundColor: '#fee2e2', 
                                          fontSize: '0.75rem', 
                                          fontWeight: 700, 
                                          cursor: 'pointer'
                                        }}
                                      >
                                        🎫 예약 필요
                                      </div>
                                    )
                                  )}

                                  {/* Comments count */}
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    💬 {place.comments ? place.comments.length : 0}
                                  </span>

                                  {/* Alternatives count indicator */}
                                  {place.alternatives && place.alternatives.length > 0 && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                      🔀 대안 {place.alternatives.length}
                                    </span>
                                  )}
                                </div>
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
                                margin: '6px 0', 
                                gap: '8px',
                                position: 'relative' 
                              }}>
                                <div style={{ 
                                  position: 'absolute', 
                                  left: '-18px', 
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: '14px',
                                  height: '14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--primary)',
                                  backgroundColor: 'var(--bg-card)',
                                  borderRadius: '50%',
                                  border: '1px solid var(--border)',
                                  zIndex: 2
                                }}>
                                  <span style={{ fontSize: '0.42rem', lineHeight: 1, display: 'block', height: '4px' }}>▼</span>
                                  <span style={{ fontSize: '0.42rem', lineHeight: 1, display: 'block', height: '4px', marginTop: '-1px' }}>▼</span>
                                </div>
                                
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
                                      {place.transportType === '비행기' && '✈️ '}
                                      {place.transportType === '여객선' && '🚢 '}
                                      {place.transportType === '기타' && '🚇 '}
                                      {place.transportType} {place.transportDuration ? (() => {
                                        const num = Number(place.transportDuration);
                                        if (isNaN(num) || num <= 0) return '';
                                        const hours = Math.floor(num / 60);
                                        const mins = num % 60;
                                        return hours > 0 ? `${hours}시간 ${mins > 0 ? `${mins}분` : ''}`.trim() : `${mins}분`;
                                      })() : ''} 이동
                                    </span>
                                  ) : (
                                    <span 
                                      style={{ cursor: 'pointer', opacity: 0.7 }} 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingPlace(prepareEditingPlace(place));
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
                                      ? `https://map.naver.com/p/directions?stext=${encodeURIComponent(place.address || place.name)}&etext=${encodeURIComponent(dayItem.places[idx+1].address || dayItem.places[idx+1].name)}&menu=route`
                                      : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(place.address || place.name)}&destination=${encodeURIComponent(dayItem.places[idx+1].address || dayItem.places[idx+1].name)}&travelmode=${place.transportType === '자차' ? 'driving' : (place.transportType === '도보' ? 'walking' : 'transit')}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      
                                      const sname = place.address || place.name;
                                      const dname = dayItem.places[idx+1].address || dayItem.places[idx+1].name;
                                      const transportType = place.transportType;
                                      
                                      console.log('=== [Naver Map Routing Clicked] ===');
                                      console.log('Departure name:', sname);
                                      console.log('Destination name:', dname);
                                      console.log('Transport Type:', transportType);
                                      
                                      if (planCurrency === 'KRW') {
                                        e.preventDefault();
                                        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                                        console.log('Device Mode: ', isMobile ? 'Mobile' : 'PC');
                                        
                                        // Open a blank window immediately on PC to prevent pop-up blocking
                                        const newWindow = isMobile ? null : window.open('', '_blank');
                                        if (newWindow) console.log('Pre-opened blank tab for PC');

                                        // Clean address names (removing extra slashes or indicators like '/출발')
                                        const cleanSname = sname.replace(/\/출발|\/도착/g, '').trim();
                                        const cleanDname = dname.replace(/\/출발|\/도착/g, '').trim();

                                         // Helper to strip detail floor/room numbers (e.g. ' 1층', ' 2층', ' 101호') for geocoding queries
                                         const cleanForGeocode = (addr) => {
                                           if (!addr) return '';
                                           return addr
                                             .replace(/\s지하\d+층.*/g, '')
                                             .replace(/\s\d+층.*/g, '')
                                             .replace(/\s\d+호.*/g, '')
                                             .replace(/\(.*?\)/g, '')
                                             .replace(/\[.*?\]/g, '')
                                             .trim();
                                         };

                                         const geocodeQueryS = cleanForGeocode(cleanSname);
                                         const geocodeQueryD = cleanForGeocode(cleanDname);

                                        // Official Naver Geocoding Helper with Nominatim fallback
                                        // Multi-stage progressive Geocoding Helper (Guarantees coordinates by relaxing query on fallback)
                                        const fetchCoords = async (query) => {
                                          if (!query) return null;

                                          const attemptSingle = async (q) => {
                                            try {
                                              const nRes = await fetch(`${API_BASE}/api/geocoding?query=${encodeURIComponent(q)}`);
                                              if (nRes.ok) {
                                                const nData = await nRes.json();
                                                if (nData && nData.lat && nData.lng) {
                                                  return { lat: nData.lat, lng: nData.lng };
                                                }
                                              }
                                            } catch (e) {}

                                            try {
                                              const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=kr`);
                                              const data = await res.json();
                                              if (data && data.length > 0) {
                                                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                                              }
                                            } catch (err) {}
                                            return null;
                                          };

                                          // Build progressive query variants
                                          const variants = [query];

                                          // Variant 2: Replace '특별자치도' with '도' or remove
                                          const v2 = query.replace(/특별자치도/g, '도').trim();
                                          if (v2 !== query) variants.push(v2);

                                          // Variant 3: Strip house/building number
                                          const v3 = query.replace(/\s\d+-\d+/g, '').replace(/\s\d+/g, '').trim();
                                          if (v3 && !variants.includes(v3)) variants.push(v3);

                                          // Variant 4: Town/District level (first 3 words)
                                          const parts = query.split(' ');
                                          if (parts.length >= 3) {
                                            const v4 = parts.slice(0, 3).join(' ');
                                            if (!variants.includes(v4)) variants.push(v4);
                                          }
                                          if (parts.length >= 2) {
                                            const v5 = parts.slice(0, 2).join(' ');
                                            if (!variants.includes(v5)) variants.push(v5);
                                          }

                                          for (const variant of variants) {
                                            const coords = await attemptSingle(variant);
                                            if (coords) return coords;
                                          }
                                          return null;
                                        };

                                        console.log('Geocoding query S:', geocodeQueryS);
                                        console.log('Geocoding query D:', geocodeQueryD);
                                        
                                        // Fetch coordinates for departure & destination in parallel
                                        const [sCoords, dCoords] = await Promise.all([
                                          fetchCoords(geocodeQueryS),
                                          fetchCoords(geocodeQueryD)
                                        ]);
                                        
                                        console.log('Resolved sCoords:', sCoords);
                                        console.log('Resolved dCoords:', dCoords);

                                        const appType = transportType === '자차' ? 'car' : (transportType === '도보' ? 'walk' : 'public');
                                        const naverWebMode = transportType === '자차' ? 'car' : (transportType === '도보' ? 'walk' : 'transit');

                                        if (sCoords && dCoords) {
                                          // Case 1: Both departure & destination coordinates resolved (Exact Pinpoint Route)
                                          const appUrl = `nmap://route/${appType}?slat=${sCoords.lat}&slng=${sCoords.lng}&sname=${encodeURIComponent(cleanSname)}&dlat=${dCoords.lat}&dlng=${dCoords.lng}&dname=${encodeURIComponent(cleanDname)}&appname=travelsquad`;
                                          const webFallback = `https://m.map.naver.com/route/route.naver?sname=${encodeURIComponent(cleanSname)}&sx=${sCoords.lng}&sy=${sCoords.lat}&dname=${encodeURIComponent(cleanDname)}&ex=${dCoords.lng}&ey=${dCoords.lat}`;
                                          const pcUrl = `https://map.naver.com/p/directions/${sCoords.lng},${sCoords.lat},${encodeURIComponent(cleanSname)}/${dCoords.lng},${dCoords.lat},${encodeURIComponent(cleanDname)}/-/${naverWebMode}?c=14.00,0,0,0,dh`;

                                          console.log('Exact Coords Route - App:', appUrl);
                                          console.log('Exact Coords Route - PC:', pcUrl);

                                          if (isMobile) {
                                            const start = Date.now();
                                            window.location.href = appUrl;
                                            setTimeout(() => {
                                              if (Date.now() - start < 1500) {
                                                window.open(webFallback, '_blank');
                                              }
                                            }, 1000);
                                          } else {
                                            if (newWindow) {
                                              newWindow.location.href = pcUrl;
                                            } else {
                                              window.open(pcUrl, '_blank');
                                            }
                                          }
                                        } else {
                                          // Case 2: One or both coordinates missing (Clean Fallback to Name Query Route)
                                          const queryText = `${cleanSname}에서 ${cleanDname} 길찾기`;
                                          const appUrl = `nmap://search?query=${encodeURIComponent(queryText)}&appname=travelsquad`;
                                          const webFallback = `https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(queryText)}`;
                                          const pcUrl = `https://map.naver.com/p/directions?stext=${encodeURIComponent(cleanSname)}&etext=${encodeURIComponent(cleanDname)}`;

                                          console.log('Query Fallback Route - App:', appUrl);
                                          console.log('Query Fallback Route - PC:', pcUrl);

                                          if (isMobile) {
                                            const start = Date.now();
                                            window.location.href = appUrl;
                                            setTimeout(() => {
                                              if (Date.now() - start < 1500) {
                                                window.open(webFallback, '_blank');
                                              }
                                            }, 1000);
                                          } else {
                                            if (newWindow) {
                                              newWindow.location.href = pcUrl;
                                            } else {
                                              window.open(pcUrl, '_blank');
                                            }
                                          }
                                        }
                                      } else {
                                        // Overseas travel -> Google Maps
                                        e.preventDefault();
                                        const googleUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(sname)}&destination=${encodeURIComponent(dname)}&travelmode=${transportType === '자차' ? 'driving' : (transportType === '도보' ? 'walking' : 'transit')}`;
                                        window.open(googleUrl, '_blank');
                                      }
                                    }}
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
                                    🗺️ 이동경로 ➔
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
                      <div key={item.id} id={`checklist-item-${item.id}`} className="checklist-item" onClick={() => handleToggleCheck(item.id)}>
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
                const getExpenseCategory = (item) => {
                  if (item.category && item.category !== '기타') return item.category;
                  if (item.placeId && plan.itinerary) {
                    for (const day of plan.itinerary) {
                      const found = (day.places || []).find(p => p.id === item.placeId);
                      if (found && found.category) return found.category;
                    }
                  }
                  return item.category || '기타';
                };

                const grandTotal = plan.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
                const memberCount = plan.members.length || 1;

                const calculateTripDays = () => {
                  if (!plan.startDate || !plan.endDate) return 1;
                  try {
                    const start = new Date(plan.startDate);
                    const end = new Date(plan.endDate);
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    return diffDays > 0 ? diffDays : 1;
                  } catch (e) {
                    return 1;
                  }
                };
                const tripDays = calculateTripDays();

                const perPersonTotal = Math.round(grandTotal / memberCount);
                const perDayTotal = Math.round(grandTotal / tripDays);
                const perPersonPerDayTotal = Math.round(grandTotal / (memberCount * tripDays));

                // Major Category calculation
                let fixedCostTotal = 0;
                let localCostTotal = 0;

                const categoryTotals = {
                  '숙박': 0,
                  '교통': 0,
                  '식비': 0,
                  '관광': 0,
                  '쇼핑': 0,
                  '기타': 0
                };

                plan.expenses.forEach(item => {
                  const cat = getExpenseCategory(item);
                  const amt = Number(item.amount || 0);
                  if (categoryTotals[cat] !== undefined) {
                    categoryTotals[cat] += amt;
                  } else {
                    categoryTotals['기타'] += amt;
                  }

                  if (cat === '숙박' || cat === '교통') {
                    fixedCostTotal += amt;
                  } else {
                    localCostTotal += amt;
                  }
                });

                const fixedPct = grandTotal > 0 ? Math.round((fixedCostTotal / grandTotal) * 100) : 0;
                const localPct = grandTotal > 0 ? (100 - fixedPct) : 0;

                // SVG Donut Chart slice computation
                const catColors = {
                  '숙박': '#8b5cf6',
                  '교통': '#06b6d4',
                  '식비': '#f59e0b',
                  '관광': '#10b981',
                  '쇼핑': '#ec4899',
                  '기타': '#6b7280'
                };

                const circleCircumference = 226.195; // 2 * PI * 36
                let accumulatedDash = 0;

                const donutSlices = Object.entries(categoryTotals)
                  .filter(([_, amt]) => amt > 0)
                  .map(([cat, amt]) => {
                    const pct = (amt / grandTotal);
                    const dashLength = pct * circleCircumference;
                    const strokeDasharray = `${dashLength} ${circleCircumference - dashLength}`;
                    const strokeDashoffset = -accumulatedDash;
                    accumulatedDash += dashLength;
                    return {
                      cat,
                      amt,
                      pctRatio: Math.round(pct * 100),
                      color: catColors[cat] || '#6b7280',
                      strokeDasharray,
                      strokeDashoffset
                    };
                  });

                // Expenses filter
                const filteredExpenses = plan.expenses.filter(item => {
                  const itemCat = getExpenseCategory(item);
                  if (selectedExpenseFilter === 'all') return true;
                  if (selectedExpenseFilter === 'major_fixed') return itemCat === '숙박' || itemCat === '교통';
                  if (selectedExpenseFilter === 'major_local') return itemCat !== '숙박' && itemCat !== '교통';
                  return itemCat === selectedExpenseFilter;
                });
                const filteredTotal = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

                return (
                  <div>
                    <div className="card" style={{ padding: '14px', marginBottom: '16px', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📊 지출 종합 분석표</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>({memberCount}명 / {tripDays}일 기준)</span>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'center' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-app)', borderBottom: '2px solid var(--border)' }}>
                            <th style={{ padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 600, width: '22%' }}>구분</th>
                            <th style={{ padding: '8px 4px', color: 'var(--primary)', fontWeight: 700, width: '26%' }}>💰 총 지출</th>
                            <th style={{ padding: '8px 4px', color: '#6d28d9', fontWeight: 700, width: '26%' }}>🏨🚗 고정/기초<br/><span style={{ fontSize: '0.68rem', fontWeight: 'normal' }}>(숙박+교통)</span></th>
                            <th style={{ padding: '8px 4px', color: '#b45309', fontWeight: 700, width: '26%' }}>🍽️🎟️ 현지활동<br/><span style={{ fontSize: '0.68rem', fontWeight: 'normal' }}>(식비·관광 등)</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 4px', fontWeight: 700, color: 'var(--text)', background: 'var(--bg-app)' }}>총 금액</td>
                            <td style={{ padding: '8px 4px', fontWeight: 800, color: 'var(--primary)' }}>{grandTotal.toLocaleString()}원</td>
                            <td style={{ padding: '8px 4px', fontWeight: 700, color: '#5b21b6' }}>{fixedCostTotal.toLocaleString()}원 <div style={{ fontSize: '0.68rem', color: '#6d28d9' }}>({fixedPct}%)</div></td>
                            <td style={{ padding: '8px 4px', fontWeight: 700, color: '#92400e' }}>{localCostTotal.toLocaleString()}원 <div style={{ fontSize: '0.68rem', color: '#b45309' }}>({localPct}%)</div></td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 4px', fontWeight: 600, color: 'var(--text)', background: 'var(--bg-app)' }}>👤 1인당</td>
                            <td style={{ padding: '8px 4px', fontWeight: 700 }}>{perPersonTotal.toLocaleString()}원</td>
                            <td style={{ padding: '8px 4px', color: '#5b21b6' }}>{Math.round(fixedCostTotal / memberCount).toLocaleString()}원</td>
                            <td style={{ padding: '8px 4px', color: '#92400e' }}>{Math.round(localCostTotal / memberCount).toLocaleString()}원</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 4px', fontWeight: 600, color: 'var(--text)', background: 'var(--bg-app)' }}>📅 1일당</td>
                            <td style={{ padding: '8px 4px', fontWeight: 700 }}>{perDayTotal.toLocaleString()}원</td>
                            <td style={{ padding: '8px 4px', color: '#5b21b6' }}>{Math.round(fixedCostTotal / tripDays).toLocaleString()}원</td>
                            <td style={{ padding: '8px 4px', color: '#92400e' }}>{Math.round(localCostTotal / tripDays).toLocaleString()}원</td>
                          </tr>
                          <tr style={{ background: '#fffbeb' }}>
                            <td style={{ padding: '8px 4px', fontWeight: 700, color: '#b45309' }}>⚡ 1인 1일당</td>
                            <td style={{ padding: '8px 4px', fontWeight: 800, color: '#b45309' }}>{perPersonPerDayTotal.toLocaleString()}원</td>
                            <td style={{ padding: '8px 4px', fontWeight: 700, color: '#5b21b6' }}>{Math.round(fixedCostTotal / (memberCount * tripDays)).toLocaleString()}원</td>
                            <td style={{ padding: '8px 4px', fontWeight: 700, color: '#92400e' }}>{Math.round(localCostTotal / (memberCount * tripDays)).toLocaleString()}원</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 3. 소분류 카테고리 Donut Chart & 비율 % */}
                    {grandTotal > 0 && donutSlices.length > 0 && (
                      <div className="card" style={{ padding: '16px', marginBottom: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>🍩 카테고리별 지출 비율</h4>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          {/* SVG Donut Chart */}
                          <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0, margin: '0 auto' }}>
                            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                              <circle cx="50" cy="50" r="36" fill="transparent" stroke="#e2e8f0" strokeWidth="14" />
                              {donutSlices.map((slice, idx) => (
                                <circle
                                  key={idx}
                                  cx="50"
                                  cy="50"
                                  r="36"
                                  fill="transparent"
                                  stroke={slice.color}
                                  strokeWidth="14"
                                  strokeDasharray={slice.strokeDasharray}
                                  strokeDashoffset={slice.strokeDashoffset}
                                  style={{ transition: 'stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease' }}
                                />
                              ))}
                            </svg>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>총 지출</span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)' }}>
                                {grandTotal >= 10000 ? `${Math.round(grandTotal / 10000)}만원` : `${grandTotal.toLocaleString()}원`}
                              </span>
                            </div>
                          </div>

                          {/* Legend List */}
                          <div style={{ flex: 1, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {donutSlices.map((slice, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: slice.color, display: 'inline-block' }} />
                                  <span style={{ fontWeight: 600 }}>{slice.cat}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{slice.amt.toLocaleString()}원</span>
                                  <span style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem', color: slice.color }}>
                                    {slice.pctRatio}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. 대분류 / 소분류 필터 바 */}
                    <div className="sub-filter-bar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 4px 12px 4px', scrollbarWidth: 'none' }}>
                      {[
                        { id: 'all', label: '전체' },
                        { id: 'major_fixed', label: '🏨🚗 고정/기초 (숙박·교통)' },
                        { id: 'major_local', label: '🍽️🎟️ 현지활동 (식비·관광·쇼핑 등)' },
                        { id: '교통', label: '🚗 교통' },
                        { id: '숙박', label: '🏨 숙박' },
                        { id: '식비', label: '🍽️ 식비' },
                        { id: '관광', label: '🎟️ 관광' },
                        { id: '쇼핑', label: '🛍️ 쇼핑' },
                        { id: '기타', label: '📦 기타' }
                      ].map(chip => (
                        <button
                          key={chip.id}
                          className={`filter-chip ${selectedExpenseFilter === chip.id ? 'active' : ''}`}
                          onClick={() => setSelectedExpenseFilter(chip.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            background: selectedExpenseFilter === chip.id ? 'var(--primary)' : 'var(--bg-card)',
                            color: selectedExpenseFilter === chip.id ? '#fff' : 'var(--text)',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    <div className="card">
                      <h3 className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>💰 경비 상세 내역</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                          합계: {filteredTotal.toLocaleString()} 원
                        </span>
                      </h3>
                      <div>
                        {filteredExpenses.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>등록된 경비 내역이 없습니다.</div>
                        ) : (
                          filteredExpenses.map((item) => {
                            const linkedPlace = item.placeId ? (() => {
                              for (const day of (plan.itinerary || [])) {
                                const match = (day.places || []).find(p => p.id === item.placeId);
                                if (match) return match;
                              }
                              return null;
                            })() : null;

                            return (
                              <div
                                key={item.id}
                                id={`expense-item-${item.id}`}
                                className="expense-item"
                                onClick={() => {
                                  if (linkedPlace) {
                                    setSelectedDetailPlace(linkedPlace);
                                  }
                                }}
                                style={{
                                  cursor: linkedPlace ? 'pointer' : 'default',
                                  transition: 'background-color 0.2s',
                                  position: 'relative',
                                  padding: '12px 14px'
                                }}
                                title={linkedPlace ? '클릭하여 해당 일정 세부 내용 및 경비 수정하기' : ''}
                              >
                                <div className="expense-info" style={{ flex: 1 }}>
                                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '0 0 4px 0' }}>
                                    {item.title} 
                                    <span style={{ fontSize: '0.68rem', fontWeight: 'normal', color: 'var(--text-muted)', backgroundColor: 'var(--border)', padding: '2px 6px', borderRadius: '4px' }}>
                                      {getExpenseCategory(item)}
                                    </span>
                                  </h4>
                                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.date}</p>
                                  <span className="expense-payer" style={{ fontSize: '0.78rem' }}>{item.payer} 결제</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                  <div className="expense-amount" style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--primary)' }}>
                                    {item.amount.toLocaleString()} 원
                                  </div>
                                  {linkedPlace ? (
                                    <span style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                      일정 세부보기 / 수정 ➔
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteExpense(item.id);
                                      }}
                                      style={{
                                        border: '1px solid var(--danger)',
                                        background: 'transparent',
                                        color: 'var(--danger)',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        padding: '2px 6px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      삭제
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
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
                          <div 
                            className="avatar" 
                            style={{ margin: 0, width: '40px', height: '40px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                          >
                            {usersMap[m]?.profileImage ? (
                              <img src={usersMap[m].profileImage} alt={usersMap[m].nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              (usersMap[m]?.nickname || m).slice(0, 1)
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600' }}>
                              {usersMap[m]?.nickname || m} {usersMap[m]?.nickname && usersMap[m].nickname !== m && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({m})</span>}
                              {userObj?.engName && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 'normal' }}>{userObj.engName}</span>}
                              {age !== null && <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '6px' }}>(만 {age}세)</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                              <span>{isPlanManager ? '👑 여행 총괄 관리자' : '참여자'}</span>
                              {(userObj?.passportBirth || userObj?.birth) && (
                                <>
                                  <span style={{ opacity: 0.5 }}>|</span>
                                  <span>🎂 생년월일: {userObj.passportBirth || userObj.birth}</span>
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

            {/* 5. PLACES TAB */}
            {activeTab === 'places' && (
              <div className="card" style={{ padding: '20px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="card-title" style={{ margin: 0 }}>📍 장소 보관함</h3>
                </div>

                {/* Map Container */}
                <div 
                  ref={mapRef} 
                  className="places-map" 
                  style={{ 
                    height: '300px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border)', 
                    marginBottom: '20px',
                    zIndex: 5,
                    position: 'relative',
                    backgroundColor: 'var(--bg-app, #f5f5f5)'
                  }}
                >
                  {!leafletLoaded && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      지도 로딩 중...
                    </div>
                  )}
                  {leafletLoaded && (!plan.savedPlaces || plan.savedPlaces.filter(p => p.lat && p.lng).length === 0) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', position: 'absolute', width: '100%', pointerEvents: 'none', zIndex: 1000 }}>
                      주소가 등록된 장소가 없습니다.
                    </div>
                  )}
                </div>

                {/* Saved Places List */}
                <div className="saved-places-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {(!plan.savedPlaces || plan.savedPlaces.length === 0) ? (
                    <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      저장된 장소가 없습니다. 가고 싶은 후보 장소들을 등록해 보세요!
                    </div>
                  ) : (
                    plan.savedPlaces.map(sp => (
                      <div key={sp.id} className="saved-place-card" style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span className={`category-badge category-${sp.category}`}>{sp.category}</span>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{sp.name}</strong>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>📍</span> <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }} title={sp.address}>{sp.address || '주소 없음'}</span>
                          </div>
                          {sp.images && sp.images.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px', scrollbarWidth: 'thin' }}>
                              {sp.images.map((imgUrl, imgIdx) => (
                                <img
                                  key={imgIdx}
                                  src={imgUrl}
                                  alt={`${sp.name} ${imgIdx + 1}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxImagesList(sp.images);
                                    setLightboxActiveIndex(imgIdx);
                                  }}
                                  style={{
                                    width: '55px',
                                    height: '55px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: '1px solid var(--border)',
                                    flexShrink: 0
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          {sp.description && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '8px', background: 'var(--bg-app)', padding: '6px 8px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                              {renderTextWithLinks(sp.description)}
                            </div>
                          )}
                          {sp.tip && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                              💡 {renderTextWithLinks(sp.tip)}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                          {sp.url && (
                            <a href={sp.url} target="_blank" rel="noopener noreferrer" className="btn-secondary-sm" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '6px 0', fontSize: '0.75rem', display: 'inline-block' }}>
                              🔗 지도검색
                            </a>
                          )}
                          <button 
                            type="button" 
                            className="btn-secondary-sm" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', margin: 0 }}
                            onClick={() => {
                              setEditingSavedPlace(sp);
                            }}
                          >
                            ✏️ 수정
                          </button>
                          <button 
                            type="button" 
                            className="btn-secondary-sm" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', margin: 0 }}
                            onClick={() => handleDeleteSavedPlace(sp.id)}
                            title="장소 삭제"
                          >
                            🗑️ 삭제
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Floating Action Button inside Details */}
          {!isGuest && activeTab !== 'members' && (
            <button 
              className={`fab ${isFabVisible ? '' : 'hidden'}`} 
              onClick={() => {
                if (activeTab === 'places') {
                  setNewSavedPlace({ name: '', category: '관광', address: '', description: '', tip: '', url: '' });
                  setShowAddSavedPlaceModal(true);
                } else {
                  setShowModal(true);
                }
              }}
            >
              +
            </button>
          )}

          {/* Bottom Navigation removed and merged to Header */}

          {/* Add Item Modal */}
          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content modal-content-scrollable" onClick={(e) => e.stopPropagation()}>
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
                  <form onSubmit={handleAddItinerary} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div className="modal-body">
                      <div className="form-group">
                        <label>여행 일자 선택</label>
                        <select className="form-control" value={newPlace.day} onChange={e => setNewPlace({ ...newPlace, day: e.target.value })}>
                          {Array.from({ length: Math.max(1, Math.ceil((new Date(plan.endDate) - new Date(plan.startDate)) / (1000 * 60 * 60 * 24)) + 1) }).map((_, i) => (
                            <option key={i} value={i + 1}>{i + 1}일차</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>카테고리</label>
                        <select className="form-control" value={newPlace.category} onChange={e => setNewPlace({ ...newPlace, category: e.target.value })}>
                          {['관광', '식사', '쇼핑', '이동', '숙소', '기타'].map(category => <option key={category} value={category}>{category}</option>)}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>시간 (HH:MM)</label>
                          <input type="time" required className="form-control" value={newPlace.time} onChange={e => setNewPlace({ ...newPlace, time: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>체류 시간 (분 단위)</label>
                          <input 
                            type="number" 
                            min="0"
                            placeholder="미설정 (예: 60)" 
                            className="form-control" 
                            value={newPlace.duration || ''} 
                            onChange={e => setNewPlace({ ...newPlace, duration: e.target.value === '' ? 0 : Number(e.target.value) })} 
                          />
                          {newPlace.duration > 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                              🕒 {Math.floor(newPlace.duration / 60) > 0 ? `${Math.floor(newPlace.duration / 60)}시간 ` : ''}{newPlace.duration % 60}분 체류
                            </span>
                          )}
                        </div>
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
                        <label>메모/설명</label>
                        <textarea placeholder="예: 바다 구경 및 망고주스 마시기" className="form-control" value={newPlace.description || ''} onChange={e => setNewPlace({ ...newPlace, description: e.target.value })}></textarea>
                      </div>

                      <div className="form-group">
                        <label>📸 이미지 첨부</label>
                        <div 
                          className={`image-upload-zone ${uploading ? 'uploading' : ''}`}
                          onClick={() => addImgInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDropImages(e, false, false)}
                          onPaste={(e) => handlePasteImages(e, false, false)}
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
                              handleImageAttach(e.target.files, false, false);
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
                                  onClick={() => handleRemoveImage(index, false, false)}
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

                      <div className="form-group">
                        <label>💡 팁/주의사항</label>
                        <textarea placeholder="예: 해질 무렵 방문, 온라인 예매 권장" className="form-control" value={newPlace.tip || ''} onChange={e => setNewPlace({ ...newPlace, tip: e.target.value })}></textarea>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <label className="reservation-check" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={newPlace.needsReservation || false} onChange={e => setNewPlace({ ...newPlace, needsReservation: e.target.checked })} />
                          🎫 사전 예약이 필요한 일정
                        </label>
                        {newPlace.needsReservation && (
                          <label className="reservation-check" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={newPlace.isReservationCompleted || false} onChange={e => setNewPlace({ ...newPlace, isReservationCompleted: e.target.checked })} />
                            ✅ 예약 완료함
                          </label>
                        )}
                      </div>

                      {/* Multi-Cost Breakdown Section */}
                      <div className="form-group" style={{ marginBottom: '16px', background: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ margin: 0, fontWeight: 'bold', fontSize: '0.88rem' }}>
                            💴 경비 세부 내역 (입장료/주차비/식비 등)
                          </label>
                          <button
                            type="button"
                            className="btn-secondary-sm"
                            style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                            onClick={() => {
                              const curCosts = newPlace.costs || [];
                              const newCost = { id: Date.now() + Math.random(), title: '', amount: '', category: newPlace.category || '관광', payer: '미지정' };
                              setNewPlace({ ...newPlace, costs: [...curCosts, newCost] });
                            }}
                          >
                            ➕ 항목 추가
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>통화:</span>
                          <select
                            className="form-control"
                            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.82rem' }}
                            value={newPlace.currency || planCurrency}
                            onChange={e => setNewPlace({ ...newPlace, currency: e.target.value })}
                          >
                            <option value={planCurrency}>{planCurrencyMeta.symbol} {planCurrencyMeta.name}</option>
                            {planCurrency !== 'KRW' && <option value="KRW">₩ 원</option>}
                          </select>
                          {newPlace.costs && newPlace.costs.length > 0 && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                              총합: {newPlace.costs.reduce((sum, c) => sum + Number(c.amount || 0), 0).toLocaleString()} {newPlace.currency || planCurrency}
                            </span>
                          )}
                        </div>

                        {(!newPlace.costs || newPlace.costs.length === 0) ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                            경비가 없는 일정이면 비워두시고, 여러 경비가 발생할 경우 <b>'➕ 항목 추가'</b>를 눌러주세요.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {newPlace.costs.map((c, cIdx) => (
                              <div key={c.id || cIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', background: '#fff', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                <input
                                  type="text"
                                  placeholder="항목명 (예: 입장료)"
                                  className="form-control"
                                  style={{ flex: 2, minWidth: '100px', fontSize: '0.82rem' }}
                                  value={c.title || ''}
                                  onChange={e => {
                                    const updated = [...newPlace.costs];
                                    updated[cIdx] = { ...updated[cIdx], title: e.target.value };
                                    setNewPlace({ ...newPlace, costs: updated });
                                  }}
                                />
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="금액"
                                  className="form-control"
                                  style={{ flex: 1.5, minWidth: '75px', fontSize: '0.82rem' }}
                                  value={c.amount || ''}
                                  onChange={e => {
                                    const updated = [...newPlace.costs];
                                    updated[cIdx] = { ...updated[cIdx], amount: e.target.value };
                                    setNewPlace({ ...newPlace, costs: updated });
                                  }}
                                />
                                <select
                                  className="form-control"
                                  style={{ flex: 1.2, minWidth: '70px', fontSize: '0.82rem' }}
                                  value={c.category || '관광'}
                                  onChange={e => {
                                    const updated = [...newPlace.costs];
                                    updated[cIdx] = { ...updated[cIdx], category: e.target.value };
                                    setNewPlace({ ...newPlace, costs: updated });
                                  }}
                                >
                                  {['관광', '식비', '숙박', '교통', '쇼핑', '기타'].map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                                <select
                                  className="form-control"
                                  style={{ flex: 1.2, minWidth: '70px', fontSize: '0.82rem' }}
                                  value={c.payer || '미지정'}
                                  onChange={e => {
                                    const updated = [...newPlace.costs];
                                    updated[cIdx] = { ...updated[cIdx], payer: e.target.value };
                                    setNewPlace({ ...newPlace, costs: updated });
                                  }}
                                >
                                  <option value="미지정">미지정</option>
                                  {plan.members.map((m, idx) => (
                                    <option key={idx} value={m}>{m}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  style={{ border: 'none', background: 'transparent', color: 'var(--danger)', fontSize: '1.1rem', cursor: 'pointer', padding: '0 4px' }}
                                  onClick={() => {
                                    const updated = newPlace.costs.filter((_, i) => i !== cIdx);
                                    setNewPlace({ ...newPlace, costs: updated });
                                  }}
                                  title="항목 삭제"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', marginBottom: '12px' }}>
                        <div className="form-group" style={{ flex: 1.5, marginBottom: 0 }}>
                          <label>다음 장소 이동 수단</label>
                          <select className="form-control" value={newPlace.transportType || ''} onChange={e => setNewPlace({ ...newPlace, transportType: e.target.value })}>
                            <option value="">설정 안 함</option>
                            <option value="대중교통">🚌 대중교통</option>
                            <option value="자차">🚗 자차</option>
                            <option value="도보">🚶 도보</option>
                            <option value="비행기">✈️ 비행기</option>
                            <option value="여객선">🚢 여객선</option>
                            <option value="기타">🚇 기타</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label>소요 시간 (분)</label>
                          <input type="number" min="0" placeholder="예: 15" className="form-control" value={newPlace.transportDuration || ''} onChange={e => setNewPlace({ ...newPlace, transportDuration: e.target.value })} />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>🗺️ 경로 지도 이미지 첨부 (지도 연동 대비 캡처 이미지)</label>
                        <div 
                          className={`image-upload-zone ${uploading ? 'uploading' : ''}`}
                          onClick={() => addMapImgInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDropImages(e, false, true)}
                          onPaste={(e) => handlePasteImages(e, false, true)}
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
                          {uploading ? '⏳ 지도 업로드 중...' : '🗺️ 복사한 지도 이미지를 여기에 붙여넣거나 클릭해서 업로드'}
                        </div>
                        <input 
                          type="file" 
                          ref={addMapImgInputRef} 
                          style={{ display: 'none' }} 
                          multiple 
                          accept="image/*" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleImageAttach(e.target.files, false, true);
                            }
                          }} 
                        />
                        {newPlace.mapImages && newPlace.mapImages.length > 0 && (
                          <div className="image-preview-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                            {newPlace.mapImages.map((url, index) => (
                              <div key={index} className="image-preview-wrapper" style={{ position: 'relative', width: '80px', height: '60px' }}>
                                <img 
                                  src={url} 
                                  alt="map preview" 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} 
                                />
                                <button 
                                  type="button" 
                                  className="remove-img-btn" 
                                  onClick={() => handleRemoveImage(index, false, true)}
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
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn-secondary-sm" onClick={() => setShowModal(false)} style={{ margin: 0, padding: '12px' }}>취소</button>
                      <button type="submit" className="submit-btn" style={{ flex: 1, margin: 0, padding: '12px' }}>일정 등록하기</button>
                    </div>
                  </form>
                )}

                {/* 2. Add Checklist Form */}
                {activeTab === 'checklist' && (
                  <form onSubmit={handleAddChecklist} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div className="modal-body">
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
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn-secondary-sm" onClick={() => setShowModal(false)} style={{ margin: 0, padding: '12px' }}>취소</button>
                      <button type="submit" className="submit-btn" style={{ flex: 1, margin: 0, padding: '12px' }}>준비물 등록하기</button>
                    </div>
                  </form>
                )}

                {/* 3. Add Expense Form */}
                {activeTab === 'expense' && (
                  <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div className="modal-body">
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
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn-secondary-sm" onClick={() => setShowModal(false)} style={{ margin: 0, padding: '12px' }}>취소</button>
                      <button type="submit" className="submit-btn" style={{ flex: 1, margin: 0, padding: '12px' }}>경비 등록하기</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Edit Place Modal */}
          {editingPlace && (
            <div className="modal-overlay" onClick={() => setEditingPlace(null)} style={{ zIndex: 1250 }}>
              <div className="modal-content modal-content-scrollable" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>📅 일정 상세 수정</h3>
                  <button className="close-btn" onClick={() => setEditingPlace(null)}>×</button>
                </div>
                <form onSubmit={handleEditItinerary} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>카테고리</label>
                      <select className="form-control" value={editingPlace.category} onChange={e => setEditingPlace({ ...editingPlace, category: e.target.value })}>
                        {['관광', '식사', '쇼핑', '이동', '숙소', '기타'].map(category => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>시간 (HH:MM)</label>
                        <input type="time" required className="form-control" value={editingPlace.time} onChange={e => setEditingPlace({ ...editingPlace, time: e.target.value })} />
                      </div>
                       <div className="form-group" style={{ flex: 1 }}>
                        <label>체류 시간 (분 단위)</label>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="미설정 (예: 60)" 
                          className="form-control" 
                          value={editingPlace.duration || ''} 
                          onChange={e => setEditingPlace({ ...editingPlace, duration: e.target.value === '' ? 0 : Number(e.target.value) })} 
                        />
                        {editingPlace.duration > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', display: 'block', marginTop: '4px' }}>
                            🕒 {Math.floor(editingPlace.duration / 60) > 0 ? `${Math.floor(editingPlace.duration / 60)}시간 ` : ''}{editingPlace.duration % 60}분 체류
                          </span>
                        )}
                      </div>
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
                      <label>메모/설명</label>
                      <textarea placeholder="예: 바다 구경 및 망고주스 마시기" className="form-control" value={editingPlace.description || ''} onChange={e => setEditingPlace({ ...editingPlace, description: e.target.value })}></textarea>
                    </div>
                    <div className="form-group">
                      <label>📸 이미지 첨부</label>
                      <div 
                        className={`image-upload-zone ${uploading ? 'uploading' : ''}`}
                        onClick={() => editImgInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropImages(e, true, false)}
                        onPaste={(e) => handlePasteImages(e, true, false)}
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
                            handleImageAttach(e.target.files, true, false);
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
                                onClick={() => handleRemoveImage(index, true, false)}
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
                    <div className="form-group">
                      <label>💡 팁/주의사항</label>
                      <textarea placeholder="예: 해질 무렵 방문, 온라인 예매 권장" className="form-control" value={editingPlace.tip || ''} onChange={e => setEditingPlace({ ...editingPlace, tip: e.target.value })}></textarea>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <label className="reservation-check" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={editingPlace.needsReservation || false} onChange={e => setEditingPlace({ ...editingPlace, needsReservation: e.target.checked })} />
                        🎫 사전 예약이 필요한 일정
                      </label>
                      {editingPlace.needsReservation && (
                        <label className="reservation-check" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editingPlace.isReservationCompleted || false} onChange={e => setEditingPlace({ ...editingPlace, isReservationCompleted: e.target.checked })} />
                          ✅ 예약 완료함
                        </label>
                      )}
                    </div>
                    {/* Multi-Cost Breakdown Section */}
                    <div className="form-group" style={{ marginBottom: '16px', background: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ margin: 0, fontWeight: 'bold', fontSize: '0.88rem' }}>
                          💴 경비 세부 내역 (입장료/주차비/식비 등)
                        </label>
                        <button
                          type="button"
                          className="btn-secondary-sm"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                          onClick={() => {
                            const curCosts = editingPlace.costs || [];
                            const newCost = { id: Date.now() + Math.random(), title: '', amount: '', category: editingPlace.category || '관광', payer: '미지정' };
                            setEditingPlace({ ...editingPlace, costs: [...curCosts, newCost] });
                          }}
                        >
                          ➕ 항목 추가
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>통화:</span>
                        <select
                          className="form-control"
                          style={{ width: 'auto', padding: '4px 8px', fontSize: '0.82rem' }}
                          value={editingPlace.currency || planCurrency}
                          onChange={e => setEditingPlace({ ...editingPlace, currency: e.target.value })}
                        >
                          <option value={planCurrency}>{planCurrencyMeta.symbol} {planCurrencyMeta.name}</option>
                          {planCurrency !== 'KRW' && <option value="KRW">₩ 원</option>}
                        </select>
                        {editingPlace.costs && editingPlace.costs.length > 0 && (
                          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            총합: {editingPlace.costs.reduce((sum, c) => sum + Number(c.amount || 0), 0).toLocaleString()} {editingPlace.currency || planCurrency}
                          </span>
                        )}
                      </div>

                      {(!editingPlace.costs || editingPlace.costs.length === 0) ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                          경비가 없는 일정이면 비워두시고, 여러 경비가 발생할 경우 <b>'➕ 항목 추가'</b>를 눌러주세요.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {editingPlace.costs.map((c, cIdx) => (
                            <div key={c.id || cIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', background: '#fff', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                              <input
                                type="text"
                                placeholder="항목명 (예: 입장료)"
                                className="form-control"
                                style={{ flex: 2, minWidth: '100px', fontSize: '0.82rem' }}
                                value={c.title || ''}
                                onChange={e => {
                                  const updated = [...editingPlace.costs];
                                  updated[cIdx] = { ...updated[cIdx], title: e.target.value };
                                  setEditingPlace({ ...editingPlace, costs: updated });
                                }}
                              />
                              <input
                                type="number"
                                min="0"
                                placeholder="금액"
                                className="form-control"
                                style={{ flex: 1.5, minWidth: '75px', fontSize: '0.82rem' }}
                                value={c.amount || ''}
                                onChange={e => {
                                  const updated = [...editingPlace.costs];
                                  updated[cIdx] = { ...updated[cIdx], amount: e.target.value };
                                  setEditingPlace({ ...editingPlace, costs: updated });
                                }}
                              />
                              <select
                                className="form-control"
                                style={{ flex: 1.2, minWidth: '70px', fontSize: '0.82rem' }}
                                value={c.category || '관광'}
                                onChange={e => {
                                  const updated = [...editingPlace.costs];
                                  updated[cIdx] = { ...updated[cIdx], category: e.target.value };
                                  setEditingPlace({ ...editingPlace, costs: updated });
                                }}
                              >
                                {['관광', '식비', '숙박', '교통', '쇼핑', '기타'].map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                              <select
                                className="form-control"
                                style={{ flex: 1.2, minWidth: '70px', fontSize: '0.82rem' }}
                                value={c.payer || '미지정'}
                                onChange={e => {
                                  const updated = [...editingPlace.costs];
                                  updated[cIdx] = { ...updated[cIdx], payer: e.target.value };
                                  setEditingPlace({ ...editingPlace, costs: updated });
                                }}
                              >
                                <option value="미지정">미지정</option>
                                {plan.members.map((m, idx) => (
                                  <option key={idx} value={m}>{m}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                style={{ border: 'none', background: 'transparent', color: 'var(--danger)', fontSize: '1.1rem', cursor: 'pointer', padding: '0 4px' }}
                                onClick={() => {
                                  const updated = editingPlace.costs.filter((_, i) => i !== cIdx);
                                  setEditingPlace({ ...editingPlace, costs: updated });
                                }}
                                title="항목 삭제"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px', marginBottom: '12px' }}>
                    <div className="form-group" style={{ flex: 1.5, marginBottom: 0 }}>
                      <label>다음 장소 이동 수단</label>
                      <select className="form-control" value={editingPlace.transportType || ''} onChange={e => setEditingPlace({ ...editingPlace, transportType: e.target.value })}>
                        <option value="">설정 안 함</option>
                        <option value="대중교통">🚌 대중교통</option>
                        <option value="자차">🚗 자차</option>
                        <option value="도보">🚶 도보</option>
                        <option value="비행기">✈️ 비행기</option>
                        <option value="여객선">🚢 여객선</option>
                        <option value="기타">🚇 기타</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>소요 시간 (분)</label>
                      <input type="number" min="0" placeholder="예: 15" className="form-control" value={editingPlace.transportDuration || ''} onChange={e => setEditingPlace({ ...editingPlace, transportDuration: e.target.value })} />
                    </div>
                  </div>
                  
                  {/* 지도 첨부 기능 추가 */}
                  <div className="form-group">
                    <label>🗺️ 경로 지도 이미지 첨부 (지도 연동 대비 캡처 이미지)</label>
                    <div 
                      className={`image-upload-zone ${uploading ? 'uploading' : ''}`}
                      onClick={() => editMapImgInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropImages(e, true, true)}
                      onPaste={(e) => handlePasteImages(e, true, true)}
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
                      {uploading ? '⏳ 지도 업로드 중...' : '🗺️ 복사한 지도 이미지를 여기에 붙여넣거나 클릭해서 업로드'}
                    </div>
                    <input 
                      type="file" 
                      ref={editMapImgInputRef} 
                      style={{ display: 'none' }} 
                      multiple 
                      accept="image/*" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleImageAttach(e.target.files, true, true);
                        }
                      }} 
                    />
                    {editingPlace.mapImages && editingPlace.mapImages.length > 0 && (
                      <div className="image-preview-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {editingPlace.mapImages.map((url, index) => (
                          <div key={index} className="image-preview-wrapper" style={{ position: 'relative', width: '80px', height: '60px' }}>
                            <img 
                              src={url} 
                              alt="map preview" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} 
                            />
                            <button 
                              type="button" 
                              className="remove-img-btn" 
                              onClick={() => handleRemoveImage(index, true, true)}
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
                  </div> {/* Close form-group of map images */}
                </div> {/* Close modal-body */}
                  <div className="modal-footer" style={{ display: 'flex', gap: '8px', padding: '12px 16px' }}>
                    <button type="button" className="btn-secondary-sm" onClick={() => setEditingPlace(null)} style={{ flex: 2, margin: 0, padding: '12px' }}>취소</button>
                    <button type="button" className="btn-secondary-sm" onClick={() => {
                      const copyTarget = { ...editingPlace };
                      setEditingPlace(null);
                      setNewPlace({
                        day: copyTarget.day || 1,
                        time: copyTarget.time || '',
                        duration: copyTarget.duration || 0,
                        name: `${copyTarget.name || ''} (복사)`,
                        address: copyTarget.address || '',
                        category: copyTarget.category || '관광',
                        description: copyTarget.description || '',
                        tip: copyTarget.tip || '',
                        needsReservation: copyTarget.needsReservation || false,
                        isReservationCompleted: copyTarget.isReservationCompleted || false,
                        estimatedCost: copyTarget.estimatedCost || copyTarget.cost || 0,
                        currency: copyTarget.currency || planCurrency,
                        payer: copyTarget.payer || '미지정',
                        transportType: copyTarget.transportType || '',
                        transportDuration: copyTarget.transportDuration || '',
                        images: copyTarget.images ? [...copyTarget.images] : [],
                        mapImages: copyTarget.mapImages ? [...copyTarget.mapImages] : []
                      });
                      setShowModal(true);
                    }} style={{ flex: 1, margin: 0, padding: '12px 4px', background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text)', whiteSpace: 'nowrap' }}>📋 복사</button>
                    <button type="button" className="delete-btn-danger" onClick={() => handleDeletePlace(editingPlace.id)} style={{ flex: 1, width: 'auto', marginTop: 0, padding: '12px 4px' }}>삭제</button>
                    <button type="submit" className="submit-btn" style={{ flex: 3, margin: 0, padding: '12px' }}>수정 완료</button>
                  </div>
                </form>
              </div>
            </div>
      )}

      {/* 2.4 SCHEDULE DETAIL MODAL */}
      {selectedDetailPlace && (
        <div className="modal-overlay" onClick={() => setSelectedDetailPlace(null)} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
            
            {/* Sticky Fixed Header (2-Row Compact Layout) */}
            <div className="detail-modal-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              {/* Row 1: Category Badge + Full Title + Close Button (×) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <span className={`category-badge category-${selectedDetailPlace.category}`} style={{ flexShrink: 0 }}>{selectedDetailPlace.category}</span>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, wordBreak: 'break-word', lineHeight: '1.3', color: 'var(--text)' }}>
                    {selectedDetailPlace.name}
                  </h3>
                </div>
                <button 
                  className="close-btn" 
                  onClick={() => setSelectedDetailPlace(null)} 
                  style={{ fontSize: '1.8rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', color: 'var(--text-muted)', flexShrink: 0, lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              {/* Row 2: Management Action Icons (Edit, Copy, Delete) Aligned Right */}
              {!isGuest && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
                  <button 
                    type="button" 
                    className="btn-secondary-sm" 
                    style={{ 
                      width: '30px', 
                      height: '30px', 
                      borderRadius: '50%', 
                      padding: 0, 
                      fontSize: '0.85rem', 
                      margin: 0, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-app, #f3f4f6)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setEditingPlace(prepareEditingPlace(selectedDetailPlace));
                      setSelectedDetailPlace(null);
                    }}
                    title="장소 정보 수정"
                  >
                    ✏️
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary-sm" 
                    style={{ 
                      width: '30px', 
                      height: '30px', 
                      borderRadius: '50%', 
                      padding: 0, 
                      fontSize: '0.85rem', 
                      margin: 0, 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-app, #f3f4f6)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setNewPlace({
                        day: selectedDetailPlace.day || 1,
                        time: selectedDetailPlace.time,
                        duration: selectedDetailPlace.duration || 0,
                        name: `${selectedDetailPlace.name} (복사)`,
                        address: selectedDetailPlace.address || '',
                        category: selectedDetailPlace.category || '관광',
                        description: selectedDetailPlace.description || '',
                        tip: selectedDetailPlace.tip || '',
                        needsReservation: selectedDetailPlace.needsReservation || false,
                        isReservationCompleted: selectedDetailPlace.isReservationCompleted || false,
                        estimatedCost: selectedDetailPlace.estimatedCost || selectedDetailPlace.cost || 0,
                        currency: selectedDetailPlace.currency || planCurrency,
                        payer: selectedDetailPlace.payer || '미지정',
                        transportType: selectedDetailPlace.transportType || '',
                        transportDuration: selectedDetailPlace.transportDuration || '',
                        images: selectedDetailPlace.images ? [...selectedDetailPlace.images] : [],
                        mapImages: selectedDetailPlace.mapImages ? [...selectedDetailPlace.mapImages] : []
                      });
                      setSelectedDetailPlace(null);
                      setShowModal(true);
                    }}
                    title="일정에 장소 복사"
                  >
                    📋
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary-sm" 
                    style={{ 
                      width: '30px', 
                      height: '30px', 
                      borderRadius: '50%', 
                      padding: 0, 
                      fontSize: '0.85rem', 
                      margin: 0, 
                      color: '#dc2626', 
                      borderColor: '#fca5a5', 
                      backgroundColor: '#fef2f2',
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (window.confirm(`'${selectedDetailPlace.name}' 장소를 정말로 삭제하시겠습니까?`)) {
                        handleDeletePlace(selectedDetailPlace.id);
                        setSelectedDetailPlace(null);
                      }
                    }}
                    title="장소 삭제"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Body (Vertical Column) */}
            <div className="detail-modal-body">
              
              {/* Time & Duration */}
              <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                🕒 {selectedDetailPlace.time} {selectedDetailPlace.duration > 0 && " (" + Math.floor(selectedDetailPlace.duration / 60) + "시간 " + (selectedDetailPlace.duration % 60) + "분 체류)"}
              </div>

              {/* Address */}
              {selectedDetailPlace.address && (
                <div style={{ fontSize: '0.88rem', color: 'var(--text)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                  📍 {selectedDetailPlace.address}
                </div>
              )}

              {/* Description */}
              {selectedDetailPlace.description && (
                <div className="detail-field">
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>📝 메모 / 설명</h4>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: '1.5', background: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {renderTextWithLinks(selectedDetailPlace.description)}
                  </div>
                </div>
              )}

              {/* Tip / Cautions */}
              {selectedDetailPlace.tip && (
                <div className="detail-field" style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.88rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>💡 팁 / 주의사항</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{renderTextWithLinks(selectedDetailPlace.tip)}</p>
                </div>
              )}

              {/* Cost info */}
              {((selectedDetailPlace.costs && selectedDetailPlace.costs.length > 0) || selectedDetailPlace.estimatedCost > 0 || selectedDetailPlace.cost > 0) && (
                <div className="detail-field" style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>💴 경비 내역:</span>
                    <span style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>
                      {formatCostComparison(selectedDetailPlace.estimatedCost ?? selectedDetailPlace.cost, selectedDetailPlace.currency || planCurrency)}
                    </span>
                  </div>
                  {selectedDetailPlace.costs && selectedDetailPlace.costs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                      {selectedDetailPlace.costs.map((c, cIdx) => (
                        <div key={cIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', background: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className={`category-badge category-${c.category || '기타'}`} style={{ fontSize: '0.7rem', padding: '1px 5px' }}>{c.category || '기타'}</span>
                            <span style={{ fontWeight: 600 }}>{c.title || selectedDetailPlace.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{Number(c.amount).toLocaleString()} {selectedDetailPlace.currency || planCurrency}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({c.payer || '미지정'})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    selectedDetailPlace.payer && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        결제자: {selectedDetailPlace.payer}
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Photos Gallery */}
              {selectedDetailPlace.images && selectedDetailPlace.images.length > 0 && (
                <div className="detail-field">
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>🖼️ 현장 사진</h4>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                    {selectedDetailPlace.images.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={img} 
                        alt="detail" 
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}
                        onClick={() => {
                          setLightboxImagesList(selectedDetailPlace.images);
                          setLightboxActiveIndex(idx);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Map Gallery */}
              {selectedDetailPlace.mapImages && selectedDetailPlace.mapImages.length > 0 && (
                <div className="detail-field">
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>🗺️ 첨부 지도</h4>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                    {selectedDetailPlace.mapImages.map((mapImg, idx) => (
                      <img 
                        key={idx} 
                        src={mapImg} 
                        alt="map" 
                        style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}
                        onClick={() => {
                          setLightboxImagesList(selectedDetailPlace.mapImages);
                          setLightboxActiveIndex(idx);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Content Actions (Map View & Reservation Status) */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingBottom: '12px', marginBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={(e) => handleMapSearch(e, selectedDetailPlace.address || selectedDetailPlace.name, planCurrency)}
                  className="btn-secondary-sm"
                  style={{ 
                    width: 'auto', 
                    padding: '8px 14px', 
                    fontSize: '0.82rem', 
                    fontWeight: '600',
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '6px', 
                    cursor: 'pointer',
                    backgroundColor: 'var(--primary-light, #e0e7ff)',
                    color: 'var(--primary)',
                    border: '1px solid var(--primary)'
                  }}
                >
                  🗺️ {selectedDetailPlace.address ? '지도에서 보기' : '지도 검색'}
                </button>

                {selectedDetailPlace.needsReservation && (
                  <button 
                    type="button"
                    className="btn-secondary-sm"
                    style={{ 
                      width: 'auto',
                      padding: '8px 14px', 
                      fontSize: '0.82rem', 
                      backgroundColor: selectedDetailPlace.isReservationCompleted ? '#d1fae5' : '#fee2e2',
                      color: selectedDetailPlace.isReservationCompleted ? '#065f46' : '#991b1b',
                      border: `1px solid ${selectedDetailPlace.isReservationCompleted ? '#a7f3d0' : '#fca5a5'}`,
                      fontWeight: 'bold',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onClick={(e) => {
                      if (isGuest) {
                        alert('게스트(조회 전용) 계정은 수정 권한이 없습니다.');
                        return;
                      }
                      handleToggleReservationComplete(e, selectedDetailPlace.id);
                    }}
                  >
                    {selectedDetailPlace.isReservationCompleted ? '✅ 예약 완료' : '🎫 예약 필요'}
                  </button>
                )}
              </div>

              {/* Alternatives Section */}
              <div className="alternatives-section" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🔀 대안 일정 후보 ({selectedDetailPlace.alternatives ? selectedDetailPlace.alternatives.length : 0})
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      type="button" 
                      className="btn-secondary-sm" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0 }}
                      onClick={() => {
                        setAlternativeForm({
                          mode: 'add',
                          placeId: selectedDetailPlace.id,
                          alt: { name: '', category: '식사', address: '', description: '', tip: '', estimatedCost: '', currency: planCurrency, payer: '미지정' }
                        });
                      }}
                    >
                      ➕ 직접 추가
                    </button>
                    {plan.savedPlaces && plan.savedPlaces.length > 0 && (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button 
                          type="button" 
                          className="btn-secondary-sm" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0 }}
                          onClick={() => {
                            const val = document.getElementById(`sp-dropdown-${selectedDetailPlace.id}`);
                            if (val) val.style.display = val.style.display === 'block' ? 'none' : 'block';
                          }}
                        >
                          📂 보관함 로드
                        </button>
                        <div 
                          id={`sp-dropdown-${selectedDetailPlace.id}`}
                          style={{ 
                            display: 'none', 
                            position: 'absolute', 
                            right: 0, 
                            top: '100%', 
                            marginTop: '4px', 
                            background: '#fff', 
                            border: '1px solid var(--border)', 
                            borderRadius: '8px', 
                            boxShadow: 'var(--shadow-md)', 
                            zIndex: 1000, 
                            minWidth: '220px', 
                            maxHeight: '200px', 
                            overflowY: 'auto' 
                          }}
                        >
                          {plan.savedPlaces.map(sp => (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => {
                                handleImportFromSavedPlaces(selectedDetailPlace.id, sp);
                                document.getElementById(`sp-dropdown-${selectedDetailPlace.id}`).style.display = 'none';
                              }}
                              style={{ 
                                display: 'block', 
                                width: '100%', 
                                padding: '8px 12px', 
                                textAlign: 'left', 
                                background: 'none', 
                                border: 'none', 
                                borderBottom: '1px solid #f0f0f0', 
                                fontSize: '0.78rem', 
                                cursor: 'pointer' 
                              }}
                              onMouseEnter={e => e.target.style.background = '#f9f9f9'}
                              onMouseLeave={e => e.target.style.background = 'none'}
                            >
                              <strong>[{sp.category}]</strong> {sp.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {!selectedDetailPlace.alternatives || selectedDetailPlace.alternatives.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                      대기 시간이나 상황 변동을 대비해 대안 장소를 등록해 두세요!
                    </div>
                  ) : (
                    selectedDetailPlace.alternatives.map(alt => (
                      <div key={alt.id} style={{
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '10px',
                        backgroundColor: 'var(--bg-app)',
                        fontSize: '0.82rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div>
                            <span className={`category-badge category-${alt.category}`} style={{ padding: '2px 4px', fontSize: '0.7rem' }}>{alt.category}</span>
                            <strong style={{ marginLeft: '6px' }}>{alt.name}</strong>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button 
                              type="button" 
                              className="btn-secondary-sm"
                              style={{ padding: '2px 6px', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}
                              onClick={() => handleSwapPlaceWithAlternative(selectedDetailPlace.id, alt.id)}
                            >
                              🔄 대표 교체
                            </button>
                            <button 
                              type="button" 
                              className="btn-secondary-sm"
                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                              onClick={(e) => handleMapSearch(e, alt.address || alt.name, planCurrency)}
                              title="대안 장소 지도 보기"
                            >
                              🗺️ 지도
                            </button>
                            <button 
                              type="button" 
                              className="btn-secondary-sm"
                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                              onClick={(e) => handleRouteNav(e, selectedDetailPlace.address || selectedDetailPlace.name, alt.address || alt.name, planCurrency, selectedDetailPlace.transportType)}
                              title="대표 장소 ➔ 대안 장소 길찾기"
                            >
                              🚗 길찾기
                            </button>
                            <button 
                              type="button" 
                              className="btn-secondary-sm"
                              style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                              onClick={() => {
                                setAlternativeForm({
                                  mode: 'edit',
                                  placeId: selectedDetailPlace.id,
                                  alt: { ...alt }
                                });
                              }}
                            >
                              ✏️
                            </button>
                            <button 
                              type="button" 
                              className="delete-btn-danger"
                              style={{ padding: '2px 6px', fontSize: '0.7rem', width: 'auto', marginTop: 0 }}
                              onClick={() => handleDeleteAlternative(selectedDetailPlace.id, alt.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                          
                        {alt.images && alt.images.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'thin' }}>
                            {alt.images.map((imgUrl, imgIdx) => (
                              <img
                                key={imgIdx}
                                src={imgUrl}
                                alt={`${alt.name} ${imgIdx + 1}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxImagesList(alt.images);
                                  setLightboxActiveIndex(imgIdx);
                                }}
                                style={{
                                  width: '55px',
                                  height: '55px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: '1px solid var(--border)',
                                  flexShrink: 0
                                }}
                              />
                            ))}
                          </div>
                        )}
                          {alt.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{renderTextWithLinks(alt.description)}</div>}
                          {alt.tip && <div style={{ color: '#b45309', fontSize: '0.75rem', marginTop: '2px', whiteSpace: 'pre-wrap' }}>💡 {renderTextWithLinks(alt.tip)}</div>}
                          {alt.address && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>📍 {alt.address}</div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Comments Section inside Detail Modal */}
                <div className="detail-comments-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700 }}>💬 가족 댓글 피드</h4>
                  
                  <div style={{ 
                    flex: 1, 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    background: 'var(--bg-app)', 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    marginBottom: '10px'
                  }}>
                    {!selectedDetailPlace.comments || selectedDetailPlace.comments.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>첫 댓글을 달아 가족과 소통해 보세요!</div>
                    ) : (
                      selectedDetailPlace.comments.map(c => {
                        const isMyComment = c.author === currentUser.name;
                        const isEditing = editingCommentId === c.id;
                        return (
                          <div key={c.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMyComment ? 'flex-end' : 'flex-start',
                            marginBottom: '10px'
                          }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                              {c.author} · <span style={{ fontSize: '0.7rem' }}>{c.time}</span>
                            </div>
                            <div style={{
                              backgroundColor: isMyComment ? 'var(--primary-light, #e0e7ff)' : '#fff',
                              border: '1px solid var(--border)',
                              borderRadius: '12px',
                              padding: '8px 12px',
                              maxWidth: '85%',
                              fontSize: '0.82rem',
                              color: 'var(--text)',
                              position: 'relative'
                            }}>
                              {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <input 
                                    type="text" 
                                    className="comment-edit-input" 
                                    value={editingCommentText} 
                                    onChange={e => setEditingCommentText(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleUpdateComment(selectedDetailPlace.id, c.id, editingCommentText);
                                    }}
                                    style={{ fontSize: '0.8rem', padding: '4px' }}
                                  />
                                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn-cancel-sm" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }}>취소</button>
                                    <button type="button" className="btn-save-sm" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => handleUpdateComment(selectedDetailPlace.id, c.id, editingCommentText)}>저장</button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div>{renderTextWithLinks(c.text)}</div>
                                  {!isGuest && (c.author === currentUser.name || currentUser.role === 'admin') && (
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px', opacity: 0.6 }}>
                                      <span style={{ cursor: 'pointer', fontSize: '0.7rem', color: 'blue' }} onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.text); }}>수정</span>
                                      <span style={{ cursor: 'pointer', fontSize: '0.7rem', color: 'red' }} onClick={() => handleDeleteComment(selectedDetailPlace.id, c.id)}>삭제</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Comment Input Box */}
                  {!isGuest ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="text"
                        placeholder="가족들과 이야기 나누기..."
                        className="form-control"
                        style={{ flex: 1, margin: 0, padding: '8px 12px', fontSize: '0.85rem' }}
                        value={commentInputs[selectedDetailPlace.id] || ''}
                        onChange={e => setCommentInputs({ ...commentInputs, [selectedDetailPlace.id]: e.target.value })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddComment(selectedDetailPlace.id);
                        }}
                      />
                      <button 
                        className="comment-send-btn" 
                        style={{ padding: '8px 16px', margin: 0, height: 'auto' }}
                        onClick={() => handleAddComment(selectedDetailPlace.id)}
                      >
                        전송
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
                      👁️ 게스트(조회 전용) 계정은 댓글 작성이 제한됩니다.
                    </div>
                  )}
                </div>

            </div>
          </div>
        </div>
      )}

      {/* 2.5 ADD SAVED PLACE MODAL */}
      {showAddSavedPlaceModal && (
        <div className="modal-overlay" onClick={() => setShowAddSavedPlaceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📍 새 후보 장소 추가</h3>
              <button className="close-btn" onClick={() => setShowAddSavedPlaceModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddSavedPlace}>
              <div className="form-group">
                <label>장소 이름 <span style={{ color: 'red' }}>*</span></label>
                <input type="text" required className="form-control" placeholder="예: 함덕 맛있는 식당" value={newSavedPlace.name} onChange={e => setNewSavedPlace({ ...newSavedPlace, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>카테고리</label>
                <select className="form-control" value={newSavedPlace.category} onChange={e => setNewSavedPlace({ ...newSavedPlace, category: e.target.value })}>
                  <option value="식사">식사</option>
                  <option value="관광">관광</option>
                  <option value="숙소">숙소</option>
                  <option value="카페">카페</option>
                  <option value="쇼핑">쇼핑</option>
                  <option value="이동">이동</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div className="form-group">
                <label>주소 (입력 시 지도 마킹)</label>
                <input type="text" className="form-control" placeholder="예: 제주 제주시 조천읍 함덕리..." value={newSavedPlace.address} onChange={e => setNewSavedPlace({ ...newSavedPlace, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label>설명 / 메모</label>
                <textarea className="form-control" placeholder="예: 대기줄 많음, 맛있는 부위는 한정 판매" value={newSavedPlace.description} onChange={e => setNewSavedPlace({ ...newSavedPlace, description: e.target.value })}></textarea>
              </div>
              <div className="form-group">
                <label>팁 / 주의사항</label>
                <input type="text" className="form-control" placeholder="예: 오후 5시 이전 대기 필수" value={newSavedPlace.tip} onChange={e => setNewSavedPlace({ ...newSavedPlace, tip: e.target.value })} />
              </div>
              <div className="form-group">
                <label>웹 지도 링크 (Naver/Google Map 등)</label>
                <input type="text" className="form-control" placeholder="https://..." value={newSavedPlace.url} onChange={e => setNewSavedPlace({ ...newSavedPlace, url: e.target.value })} />
              </div>
              <div className="form-group">
                <label>📷 사진 첨부</label>
                <div 
                  className={`image-upload-zone ${uploading ? 'uploading' : ''}`}
                  onClick={() => addSavedPlaceImgInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleSavedPlaceDrop(e, false)}
                  onPaste={(e) => handleSavedPlacePaste(e, false)}
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
                  {uploading ? '⏳ 이미지 업로드 중...' : '🖼️ 복사한 이미지를 여기에 붙여넣기(Ctrl+V), 드래그&드롭 또는 클릭하여 사진 추가'}
                </div>
                <input 
                  type="file" 
                  ref={addSavedPlaceImgInputRef}
                  style={{ display: 'none' }}
                  multiple 
                  accept="image/*" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleSavedPlaceImageAttach(e.target.files, false);
                    }
                  }} 
                />
                {newSavedPlace.images && newSavedPlace.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '8px' }}>
                    {newSavedPlace.images.map((img, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={img} alt="saved" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                        <button 
                          type="button" 
                          onClick={() => {
                            setNewSavedPlace(prev => ({
                              ...prev,
                              images: prev.images.filter((_, idx) => idx !== i)
                            }));
                          }} 
                          style={{ position: 'absolute', top: -4, right: -4, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-secondary-sm" style={{ flex: 1, padding: '12px 0', fontSize: '0.95rem', fontWeight: 600 }} onClick={() => setShowAddSavedPlaceModal(false)}>취소</button>
                <button type="submit" className="submit-btn" style={{ flex: 1, padding: '12px 0', fontSize: '0.95rem' }}>등록</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2.6 EDIT SAVED PLACE MODAL */}
      {editingSavedPlace && (
        <div className="modal-overlay" onClick={() => setEditingSavedPlace(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ 후보 장소 수정</h3>
              <button className="close-btn" onClick={() => setEditingSavedPlace(null)}>×</button>
            </div>
            <form onSubmit={handleEditSavedPlace}>
              <div className="form-group">
                <label>장소 이름 <span style={{ color: 'red' }}>*</span></label>
                <input type="text" required className="form-control" value={editingSavedPlace.name} onChange={e => setEditingSavedPlace({ ...editingSavedPlace, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>카테고리</label>
                <select className="form-control" value={editingSavedPlace.category} onChange={e => setEditingSavedPlace({ ...editingSavedPlace, category: e.target.value })}>
                  <option value="식사">식사</option>
                  <option value="관광">관광</option>
                  <option value="숙소">숙소</option>
                  <option value="카페">카페</option>
                  <option value="쇼핑">쇼핑</option>
                  <option value="이동">이동</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div className="form-group">
                <label>주소</label>
                <input type="text" className="form-control" value={editingSavedPlace.address || ''} onChange={e => setEditingSavedPlace({ ...editingSavedPlace, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label>설명 / 메모</label>
                <textarea className="form-control" value={editingSavedPlace.description || ''} onChange={e => setEditingSavedPlace({ ...editingSavedPlace, description: e.target.value })}></textarea>
              </div>
              <div className="form-group">
                <label>팁 / 주의사항</label>
                <input type="text" className="form-control" value={editingSavedPlace.tip || ''} onChange={e => setEditingSavedPlace({ ...editingSavedPlace, tip: e.target.value })} />
              </div>
              <div className="form-group">
                <label>웹 지도 링크</label>
                <input type="text" className="form-control" value={editingSavedPlace.url || ''} onChange={e => setEditingSavedPlace({ ...editingSavedPlace, url: e.target.value })} />
              </div>
              <div className="form-group">
                <label>📷 사진 첨부</label>
                <div 
                  className={`image-upload-zone ${uploading ? 'uploading' : ''}`}
                  onClick={() => editSavedPlaceImgInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleSavedPlaceDrop(e, true)}
                  onPaste={(e) => handleSavedPlacePaste(e, true)}
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
                  {uploading ? '⏳ 이미지 업로드 중...' : '🖼️ 복사한 이미지를 여기에 붙여넣기(Ctrl+V), 드래그&드롭 또는 클릭하여 사진 추가'}
                </div>
                <input 
                  type="file" 
                  ref={editSavedPlaceImgInputRef}
                  style={{ display: 'none' }}
                  multiple 
                  accept="image/*" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleSavedPlaceImageAttach(e.target.files, true);
                    }
                  }} 
                />
                {editingSavedPlace.images && editingSavedPlace.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '8px' }}>
                    {editingSavedPlace.images.map((img, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={img} alt="saved" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingSavedPlace(prev => ({
                              ...prev,
                              images: prev.images.filter((_, idx) => idx !== i)
                            }));
                          }} 
                          style={{ position: 'absolute', top: -4, right: -4, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-secondary-sm" style={{ flex: 1, padding: '12px 0', fontSize: '0.95rem', fontWeight: 600 }} onClick={() => setEditingSavedPlace(null)}>취소</button>
                <button type="submit" className="submit-btn" style={{ flex: 1, padding: '12px 0', fontSize: '0.95rem' }}>저장 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2.7 ALTERNATIVE ADD/EDIT MODAL */}
      {alternativeForm && (
        <div className="modal-overlay" onClick={() => setAlternativeForm(null)} style={{ zIndex: 1250 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{alternativeForm.mode === 'add' ? '🔀 대안 일정 추가' : '✏️ 대안 일정 수정'}</h3>
              <button className="close-btn" onClick={() => setAlternativeForm(null)}>×</button>
            </div>
            <form onSubmit={handleSaveAlternative}>
              <div className="form-group">
                <label>장소 이름 <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  required 
                  className="form-control" 
                  value={alternativeForm.alt.name} 
                  onChange={e => setAlternativeForm({
                    ...alternativeForm,
                    alt: { ...alternativeForm.alt, name: e.target.value }
                  })} 
                />
              </div>
              <div className="form-group">
                <label>카테고리</label>
                <select 
                  className="form-control" 
                  value={alternativeForm.alt.category} 
                  onChange={e => setAlternativeForm({
                    ...alternativeForm,
                    alt: { ...alternativeForm.alt, category: e.target.value }
                  })}
                >
                  <option value="식사">식사</option>
                  <option value="관광">관광</option>
                  <option value="숙소">숙소</option>
                  <option value="카페">카페</option>
                  <option value="쇼핑">쇼핑</option>
                  <option value="이동">이동</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div className="form-group">
                <label>주소</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="예: 제주 조천읍 함덕리..." 
                  value={alternativeForm.alt.address || ''} 
                  onChange={e => setAlternativeForm({
                    ...alternativeForm,
                    alt: { ...alternativeForm.alt, address: e.target.value }
                  })} 
                />
              </div>
              <div className="form-group">
                <label>설명 / 메모</label>
                <textarea 
                  className="form-control" 
                  placeholder="설명 작성" 
                  value={alternativeForm.alt.description || ''} 
                  onChange={e => setAlternativeForm({
                    ...alternativeForm,
                    alt: { ...alternativeForm.alt, description: e.target.value }
                  })}
                ></textarea>
              </div>
              <div className="form-group">
                <label>팁 / 주의사항</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={alternativeForm.alt.tip || ''} 
                  onChange={e => setAlternativeForm({
                    ...alternativeForm,
                    alt: { ...alternativeForm.alt, tip: e.target.value }
                  })} 
                />
              </div>
              <div className="form-group">
                <label>예상 금액</label>
                <input 
                  type="number" 
                  min="0"
                  className="form-control" 
                  value={alternativeForm.alt.estimatedCost || ''} 
                  onChange={e => setAlternativeForm({
                    ...alternativeForm,
                    alt: { ...alternativeForm.alt, estimatedCost: e.target.value }
                  })} 
                />
              </div>
              <div className="form-group">
                <label>📷 사진 첨부</label>
                <div 
                  className={`image-upload-zone ${uploading ? 'uploading' : ''}`}
                  onClick={() => altImgInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleAltDrop(e)}
                  onPaste={(e) => handleAltPaste(e)}
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
                  {uploading ? '⏳ 이미지 업로드 중...' : '🖼️ 복사한 이미지를 여기에 붙여넣기(Ctrl+V), 드래그&드롭 또는 클릭하여 사진 추가'}
                </div>
                <input 
                  type="file" 
                  ref={altImgInputRef}
                  style={{ display: 'none' }}
                  multiple 
                  accept="image/*" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleAltImageAttach(e.target.files);
                    }
                  }} 
                />
                {alternativeForm.alt?.images && alternativeForm.alt.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '8px' }}>
                    {alternativeForm.alt.images.map((img, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={img} alt="alt" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                        <button 
                          type="button" 
                          onClick={() => {
                            setAlternativeForm(prev => ({
                              ...prev,
                              alt: {
                                ...prev.alt,
                                images: prev.alt.images.filter((_, idx) => idx !== i)
                              }
                            }));
                          }} 
                          style={{ position: 'absolute', top: -4, right: -4, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="button" className="btn-secondary-sm" style={{ flex: 1, padding: '12px 0', fontSize: '0.95rem', fontWeight: 600 }} onClick={() => setAlternativeForm(null)}>취소</button>
                <button type="submit" className="submit-btn" style={{ flex: 1, padding: '12px 0', fontSize: '0.95rem' }}>{alternativeForm.mode === 'add' ? '추가' : '저장 완료'}</button>
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
                  <option value="ritual">제사 (차례)</option>
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
                  <option value="ritual">제사 (차례)</option>
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

      {/* 2.8 PROFILE EDIT MODAL */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>⚙️ 프로필 수정</h3>
              <button className="close-btn" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              
              {/* Profile Image upload/preview */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: '10px' }}>
                  {profileForm.profileImage ? (
                    <img 
                      src={profileForm.profileImage} 
                      alt="profile preview" 
                      style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                    />
                  ) : (
                    <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                      {profileForm.nickname.slice(0, 1)}
                    </div>
                  )}
                  <label 
                    htmlFor="profile-upload" 
                    style={{ 
                      position: 'absolute', 
                      bottom: '0', 
                      right: '0', 
                      backgroundColor: 'var(--primary)', 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      border: '2px solid #fff',
                      color: '#fff',
                      fontSize: '0.85rem',
                      margin: 0
                    }}
                    title="이미지 업로드"
                  >
                    📷
                  </label>
                  <input 
                    id="profile-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfileImageUpload} 
                    style={{ display: 'none' }} 
                  />
                </div>
                {profileForm.profileImage && (
                  <button 
                    type="button" 
                    className="btn-secondary-sm" 
                    style={{ fontSize: '0.75rem', padding: '2px 8px', color: '#ef4444', border: 'none', background: 'none' }} 
                    onClick={() => setProfileForm(prev => ({ ...prev, profileImage: null }))}
                  >
                    이미지 제거
                  </button>
                )}
              </div>

              {/* Nickname input */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>닉네임 설정</label>
                <input 
                  type="text" 
                  required 
                  className="form-control" 
                  value={profileForm.nickname} 
                  onChange={e => setProfileForm(prev => ({ ...prev, nickname: e.target.value }))} 
                  placeholder="사용하실 닉네임을 입력하세요"
                />
              </div>

              {/* Password (PIN) input */}
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 600 }}>비밀번호 변경 (숫자 6자리)</label>
                <input 
                  type="password" 
                  maxLength={6}
                  className="form-control" 
                  value={profileForm.password} 
                  onChange={e => setProfileForm(prev => ({ ...prev, password: e.target.value.replace(/[^0-9]/g, '') }))} 
                  placeholder="새로운 6자리 PIN (변경시에만 입력)"
                />
              </div>

              {profileError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                  ⚠️ {profileError}
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-secondary-sm" style={{ padding: '12px', fontSize: '0.95rem', margin: 0 }} onClick={() => setShowProfileModal(false)} disabled={profileUpdating}>취소</button>
                <button type="submit" className="submit-btn" style={{ flex: 1, padding: '12px', fontSize: '0.95rem', margin: 0 }} disabled={profileUpdating}>
                  {profileUpdating ? '저장 중...' : '저장 완료'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2.9 NOTIFICATION CENTER MODAL */}
      {showNotifModal && (
        <div className="modal-overlay" onClick={() => setShowNotifModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '95%', maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔔 알림 센터
                {notifications.filter(n => !n.readBy || !n.readBy.includes(currentUser.name)).length > 0 && (
                  <span style={{ fontSize: '0.75rem', background: 'var(--danger)', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>
                    {notifications.filter(n => !n.readBy || !n.readBy.includes(currentUser.name)).length}개 안읽음
                  </span>
                )}
              </h3>
              <button className="close-btn" onClick={() => setShowNotifModal(false)}>×</button>
            </div>
            
            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '4px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📭</div>
                  수신된 알림이 없습니다.
                </div>
              ) : (
                notifications.map((notif) => {
                  const isUnread = !notif.readBy || !notif.readBy.includes(currentUser.name);
                  const actorInfo = usersMap[notif.actor] || { nickname: notif.actor, profileImage: null };
                  
                  // Icon by type
                  let typeBadge = "📝";
                  let badgeBg = "var(--bg-app)";
                  if (notif.type === 'place_add') { typeBadge = "➕"; badgeBg = "#ecfdf5"; }
                  else if (notif.type === 'place_edit') { typeBadge = "✏️"; badgeBg = "#eff6ff"; }
                  else if (notif.type === 'comment_add') { typeBadge = "💬"; badgeBg = "#fff7ed"; }
                  else if (notif.type === 'checklist_add') { typeBadge = "✅"; badgeBg = "#f5f3ff"; }
                  else if (notif.type === 'expense_add') { typeBadge = "💰"; badgeBg = "#fef2f2"; }
                  
                  return (
                    <div 
                      key={notif.id} 
                      onClick={() => handleNotificationClick(notif)}
                      style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        padding: '12px', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border)',
                        background: isUnread ? 'var(--primary-light)' : 'var(--bg-card)', 
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        position: 'relative',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      className="notif-item"
                    >
                      {/* Actor Avatar */}
                      <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
                        {actorInfo.profileImage ? (
                          <img src={actorInfo.profileImage} alt={actorInfo.nickname} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            {actorInfo.nickname.slice(0, 1)}
                          </div>
                        )}
                        <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: badgeBg, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', border: '1px solid var(--border)' }}>
                          {typeBadge}
                        </span>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
                          📌 {notif.planTitle || '여행 계획'}
                        </div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontWeight: isUnread ? '600' : 'normal', lineHeight: '1.4' }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(notif.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {new Date(notif.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {isUnread && (
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--danger)', 
                          alignSelf: 'center', 
                          flexShrink: 0 
                        }}></div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImagesList && lightboxImagesList.length > 0 && (
        <div 
          className="modal-overlay" 
          onClick={() => setLightboxImagesList([])}
          style={{ zIndex: 3000, backgroundColor: 'rgba(0, 0, 0, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <ZoomableImage 
            images={lightboxImagesList} 
            initialIndex={lightboxActiveIndex} 
            onClose={() => setLightboxImagesList([])} 
          />
        </div>
      )}
    </div>
  );
}

// Zoomable Image Component for Lightbox (Mouse Wheel Zoom & Pinch-to-Zoom with Touch Drag & Swipe Support)
function ZoomableImage({ images, initialIndex, onClose }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const positionRef = useRef(position);
  positionRef.current = position;
  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;

  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef(0);
  const lastScaleRef = useRef(1);
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const touchStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const src = images[activeIndex];

  // Sync activeIndex with initialIndex if it changes
  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  // Reset zoom on src change
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  // Handle keyboard events (Arrow Keys to slide, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setActiveIndex(prev => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex(prev => (prev + 1) % images.length);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images, onClose]);

  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle high-performance wheel and touch events with { passive: false } manually
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = 0.25;
      const currentScale = scaleRef.current;
      const newScale = e.deltaY < 0 ? Math.min(currentScale + zoomFactor, 6) : Math.max(currentScale - zoomFactor, 1);
      
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    };

    const handleTouchMoveEvent = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getTouchDistance(e.touches);
        const startDist = touchStartDistRef.current;
        if (startDist > 0) {
          const factor = dist / startDist;
          const newScale = Math.max(1, Math.min(lastScaleRef.current * factor, 6));
          setScale(newScale);
          if (newScale === 1) {
            setPosition({ x: 0, y: 0 });
          }
        }
      } else if (e.touches.length === 1 && isDraggingRef.current && scaleRef.current > 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - lastTouchRef.current.x;
        const dy = touch.clientY - lastTouchRef.current.y;
        setPosition(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchmove', handleTouchMoveEvent, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchmove', handleTouchMoveEvent);
    };
  }, []);

  const handleMouseDown = (e) => {
    if (scaleRef.current <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - positionRef.current.x, y: e.clientY - positionRef.current.y };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartDistRef.current = getTouchDistance(e.touches);
      lastScaleRef.current = scaleRef.current;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      touchStartDistRef.current = 0;

      // Swipe detection when scale is 1
      if (scaleRef.current === 1) {
        const touch = e.changedTouches[0];
        if (touch) {
          const dx = touch.clientX - touchStartRef.current.x;
          const dy = touch.clientY - touchStartRef.current.y;
          if (Math.abs(dx) > 60 && Math.abs(dy) < 40) {
            if (dx > 0) {
              // Swipe right -> Prev
              setActiveIndex(prev => (prev - 1 + images.length) % images.length);
            } else {
              // Swipe left -> Next
              setActiveIndex(prev => (prev + 1) % images.length);
            }
          }
        }
      }
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      setIsDragging(true);
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative', 
        width: '100vw', 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden',
        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <img 
        src={src} 
        alt="Enlarged view" 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '85vh', 
          objectFit: 'contain', 
          borderRadius: '8px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          userSelect: 'none',
          pointerEvents: 'none'
        }} 
      />
      
      {scale > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '24px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          zIndex: 10
        }}>
          🔍 {scale.toFixed(1)}x 확대 중 (드래그하여 이동)
        </div>
      )}

      {images.length > 1 && scale === 1 && (
        <>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex(prev => (prev - 1 + images.length) % images.length);
            }}
            style={{
              position: 'absolute',
              left: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              fontSize: '32px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              outline: 'none',
              zIndex: 10,
              userSelect: 'none'
            }}
          >
            ‹
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex(prev => (prev + 1) % images.length);
            }}
            style={{
              position: 'absolute',
              right: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              fontSize: '32px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              outline: 'none',
              zIndex: 10,
              userSelect: 'none'
            }}
          >
            ›
          </button>
          <div style={{
            position: 'absolute',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            zIndex: 10
          }}>
            {activeIndex + 1} / {images.length}
          </div>
        </>
      )}
      
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          border: 'none',
          color: '#fff',
          fontSize: '28px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          outline: 'none',
          zIndex: 10
        }}
      >
        ×
      </button>
    </div>
  );
}

export default App;
