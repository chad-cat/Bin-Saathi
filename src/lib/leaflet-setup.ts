import L from 'leaflet';

// Ensure L is available on window for Leaflet plugins
if (typeof window !== 'undefined') {
  (window as any).L = L;
}

// Import markercluster plugin
import 'leaflet.markercluster';

export default L;
