"use client";
import WorkoutTabs from "./components/WorkoutTabs";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-purple-700 text-white rounded-xl p-8 shadow-lg">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Welcome to FitCoach</h1>
          <p className="text-xl mb-6">
            Your personal training companion. Stay consistent, stay motivated.
          </p>
          <button className="btn btn-accent btn-lg">Get Started</button>
        </div>
      </section>

      {/* Workout Schedule with Day Tabs (and session‑based rotation) */}
      <section>
        <WorkoutTabs />
      </section>
    </div>
  );
}
