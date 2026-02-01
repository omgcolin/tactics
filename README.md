# Tactics

A complete React-based tactics game built with TypeScript, featuring level progression, music system, and persistent save states. Play now at: https://tacticsfinal.netlify.app/

## 🎮 Game Features

### Core Gameplay
- **3 Progressive Levels**: Forest Ambush → Mountain Pass → The Crossfire
- **Level Unlocking System**: Complete levels to unlock the next challenge
- **Victory/Defeat Screens**: With proper progression and retry options
- **Safe Spawn System**: Prevents spawning directly on level entrances

### Audio & Music
- **Dynamic Music System**: Overworld and level-specific tracks
- **Volume Control**: Adjustable music volume with slider
- **Audio Enable/Disable**: User choice on game start
- **Sound Effects**: Sword slashes and shield bashes with directional animations

### Technical Implementation
- **React + TypeScript**: Modern frontend development
- **Vite Build Tool**: Fast development and optimized builds
- **Tailwind CSS**: Utility-first styling
- **localStorage Save System**: Persistent game state
- **Netlify Deployment**: Automated CI/CD pipeline

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API
- **Deployment**: Netlify
- **Version Control**: Git

## 🎯 Level Progression

### Level 1: Forest Ambush
- Learn basic movement and combat mechanics
- Understand enemy positioning
- Master directional attacks

### Level 2: Mountain Pass  
- Advanced terrain navigation
- Strategic positioning
- Resource management

### Level 3: The Crossfire
- Complex multi-directional threats
- Tactical decision making
- Final challenge combining all learned skills

## 🎵 Audio System

The game features a comprehensive audio system:
- **Overworld Music**: Ambient background music
- **Level-specific Music**: Thematic tracks for each level
- **Sound Effects**: Combat audio with directional awareness
- **Volume Control**: User-adjustable audio levels
- **Browser Compatibility**: Handles modern autoplay restrictions

## 💾 Save System

- **Persistent Progress**: Save states maintained between sessions
- **Version Control**: Automatic save migration for updates
- **Level Unlocks**: Progress tracking across game sessions
- **Hero Position**: Remember player location in overworld

## 🚀 Deployment

Built with modern web technologies and deployed via Netlify:
- **Static Site Generation**: Fast loading times
- **Global CDN**: Worldwide accessibility
- **Automated Builds**: CI/CD pipeline
- **Versioned Deploys**: Rollback capabilities

## 🎨 Visual Design

- **Sprite-based Graphics**: Character sprites and level maps
- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Clean, intuitive interface
- **Visual Feedback**: Clear indicators for game state

## 📱 Controls

- **Movement**: Arrow keys or WASD
- **Combat**: Mouse clicks for directional attacks
- **Navigation**: Click on levels to enter
- **Audio**: Volume slider and enable/disable buttons

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── data/               # Game data and level configurations
└── App.tsx            # Main application component

public/
├── audio/             # Music and sound files
├── knight_sprite.png  # Character sprite
├── overworld_map.png  # Game map
└── sunny_forest.png   # Level background
```

### Build Commands
```bash
npm run build      # Production build
npm run dev        # Development server
npm run preview     # Preview production build
```

## 🎯 Portfolio Value

This project demonstrates:
- **Full-stack web development** capabilities
- **Game development** expertise
- **Audio integration** and user experience
- **State management** and persistence
- **Modern React patterns** and TypeScript
- **CI/CD deployment** workflows
- **Responsive design** principles

## 📝 License

This project is open source and available under the MIT License.

---

**Built with ❤️ using React, TypeScript, and modern web technologies**
