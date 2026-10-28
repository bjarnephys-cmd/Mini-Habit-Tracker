import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK on the server side
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Candidate models in order of preference
const MODEL_CANDIDATES = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

function runWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Intelligent local fallback when upstream API undergoes temporary load spikes
 */
function generateSmartFallback(prompt: string) {
  const p = prompt.toLowerCase();

  if (p.includes('water') || p.includes('drink') || p.includes('hydrat')) {
    return {
      summary: 'Configured daily hydration habit and 4 scheduled water drinking reminders.',
      motivationalTip: 'Consistent hydration throughout the day sustains cellular energy, mental focus, and muscle recovery.',
      suggestedHabits: [
        {
          name: 'Daily Hydration Goal',
          category: 'water',
          targetValue: 2000,
          unit: 'ml',
          icon: 'droplets',
        },
      ],
      suggestedExercises: [],
      suggestedReminders: [
        {
          title: 'Morning Water Glass (250ml)',
          description: 'Start your morning with a fresh glass of water to kickstart metabolism.',
          category: 'water',
          time: '09:00',
          leadTimeMinutes: 5,
          dayOffset: 0,
          repeatDaily: true,
        },
        {
          title: 'Midday Hydration Refill',
          description: 'Drink a glass of water before lunchtime.',
          category: 'water',
          time: '12:30',
          leadTimeMinutes: 10,
          dayOffset: 0,
          repeatDaily: true,
        },
        {
          title: 'Afternoon Energy Water Break',
          description: 'Beat the afternoon slump with a cold glass of water and a quick stretch.',
          category: 'water',
          time: '15:30',
          leadTimeMinutes: 10,
          dayOffset: 0,
          repeatDaily: true,
        },
        {
          title: 'Evening Hydration Check',
          description: 'Ensure your 2000ml daily target is met before dinner.',
          category: 'water',
          time: '18:30',
          leadTimeMinutes: 15,
          dayOffset: 0,
          repeatDaily: true,
        },
      ],
    };
  }

  if (p.includes('run') || p.includes('jog') || p.includes('cardio') || p.includes('workout') || p.includes('exercise')) {
    return {
      summary: 'Scheduled 3 cardio and running sessions for next week with 15-min preparation reminders.',
      motivationalTip: 'Spacing workouts with rest days prevents fatigue and steadily builds cardiovascular stamina.',
      suggestedHabits: [
        {
          name: 'Cardio & Running Streak',
          category: 'exercise',
          targetValue: 30,
          unit: 'mins',
          icon: 'dumbbell',
        },
      ],
      suggestedExercises: [
        {
          title: '5km Steady Tempo Run',
          type: 'running',
          targetDurationMin: 35,
          plannedTime: '07:30',
          dayOffset: 1,
          intensity: 'moderate',
          notes: 'Warm up 5 min, steady rhythmic pace.',
        },
        {
          title: 'Interval Sprint Workout',
          type: 'running',
          targetDurationMin: 30,
          plannedTime: '07:30',
          dayOffset: 3,
          intensity: 'intense',
          notes: '400m intervals x 5 with 1-min walking recovery.',
        },
        {
          title: 'Weekend Long Distance Run',
          type: 'running',
          targetDurationMin: 50,
          plannedTime: '08:30',
          dayOffset: 5,
          intensity: 'moderate',
          notes: 'Hydrate well and keep a conversational pace.',
        },
      ],
      suggestedReminders: [
        {
          title: 'Upcoming Workout: 5km Steady Tempo Run',
          description: 'Lace up running shoes, drink water, and do dynamic stretches.',
          category: 'exercise',
          time: '07:30',
          leadTimeMinutes: 15,
          dayOffset: 1,
          repeatDaily: false,
        },
        {
          title: 'Upcoming Workout: Interval Sprint Workout',
          description: 'Prep track gear and hydrate.',
          category: 'exercise',
          time: '07:30',
          leadTimeMinutes: 15,
          dayOffset: 3,
          repeatDaily: false,
        },
        {
          title: 'Upcoming Workout: Weekend Long Run',
          description: 'Fuel with a light snack and check running weather.',
          category: 'exercise',
          time: '08:30',
          leadTimeMinutes: 30,
          dayOffset: 5,
          repeatDaily: false,
        },
      ],
    };
  }

  if (p.includes('sleep') || p.includes('bed') || p.includes('rest')) {
    return {
      summary: 'Created restful sleep routine with 30-minute digital sunset wind-down reminders.',
      motivationalTip: 'Lowering bedroom light and avoiding screens 30 minutes before sleep optimizes melatonin production.',
      suggestedHabits: [
        {
          name: '8h Restful Sleep',
          category: 'sleep',
          targetValue: 8,
          unit: 'hours',
          icon: 'moon',
        },
      ],
      suggestedExercises: [],
      suggestedReminders: [
        {
          title: 'Bedtime Wind-down & Digital Sunset',
          description: 'Turn off screens, lower lighting, and start relaxing for a solid 8 hours of sleep.',
          category: 'sleep',
          time: '22:30',
          leadTimeMinutes: 30,
          dayOffset: 0,
          repeatDaily: true,
        },
      ],
    };
  }

  // General healthy habit template
  return {
    summary: `Created custom routine: "${prompt.slice(0, 40)}" with scheduled alerts.`,
    motivationalTip: 'Small, daily actions compounded over 14 days build lasting neurological pathways for success.',
    suggestedHabits: [
      {
        name: prompt.length > 25 ? `${prompt.slice(0, 25)}...` : prompt,
        category: 'custom',
        targetValue: 1,
        unit: 'times',
        icon: 'sparkles',
      },
    ],
    suggestedExercises: [],
    suggestedReminders: [
      {
        title: `Reminder: ${prompt.length > 35 ? `${prompt.slice(0, 35)}...` : prompt}`,
        description: 'Take a brief moment to complete your habit and stay on streak.',
        category: 'habit',
        time: '15:00',
        leadTimeMinutes: 15,
        dayOffset: 0,
        repeatDaily: true,
      },
    ],
  };
}

/**
 * Endpoint: POST /api/ai/parse-habit-intent
 * Parses natural language input (e.g. "Remind me to drink water daily", "Plan 3 morning runs next week and remind me 15m before")
 * and returns structured habits, exercises, and reminders.
 */
app.post('/api/ai/parse-habit-intent', async (req: Request, res: Response) => {
  const { prompt, currentHabits, todayDate } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'A prompt string is required.' });
    return;
  }

  if (!apiKey) {
    // If no API key configured, use high-quality smart generator
    const fallbackData = generateSmartFallback(prompt);
    res.json({ success: true, data: fallbackData });
    return;
  }

  const systemInstruction = `You are HabitFlow AI, an intelligent wellness and habit scheduling assistant.
Your job is to analyze user requests (such as "Remind me to drink water daily", "Plan 3 runs next week and remind me 30 min before", "Help me build a sleep routine")
and turn them into concrete, actionable items:
1. Suggested Habits (with name, category: "exercise"|"water"|"sleep"|"custom", targetValue, unit, and icon)
2. Suggested Exercise Plans (within the next 14 days, with title, type: "running"|"strength"|"cycling"|"yoga"|"hiit"|"swimming"|"walking"|"pilates"|"rest", targetDurationMin, plannedTime in HH:mm, dayOffset from 0 to 13 where 0 is today, intensity: "light"|"moderate"|"intense", notes)
3. Suggested Reminders (with title, description, category: "exercise"|"water"|"sleep"|"habit"|"task", time in HH:mm, leadTimeMinutes from [0, 5, 10, 15, 30, 60, 120, 1440], repeatDaily: boolean, dayOffset: number)
4. A friendly, encouraging 1-2 sentence motivational explanation of why this routine helps.

Always specify realistic times (e.g., water reminders during waking hours like 09:00, 12:00, 15:00, 18:00; workouts in the morning or early evening; sleep reminders at 22:00 or 22:30).
Default dayOffset is 0 (today) if not specified, or distribute across 0 to 13 if the user asks for "next week" or "daily".
Today's reference date is: ${todayDate || 'today'}.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: 'Short 1-sentence summary of what was generated.',
      },
      motivationalTip: {
        type: Type.STRING,
        description: 'Encouraging advice or rationale for the habit.',
      },
      suggestedHabits: {
        type: Type.ARRAY,
        description: 'Habits to create or track.',
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: {
              type: Type.STRING,
              description: 'One of: exercise, water, sleep, custom',
            },
            targetValue: { type: Type.NUMBER },
            unit: { type: Type.STRING, description: 'e.g. ml, glasses, mins, hours, times' },
            icon: { type: Type.STRING, description: 'e.g. droplets, moon, dumbbell, sparkles, heart' },
          },
          required: ['name', 'category', 'targetValue', 'unit'],
        },
      },
      suggestedExercises: {
        type: Type.ARRAY,
        description: 'Workouts to schedule over the next 14 days.',
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: {
              type: Type.STRING,
              description: 'One of: running, strength, cycling, yoga, hiit, swimming, walking, pilates, rest',
            },
            targetDurationMin: { type: Type.NUMBER },
            plannedTime: { type: Type.STRING, description: 'HH:mm format e.g. 07:30' },
            dayOffset: { type: Type.NUMBER, description: '0 for today, 1 for tomorrow, up to 13' },
            intensity: { type: Type.STRING, description: 'light, moderate, intense' },
            notes: { type: Type.STRING },
          },
          required: ['title', 'type', 'targetDurationMin', 'plannedTime', 'dayOffset'],
        },
      },
      suggestedReminders: {
        type: Type.ARRAY,
        description: 'Calendar notifications to set with chosen lead times.',
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: {
              type: Type.STRING,
              description: 'One of: exercise, water, sleep, habit, task',
            },
            time: { type: Type.STRING, description: 'HH:mm format e.g. 14:00' },
            leadTimeMinutes: {
              type: Type.NUMBER,
              description: 'Alert minutes before event: 0, 5, 10, 15, 30, 60, 120, 1440',
            },
            dayOffset: { type: Type.NUMBER, description: '0 for today, up to 13' },
            repeatDaily: { type: Type.BOOLEAN },
          },
          required: ['title', 'category', 'time', 'leadTimeMinutes', 'dayOffset'],
        },
      },
    },
    required: ['summary', 'motivationalTip', 'suggestedHabits', 'suggestedExercises', 'suggestedReminders'],
  };

  // Try candidate models with 4s timeout per attempt
  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await runWithTimeout(
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        }),
        4500
      );

      const parsedJson = JSON.parse(response.text || '{}');
      if (parsedJson && parsedJson.summary) {
        res.json({ success: true, data: parsedJson });
        return;
      }
    } catch (err: unknown) {
      console.warn(`Model ${model} failed, trying next candidate...`, (err as Error).message);
    }
  }

  // If all live models experienced a temporary upstream spike, use the resilient smart fallback
  const fallback = generateSmartFallback(prompt);
  res.json({ success: true, data: fallback });
});

/**
 * Endpoint: POST /api/ai/daily-coach
 * Generates personalized encouragement or advice based on today's logged habits
 */
app.post('/api/ai/daily-coach', async (req: Request, res: Response) => {
  const { habitsCount, completedCount, waterIntake, waterTarget, sleepHours, sleepQuality, todayWorkout } = req.body;

  const defaultAdvice = {
    comment: completedCount >= habitsCount && habitsCount > 0
      ? 'All daily habits completed! Outstanding consistency.'
      : `You've checked off ${completedCount} of ${habitsCount} habits today. Stay hydrated and focused!`,
    actionableMicroTip: waterIntake < waterTarget
      ? `Drink 250ml of water right now to keep your hydration on target (${waterIntake}/${waterTarget}ml).`
      : 'Take 5 minutes for a posture reset and deep breathing.',
  };

  if (!apiKey) {
    res.json(defaultAdvice);
    return;
  }

  const prompt = `Current daily stats:
- Habits completed: ${completedCount} / ${habitsCount}
- Water intake: ${waterIntake}ml (Target: ${waterTarget}ml)
- Sleep: ${sleepHours} hours (Quality: ${sleepQuality || 'unrated'})
- Today's planned workout: ${todayWorkout ? `${todayWorkout.title} (${todayWorkout.completed ? 'COMPLETED' : 'PENDING'})` : 'None planned'}

Provide:
1. A concise, warm 1-2 sentence coaching comment on the day's progress.
2. A single actionable micro-tip for the next few hours.`;

  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await runWithTimeout(
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: 'You are a warm, concise habit coach. Speak directly to the user in a supportive and practical tone.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                comment: { type: Type.STRING },
                actionableMicroTip: { type: Type.STRING },
              },
              required: ['comment', 'actionableMicroTip'],
            },
          },
        }),
        4000
      );

      const parsed = JSON.parse(response.text || '{}');
      if (parsed && parsed.comment) {
        res.json(parsed);
        return;
      }
    } catch (err: unknown) {
      console.warn(`Coach model ${model} failed, trying next...`, (err as Error).message);
    }
  }

  res.json(defaultAdvice);
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HabitFlow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
