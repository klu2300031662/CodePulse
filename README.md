# CodePulse SaaS App

The Ultimate Developer Analytics Platform. Consolidate your LeetCode, HackerRank, Codeforces, and GeeksForGeeks profiles. Track your problem-solving statistics, run code dynamically, and prepare for top tech company interviews.

## Features Built
- **JWT Authentication** (Login/Register)
- **Developer Dashboard** with statistics, heatmaps, and platform distribution charts
- **Problem Tracker** (CRUD tables with Shadcn UI)
- **Interactive Terminal** (Monaco Editor with secure Java/Python/JS/C++ code execution)
- **Platform Platforms UI** to connect varying accounts
- **Company Preparation** mocked data module
- **Global Leaderboard** mocked data module
- **Developer Profiles** for public sharing
- **Beautiful Landing Page** featuring testimonials and application preview

## Tech Stack
### Frontend
- Next.js 14, React, Tailwind CSS
- Shadcn UI, Lucide Icons, Recharts, React-Tooltip
- Monaco Editor React
- Axios API Client

### Backend
- Spring Boot 3.3.0, Java 17
- Spring Security (JWT)
- Spring Data JPA, Hibernate
- PostgreSQL integration

## Running the Application Locally

### 1. Database Setup
Make sure you have Docker installed and running.
```bash
docker-compose up -d
```
This sets up a PostgreSQL instance on port 5432 with db `codepulsedb`, user `codepulse`, password `password`.

### 2. Run Backend (Spring Boot)
Navigate to the `backend` folder and run the Maven application:
```bash
cd backend
./mvnw spring-boot:run
```
*(On Windows, use `mvnw.cmd spring-boot:run`)*

The backend will be accessible at `http://localhost:8080`.

### 3. Run Frontend (Next.js)
Navigate to the `frontend` directory in a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

The frontend will be accessible at `http://localhost:3000`.

## Features Tour
1. Navigate to `http://localhost:3000` to view the beautiful Landing Page.
2. Click **Get Started** or **Sign In**. Add a new user.
3. Once dashboard is loaded, check out the activity heatmap.
4. Navigate to **Problems Tracker** in the sidebar to manually log a LeetCode problem.
5. Navigate to **Interactive Terminal** to write and test Python, Java, JS or C++ code against your local machine.

---

*Note: As this is a prototype, external platform scraping logic is abstracted and Global Leaderboard data is presented as a mock.*
