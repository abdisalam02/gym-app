# MyGym - Fitness Tracking Application

A modern, responsive web application for tracking workouts, exercises, body measurements, and fitness progress.

## Features

### Dashboard
- Overview of recent workouts and progress
- Workout streak tracking
- Personal records display
- Body stats visualization
- Upcoming workout schedule

### Workouts
- Create and manage workout plans
- Track workout history
- Log completed workouts
- Plan future workouts with the workout planner
- Add images to workout plans using Google image search

### Exercises
- Browse and search exercise library
- Filter exercises by muscle group
- Create custom exercises
- Add images to exercises using Google image search
- Track exercise history and progress

### Measurements
- Log and track body measurements
- Visualize progress with charts
- Set measurement goals

## Technical Stack

- **Frontend**: Next.js 13.4+ (App Router), React, TypeScript
- **Styling**: Tailwind CSS, DaisyUI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Image Search**: Google Custom Search API
- **Charts**: Chart.js with React-Chartjs-2

## Setup Instructions

### Prerequisites
- Node.js 16.8 or later
- npm or yarn
- Supabase account
- Google Custom Search API key

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Custom Search API
NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY=your_google_api_key
NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

### Google Custom Search API Setup

1. Create a Google Cloud project at [console.cloud.google.com](https://console.cloud.google.com/)
2. Enable the Custom Search API
3. Create API credentials (API Key)
4. Create a Programmable Search Engine at [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)
5. Configure your search engine to search the entire web
6. Enable image search in your search engine settings
7. Copy your Search Engine ID and API Key to your environment variables

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gym-app.git
cd gym-app

# Install dependencies
npm install

# Run the development server
npm run dev
```

## Database Schema

The application uses the following main tables in Supabase:

- **workout_plans**: Stores workout plan details
- **workout_days**: Stores individual workout days within a plan
- **exercises**: Stores exercise information
- **workout_exercises**: Links exercises to workout days with sets/reps
- **workout_logs**: Records completed workouts
- **exercise_logs**: Records completed exercises within workouts
- **measurements**: Stores body measurement data

## Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop screens
- Tablets
- Mobile devices

## Color Scheme

The application uses a calming color scheme:
- Slate colors (slate-600, slate-700, slate-800) for backgrounds
- Teal (teal-600, teal-700) for primary buttons and accents
- Amber for highlights and streaks
- White for headings and slate-300/400 for secondary text

## License

MIT License
