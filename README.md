# 🎯 Spotlight AI - Your Desktop AI Assistant That Sees, Hears, and Searches

<div align="center">
  <img src="app-photo.png" alt="Spotlight AI Desktop Application Interface" width="600" />
</div>

> **The desktop AI companion that can see everything on your screen, hear everything you say, and search the web for you in real-time.**

## 🌟 What Makes Spotlight AI Special?

Spotlight AI is a  desktop assistant that combines **computer vision**, **real-time speech recognition**, and **web search capabilities** to create an AI that truly understands your context and can help you with anything you're working on.

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

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API keys for:
  - Google Gemini AI
  - Serper API (for web search)

### System Requirements
- **Primary Development Environment**: Ubuntu 24.04.2 LTS
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
