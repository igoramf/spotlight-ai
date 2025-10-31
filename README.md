# 🎯 Spotlight AI - Your Desktop AI Assistant That Sees, Hears, and Searches

<div align="center">
  <img src="app-photo.png" alt="Spotlight AI Desktop Application Interface" width="600" />
</div>

> **The desktop AI companion that can see everything on your screen, hear everything you say, and search the web for you in real-time.**

### **Main Application Controls**
| Shortcut | Action |
|----------|--------|
| `Ctrl + X` | Show/Hide Window |
| `Ctrl + F` | Toggle Input |
| `Ctrl + Shift + F` | Quick Screen Analysis |

### **Navigation & Response Management**
| Shortcut | Action |
|----------|--------|
| `Ctrl + ↑` | Previous Conversation |
| `Ctrl + ↓` | Next Conversation |
| `Ctrl + R` | Clear Response |

### **Window Movement**
| Shortcut | Action |
|----------|--------|
| `Ctrl + ←` | Move Left |
| `Ctrl + →` | Move Right |


## 🎨 Custom Prompt Feature

### **What is a Custom Prompt?**
The custom prompt feature allows you to define personalized instructions that will influence how the AI responds to your questions. This prompt is automatically included in every interaction, allowing you to customize the AI's behavior, tone, and response style according to your preferences.

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
