# 🧠 Therapy Bro

**Therapy Bro** is a web application that combines a FastAPI backend and a modern frontend (npm) to provide AI-driven therapeutic chat experiences using OpenAI's API.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/abhisamaya/therapy-bro.git
cd therapy-bro
```

### 2. Set Up Python Backend (FastAPI)
Create and activate a conda environment:
```bash
conda create --name tb_env python=3.11.13
conda activate tb_env
```

Install dependencies:
```bash
pip install -r backend/app/requirements.txt
```

#### Add your OpenAI credentials
Create a .env file in the backend/ directory with the following content:
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Replace sk-proj-... with your actual OpenAI API key.

#### Run the FastAPI server:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Access the API docs at:
👉 http://127.0.0.1:8000/docs

### 3. Set Up Frontend (npm)
```bash
cd ../frontend
npm install
npm run dev
```
The frontend will run at:
👉 http://localhost:3000/
