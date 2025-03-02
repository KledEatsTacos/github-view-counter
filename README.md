# GitHub Profile View Counter

A simple, efficient view counter for GitHub profiles that excludes your own views. This counter tracks unique visits by IP address and prevents counting repeated views from the same source for 30 minutes.

## Features

- 📊 Tracks views to your GitHub profile
- 🚫 Excludes self-views using IP tracking to not inflate the counter
- 🔄 Uses local persistence to store view counts
- 🖼️ Generates a clean SVG badge to display your view count
- 🕒 Automatically resets IP tracking after 30 minutes

## Installation

Run these commands in your terminal:

1. Clone this repository:
```bash
git clone https://github.com/KledEatsTacos/view-counter.git
cd view-counter
```

2. Install dependencies:
```bash
npm install
```

3. Run the server:
```bash
npm start
```

## Usage

The counter works by adding two image references to your GitHub profile README.md:

### 1. Invisible Counter (tracks views)

```markdown
![](https://your-deployed-url.com/count)
```

### 2. Badge (displays count)

```markdown
![Profile views](https://your-deployed-url.com/badge)
```

## Deployment

You can deploy this application to platforms like:

- Vercel (recommended for easy setup)
- Heroku
- Render
- Railway
- Fly.io

After deployment, replace `your-deployed-url.com` with your actual domain in the usage examples.

## How It Works

- When someone visits your GitHub profile, the `/count` endpoint is called invisibly
- The server checks if the visitor's IP has been seen in the last 30 minutes
- If not, it increments the counter and records the IP with a timestamp
- The `/badge` endpoint generates an SVG showing the current count
- IP addresses are automatically cleared after 30 minutes

## License

MIT
