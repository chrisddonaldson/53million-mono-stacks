
// Mock Data Types
export interface WeatherForecast {
  time: string;
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Partly Cloudy';
}

export interface WeatherData {
  temp: number;
  condition: string;
  high: number;
  low: number;
  location: string;
  forecast: WeatherForecast[];
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

export interface TrainDeparture {
  id: string;
  destination: string;
  dueInMinutes: number;
  status: 'On Time' | 'Delayed' | 'Cancelled';
  platform: string;
}

// Basic fetch wrapper
const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
};

export const api = {
  fetchWeather: async (): Promise<WeatherData> => {
    return fetchJson<WeatherData>('/api/weather');
  },

  fetchCalendarEvents: async (): Promise<CalendarEvent[]> => {
    return fetchJson<CalendarEvent[]>('/api/calendar');
  },

  fetchRSSHeadlines: async (): Promise<RSSItem[]> => {
    return fetchJson<RSSItem[]>('/api/rss');
  },

  fetchTrainDepartures: async (): Promise<TrainDeparture[]> => {
      return fetchJson<TrainDeparture[]>('/api/trains');
  }
};
