# 🚀 Deploy to GitHub Pages

## Quick Setup (5 minutes)

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click **"New repository"** (green button)
3. Name it: `tic-tac-toe-game` (or any name you prefer)
4. Make it **Public** (required for free GitHub Pages)
5. ✅ **Don't** initialize with README (we already have files)
6. Click **"Create repository"**

### Step 2: Upload Your Code
You have two options:

#### Option A: Command Line (if you have Git)
```bash
cd "/Users/alokeshirolkar/Library/CloudStorage/GoogleDrive-alokeshirolkar@gmail.com/My Drive/Games/tic-tac-toe-game/tic-tac-toe-game"
git add .
git commit -m "Initial commit: Tic Tac Toe game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tic-tac-toe-game.git
git push -u origin main
```

#### Option B: Upload via GitHub Web Interface
1. In your new repository, click **"uploading an existing file"**
2. Drag and drop ALL files from your project folder
3. Write commit message: "Initial commit: Tic Tac Toe game"
4. Click **"Commit changes"**

### Step 3: Enable GitHub Pages
1. In your repository, go to **Settings** tab
2. Scroll down to **"Pages"** in the left sidebar
3. Under **"Source"**, select: **"GitHub Actions"**
4. Click **"Save"**

### Step 4: Your Game is Live! 🎉
- GitHub will automatically deploy your game
- Your live URL will be: `https://YOUR_USERNAME.github.io/tic-tac-toe-game`
- Deployment takes 2-3 minutes

## 🔄 Automatic Updates

Every time you push changes to your repository:
- GitHub Actions automatically rebuilds your site
- Your live game updates within minutes
- No manual deployment needed!

## 📁 File Structure for GitHub Pages

Your repository structure:
```
tic-tac-toe-game/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Auto-deployment workflow
├── src/                      # Your game files (deployed to web)
│   ├── index.html
│   ├── css/styles.css
│   ├── js/
│   └── manifest.json
├── package.json
├── README.md
└── .gitignore
```

## 🌟 Features You Get

✅ **Free Hosting** - Forever free for public repos  
✅ **Custom Domain** - Add your own domain later  
✅ **HTTPS** - Automatic SSL certificate  
✅ **Global CDN** - Fast loading worldwide  
✅ **Auto Deploy** - Updates on every push  
✅ **Version History** - Full Git history  

## 🛠️ Troubleshooting

**Game not loading?**
- Check that your repository is public
- Verify GitHub Pages is enabled in Settings
- Wait 5-10 minutes for initial deployment

**Want to update the game?**
- Edit files directly on GitHub, or
- Clone repository, make changes, and push

## 🎯 Next Steps

1. **Custom Domain** (optional): Add your own domain in Pages settings
2. **Analytics**: Add Google Analytics to track visitors
3. **Updates**: Keep improving your game and push updates
4. **Share**: Share your live URL with friends!

## 📞 Need Help?

If you run into issues:
1. Check the **Actions** tab in your repository for deployment status
2. Ensure all files are in the `src` folder
3. Make sure the repository is public

---

**Your game will be live at: `https://YOUR_USERNAME.github.io/tic-tac-toe-game`** 🚀