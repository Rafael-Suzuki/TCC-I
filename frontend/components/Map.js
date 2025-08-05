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

// Coordenadas dos bairros de João Monlevade
const neighborhoodCoordinates = {
  'Centro': [-19.816562, -43.168972],
  'Rosário': [-19.810065, -43.170363],
  'São José': [-19.807682, -43.17717],
  'Monlevade': [-19.809156, -43.172571],
  'Alvorada': [-19.842803, -43.176131],
  'Amazonas': [-19.823389, -43.16427],
  'Bom Jesus': [-19.852538, -43.190809],
  'Campo Alegre': [-19.846323, -43.171627],
  'Esperança': [-19.837162, -43.167471],
  'Fátima': [-19.824091, -43.173307],
  'Jardim Alvorada': [-19.842359, -43.178666],
  'Jardim das Rosas': [-19.847281, -43.186322],
  'Jardim Esperança': [-19.83377, -43.19237],
  'Nova Esperança': [-19.841472, -43.173294],
  'Parque das Águas': [-19.849591, -43.187498],
  'Santa Bárbara': [-19.839825, -43.174551],
  'Santa Efigênia': [-19.837712, -43.171916],
  'São Benedito': [-19.845931, -43.157703],
  'São Cristóvão': [-19.851741, -43.171512],
  'Vista Alegre': [-19.848321, -43.184001],
  'Antônio Dias': [-19.77751, -43.153557],
  'Bela Vista': [-19.778999, -43.178002],
  'Boa Vista': [-19.785919, -43.181406],
  'Carneirinhos': [-19.793575, -43.184548],
  'Cidade Nova': [-19.795118, -43.180704],
  'Jardim Panorama': [-19.778236, -43.159147],
  'Jardim Primavera': [-19.800892, -43.172789],
  'Monte Castelo': [-19.773081, -43.182595],
  'Novo Horizonte': [-19.786412, -43.176555],
  'Planalto': [-19.796751, -43.167612],
  'Progresso': [-19.796686, -43.181794],
  'Santa Rita': [-19.797135, -43.16557],
  'São Francisco': [-19.794161, -43.176993],
  'São João': [-19.780685, -43.172542],
  'São Pedro': [-19.788091, -43.183063],
  'Vila Rica': [-19.785534, -43.184864],
  'Aclimação': [-19.808588, -43.148609],
  'Areia Preta': [-19.830813, -43.142466],
  'Belmonte': [-19.803915, -43.146333],
  'Cruzeiro Celeste': [-19.806091, -43.149716],
  'Jardim Quisisana': [-19.821948, -43.141574],
  'Loanda': [-19.822576, -43.153244],
  'Nova Monlevade': [-19.80499, -43.142275],
  'Parque Ipanema': [-19.828455, -43.1456],
  'Santo Antônio': [-19.817706, -43.148104],
  'São Judas Tadeu': [-19.805084, -43.160069],
  'São Sebastião': [-19.819267, -43.15886],
  'Tanque': [-19.815839, -43.149007],
  'Vila Ipê': [-19.829826, -43.153743],
  'Vila Tanque': [-19.809251, -43.144713],
  'Bom Retiro': [-19.823239, -43.187711],
  'Campos Elísios': [-19.813695, -43.212372],
  'Granjas Monlevade': [-19.828239, -43.202727],
  'Jardim Santa Mônica': [-19.801512, -43.187883],
  'Madre de Deus': [-19.820198, -43.208886],
  'Novo Cruzeiro': [-19.804304, -43.191695],
  'Parque São Luís': [-19.811584, -43.202596],
  'Ponte do Cosme': [-19.81582, -43.195552],
  'Santa Terezinha': [-19.823404, -43.204142],
  'São Vicente': [-19.810854, -43.196979],
  'Vera Cruz': [-19.821948, -43.189838],
  'Vila Operária': [-19.827098, -43.193644],
  'Vila Santa Cecília': [-19.819237, -43.210907],
  'Vitória': [-19.814692, -43.201953],
  'Zona Rural': [-19.799404, -43.194256]
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
        return '#3b82f6'; // blue
      case 'intermitente':
        return '#f59e0b'; // yellow
      case 'falta':
        return '#ef4444'; // red
      case 'manutencao':
        return '#ea580c'; // orange
      default:
        return '#6b7280'; // gray
    }
  };

  const createCustomIcon = (color) => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      return new L.DivIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
    }
    return null;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'normal': return 'Abastecimento Normal';
      case 'intermitente': return 'Abastecimento Intermitente';
      case 'falta': return 'Sem Abastecimento';
      case 'manutencao': return 'Em Manutenção';
      default: return 'Status Desconhecido';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'text-blue-600';
      case 'intermitente': return 'text-yellow-600';
      case 'falta': return 'text-red-600';
      case 'manutencao': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando mapa...</div>
      </div>
    );
  }

<<<<<<< HEAD
const getStatusColor = (status) => {
  switch (status) {
    case 'normal': return 'text-blue-600';
    case 'intermitente': return 'text-yellow-600';
    case 'falta': return 'text-red-600';
    case 'manutencao': return 'text-orange-600';
    default: return 'text-gray-600';
=======
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-600">Erro ao carregar dados: {error}</div>
      </div>
    );
>>>>>>> 822bdbb33944834b39048d0e3551f09a0542f87a
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