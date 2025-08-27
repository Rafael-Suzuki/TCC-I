import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import Cookies from 'js-cookie';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowRightOnRectangleIcon,
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import MapPicker from '../components/MapPicker';

export default function Dashboard() {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      availability_pct: 0,
      incidents: { total: 0 },
      mttr_min: 0,
      now: { normal: 0, intermitente: 0, falta: 0, sem_informacao: 0 }
    },
    ranking: [],
    timeseries: []
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('7d'); // 24h, 7d, 30d
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('neighborhoods');
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCoordsModal, setShowCoordsModal] = useState(false);
  const [editingNeighborhood, setEditingNeighborhood] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingCoords, setEditingCoords] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    bairro: '',
    status: 'sem_informacao'
  });
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator'
  });
  const router = useRouter();

  // Filtrar e paginar bairros
  const filteredNeighborhoods = neighborhoods.filter(neighborhood =>
    neighborhood.bairro.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredNeighborhoods.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNeighborhoods = filteredNeighborhoods.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  useEffect(() => {
    checkAuth();
    fetchNeighborhoods();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchAnalyticsData(); // Carregar dados de analytics inicialmente
    }
  }, [user]);

  // Carregar dados de análise quando a aba analytics for ativada
  useEffect(() => {
    if (activeTab === 'analytics' && user?.role === 'admin') {
      fetchAnalyticsData();
    }
  }, [activeTab, user]);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('http://localhost:3001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Parse the nested JSON data from /api/auth/me
      const userData = JSON.parse(response.data.data);
      setUser(userData.data);
    } catch (error) {
      console.error('Erro na autenticação:', error);
      Cookies.remove('token');
      localStorage.clear();
      router.push('/login');
    }
  };

  const fetchNeighborhoods = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/status');
      
      // Parse the nested JSON data
      const parsedData = JSON.parse(response.data.data);
      
      const neighborhoods = parsedData.data || [];
      const pagination = parsedData.pagination || {};
      
      setNeighborhoods(Array.isArray(neighborhoods) ? neighborhoods : []);
      if (pagination.page) {
        setCurrentPage(pagination.page);
      }
    } catch (error) {
      console.error('Erro ao buscar bairros:', error);
      setNeighborhoods([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get('http://localhost:3001/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Resposta da API de usuários:', response.data);
      
      // Parse the nested JSON data from /api/users
      const usersData = JSON.parse(response.data.data);
      setUsers(usersData.data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setUsers([]);
    }
  };

  // Função removida - usando fetchAnalyticsData que funciona corretamente

  // Função para buscar dados de análise com período
  const fetchAnalyticsData = async (period = analyticsPeriod) => {
    setAnalyticsLoading(true);
    try {
      const token = Cookies.get('token');
      
      // Calcular datas baseado no período
      const now = new Date();
      const from = new Date();
      
      switch (period) {
        case '24h':
          from.setHours(now.getHours() - 24);
          break;
        case '7d':
          from.setDate(now.getDate() - 7);
          break;
        case '30d':
          from.setDate(now.getDate() - 30);
          break;
        default:
          from.setDate(now.getDate() - 7);
      }
      
      const fromISO = from.toISOString();
      const toISO = now.toISOString();
      
      // Buscar dados em paralelo
      const [overviewRes, rankingRes, timeseriesRes] = await Promise.all([
        axios.get(`http://localhost:3001/api/analytics/overview?from=${fromISO}&to=${toISO}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:3001/api/analytics/ranking?from=${fromISO}&to=${toISO}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:3001/api/analytics/timeseries/incidents?from=${fromISO}&to=${toISO}&granularity=day`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      // O backend retorna dados com duplo encapsulamento: response.data.data contém uma string JSON
      const overviewData = JSON.parse(overviewRes.data.data);
      const rankingData = JSON.parse(rankingRes.data.data);
      const timeseriesData = JSON.parse(timeseriesRes.data.data);
      
      setAnalyticsData({
        overview: overviewData.data,
        ranking: rankingData.data,
        timeseries: timeseriesData.data
      });
    } catch (error) {
      console.error('Erro ao buscar dados de análise:', error);
      setAnalyticsData({
        overview: null,
        ranking: null,
        timeseries: null
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Função para alterar período e recarregar dados
  const handlePeriodChange = (newPeriod) => {
    setAnalyticsPeriod(newPeriod);
    fetchAnalyticsData(newPeriod);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = Cookies.get('token');
      
      if (editingNeighborhood) {
        await axios.put(`http://localhost:3001/api/status/${editingNeighborhood.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:3001/api/status', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowModal(false);
      setEditingNeighborhood(null);
      setFormData({ bairro: '', status: 'sem_informacao' });
      fetchNeighborhoods();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar dados');
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = Cookies.get('token');
      
      if (editingUser) {
        const updateData = { ...userFormData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await axios.put(`http://localhost:3001/api/users/${editingUser.id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:3001/api/users', userFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowUserModal(false);
      setEditingUser(null);
      setUserFormData({ name: '', email: '', password: '', role: 'operator' });
      setShowPassword(false);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário');
    }
  };

  const handleEdit = (neighborhood) => {
    setEditingNeighborhood(neighborhood);
    setFormData({
      bairro: neighborhood.bairro,
      status: neighborhood.status
    });
    setShowModal(true);
  };

  // Função para editar coordenadas
  const handleEditCoords = (neighborhood) => {
    setEditingCoords(neighborhood);
    setShowCoordsModal(true);
  };

  // Função para atualizar coordenadas
  const handleUpdateCoords = async (latitude, longitude) => {
    try {
      const token = Cookies.get('token');
      await axios.put(
        `http://localhost:3001/api/status/${editingCoords.id}/coords`,
        { latitude, longitude },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Atualizar a lista de bairros
      await fetchNeighborhoods();
      
      // Fechar modal
      setShowCoordsModal(false);
      setEditingCoords(null);
      
      alert('Coordenadas atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar coordenadas:', error);
      alert('Erro ao atualizar coordenadas: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUserEdit = (user) => {
    setEditingUser(user);
    setUserFormData({
      name: user.nome,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowUserModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este bairro?')) {
      try {
        const token = Cookies.get('token');
        await axios.delete(`http://localhost:3001/api/status/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchNeighborhoods();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir bairro');
      }
    }
  };

  const handleUserDelete = async (id) => {
    try {
      const token = Cookies.get('token');
      await axios.delete(`http://localhost:3001/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Atualizar estado local imediatamente
      const updatedUsers = users.filter(user => user.id !== id);
      setUsers(updatedUsers);
      
      alert('Usuário excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/login');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'normal': { color: 'bg-blue-100 text-blue-800', text: 'Normal' },
      'intermitente': { color: 'bg-orange-100 text-orange-800', text: 'Intermitente' },
      'falta': { color: 'bg-red-100 text-red-800', text: 'Sem Água' },
      'sem_informacao': { color: 'bg-gray-100 text-gray-800', text: 'Sem Informação' }
    };
    
    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800', text: 'Desconhecido' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Dashboard - Monitor Água</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <HomeIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-600">Olá, {user?.nome}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <a 
                  href="/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ver Mapa Público
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-600 hover:text-gray-800"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                  Sair
                </button>
              </div>
            </div>
            
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('neighborhoods')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'neighborhoods'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <HomeIcon className="h-5 w-5 inline mr-2" />
                  Gerenciar Bairros
                </button>
                
                {user?.role === 'admin' && (
                  <>
                    <button
                      onClick={() => setActiveTab('users')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'users'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <UsersIcon className="h-5 w-5 inline mr-2" />
                      Gerenciar Usuários
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'analytics'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <ChartBarIcon className="h-5 w-5 inline mr-2" />
                      Análises
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {activeTab === 'neighborhoods' && (
            <div className="px-4 py-6 sm:px-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Status dos Bairros</h2>
                <button
                  onClick={() => {
                    setEditingNeighborhood(null);
                    setFormData({ bairro: '', status: 'sem_informacao' });
                    setShowModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Adicionar Bairro
                </button>
              </div>

              {/* Search and Info */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Buscar bairro..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, filteredNeighborhoods.length)} de {filteredNeighborhoods.length} bairros
                  </div>
                </div>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {loading && (
                    <li className="px-6 py-4 text-center text-gray-500">
                      Carregando bairros...
                    </li>
                  )}
                  {!loading && filteredNeighborhoods.length === 0 && (
                    <li className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? 'Nenhum bairro encontrado' : 'Nenhum bairro cadastrado'}
                    </li>
                  )}
                  {!loading && currentNeighborhoods.length > 0 && currentNeighborhoods.map((neighborhood) => (
                    <li key={neighborhood.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {getStatusBadge(neighborhood.status)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {neighborhood.bairro}
                            </div>
                            <div className="text-sm text-gray-500">
                              Atualizado em: {new Date(neighborhood.updatedAt).toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(neighborhood)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar bairro"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditCoords(neighborhood)}
                            className="text-green-600 hover:text-green-900"
                            title="Editar coordenadas"
                          >
                            <MapPinIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(neighborhood.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir bairro"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Página <span className="font-medium">{currentPage}</span> de{' '}
                        <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Anterior</span>
                          ←
                        </button>
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1;
                          const isCurrentPage = page === currentPage;
                          const showPage = page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2);
                          
                          if (!showPage) {
                            if (page === currentPage - 3 || page === currentPage + 3) {
                              return (
                                <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }
                          
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                isCurrentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Próximo</span>
                          →
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && user?.role === 'admin' && (
            <div className="px-4 py-6 sm:px-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Gerenciar Usuários</h2>
                <button
                   onClick={() => {
                     setEditingUser(null);
                     setUserFormData({ nome: '', email: '', senha: '', role: 'user' });
                     setShowUserModal(true);
                   }}
                   className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                 >
                   <PlusIcon className="h-4 w-4 mr-2" />
                   Adicionar Usuário
                 </button>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <li key={user.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.nome}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUserEdit(user)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Editar usuário"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja deletar o usuário ${user.nome}?`)) {
                                handleUserDelete(user.id);
                              }
                            }}
                            className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium"
                            title="Deletar usuário"
                          >
                            Deletar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && user?.role === 'admin' && (
            <div className="px-4 py-6 sm:px-0">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Análises</h2>
                  
                  <div className="flex items-center space-x-4">
                    {/* Botão de Atualização Manual */}
                    <button
                      onClick={() => fetchAnalyticsData(analyticsPeriod)}
                      disabled={analyticsLoading}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Atualizar análises manualmente"
                    >
                      <svg className={`h-4 w-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {analyticsLoading ? 'Atualizando...' : 'Atualizar'}
                    </button>
                    
                    {/* Filtro de Período */}
                    <div className="flex space-x-2">
                      {['24h', '7d', '30d'].map((period) => (
                        <button
                          key={period}
                          onClick={() => handlePeriodChange(period)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            analyticsPeriod === period
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {period === '24h' ? '24 horas' : period === '7d' ? '7 dias' : '30 dias'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500">Carregando análises...</div>
                  </div>
                ) : analyticsData.overview ? (
                  <>
                    {/* Cards de Métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Disponibilidade */}
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                               <CheckCircleIcon className="h-6 w-6 text-green-400" />
                             </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                  Disponibilidade
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                  {analyticsData.overview.availability_pct?.toFixed(1) || 0}%
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Total de Incidentes */}
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                               <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                             </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                  Total de Incidentes
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                  {analyticsData.overview.incidents?.total || 0}
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* MTTR */}
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                               <ClockIcon className="h-6 w-6 text-yellow-400" />
                             </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                  MTTR (min)
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                  {analyticsData.overview.mttr_min?.toFixed(0) || 'N/A'}
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bairros Sem Água Agora */}
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <MapPinIcon className="h-6 w-6 text-blue-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                  Sem Água Agora
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                  {analyticsData.overview.now?.falta || 0}
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rankings */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Top 5 por Incidentes */}
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Top 5 - Mais Incidentes
                          </h3>
                          <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Bairros com mais incidentes no período
                          </p>
                        </div>
                        <ul className="divide-y divide-gray-200">
                          {analyticsData.ranking?.by_incidents?.slice(0, 5).map((item, index) => (
                            <li key={item.neighborhood_id} className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                      index === 1 ? 'bg-gray-100 text-gray-800' :
                                      index === 2 ? 'bg-orange-100 text-orange-800' :
                                      'bg-gray-50 text-gray-600'
                                    }`}>
                                      <span className="text-sm font-medium">
                                        {index + 1}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.count} incidentes
                                </div>
                              </div>
                            </li>
                          )) || (
                            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                              Nenhum dado disponível
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Top 5 por Downtime */}
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Top 5 - Maior Downtime
                          </h3>
                          <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Bairros com maior tempo de inatividade
                          </p>
                        </div>
                        <ul className="divide-y divide-gray-200">
                          {analyticsData.ranking?.by_downtime_min?.slice(0, 5).map((item, index) => (
                            <li key={item.neighborhood_id} className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                      index === 0 ? 'bg-red-100 text-red-800' :
                                      index === 1 ? 'bg-orange-100 text-orange-800' :
                                      index === 2 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-50 text-gray-600'
                                    }`}>
                                      <span className="text-sm font-medium">
                                        {index + 1}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {Math.round(item.minutes)} min
                                </div>
                              </div>
                            </li>
                          )) || (
                            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                              Nenhum dado disponível
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Série Temporal de Incidentes */}
                    {analyticsData.timeseries?.points && analyticsData.timeseries.points.length > 0 && (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Incidentes por Dia
                          </h3>
                          <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Distribuição temporal dos incidentes
                          </p>
                        </div>
                        <div className="px-4 py-4">
                          <div className="flex items-end space-x-1 h-32">
                            {analyticsData.timeseries.points.map((point, index) => {
                              const maxCount = Math.max(...analyticsData.timeseries.points.map(p => p.count));
                              const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0;
                              return (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                  <div 
                                    className="bg-blue-500 w-full rounded-t"
                                    style={{ height: `${height}%` }}
                                    title={`${point.date}: ${point.count} incidentes`}
                                  ></div>
                                  <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                                    {new Date(point.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500">Nenhum dado disponível para o período selecionado</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingNeighborhood ? 'Editar Bairro' : 'Adicionar Bairro'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Bairro
                    </label>
                    <input
                      type="text"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="normal">Normal</option>
                        <option value="intermitente">Intermitente</option>
                        <option value="falta">Sem Água</option>
                        <option value="sem_informacao">Sem Informação</option>
                      </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingNeighborhood(null);
                        setFormData({ bairro: '', status: 'sem_informacao' });
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {editingNeighborhood ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showUserModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}
                </h3>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha {editingUser && '(deixe em branco para manter a atual)'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                        required={!editingUser}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Função
                    </label>
                    <select
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserModal(false);
                        setEditingUser(null);
                        setUserFormData({ nome: '', email: '', senha: '', role: 'user' });
                        setShowPassword(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {editingUser ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Coordenadas */}
        {showCoordsModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Editar Coordenadas - {editingCoords?.bairro}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCoordsModal(false);
                      setEditingCoords(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Fechar</span>
                    ✕
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Selecione a localização do bairro <strong>{editingCoords?.bairro}</strong> no mapa abaixo.
                  </p>
                  {editingCoords?.latitude && editingCoords?.longitude && (
                    <p className="text-sm text-blue-600 mt-1">
                      Coordenadas atuais: {parseFloat(editingCoords.latitude).toFixed(6)}, {parseFloat(editingCoords.longitude).toFixed(6)}
                    </p>
                  )}
                </div>

                <MapPicker
                  initialLatLng={
                    editingCoords?.latitude && editingCoords?.longitude
                      ? [parseFloat(editingCoords.latitude), parseFloat(editingCoords.longitude)]
                      : null
                  }
                  onPick={handleUpdateCoords}
                />

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCoordsModal(false);
                      setEditingCoords(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}