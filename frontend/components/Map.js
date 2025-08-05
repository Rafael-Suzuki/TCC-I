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
    case 'manutencao':
      color = '#ea580c'; // orange
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

const getStatusText = (status) => {
  switch (status) {
    case 'normal': return 'Sem Informação';
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