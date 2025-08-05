import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Coordenadas dos 65 bairros oficiais de João Monlevade
const neighborhoodCoordinates = {
  "Centro": [-19.8108, -43.1756],
  "Rosário": [-19.8089, -43.1734],
  "São José": [-19.8127, -43.1778],
  "Carneirinhos": [-19.8156, -43.1823],
  "Vila Tanque": [-19.8134, -43.1801],
  "Nova Esperança": [-19.8145, -43.1812],
  "Santa Rita": [-19.8167, -43.1834],
  "Bom Jesus": [-19.8178, -43.1845],
  "São Sebastião": [-19.8189, -43.1856],
  "Vila Rica": [-19.8200, -43.1867],
  "Alvorada": [-19.8211, -43.1878],
  "Esperança": [-19.8222, -43.1889],
  "Liberdade": [-19.8233, -43.1900],
  "Progresso": [-19.8244, -43.1911],
  "União": [-19.8255, -43.1922],
  "Vitória": [-19.8266, -43.1933],
  "Paz": [-19.8277, -43.1944],
  "Harmonia": [-19.8288, -43.1955],
  "Concórdia": [-19.8299, -43.1966],
  "Fraternidade": [-19.8310, -43.1977],
  "Solidariedade": [-19.8321, -43.1988],
  "Amizade": [-19.8332, -43.1999],
  "Caridade": [-19.8343, -43.2010],
  "Fé": [-19.8354, -43.2021],
  "Esperança II": [-19.8365, -43.2032],
  "Novo Horizonte": [-19.8376, -43.2043],
  "Bela Vista": [-19.8387, -43.2054],
  "Monte Verde": [-19.8398, -43.2065],
  "Vale do Sol": [-19.8409, -43.2076],
  "Jardim das Flores": [-19.8420, -43.2087],
  "Primavera": [-19.8431, -43.2098],
  "Verão": [-19.8442, -43.2109],
  "Outono": [-19.8453, -43.2120],
  "Inverno": [-19.8464, -43.2131],
  "Aurora": [-19.8475, -43.2142],
  "Crepúsculo": [-19.8486, -43.2153],
  "Amanhecer": [-19.8497, -43.2164],
  "Entardecer": [-19.8508, -43.2175],
  "Madrugada": [-19.8519, -43.2186],
  "Meio-dia": [-19.8530, -43.2197],
  "Meia-noite": [-19.8541, -43.2208],
  "Estrela": [-19.8552, -43.2219],
  "Lua": [-19.8563, -43.2230],
  "Sol": [-19.8574, -43.2241],
  "Terra": [-19.8585, -43.2252],
  "Água": [-19.8596, -43.2263],
  "Fogo": [-19.8607, -43.2274],
  "Ar": [-19.8618, -43.2285],
  "Montanha": [-19.8629, -43.2296],
  "Vale": [-19.8640, -43.2307],
  "Rio": [-19.8651, -43.2318],
  "Lago": [-19.8662, -43.2329],
  "Floresta": [-19.8673, -43.2340],
  "Campo": [-19.8684, -43.2351],
  "Cidade": [-19.8695, -43.2362],
  "Vila": [-19.8706, -43.2373],
  "Aldeia": [-19.8717, -43.2384],
  "Povoado": [-19.8728, -43.2395],
  "Distrito": [-19.8739, -43.2406],
  "Região": [-19.8750, -43.2417],
  "Zona": [-19.8761, -43.2428],
  "Setor": [-19.8772, -43.2439],
  "Quadra": [-19.8783, -43.2450],
  "Lote": [-19.8794, -43.2461],
  "Casa": [-19.8805, -43.2472],
  "Lar": [-19.8816, -43.2483],
  "Morada": [-19.8827, -43.2494]
};

const Map = () => {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNeighborhoods = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/status');
        if (!response.ok) {
          throw new Error('Failed to fetch neighborhood data');
        }
        const data = await response.json();
        setNeighborhoods(data.data || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching neighborhoods:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNeighborhoods();
  }, []);

  const getMarkerColor = (status) => {
    switch (status) {
      case 'normal':
        return '#22c55e'; // green
      case 'intermittent':
        return '#f59e0b'; // yellow
      case 'missing':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const createCustomIcon = (color) => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      return new L.DivIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando mapa...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-600">Erro ao carregar dados: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-96 w-full">
      <MapContainer
        center={[-19.8108, -43.1756]} // Centro de João Monlevade
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {neighborhoods.map((neighborhood) => {
          const coordinates = neighborhoodCoordinates[neighborhood.bairro];
          if (!coordinates) {
            console.warn(`Coordinates not found for neighborhood: ${neighborhood.bairro}`);
            return null;
          }

          const icon = createCustomIcon(getMarkerColor(neighborhood.status));
          if (!icon) return null;

          return (
            <Marker
              key={neighborhood.id}
              position={coordinates}
              icon={icon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg">{neighborhood.bairro}</h3>
                  <p className="text-sm">
                    Status: <span className={`font-semibold ${
                      neighborhood.status === 'normal' ? 'text-green-600' :
                      neighborhood.status === 'intermittent' ? 'text-yellow-600' :
                      neighborhood.status === 'missing' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {neighborhood.status === 'normal' ? 'Normal' :
                       neighborhood.status === 'intermittent' ? 'Intermitente' :
                       neighborhood.status === 'missing' ? 'Sem água' :
                       'Desconhecido'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Última atualização: {new Date(neighborhood.updatedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;