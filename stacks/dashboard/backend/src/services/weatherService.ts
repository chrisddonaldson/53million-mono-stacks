export const getWeatherData = async (lat?: number, lng?: number) => {
  // TODO: Integrate with OpenMeteo or OpenWeatherMap (Free Tier)
  // For now, return mock data matching the frontend interface
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Basic mock logic to vary temp slightly
  const baseTemp = 12 + Math.floor(Math.random() * 5);
  const locationName = lat && lng ? `Custom (${lat.toFixed(2)}, ${lng.toFixed(2)})` : 'London, UK';

  return {
    temp: baseTemp,
    condition: Math.random() > 0.5 ? 'Sunny' : 'Partly Cloudy',
    high: baseTemp + 4,
    low: baseTemp - 3,
    location: locationName,
    forecast: [
        { time: 'Now', temp: baseTemp, condition: 'Sunny' },
        { time: '+1h', temp: baseTemp + 1, condition: 'Partly Cloudy' },
        { time: '+2h', temp: baseTemp + 1, condition: 'Cloudy' },
        { time: '+3h', temp: baseTemp - 1, condition: 'Rain' },
    ]
  };
};
