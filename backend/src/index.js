const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();
const dbService = require('./services/dbService');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Upload Images API
app.post('/api/upload', upload.array('files'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '업로드할 파일이 없습니다.' });
    }
    const filePaths = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ urls: filePaths });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "파일 업로드 중 오류가 발생했습니다." });
  }
});

// Authentication API
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요." });
  }

  try {
    const user = await dbService.authenticateUser(username, password);
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
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Sync Full Plan (convenient offline sync)
app.post('/api/plans/:id/sync', async (req, res) => {
  const planId = parseInt(req.params.id);
  try {
    const plan = await dbService.getPlanById(planId);
    if (plan) {
      // Sync by merging the request body (excluding id to prevent changing it)
      const updatedPlan = { ...plan, ...req.body, id: planId };
      const result = await dbService.syncPlan(planId, updatedPlan);
      res.json(result);
    } else {
      res.status(404).json({ message: "여행 계획을 찾을 수 없습니다." });
    }
  } catch (err) {
    console.error("Sync plan error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Fetch all plans
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await dbService.getPlans();
    res.json(plans);
  } catch (err) {
    console.error("Get plans error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Fetch single plan
app.get('/api/plans/:id', async (req, res) => {
  const planId = parseInt(req.params.id);
  try {
    const plan = await dbService.getPlanById(planId);
    if (!plan) return res.status(404).json({ message: "여행 계획을 찾을 수 없습니다." });
    res.json(plan);
  } catch (err) {
    console.error("Get plan by id error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Create new plan
app.post('/api/plans', async (req, res) => {
  const { title, startDate, endDate, members, manager, currency, accommodation, transportation, isEvent, description } = req.body;
  if (!title || !startDate || !endDate) {
    return res.status(400).json({ message: "제목, 시작일, 종료일은 필수입니다." });
  }
  try {
    const newPlanData = {
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
    const newPlan = await dbService.createPlan(newPlanData);
    res.status(201).json(newPlan);
  } catch (err) {
    console.error("Create plan error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Delete plan or event API
app.delete('/api/plans/:id', async (req, res) => {
  const planId = parseInt(req.params.id);
  try {
    const success = await dbService.deletePlan(planId);
    if (!success) {
      return res.status(404).json({ message: "삭제할 일정을 찾을 수 없습니다." });
    }
    res.json({ message: "일정이 성공적으로 삭제되었습니다." });
  } catch (err) {
    console.error("Delete plan error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Add Place Comment API
app.post('/api/plans/:id/places/:placeId/comments', async (req, res) => {
  const planId = parseInt(req.params.id);
  const placeId = parseInt(req.params.placeId);
  const { author, text } = req.body;

  if (!author || !text) {
    return res.status(400).json({ message: "작성자와 내용이 필요합니다." });
  }

  try {
    const updatedPlan = await dbService.addComment(planId, placeId, author, text);
    if (!updatedPlan) {
      return res.status(404).json({ message: "여행 계획 또는 일정 항목을 찾을 수 없습니다." });
    }
    res.json(updatedPlan);
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Add itinerary place helper
app.post('/api/plans/:id/itinerary', async (req, res) => {
  const planId = parseInt(req.params.id);
  const { day, date, places } = req.body;
  
  try {
    const updatedPlan = await dbService.addPlace(planId, day, date, places);
    if (!updatedPlan) {
      return res.status(404).json({ message: "여행 계획을 찾을 수 없습니다." });
    }
    res.json(updatedPlan);
  } catch (err) {
    console.error("Add place error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Get all anniversaries
app.get('/api/anniversaries', async (req, res) => {
  try {
    const list = await dbService.getAnniversaries();
    res.json(list);
  } catch (err) {
    console.error("Get anniversaries error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Save/update anniversary
app.post('/api/anniversaries', async (req, res) => {
  try {
    const item = await dbService.saveAnniversary(req.body);
    res.json(item);
  } catch (err) {
    console.error("Save anniversary error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Delete anniversary
app.delete('/api/anniversaries/:id', async (req, res) => {
  try {
    await dbService.deleteAnniversary(req.params.id);
    res.json({ message: "기념일이 삭제되었습니다." });
  } catch (err) {
    console.error("Delete anniversary error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Get all trash items
app.get('/api/trash', async (req, res) => {
  try {
    const list = await dbService.getTrash();
    res.json(list);
  } catch (err) {
    console.error("Get trash error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Restore plan from trash
app.post('/api/trash/:id/restore', async (req, res) => {
  try {
    const success = await dbService.restorePlan(req.params.id);
    if (!success) return res.status(404).json({ message: "복구할 일정을 찾을 수 없습니다." });
    res.json({ message: "일정이 복구되었습니다." });
  } catch (err) {
    console.error("Restore plan error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// Delete plan permanently from trash
app.delete('/api/trash/:id', async (req, res) => {
  try {
    const success = await dbService.deletePlanPermanently(req.params.id);
    if (!success) return res.status(404).json({ message: "영구 삭제할 일정을 찾을 수 없습니다." });
    res.json({ message: "일정이 영구 삭제되었습니다." });
  } catch (err) {
    console.error("Delete plan permanently error:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

app.get('/health', (req, res) => {
  res.send('Server is healthy');
});

// Serve static frontend files in production (if built)
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (require('fs').existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
