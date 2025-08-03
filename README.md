# 🎯 Spotlight AI - Your Desktop AI Assistant That Sees, Hears, and Searches

> **The ultimate desktop AI companion that can see everything on your screen, hear everything you say, and search the web for you in real-time.**

## 🌟 What Makes Spotlight AI Special?

Spotlight AI is a powerful desktop assistant that combines **computer vision**, **real-time speech recognition**, and **web search capabilities** to create an AI that truly understands your context and can help you with anything you're working on.

### 👁️ **Sees Everything You See**
- **Real-time screen capture** and analysis
- **Visual context understanding** - the AI can see your code, documents, images, and any content on your screen
- **Smart screenshot analysis** using advanced vision models
- **Contextual insights** based on what's currently visible

### 🎤 **Hears Everything You Hear**
- **Live speech transcription** with real-time processing
- **System audio capture** - hears both your voice and system sounds
- **Continuous listening** with intelligent noise filtering
- **Multi-language support** for natural conversation

### 🔍 **Searches the Web for You**
- **Contextual search results** based on your current work
- **Smart information retrieval** to enhance responses

## 🚀 Key Features

### **Smart Mode & Search Mode**
- **Smart Mode**: AI analyzes your screen + speech for contextual assistance
- **Search Mode**: Automatically searches the web to enhance responses
- **Dynamic insights**: Real-time analysis of your current context

### **Live Transcription & Analysis**
- **Real-time speech-to-text** with Gemini
- **System audio integration** for complete audio context
- **Continuous conversation** with natural language processing

### **Visual Intelligence**
- **Screen content extraction** and analysis
- **Visual context understanding** using Gemini

### **Web Search Integration**
- **Web search integration** via Serper API
- **Contextual search results** that enhance AI responses

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Desktop**: Electron for cross-platform desktop app
- **AI Models**: 
  - **Vision**: Google Gemini 2.5 Flash/Pro
  - **Language**: Gemini for contextual responses
- **Web Search**: Serper API (Google Search)
- **UI Components**: Radix UI + shadcn/ui

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- **Operating System**: Developed and tested on Ubuntu Linux, but may work on other operating systems
- API keys for:
  - Google Gemini AI
  - OpenAI (for transcription)
  - Serper API (for web search)

### System Requirements
- **Primary Development Environment**: Ubuntu 24.04.2 LTS
- **Kernel**: Linux 6.8.0-71-generic
- **Architecture**: x86_64
- **Compatibility**: May work on other Linux distributions, Windows and Mac

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/spotlight-ai.git
cd spotlight-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SERPER_API_KEY=your_serper_api_key
```

## 🎯 Usage

### **Starting a Session**
1. Launch Spotlight AI
2. Click the microphone button to start recording
3. The AI will begin listening and seeing your screen
4. Ask questions naturally - the AI understands your context

### **Smart Interactions**
- **"What am I working on?"** - AI analyzes your screen and speech
- **"Help me with this code"** - AI sees your code and provides assistance
- **"Search for the latest React updates"** - AI searches the web for you
- **"Explain what's on my screen"** - AI describes what it sees

### **Modes**
- **Smart Mode**: AI analyzes everything for contextual help
- **Search Mode**: AI searches the web to enhance responses
- **Chat Mode**: Direct conversation with the AI

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both React and Electron
npm run dev:react        # Start React dev server only
npm run dev:electron     # Start Electron only

# Building
npm run build           # Build for production
npm run build:dev       # Build for development

# Distribution
npm run dist:mac        # Build for macOS
npm run dist:win        # Build for Windows
npm run dist:linux      # Build for Linux

# Linting
npm run lint            # Run ESLint
```

---

**Spotlight AI** - Your intelligent desktop companion that sees, hears, and searches everything for you. 🚀