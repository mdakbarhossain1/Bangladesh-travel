# Bangladesh Travel Explorer

A simple HTML, CSS, and JavaScript frontend project using the generated `data.json` dataset.

## Files
- `index.html` - app layout
- `style.css` - styles
- `app.js` - filtering and rendering logic
- `data.json` - full 140 destination dataset

## Run locally
Because browsers often block `fetch()` from local files, run a local server.

### Option 1: Python
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`

### Option 2: VS Code Live Server
Open the folder and run Live Server.

## Features
- search by destination, district, division, category
- filter by category and division
- sort by name, rating, and budget
- destination cards with route, budget, best time, highlights, and tips
