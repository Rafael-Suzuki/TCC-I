import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';

// Importação dinâmica do mapa para evitar problemas de SSR
const MapComponent = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Carregando mapa...</div>
});

export default function Home() {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  const fetchNeighborhoods = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/status?limit=1000`);
      const data = typeof response.data.data === 'string' ? JSON.parse(response.data.data) : response.data.data;
      setNeighborhoods(data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNeighborhoods = neighborhoods.filter(neighborhood => {
    const matchesSearch = neighborhood.bairro.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || neighborhood.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'text-blue-600';
      case 'intermitente': return 'text-yellow-600';
      case 'falta': return 'text-red-600';
      case 'manutencao': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'normal': return 'Sem Informação';
      case 'intermitente': return 'Intermitente';
      case 'falta': return 'Sem Água';
      case 'manutencao': return 'Manutenção';
      default: return 'Sem Informação';
    }
  };

  return (
    <>
      <Head>
        <title>Monitor de Água - João Monlevade</title>
        <meta name="description" content="Sistema de monitoramento do abastecimento de água em João Monlevade" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  💧 Monitor de Água - João Monlevade
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/login" className="btn-primary flex items-center space-x-2">
                  <UserIcon className="h-5 w-5" />
                  <span>Login</span>
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
                
                {/* Search */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Bairro
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Digite o nome do bairro..."
                      className="input-field pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status do Abastecimento
                  </label>
                  <select
                    className="input-field"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">Todos os Status</option>
                    <option value="normal">Sem Informação</option>
                    <option value="intermitente">Intermitente</option>
                    <option value="falta">Sem Água</option>
                    <option value="manutencao">Manutenção</option>
                  </select>
                </div>

                {/* Legend */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Legenda</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Normal</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Intermitente</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Sem Água</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Sem Informação</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Neighborhoods List */}
              <div className="card mt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Bairros</h2>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Carregando...</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredNeighborhoods.map((neighborhood) => (
                      <div key={neighborhood.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                        <span className="text-sm font-medium text-gray-900">
                          {neighborhood.bairro}
                        </span>
                        <span className={`text-xs font-medium ${getStatusColor(neighborhood.status)}`}>
                          {getStatusText(neighborhood.status)}
                        </span>
                      </div>
                    ))}
                    {filteredNeighborhoods.length === 0 && (
                      <p className="text-gray-500 text-center py-4">Nenhum bairro encontrado</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              <div className="card h-[600px]">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Abastecimento</h2>
                <div className="h-full">
                  <MapComponent neighborhoods={filteredNeighborhoods} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}