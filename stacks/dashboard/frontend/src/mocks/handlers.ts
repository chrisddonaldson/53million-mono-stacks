
import { http, HttpResponse } from 'msw';

// Mock Data (Moved from api.ts services)
const weatherData = {
  temp: 15,
  condition: 'Partly Cloudy',
  high: 18,
  low: 12,
  location: 'London, UK (Mock)',
  forecast: [
    { time: 'Now', temp: 15, condition: 'Partly Cloudy' },
    { time: '+1h', temp: 16, condition: 'Sunny' },
    { time: '+2h', temp: 16, condition: 'Cloudy' },
    { time: '+3h', temp: 14, condition: 'Rain' }
  ]
};

const calendarData = [
  {
    id: '1',
    title: 'Team Standup (Mock)',
    startTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    endTime: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    isAllDay: false
  },
  {
    id: '2',
    title: 'Lunch with Sarah (Mock)',
    startTime: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
    endTime: new Date(new Date().setHours(13, 30, 0, 0)).toISOString(),
    isAllDay: false
  }
];

const rssData = [
  {
    id: '1',
    title: 'SolidJS 2.0 Announced (Mock)',
    source: 'Hacker News',
    publishedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'SpaceX Launch Successful (Mock)',
    source: 'TechCrunch',
    publishedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

const trainData = [
  {
      id: '1',
      destination: 'Stratford (Mock)',
      dueInMinutes: 2,
      status: 'On Time',
      platform: '4'
  },
  {
      id: '2',
      destination: 'Shenfield (Mock)',
      dueInMinutes: 16,
      status: 'Delayed',
      platform: '4'
  }
];

export const handlers = [
  http.get('/api/weather', () => {
    return HttpResponse.json(weatherData);
  }),
  
  http.get('/api/calendar', () => {
    return HttpResponse.json(calendarData);
  }),

  http.get('/api/rss', () => {
    return HttpResponse.json(rssData);
  }),

  http.get('/api/trains', () => {
    return HttpResponse.json(trainData);
  })
];
