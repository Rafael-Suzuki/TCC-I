import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Coordenadas aproximadas de João Monlevade, MG
const JOAO_MONLEVADE_CENTER = [-19.8117, -43.1731];
const DEFAULT_ZOOM = 13;

// Função para criar ícones coloridos baseados no status
const createColoredIcon = (status) => {
  let color;
  switch (status) {
    case 'normal':
      color = '#3b82f6'; // blue
      break;
    case 'intermitente':
      color = '#f59e0b'; // yellow
      break;
    case 'falta':
      color = '#ef4444'; // red
      break;
    default:
      color = '#6b7280'; // gray
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Coordenadas aproximadas dos bairros de João Monlevade
const neighborhoodCoordinates = {
  'Centro': [-19.8117, -43.1731],
  'Bela Vista': [-19.8200, -43.1800],
  'São Sebastião': [-19.8050, -43.1650],
  'Eldorado': [-19.8180, -43.1600],
  'Caetés': [-19.8250, -43.1750],
  'Ponte da Aldeia': [-19.8000, -43.1800],
  'Água Limpa': [-19.8300, -43.1700],
  'Vila Tanque': [-19.8150, -43.1850],
  'Carneirinhos': [-19.8080, -43.1580],
  'Santa Rita': [-19.8220, -43.1680],
};

const getStatusText = (status) => {
  switch (status) {
    case 'normal': return 'Abastecimento Normal';
    case 'intermitente': return 'Abastecimento Intermitente';
    case 'falta': return 'Sem Abastecimento';
    default: return 'Status Desconhecido';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'normal': return 'text-blue-600';
    case 'intermitente': return 'text-yellow-600';
    case 'falta': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

const Map = ({ neighborhoods = [] }) => {
  return (
    <MapContainer
      center={JOAO_MONLEVADE_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {neighborhoods.map((neighborhood) => {
        const coordinates = neighborhoodCoordinates[neighborhood.bairro] || JOAO_MONLEVADE_CENTER;
        
        return (
          <Marker
            key={neighborhood.id}
            position={coordinates}
            icon={createColoredIcon(neighborhood.status)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {neighborhood.bairro}
                </h3>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`font-medium ${getStatusColor(neighborhood.status)}`}>
                      {getStatusText(neighborhood.status)}
                    </span>
                  </p>
                  {neighborhood.updated_at && (
                    <p className="text-xs text-gray-500">
                      Atualizado em: {new Date(neighborhood.updated_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default Map;