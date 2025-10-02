# VoiceBot - AI Voice Assistant

A modern Next.js web application that combines voice recognition, AI conversation, and text-to-speech capabilities to create an interactive voice assistant powered by Google Gemini AI.

## 🚀 Features

- 🎤 **Voice Recognition**: Real-time speech-to-text using Web Speech API
- 🤖 **AI Conversations**: Powered by Google Gemini AI with personalized responses
- 🔊 **Text-to-Speech**: Browser-based speech synthesis for AI responses
- 🌙 **Dark Theme**: Professional black gradient design with blue accents
- 💬 **Real-time Chat**: Live transcription and immediate AI responses
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎯 **Smart Controls**: Intuitive microphone button with visual state indicators

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4 with TypeScript
- **Styling**: TailwindCSS
- **AI Integration**: Google Gemini AI API
- **Voice**: Web Speech API (Speech Recognition + Speech Synthesis)
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ installed
- Google Gemini API key ([Get yours here](https://aistudio.google.com/app/apikey))
- Modern web browser (Chrome recommended for best voice recognition support)

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Gemini API

1. Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Update your `.env.local` file:

```env
# Add your Gemini API key here
GEMINI_API_KEY=your_actual_api_key_here

# Next.js configuration
NEXT_PUBLIC_APP_NAME=VoiceBot
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 How to Use

1. **Start the Application**: Open the web app in your browser
2. **Click the Microphone**: Press the microphone button to start voice recognition
3. **Speak Your Question**: Ask any question - the app will transcribe in real-time
4. **Get AI Response**: Receive both text and spoken responses from the AI
5. **Interactive Control**: Click the mic to stop current speech or start new recording

## 🤖 Special Features

The VoiceBot includes predefined responses for specific interview-style questions:

- **Life Story**: Personal background and experiences
- **Superpower**: Core strengths and beliefs
- **Growth Areas**: Areas for personal development
- **Misconceptions**: How others perceive vs. reality
- **Pushing Boundaries**: Approach to personal growth

## 🔊 Voice Features

- **Speech Recognition**: Converts your voice to text in real-time
- **Text-to-Speech**: AI responses are spoken aloud automatically
- **Smart Controls**: Microphone button changes color based on state:
  - 🔵 Blue: Ready to listen
  - 🔴 Red: Currently listening
  - 🟠 Orange: Speaking response

## 📱 Browser Support

- ✅ **Chrome** (Recommended) - Full support
- ✅ **Edge** - Full support
- ✅ **Safari** (macOS/iOS) - Good support
- ❌ **Firefox** - Limited Web Speech API support

## 📁 File Structure

```
src/
├── app/
│   ├── api/gemini/          # Gemini AI API route with advanced model discovery
│   ├── globals.css          # Global styles and dark theme
│   └── page.tsx             # Main page with gradient background
├── components/
│   ├── VoiceBotCard.tsx     # Main chat interface with voice capabilities
│   └── MicrophoneButton.tsx # Interactive voice input button
└── types/
    └── speech.d.ts          # Web Speech API TypeScript definitions
```

## 🚀 Deployment

The app can be deployed to various platforms:

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Deploy the .next folder
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key | Yes |
| `NEXT_PUBLIC_APP_NAME` | Application name | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for AI capabilities
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for voice features
- [Next.js](https://nextjs.org/) for the robust framework
- [TailwindCSS](https://tailwindcss.com/) for styling

---

**Made with ❤️ using Next.js and Google Gemini AI**
