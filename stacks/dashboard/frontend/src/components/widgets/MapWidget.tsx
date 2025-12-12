
import { Component } from 'solid-js';
import WidgetContainer from './WidgetContainer';
import { useLocation } from '../../context/LocationContext';

const MapWidget: Component = () => {
  const { state } = useLocation();
  
  // Construct URL dynamically based on state
  const mapUrl = () => {
      const { lat, lng } = state();
      return `https://maps.google.com/maps?q=${lat},${lng}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
  };

  return (
    <WidgetContainer title="Location" className="min-h-[200px]">
      <div class="h-full w-full rounded-lg overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-500">
        <iframe
          width="100%"
          height="100%"
          src={mapUrl()}
          style={{ border: 0 }}
          loading="lazy"
          allowfullscreen={false}
          referrerpolicy="no-referrer-when-downgrade"
          class="absolute inset-0 w-full h-full"
        ></iframe>
        {/* Overlay to prevent interaction stealing scroll unless explicitly wanted, or just for style */}
        <div class="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-lg"></div>
      </div>
    </WidgetContainer>
  );
};

export default MapWidget;
