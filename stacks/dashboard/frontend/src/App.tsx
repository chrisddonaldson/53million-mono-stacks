
import { Component } from 'solid-js';
import TimeWidget from './components/widgets/TimeWidget';
import WeatherWidget from './components/widgets/WeatherWidget';
import CalendarWidget from './components/widgets/CalendarWidget';
import RSSWidget from './components/widgets/RSSWidget';
import SunriseSunsetWidget from './components/widgets/SunriseSunsetWidget';
import MoonPhaseWidget from './components/widgets/MoonPhaseWidget';
import MapWidget from './components/widgets/MapWidget';
import LocationWidget from './components/widgets/LocationWidget';
import { LocationProvider } from './context/LocationContext';

const App: Component = () => {
  return (
    <LocationProvider>
      <div class="min-h-screen bg-neutral-900 text-white p-6 md:p-12 overflow-hidden">
        <div class="h-[calc(100vh-6rem)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-rows-3 gap-6">
          
          {/* Top Row: Time & Weather & Astronomy */}
          <TimeWidget />
          <WeatherWidget />
          
          {/* Astronomy & Map Group */}
          <div class="grid grid-cols-2 grid-rows-2 gap-4">
            <SunriseSunsetWidget />
            <MoonPhaseWidget />
            <div class="col-span-2 row-span-1 grid grid-cols-2 gap-4">
               <LocationWidget />
               <MapWidget />
            </div>
          </div>
          
          {/* Middle/Bottom: Calendar gets vertical space */}
          <CalendarWidget />

          {/* Bottom Area: RSS Feed takes remaining width */}
          <RSSWidget />
          
        </div>
        
        {/* Background decoration */}
        <div class="fixed inset-0 pointer-events-none z-[-1]">
          <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]"></div>
          <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px]"></div>
        </div>
      </div>
    </LocationProvider>
  );
};

export default App;
