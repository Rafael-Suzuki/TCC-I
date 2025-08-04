import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Fix for Leaflet default markers
    if (typeof window !== 'undefined' && window.L) {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.svg',
        iconUrl: '/leaflet/marker-icon.svg',
        shadowUrl: '/leaflet/marker-shadow.svg',
      });
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;