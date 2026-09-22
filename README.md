# 🌉 Skill Bridge Ethiopia — Advanced LMS

A full-stack, mentor-guided Learning Management System built with React + Tailwind (frontend) and Node.js + Express + MongoDB (backend).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Setup Backend
```bash
cd server
npm install
# Edit .env and set your MONGO_URI
npm run seed        # Creates default admin account
npm run dev         # Starts on http://localhost:5000
```

### 2. Setup Frontend
```bash
cd client
npm install
npm run dev         # Starts on http://localhost:5173
```

### Default Admin Credentials
- **Email**: `admin@skillbridge.et`
- **Password**: `Admin@123`

---

## 👥 Roles

| Role | Auto-Approved | Description |
|---|---|---|
| Student | ✅ Yes | Learn from mentors |
| Mentor | ❌ Admin approval | Create courses, guide students |
| Employer | ❌ Admin approval | Browse certified students |
| Admin | Created manually | Full platform control |

## 🔄 Enrollment Flow
1. Student browses approved courses
2. Student requests a mentor
3. Mentor accepts → Enrollment created
4. Student unlocks full course content

## 🏆 Certificate Flow
1. Student completes all modules
2. Student passes the final test (≥70%)
3. Student requests certificate
4. Mentor approves → Certificate issued
5. Badge auto-assigned

## 📁 Project Structure
```
Finaly_year_Project/
├── server/      # Node.js + Express + MongoDB
└── client/      # React + Tailwind CSS
```

## 🔐 API Base URL
`http://localhost:5000/api`
