# 🌾 CocoNoteCC - Farm Management PWA

A modern, feature-rich Progressive Web App for managing farms in Coimbatore, Tamil Nadu. Track your farm's layout, plants, livestock, finances, and more!

## 🚀 Tech Stack

### Frontend
- **Vite** - Lightning-fast build tool
- **React 18** + **TypeScript** - Type-safe UI development
- **Tailwind CSS 3** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **PWA** - Installable, works offline

### Backend (Coming Soon)
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **Azure** - Cloud hosting

## ✨ Features

### ✅ Implemented
- **PWA Capabilities** - Install on mobile/desktop, works offline
- **Auto Theme** - Automatically switches between light/dark mode based on system preference
- **Header Navigation** - Search, notifications, user menu
- **Multi-step Farm Creation**
  - Basic info (name, description)
  - Location & area (coordinates, acres)
  - FMB sketch upload with preview
  - Farm details (fencing, entry, road borders)
  - Farming type & soil type selection
- **Farm List View** - View all your farms
- **Finance Dashboard** - Track expenses, income, profit
- **Responsive Design** - Works on all devices

### 🚧 Coming Soon
- Interactive boundary tracing on FMB sketches
- Buildings configuration (houses, sheds, storage)
- Plants & trees configuration (rows, columns, spacing, layers)
- Top-down drone view of farm (RPG-style rendering)
- 4 farm modes: View, Edit, Pipeline, Livestock
- Multilayer farming visualization
- TNGIS API integration for maps
- Market updates & weather forecasts
- Calendar & task management
- User authentication (login/register)

## 🛠️ Installation

### Prerequisites
- **Node.js** v18+ ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd coconote
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.

## 📁 Project Structure

```
coconote/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Header.tsx   # App header with search, notifications
│   │   └── FormSteps.tsx # Multi-step form progress indicator
│   ├── pages/           # Page components
│   │   ├── Home.tsx     # Farm selection page
│   │   ├── FarmCreate.tsx # Farm creation wizard
│   │   ├── FarmView.tsx # Farm visualization
│   │   ├── Finance.tsx  # Finance tracking
│   │   ├── Market.tsx   # Market updates
│   │   ├── News.tsx     # Weather & news
│   │   └── Calendar.tsx # Task calendar
│   ├── stores/          # Zustand state management
│   │   ├── farmStore.ts # Farm data & state
│   │   ├── userStore.ts # User data & auth
│   │   ├── financeStore.ts # Financial data
│   │   └── themeStore.ts # Theme preferences
│   ├── types/           # TypeScript type definitions
│   │   ├── farm.types.ts # Farm-related types
│   │   └── user.types.ts # User-related types
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # App entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── vite.config.ts       # Vite configuration
├── tailwind.config.ts   # Tailwind configuration
└── package.json         # Dependencies

```

## 🎨 Design Philosophy

- **Soft Colors** - Uses frost, pearl, cream tones instead of harsh white
- **Smooth Animations** - Framer Motion for delightful interactions
- **Modern UI** - Clean, intuitive interface
- **Accessibility** - Dark mode support, responsive design
- **Performance** - Fast load times, offline capability

## 🧩 Key Concepts (For Beginners)

- **PWA** = Progressive Web App - Works like a native app on phones
- **TypeScript** = JavaScript with type checking to prevent bugs
- **Zustand** = State management - Where app remembers data
- **Tailwind CSS** = Utility classes for styling (e.g., `bg-blue-500`)
- **Framer Motion** = Animation library for smooth transitions
- **Vite** = Build tool that makes development super fast

## 📝 Usage

### Creating a Farm

1. Click the **+ button** in the header or **"Add Farm"** on home page
2. Follow the 8-step wizard:
   - Enter farm name & description
   - Add location coordinates & area in acres
   - Upload FMB sketch (or download from TN eServices)
   - Configure entry, fencing, road borders
   - Select farming type & soil
   - (More steps coming soon!)
3. Click **"Create Farm"** to save

### Viewing Farms

- All your farms appear as cards on the home page
- Click a farm card to view details
- Switch between different farm modes (coming soon)

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

This is a personal project for Coimbatore farmers. Contributions welcome!

## 📄 License

MIT License - feel free to use for your own farm!

## 🐛 Issues

If you encounter any problems:
1. Make sure Node.js v18+ is installed
2. Delete `node_modules` folder and run `npm install` again
3. Clear browser cache
4. Check console for errors (F12 in browser)

## 🎯 Roadmap

- [ ] Boundary tracing tool
- [ ] Building placement & configuration
- [ ] Plant/tree grid calculator
- [ ] Top-down farm renderer
- [ ] TNGIS map integration
- [ ] Backend API (FastAPI)
- [ ] User authentication
- [ ] Market price integration
- [ ] Weather API integration
- [ ] Mobile app versions (iOS/Android)

---

**Built with ❤️ for farmers in Coimbatore, Tamil Nadu**
