const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Pre-registered family user list
const FAM_USERS = [
  { name: "이정우", pin: "570413", role: "user" },
  { name: "홍영숙", pin: "630124", role: "user" },
  { name: "이진수", pin: "850119", role: "user" },
  { name: "이아름", pin: "880803", role: "user" },
  { name: "이현수", pin: "870707", role: "admin" }, // Admin
  { name: "양슬기", pin: "871214", role: "user" },
  { name: "이준성", pin: "110324", role: "user" },
  { name: "이은성", pin: "140813", role: "user" },
  { name: "이해성", pin: "200220", role: "user" }
];

// Mock DB data
let travelPlans = [
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
          { 
            id: 1002, 
            time: "12:30", 
            name: "자매국수", 
            description: "점심 식사 (고기국수)", 
            comments: [] 
          },
          { 
            id: 1003, 
            time: "15:00", 
            name: "함덕해수욕장", 
            description: "바다 구경 및 카페 휴식", 
            comments: [
              { id: 2, author: "양슬기", text: "아이들 돗자리랑 여벌 옷 챙겨갈게요.", time: "오후 1:15" }
            ] 
          },
          { 
            id: 1004, 
            time: "18:00", 
            name: "숙소 체크인", 
            description: "서귀포 가족 펜션", 
            comments: [] 
          }
        ]
      },
      {
        day: 2,
        date: "2026-08-16",
        places: [
          { 
            id: 1005, 
            time: "09:30", 
            name: "성산일출봉", 
            description: "가벼운 산책 코스 (부모님은 아래 카페 대기)", 
            comments: [] 
          },
          { 
            id: 1006, 
            time: "12:00", 
            name: "성산 바다식당", 
            description: "갈치조림 점심", 
            comments: [] 
          }
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
  },
  {
    id: 2,
    title: "2025년 가을 경주 역사 여행",
    startDate: "2025-10-10",
    endDate: "2025-10-12",
    members: ["이정우", "홍영숙", "이진수", "이아름"],
    itinerary: [
      {
        day: 1,
        date: "2025-10-10",
        places: [
          { 
            id: 2001, 
            time: "13:00", 
            name: "경주 버스터미널 도착", 
            description: "택시 탑승", 
            comments: [] 
          },
          { 
            id: 2002, 
            time: "14:00", 
            name: "대릉원 및 황리단길", 
            description: "가족 한복 대여 및 사진 촬영", 
            comments: [
              { id: 3, author: "이아름", text: "한복점 예약해 뒀어요!", time: "오전 11:20" }
            ] 
          }
        ]
      }
    ],
    expenses: [
      { id: 301, title: "한복 대여 (4인)", amount: 80000, payer: "홍영숙", date: "2025-10-10" }
    ],
    checklists: [
      { id: 401, title: "경주 역사 탐방 책자 지참", checked: true, assignee: "이아름" }
    ]
  }
];

// Authentication API
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요." });
  }

  const user = FAM_USERS.find(u => u.name === username && u.pin === password);
  if (!user) {
    return res.status(401).json({ message: "아이디 또는 비밀번호가 틀렸습니다." });
  }

  res.json({
    token: `mock-token-${user.name}-${Date.now()}`,
    user: {
      name: user.name,
      role: user.role
    }
  });
});

// Sync Full Plan (convenient offline sync)
app.post('/api/plans/:id/sync', (req, res) => {
  const planId = parseInt(req.params.id);
  const planIndex = travelPlans.findIndex(p => p.id === planId);
  if (planIndex !== -1) {
    travelPlans[planIndex] = { ...travelPlans[planIndex], ...req.body };
    res.json(travelPlans[planIndex]);
  } else {
    res.status(404).json({ message: "여행 계획을 찾을 수 없습니다." });
  }
});

// Fetch all plans
app.get('/api/plans', (req, res) => {
  res.json(travelPlans);
});

// Fetch single plan
app.get('/api/plans/:id', (req, res) => {
  const plan = travelPlans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return res.status(404).json({ message: "여행 계획을 찾을 수 없습니다." });
  res.json(plan);
});

// Create new plan
app.post('/api/plans', (req, res) => {
  const { title, startDate, endDate, members } = req.body;
  if (!title || !startDate || !endDate) {
    return res.status(400).json({ message: "제목, 시작일, 종료일은 필수입니다." });
  }
  const newPlan = {
    id: travelPlans.length + 1,
    title,
    startDate,
    endDate,
    members: members || [],
    itinerary: [],
    expenses: [],
    checklists: []
  };
  travelPlans.push(newPlan);
  res.status(201).json(newPlan);
});

// Add Place Comment API
app.post('/api/plans/:id/places/:placeId/comments', (req, res) => {
  const planId = parseInt(req.params.id);
  const placeId = parseInt(req.params.placeId);
  const { author, text } = req.body;

  if (!author || !text) {
    return res.status(400).json({ message: "작성자와 내용이 필요합니다." });
  }

  const plan = travelPlans.find(p => p.id === planId);
  if (!plan) return res.status(404).json({ message: "여행 계획을 찾을 수 없습니다." });

  let foundPlace = null;
  for (const dayItem of plan.itinerary) {
    const place = dayItem.places.find(p => p.id === placeId);
    if (place) {
      foundPlace = place;
      break;
    }
  }

  if (!foundPlace) {
    return res.status(404).json({ message: "일정 항목을 찾을 수 없습니다." });
  }

  if (!foundPlace.comments) {
    foundPlace.comments = [];
  }

  const newComment = {
    id: Date.now(),
    author,
    text,
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  };

  foundPlace.comments.push(newComment);
  res.json(plan);
});

// API helper for adding itinerary place with generated ID and comments array
app.post('/api/plans/:id/itinerary', (req, res) => {
  const planId = parseInt(req.params.id);
  const planIndex = travelPlans.findIndex(p => p.id === planId);
  if (planIndex === -1) return res.status(404).json({ message: "여행 계획을 찾을 수 없습니다." });

  const { day, date, places } = req.body;
  const processedPlaces = (places || []).map(p => ({
    id: p.id || Date.now() + Math.random(),
    time: p.time,
    name: p.name,
    description: p.description || '',
    comments: p.comments || []
  }));

  const dayIndex = travelPlans[planIndex].itinerary.findIndex(item => item.day === parseInt(day));
  if (dayIndex === -1) {
    travelPlans[planIndex].itinerary.push({ day: parseInt(day), date, places: processedPlaces });
  } else {
    travelPlans[planIndex].itinerary[dayIndex].places.push(...processedPlaces);
    travelPlans[planIndex].itinerary[dayIndex].places.sort((a, b) => a.time.localeCompare(b.time));
  }

  res.json(travelPlans[planIndex]);
});

app.get('/health', (req, res) => {
  res.send('Server is healthy');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
