
// Mock Data Types
export interface WeatherData {
  temp: number;
  condition: string;
  high: number;
  low: number;
  location: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
}

export interface RSSItem {
  id: string;
  title: string;
  source: string;
  publishedAt: Date;
}

// Mock API Service
export const api = {
  fetchWeather: async (): Promise<WeatherData> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Randomize slightly to show updates
    const temp = 72 + Math.floor(Math.random() * 5);
    
    return {
      temp,
      condition: Math.random() > 0.5 ? 'Sunny' : 'Partly Cloudy',
      high: 78,
      low: 65,
      location: 'London, UK'
    };
  },

  fetchCalendarEvents: async (): Promise<CalendarEvent[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return [
      {
        id: '1',
        title: 'Team Standup',
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
        endTime: new Date(today.getTime() + 10.5 * 60 * 60 * 1000),
        isAllDay: false
      },
      {
        id: '2',
        title: 'Lunch with Sarah',
        startTime: new Date(today.getTime() + 12.5 * 60 * 60 * 1000), // 12:30 PM
        endTime: new Date(today.getTime() + 13.5 * 60 * 60 * 1000),
        isAllDay: false
      },
      {
        id: '3',
        title: 'Project Review',
        startTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // 3:00 PM
        endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
        isAllDay: false
      }
    ];
  },

  fetchRSSHeadlines: async (): Promise<RSSItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    return [
      {
        id: '1',
        title: 'SolidJS 2.0 Announced: Everything You Need to Know',
        source: 'Hacker News',
        publishedAt: new Date()
      },
      {
        id: '2',
        title: 'SpaceX Successfully Launches Starship',
        source: 'TechCrunch',
        publishedAt: new Date(Date.now() - 3600000)
      },
      {
        id: '3',
        title: 'The Future of Web Development in 2026',
        source: 'Dev.to',
        publishedAt: new Date(Date.now() - 7200000)
      }
    ];
  }
};
