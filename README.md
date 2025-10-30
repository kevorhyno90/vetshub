# Vetshub 🐄

A comprehensive farm management system centralizes data and automates operations to optimize production, increase profitability, and promote sustainability. These digital platforms go beyond simple record-keeping to provide farmers with a holistic, data-driven view of their entire business.

## Progressive Web App (PWA)

Vetshub is built as a Progressive Web App, which means it can be installed on any device and works offline!

### Features

✅ **Installable** - Add to your home screen on mobile or desktop  
✅ **Offline Support** - Works without an internet connection  
✅ **Responsive Design** - Optimized for all screen sizes  
✅ **Fast Loading** - Cached resources for quick access  
✅ **Cross-Platform** - Works on iOS, Android, Windows, Mac, and Linux  

### How to Use

1. **Visit the website** - Open `index.html` in your web browser
2. **Install the app** - Click the "Install App" button when it appears, or use your browser's install option
3. **Use offline** - Once installed, the app will work even without internet connection

### How to Run Locally

```bash
# Clone the repository
git clone https://github.com/kevorhyno90/vetshub.git
cd vetshub

# Start a local web server
python3 -m http.server 8080

# Open in your browser
# Visit http://localhost:8080
```

### PWA Files

- `index.html` - Main application page
- `manifest.json` - PWA configuration file
- `service-worker.js` - Service worker for offline functionality
- `icons/` - App icons for different sizes

### Browser Support

The PWA works in all modern browsers that support Service Workers:
- Chrome/Edge 40+
- Firefox 44+
- Safari 11.1+
- Opera 27+

### Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Service Worker API
- Web App Manifest
