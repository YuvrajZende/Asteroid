# 🚀 Asteroid

Asteroid is an **AI-powered search and research assistant** that combines live web search, news, and research papers with large language models to deliver **contextual, cited, and follow-up aware answers**.

Inspired by tools like **Perplexity**, Asteroid is built from scratch to explore how modern AI search systems actually work under the hood.

---

## ✨ Why Asteroid?

Traditional search engines give you links.  
Chatbots give you answers — but often without grounding.

Asteroid sits in between:
- 🔍 It **searches** real sources (web, news, papers)
- 🧠 It **reasons** over them using LLMs
- 💬 It supports **follow-up questions** in the same context
- 🧵 It keeps each search as a persistent chat thread

---

## 🧠 Core Features

### 🔍 AI Search
- Natural language queries
- Retrieves data from:
  - Web search
  - News sources
  - Research papers
- Synthesizes information into a single coherent answer

---

### 💬 Follow-up Conversations
- Each search creates a **unique chat session**
- Users can ask follow-up questions inside the same chat
- Context is preserved across turns
- Follow-ups are internally rewritten into standalone queries for better retrieval

---

### 🧵 Chat Management
- ChatGPT-style unique chat IDs (random string per search)
- URL-based routing (`/chat/:chatId`)
- Persistent chat history per authenticated user
- Each chat contains:
  - User messages
  - Assistant responses
  - Source metadata

---

### 🔐 Authentication
- Secure authentication using **Clerk**
- User-scoped chat history
- Future-ready for organizations / teams

---

## 🧭 User Flow

1. User logs in via Clerk
2. User submits a query
3. System:
   - Generates a unique `chat_id`
   - Fetches relevant sources
   - Runs AI reasoning
   - Stores messages in the database
4. User asks follow-up questions
5. System:
   - Uses prior context
   - Rewrites follow-up into a full query
   - Re-runs search and reasoning
6. User can revisit previous chats anytime

---

## 🏗 Architecture Overview

### Frontend
- React
- Chat-style UI
- Client-side routing with persistent chat URLs

### Backend (Conceptual)
- AI orchestration layer
- Search + retrieval pipeline
- Query rewriting for follow-ups
- Context management

### Database
- Supabase (PostgreSQL)

### Authentication
- Clerk

---

## 🗃 Data Model (Simplified)

### `chats`
- `id` — unique chat identifier (random string)
- `user_id` — Clerk user ID
- `created_at`

### `messages`
- `id`
- `chat_id` — references chats
- `role` — `user` | `assistant`
- `content`
- `sources` (JSON)
- `created_at`

---

## 🔐 Security & Access Control

- Clerk handles authentication and sessions
- Supabase Row Level Security (RLS) ensures:
  - Users can only access their own chats
- Chat IDs are URL-safe and collision-resistant

---

## 🎯 Product Goals

- Build a real-world AI search system (not a demo)
- Understand follow-up reasoning and query rewriting
- Design scalable chat + retrieval architecture
- Create a strong foundation for future features

---

## Enhancements

- 📌 Improved citation rendering
- 🐐 Support Multiple LLMs
- 📄 Research paper deep-dive mode
- 🧠 Chat summarization
- 🔗 Public shareable chat links
- 📊 Search result clustering
- 🇮🇳 Better regional / contextual news search

---

## 🤝 Contributing

Asteroid is under active development.
---

## 📄 License

MIT License
