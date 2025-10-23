# 🧠 Therapy Bro

**Therapy Bro** is your personal AI therapist — a conversational agent designed to help you navigate problems, emotions, and everyday situations using intelligent, empathetic dialogue powered by multiple AI providers. It provides supportive, judgment-free conversations to promote mental clarity and emotional well-being.

**Therapy Bro** is a web application that combines a FastAPI backend and a modern frontend (npm) to provide AI-driven therapeutic chat experiences using OpenAI, Anthropic Claude, or Together AI open-source models.

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

#### Configure AI Provider
Create a .env file in the backend/app/ directory. You can use the provided `env.example` as a template:

```bash
cp backend/app/env.example backend/app/.env
```

**Choose your AI provider and configure accordingly:**

**Option 1: OpenAI**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
```

**Option 2: Anthropic Claude**
```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

**Option 3: Together AI (Open-Source Models)**
```bash
LLM_PROVIDER=together
TOGETHER_API_KEY=your_together_api_key_here
TOGETHER_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo
```

**Popular Together AI Models:**
- `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` (recommended)
- `meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo` (faster, smaller)
- `mistralai/Mixtral-8x7B-Instruct-v0.1`
- `Qwen/Qwen2.5-72B-Instruct-Turbo`
- `NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO`

Replace the API keys with your actual credentials from the respective providers.

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

---

## 🤖 AI Provider Options

Therapy Bro supports three AI providers, each with different strengths:

### OpenAI
- **Models**: GPT-4o, GPT-4o-mini, GPT-3.5-turbo
- **Best for**: General conversation, creative responses
- **Cost**: Pay-per-token pricing

### Anthropic Claude
- **Models**: Claude-3.5-Sonnet, Claude-3-Haiku, Claude-3-Opus
- **Best for**: Detailed analysis, reasoning, safety-focused conversations
- **Cost**: Pay-per-token pricing

### Together AI (Open-Source Models)
- **Models**: Llama, Mistral, Qwen, and many others
- **Best for**: Cost-effective alternatives, open-source transparency
- **Cost**: Often more affordable than proprietary models
- **Models Available**: 100+ open-source models from various providers

### Switching Providers
To switch between providers, simply update your `.env` file:
1. Change `LLM_PROVIDER` to `openai`, `anthropic`, or `together`
2. Update the corresponding API key and model name
3. Restart the FastAPI server

---

## 🔧 Advanced Configuration

### Environment Variables
See `backend/app/env.example` for all available configuration options including:
- Model-specific parameters (temperature, max tokens)
- Frontend origin settings
- Database configuration

### Backend Architecture & Docs
See `backend/app/README.md` for detailed backend architecture, directory layout, database pooling configuration, and development guidelines.

### Custom Models
With Together AI, you can use any model from their catalog. Check their [model list](https://docs.together.ai/docs/inference-models) for the latest available models.
