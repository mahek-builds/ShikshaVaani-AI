<div align="center">
<img src="https://img.shields.io/badge/ShikshaVaani-AI%20Teaching%20Assistant-1A5276?style=for-the-badge&logo=google-classroom&logoColor=white" alt="ShikshaVaani"/>

# 🎙️ ShikshaVaani AI

### Voice-Enabled AI Teaching Assistant for Indian Government Schools

<br/>

> **ShikshaVaani** — *Shiksha* (Education) + *Vaani* (Voice) — is a hands-free, bilingual AI co-pilot designed for live classroom sessions in Haryana government schools. Teachers speak in natural Hinglish; the system understands, generates, and projects educational content onto the smart board — instantly.

<br/>

[Quick Start](#quick-start) · [Architecture](#core-architecture--innovations) · [API Docs](#api-reference) · [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Core Features](#core-features)
- [Core Architecture & Innovations](#core-architecture--innovations)
- [System Design](#system-design)
- [Folder Structure](#folder-structure)
- [Installation & Operation](#installation--operation)
- [API Reference](#api-reference)
- [Prompt Engineering](#prompt-engineering)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Problem Statement

Government schools across Haryana face a critical pedagogical gap:

| Pain Point | Impact |
|-----------|--------|
| 📚 English textbooks, Hinglish-speaking students | Comprehension gap — students disengage |
| ✍️ Teachers handwrite every explanation | 15–20 min wasted per topic per class |
| 📝 Quiz preparation happens after school hours | No real-time formative assessment |
| 🖥️ Smart boards exist but have no AI software | ₹80,000+ hardware sitting underutilized |
| ⌨️ Every AI tool requires typing | Impossible to use while managing 40+ students |

**ShikshaVaani eliminates all five barriers with a single voice command.**

---

## ✨ Core Features

### 🗣️ Feature 1 — Live Concept Simplification

> *"Explain photosynthesis to class 6 in Hindi"*

- Teacher speaks in natural Hinglish
- System detects topic, grade level, and language preference
- Cohere generates a structured, culturally-relevant explanation (in Hinglish, Hindi, or English)
- Smart board displays: title → paragraph explanation → 5 emoji-tagged visual bullet points → fun fact
- Browser TTS reads the explanation aloud — teacher stays hands-free

### 🧠 Feature 2 — Voice-Triggered Quizzing

> *"Quiz on water cycle class 7"*

- 5 MCQs generated instantly in Hinglish
- Each question displayed fullscreen with A/B/C/D options
- Countdown timer per question (configurable)
- Teacher says *"answer"* to reveal correct answer with explanation
- Teacher says *"next"* to advance to the next question
- Full quiz narrated via Text-to-Speech

---

## 🏗️ Core Architecture & Innovations

### Architectural Philosophy

ShikshaVaani is built on a **three-layer decoupled architecture** optimized for low-bandwidth, voice-first, classroom environments:

```
┌─────────────────────────────────────────────────────────────────┐
│                     VOICE INPUT LAYER                           │
│   Web Speech API (hi-IN)  →  Real-time STT  →  Hinglish Text   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────▼────────────────────────────────────┐
│                   AI PROCESSING LAYER  (FastAPI)                │
│                                                                 │
│   /command  ──►  Intent Router (Cohere)                         │
│       │                   │                                     │
│       ├──► explain  ──►  Concept Simplification Service         │
│       └──► quiz     ──►  MCQ Generation Service                 │
│                                                                 │
│   All services use structured JSON prompts + safe parsing       │
└────────────────────────────┬────────────────────────────────────┘
                             │ JSON Response
┌────────────────────────────▼────────────────────────────────────┐
│                  SMART BOARD DISPLAY LAYER (Next.js)            │
│   ExplainCard  /  QuizDisplay  →  Fullscreen Projection         │
│   Web Speech Synthesis API  →  Voice Narration                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🔑 Key Innovations

#### 1. Hinglish-Native Prompt Engineering

Prompts are engineered specifically for **classroom Hinglish** — a natural Hindi-English code-switch spoken by Indian teachers and students. Prompts enforce:

- Real-life Indian examples (dal-chawal, cricket, autorickshaw)
- Grade-calibrated vocabulary (Class 6 ≠ Class 10 explanation complexity)
- Emoji-tagged visual points for smart board readability

#### 2. Intent-First Architecture

Every voice command passes through a **command detection layer** before reaching feature services. This means:

- A teacher can say anything naturally — the system routes correctly
- No rigid command syntax required
- Extensible: new intents are added as new routes

#### 3. Browser-Native Voice Stack

Uses **Web Speech API** — both Speech-to-Text and Text-to-Speech run directly in the browser via Web Speech API:

- Works offline after initial page load
- Zero latency for voice output

#### 4. Smart Board-First UI Design

Content is designed to be readable from 30 feet at 1080p on a classroom projector.

#### 5. Safe JSON Extraction Pipeline

Responses pass through a `safe_parse_json()` utility that:

- Strips markdown code fences
- Regex-extracts the JSON object
- Raises typed exceptions for debugging
- Never crashes the API — returns structured error responses

---

## 🔧 System Design

### 🏗️ Data Flow & State Synchronization (P2P Local Pub/Sub)

```mermaid
graph TD
    subgraph Client [Browser Client Runtime]
        Teacher[Teacher Dashboard] -- "1. Broadcasts State / Nav Event" --► BC[BroadcastChannel: 'shikshaVaani-board']
        BC -- "2. Syncs Event P2P" --► Board[Smart Board Projection]
        Teacher -- "Web Speech API" --► Speech[Local STT / TTS Processing]
    end

    subgraph Backend [FastAPI Server on Render]
        Teacher -- "3. HTTP POST /command" --► Cmd[Command Router]
        Cmd -- "4. Intent: explain" --► Exp[Explain Service]
        Cmd -- "4. Intent: quiz" --► Quiz[Quiz Service]
    end

    subgraph LLM [AI Engine]
        Exp -- "5. Prompts" --► Cohere[Cohere Command-R+]
        Quiz -- "5. Prompts" --► Cohere
        Cmd -- "5. Intent Extraction" --► Cohere
    end
```

### ⚡ Architectural Decisions & Trade-offs

| Decision | What We Chose | Alternative Considered | Why it is Better for Classrooms |
| :--- | :--- | :--- | :--- |
| **State Sync** | **Local `BroadcastChannel` Pub/Sub** | Stateful WebSockets Server | Zero backend hosting costs, zero database overhead, and sub-millisecond sync latency. |
| **Speech Processing** | **Browser-Native Web Speech API** | Cloud Models (Whisper/TTS) | Bypasses slow school network speeds (saves bandwidth) and runs with zero API billing. |
| **LLM Execution** | **Intent Router -> Sub-services** | Unified Monolithic Prompt | Dramatically increases generation accuracy, saves tokens, and simplifies adding new features. |

### Request Lifecycle

```
Teacher speaks
     │
     ▼
[Browser] Web Speech API captures audio (lang: "hi-IN")
     │
     ▼
[Browser] Transcript → POST /command
     │
     ▼
[FastAPI] command_service.py
     │    Cohere: detect intent + extract (topic, grade, language)
     │    Returns: { intent, topic, grade, language }
     │
     ├─── intent == "explain" ──► POST /explain
     │                                │
     │                           explain_service.py
     │                           Cohere: generate explanation (in Hinglish/Hindi/English)
     │                           Returns: { title, explanation, visual_points, fun_fact }
     │
     └─── intent == "quiz" ───► POST /quiz
                                     │
                                quiz_prompt.py
                                Cohere: generate 5 MCQs as JSON
                                Returns: { quiz_title, questions: [...] }
```

---

## 📁 Folder Structure

```
shikshaVaani/
│
├── backend/                          # FastAPI Application
│   ├── app/
│   │   │
│   │   ├── api/
│   │   │   └── routes.py             # All REST endpoints (/command, /explain, /quiz)
│   │   │
│   │   ├── core/
│   │   │   ├── config.py             # env var settings
│   │   │   └── cohere_client.py      # Cohere client initialization
│   │   │
│   │   ├── schemas/
│   │   │   ├── command.py            # CommandRequest / CommandResponse models
│   │   │   ├── explain.py            # ExplainRequest / ExplainResponse models
│   │   │   └── quiz.py               # QuizRequest models
│   │   │
│   │   ├── services/
│   │   │   ├── command_service.py    # Intent detection logic
│   │   │   ├── explain_service.py    # Concept simplification pipeline
│   │   │   └── quiz_prompt.py        # MCQ generation service
│   │   │
│   │   ├── prompts/
│   │   │   ├── explain_prompt.py     # Concept explanation prompt template
│   │   │   └── quiz_prompt.py        # MCQ generation prompt template
│   │   │
│   │   └── main.py                   # FastAPI app factory + CORS + router mount
│   │
│   ├── requirements.txt              # Python dependencies
│   └── .env.example                  # Template for env vars
│
├── frontend/                         # Next.js Application
│   ├── components/
│   │   ├── VoiceCapture.jsx          # Mic button + Web Speech API hook
│   │   ├── SmartBoardDisplay.jsx     # Fullscreen projection wrapper
│   │   ├── ExplainCard.jsx           # Explanation display component
│   │   └── QuizDisplay.jsx           # MCQ display + timer component
│   │
│   └── app/                          # Next.js App Router
│       ├── page.js                   # Teacher dashboard
│       └── board/
│           └── page.js               # Smart board projection
│
└── README.md                         # This file
```

---

## 🚀 Installation & Operation

### Prerequisites

| Requirement | Version | Check |
|-----------|---------|-------|
| Python | ≥ 3.11 | `python --version` |
| Cohere API Key | Standard Tier OK | [dashboard.cohere.com](https://dashboard.cohere.com/) |

---

### Option A — Local Setup (Recommended)

#### Step 1 — Backend

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set COHERE_API_KEY=your_key_here

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Verify backend:**

```bash
curl http://localhost:8000/
# Interactive API docs: http://localhost:8000/docs
```

---

## 📡 API Reference

### Base URL

```
Development:  http://localhost:8000
```

### Endpoints

#### `POST /command` — Intent Detection

Parses a free-form Hinglish voice command and extracts structured intent.

**Request:**
```json
{
  "text": "Explain photosynthesis to class 6 in Hindi"
}
```

**Response (200 OK):**
```json
{
  "intent": "explain",
  "topic": "photosynthesis",
  "grade": "6",
  "language": "Hindi"
}
```

---

#### `POST /explain` — Live Concept Simplification

Generates a Hinglish explanation optimized for smart board display.

**Request:**
```json
{
  "topic": "Photosynthesis",
  "grade": "6",
  "language": "Hindi"
}
```

**Response (200 OK):**
```json
{
  "title": "Photosynthesis — Suraj se Khana Banana",
  "explanation": "Dekho bhai, jab plant sunlight lete hai, paani aur CO2 se apna khana khud banata hai...",
  "visual_points": [
    "☀️ Sunlight — energy source",
    "💧 Water (H2O) — roots se aata hai",
    "🌿 CO2 — hawa se absorb hoti hai",
    "🍬 Glucose — plant ka khana banta hai",
    "🌬️ O2 — humara oxygen release hota hai"
  ],
  "fun_fact": "Ek ped ek din mein 100 litres paani absorb kar sakta hai!"
}
```

---

#### `POST /quiz` — Voice-Triggered MCQ Generation

Generates a complete quiz set for classroom assessment.

**Request:**
```json
{
  "topic": "Water Cycle",
  "grade": "7",
  "num_questions": 5
}
```

**Response (200 OK):**
```json
{
  "quiz_title": "Water Cycle Quiz — Class 7",
  "questions": [
    {
      "id": 1,
      "question": "Paani ka vapas aasman mein jaana kya kehlata hai?",
      "options": [
        "A. Condensation",
        "B. Evaporation",
        "C. Precipitation",
        "D. Runoff"
      ],
      "answer": "B",
      "explanation": "Evaporation mein paani garam hokar vapour ban jaata hai aur upar chala jaata hai."
    }
  ]
}
```

---

## 🧠 Prompt Engineering

ShikshaVaani's output quality is driven by three carefully engineered prompt templates in `app/prompts/`.

### Explain Prompt (`prompts/explain_prompt.py`)

```
You are ShikshaVaani, an AI teaching assistant for Indian government schools.
A teacher has asked you to explain a concept to Class {grade} students.

Topic: {topic}
Language preference: {language}

STRICT RULES:
1. Write in natural Hinglish — mix Hindi and English the way Indian teachers actually speak.
2. Use real-life Indian examples: dal-chawal, cricket, autorickshaw, mango trees.
3. Keep every sentence under 12 words. Simple vocabulary only.
4. Grade calibration: Class 6 = very simple; Class 10 = slightly technical.
5. Visual points must start with a relevant emoji.
6. Return ONLY valid JSON. No markdown. No preamble.

Required JSON structure:
{
  "title": "topic in Hinglish (max 8 words)",
  "explanation": "3–4 sentence Hinglish explanation",
  "visual_points": ["emoji + point 1", "emoji + point 2", ...],
  "fun_fact": "one surprising, memorable fact"
}
```

### Quiz Prompt (`prompts/quiz_prompt.py`)

```
You are a quiz generator for Indian government school students.

Topic: {topic}
Grade: {grade}
Number of questions: {num_questions}

STRICT RULES:
1. All questions in simple Hinglish.
2. Exactly 4 options per question: A, B, C, D.
3. Only ONE correct answer per question.
4. Explanation must be 1 sentence, in Hinglish.
5. Vary question difficulty: 2 easy, 2 medium, 1 hard.
6. Return ONLY valid JSON.

Required JSON structure:
{
  "quiz_title": "Topic Quiz — Class X",
  "questions": [
    {
      "id": 1,
      "question": "question text in Hinglish",
      "options": ["A. option", "B. option", "C. option", "D. option"],
      "answer": "A",
      "explanation": "one-sentence Hinglish explanation"
    }
  ]
}
```

---

## 🔐 Environment Variables

### Backend — `backend/.env`

```
# ── Required ──────────────────────────────────────────────────────────
COHERE_API_KEY=your_cohere_api_key_here

# ── Application ───────────────────────────────────────────────────────
APP_NAME=ShikshaVaani API
ENVIRONMENT=development          # development | staging | production
LOG_LEVEL=INFO                   # DEBUG | INFO | WARNING | ERROR
```

Get your Cohere API key from: [dashboard.cohere.com](https://dashboard.cohere.com/)

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **LLM** | Cohere | Latest | Text generation, intent detection |
| **Backend** | FastAPI | 0.110+ | Async REST API, auto Swagger docs |
| **Validation** | Pydantic v2 | 2.6+ | Request/response schema enforcement |
| **Server** | Uvicorn | 0.29+ | ASGI server for FastAPI |
| **STT** | Web Speech API | Browser | Hinglish/Hindi speech-to-text (hi-IN) |
| **TTS** | Web Speech Synthesis | Browser | Voice narration |
| **Font** | Noto Sans Devanagari | — | Full Hindi Unicode rendering |

---

## 🗺️ Roadmap

```
v1.0  ✅  Live Concept Simplification + Voice-Triggered Quizzing
v1.1  🔲  Bilingual Dictation & Translation feature
v1.2  🔲  Hands-Free Activity Guide with on-screen timer
v2.0  🔲  Student mobile companion app
v2.1  🔲  Lesson history + teacher progress dashboard
v3.0  🔲  Offline mode with local LLM
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

```bash
# 1. Create your feature branch
git checkout -b feature/new-feature

# 2. Commit your changes
git commit -m "feat: add new feature"

# 3. Push to the branch
git push origin feature/new-feature

# 4. Open a Pull Request
```

Please ensure:
- All new services have corresponding Pydantic schemas
- Prompts are added to `app/prompts/` as separate modules
- Code follows PEP 8 style guide

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Built with ❤️ for India's classrooms**

*ShikshaVaani AI — because every teacher deserves a co-pilot.*

</div>