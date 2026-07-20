const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Path to persistent data file
const DATA_FILE = path.join(__dirname, '../data/plans.json');

// Ensure data directory and file exist
const initializeData = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(DATA_FILE)) {
    const seedData = [
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
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
  }
};
initializeData();

// Helper functions to load/save plans
const loadPlans = () => {
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading data file:", err);
    return [];
  }
};

const savePlans = (plans) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(plans, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing data file:", err);
  }
};

// Pre-registered family user list
const FAM_USERS = [
  { name: "이정우", pin: "570413", role: "user" },
  { name: "홍영숙", pin: "630124", role: "user" },
  { name: "이진수", pin: "850119", role: "user" },
  { name: "이아름", pin: "880803", role: "user" },
  { name: "이현수", pin: "870707", role: "admin" },
  { name: "양슬기", pin: "871214", role: "user" },
  { name: "이준성", pin: "110324", role: "user" },
  { name: "이은성", pin: "140813", role: "user" },
  { name: "이해성", pin: "200220", role: "user" },
  { name: "이하성", pin: "210930", role: "user" },
  { name: "이주성", pin: "231110", role: "user" }
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
  const plans = loadPlans();
  const planIndex = plans.findIndex(p => p.id === planId);
  
  if (planIndex !== -1) {
    plans[planIndex] = { ...plans[planIndex], ...req.body };
    savePlans(plans);
    res.json(plans[planIndex]);
  } else {
    res.status(404).json({ message: "여행 계획을 찾을 수 없습니다." });
  }
});

// Fetch all plans
app.get('/api/plans', (req, res) => {
  res.json(loadPlans());
});

// Fetch single plan
app.get('/api/plans/:id', (req, res) => {
  const plans = loadPlans();
  const plan = plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return res.status(404).json({ message: "여행 계획을 찾을 수 없습니다." });
  res.json(plan);
});

// Create new plan
app.post('/api/plans', (req, res) => {
  const { title, startDate, endDate, members, manager, currency, accommodation, transportation, isEvent, description } = req.body;
  if (!title || !startDate || !endDate) {
    return res.status(400).json({ message: "제목, 시작일, 종료일은 필수입니다." });
  }
  const plans = loadPlans();
  const newPlan = {
    id: plans.reduce((maxId, plan) => Math.max(maxId, Number(plan.id) || 0), 0) + 1,
    title,
    startDate,
    endDate,
    members: members || [],
    manager: manager || (members || [])[0] || '',
    currency: currency || 'KRW',
    ...(accommodation ? { accommodation } : {}),
    ...(transportation ? { transportation } : {}),
    ...(isEvent ? { isEvent: true } : {}),
    ...(description ? { description } : {}),
    itinerary: [],
    expenses: [],
    checklists: []
  };
  plans.push(newPlan);
  savePlans(plans);
  res.status(201).json(newPlan);
});

// Delete plan or event API
app.delete('/api/plans/:id', (req, res) => {
  const planId = parseInt(req.params.id);
  let plans = loadPlans();
  const exists = plans.some(p => p.id === planId);
  if (!exists) {
    return res.status(404).json({ message: "삭제할 일정을 찾을 수 없습니다." });
  }
  plans = plans.filter(p => p.id !== planId);
  savePlans(plans);
  res.json({ message: "일정이 성공적으로 삭제되었습니다." });
});

// Add Place Comment API
app.post('/api/plans/:id/places/:placeId/comments', (req, res) => {
  const planId = parseInt(req.params.id);
  const placeId = parseInt(req.params.placeId);
  const { author, text } = req.body;

  if (!author || !text) {
    return res.status(400).json({ message: "작성자와 내용이 필요합니다." });
  }

  const plans = loadPlans();
  const planIndex = plans.findIndex(p => p.id === planId);
  if (planIndex === -1) return res.status(404).json({ message: "여행 계획을 찾을 수 없습니다." });

  let foundPlace = null;
  for (const dayItem of plans[planIndex].itinerary) {
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
  savePlans(plans);
  res.json(plans[planIndex]);
});

// Add itinerary place helper
app.post('/api/plans/:id/itinerary', (req, res) => {
  const planId = parseInt(req.params.id);
  const plans = loadPlans();
  const planIndex = plans.findIndex(p => p.id === planId);
  if (planIndex === -1) return res.status(404).json({ message: "여행 계획을 찾을 수 없습니다." });

  const { day, date, places } = req.body;
  const processedPlaces = (places || []).map(p => ({
    id: p.id || Date.now() + Math.random(),
    time: p.time,
    name: p.name,
    description: p.description || '',
    category: p.category || '관광',
    estimatedCost: Number(p.estimatedCost ?? p.cost) || 0,
    currency: p.currency || plans[planIndex].currency || 'KRW',
    needsReservation: Boolean(p.needsReservation),
    tip: p.tip || '',
    payer: p.payer || '',
    comments: p.comments || []
  }));

  const dayIndex = plans[planIndex].itinerary.findIndex(item => item.day === parseInt(day));
  if (dayIndex === -1) {
    plans[planIndex].itinerary.push({ day: parseInt(day), date, places: processedPlaces });
  } else {
    plans[planIndex].itinerary[dayIndex].places.push(...processedPlaces);
    plans[planIndex].itinerary[dayIndex].places.sort((a, b) => a.time.localeCompare(b.time));
  }

  savePlans(plans);
  res.json(plans[planIndex]);
});

app.get('/health', (req, res) => {
  res.send('Server is healthy');
});

// Serve static frontend files in production (if built)
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
