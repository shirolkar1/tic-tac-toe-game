# 🎮 Tic Tac Toe Game

A modern, responsive Tic Tac Toe game built with vanilla JavaScript, HTML5, and CSS3. Play the classic game with a beautiful interface that works on all devices!

## 🌟 Features

- ✨ **Modern UI** - Beautiful, responsive design
- 📱 **Mobile Friendly** - Works perfectly on phones and tablets
- 🏆 **Score Tracking** - Keep track of wins for both players
- 🎯 **Smart Animations** - Smooth transitions and visual feedback
- 🔄 **Auto Reset** - Games reset automatically after completion
- ⚡ **Fast Performance** - Lightweight vanilla JavaScript
- 🎨 **Accessible** - WCAG compliant design

## 🚀 Quick Start

### Play Online
**[🎮 Play Now](https://your-deployed-url.vercel.app)** (Live Demo)

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tic-tac-toe-game.git
   cd tic-tac-toe-game
   ```

2. Open `src/index.html` in your browser, or:
   ```bash
   npm run serve    # Python server
   npm run dev      # Development server with hot reload
   ```

## 🎯 How to Play

1. **Two Players** - Player X starts first
2. **Click any cell** to place your mark (X or O)
3. **Get three in a row** - horizontally, vertically, or diagonally
4. **Win detection** - Game automatically detects wins and draws
5. **Auto-reset** - New game starts automatically after 3 seconds

## 🛠️ Development

### Project Structure
```
src/
├── index.html          # Main game page
├── css/
│   └── styles.css      # Game styling
├── js/
│   ├── app.js         # Main application
│   ├── game.js        # Core game logic
│   └── ui.js          # User interface
└── manifest.json       # PWA manifest

tests/
└── game.test.js        # Unit tests
```

### Available Scripts
```bash
npm run dev        # Development server
npm run test       # Run tests
npm run build      # Build for production
npm run deploy     # Deploy to production
```

## 🌐 Deployment

Your game is **production-ready**! Deploy to any of these platforms:

### Quick Deploy Options
- **[Vercel](https://vercel.com)** - Drag & drop deployment
- **[Netlify](https://netlify.com)** - Instant static hosting  
- **[GitHub Pages](https://pages.github.com)** - Free GitHub hosting
- **[Surge.sh](https://surge.sh)** - Command-line deployment

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tic-tac-toe-game)

See **[PRODUCTION_READY.md](PRODUCTION_READY.md)** for detailed deployment instructions.

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Tests cover:
- Game initialization
- Move validation
- Win detection
- Game reset functionality

## 📱 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 Customization

Easy to customize:
- **Colors**: Modify CSS variables in `styles.css`
- **Animations**: Adjust CSS transitions and keyframes
- **Game Logic**: Extend the `Game` class in `game.js`
- **UI Components**: Modify the `UI` class in `ui.js`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- Built with vanilla JavaScript for maximum performance
- Responsive design principles
- Accessibility best practices
- Modern web standards

---

**Ready to play?** [🎮 Start Game](src/index.html) or [🚀 Deploy Now](PRODUCTION_READY.md)!