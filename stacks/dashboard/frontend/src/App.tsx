
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
        
        {/* Row 1: Time & Weather & Map */}
        <TimeWidget />
        <WeatherWidget />
        
        {/* Map & Location Group */}
        <div class="flex flex-col gap-4 h-full"> 
           <div class="flex-none">
             <LocationWidget />
           </div>
           <div class="flex-grow min-h-0 relative">
             <div class="absolute inset-0">
               <MapWidget />
             </div>
           </div>
        </div>
        
        {/* Row 2: Calendar (Wide) & Sun/Moon */}
        <div class="lg:col-span-2">
            <CalendarWidget />
        </div>

        {/* Astronomy Group */}
        <div class="grid grid-cols-2 gap-4">
          <SunriseSunsetWidget />
          <MoonPhaseWidget />
        </div>

        {/* Row 3: RSS Feed (Full Width) */}
        <div class="lg:col-span-3">
          <RSSWidget />
        </div>
        
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
