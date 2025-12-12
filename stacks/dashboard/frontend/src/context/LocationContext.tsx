
import { createContext, createSignal, useContext, ParentComponent, Accessor } from 'solid-js';

export interface LocationState {
  lat: number;
  lng: number;
  name: string;
  timezone: string;
  isAuto: boolean;
  error?: string;
}

interface LocationContextValue {
  state: Accessor<LocationState>;
  useDeviceLocation: () => void;
  setManualLocation: (data: LocationState) => void;
  resetToDefault: () => void;
}

const defaultLocation: LocationState = {
  lat: 51.5074,
  lng: -0.1278,
  name: 'London, UK',
  timezone: 'Europe/London',
  isAuto: false
};

const LocationContext = createContext<LocationContextValue>();

export const LocationProvider: ParentComponent = (props) => {
  const [state, setState] = createSignal<LocationState>(defaultLocation);

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'Geolocation not supported' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Approximate timezone from browser
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Current Location', // In a real app, reverse geocode this
          timezone,
          isAuto: true,
          error: undefined
        });
      },
      (err) => {
        setState(s => ({ ...s, error: `Location denied: ${err.message}`, isAuto: false }));
      }
    );
  };

  const setManualLocation = (data: LocationState) => {
    setState({ ...data, isAuto: false, error: undefined });
  };

  const resetToDefault = () => {
    setState(defaultLocation);
  };

  return (
    <LocationContext.Provider value={{ state, useDeviceLocation, setManualLocation, resetToDefault }}>
      {props.children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
