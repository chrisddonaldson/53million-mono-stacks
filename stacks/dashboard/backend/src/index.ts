
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getWeatherData } from './services/weatherService';
import { getCalendarEvents } from './services/calendarService';
import { getRSSHeadlines } from './services/rssService';
import { getTrainDepartures } from './services/trainService';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// -- Endpoints --

// 1. Weather
app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    // Determine location from query or default
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    
    const data = await getWeatherData(lat, lng);
    res.json(data);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// 2. Calendar
app.get('/api/calendar', async (req: Request, res: Response) => {
  try {
    const data = await getCalendarEvents();
    res.json(data);
  } catch (error) {
     console.error('Error fetching calendar:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// 3. RSS
app.get('/api/rss', async (req: Request, res: Response) => {
  try {
    const data = await getRSSHeadlines();
    res.json(data);
  } catch (error) {
     console.error('Error fetching RSS:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feeds' });
  }
});

// 4. Trains
app.get('/api/trains', async (req: Request, res: Response) => {
  try {
    const data = await getTrainDepartures();
    res.json(data);
  } catch (error) {
     console.error('Error fetching trains:', error);
    res.status(500).json({ error: 'Failed to fetch train departures' });
  }
}); 

app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});
