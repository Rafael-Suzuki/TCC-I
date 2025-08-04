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
  HomeIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNeighborhood, setEditingNeighborhood] = useState(null);
  const [formData, setFormData] = useState({
    bairro: '',
    status: 'normal'
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchNeighborhoods();
  }, []);

  const checkAuth = () => {
    const token = Cookies.get('token');
    const userData = Cookies.get('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchNeighborhoods = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNeighborhoods(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    router.push('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = Cookies.get('token');
    
    try {
      if (editingNeighborhood) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/status/${editingNeighborhood.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/status`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }
      
      setShowModal(false);
      setEditingNeighborhood(null);
      setFormData({ bairro: '', status: 'normal' });
      fetchNeighborhoods();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar. Tente novamente.');
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

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    
    const token = Cookies.get('token');
    
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/status/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchNeighborhoods();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir. Tente novamente.');
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      normal: 'bg-blue-100 text-blue-800',
      intermitente: 'bg-yellow-100 text-yellow-800',
      falta: 'bg-red-100 text-red-800'
    };
    
    const texts = {
      normal: 'Normal',
      intermitente: 'Intermitente',
      falta: 'Sem Água'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${classes[status] || 'bg-gray-100 text-gray-800'}`}>
        {texts[status] || 'Desconhecido'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - Monitor de Água</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">
                  💧 Dashboard - Monitor de Água
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Olá, {user?.nome}
                </span>
                <a href="/" className="btn-secondary flex items-center space-x-2">
                  <HomeIcon className="h-5 w-5" />
                  <span>Mapa Público</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Actions */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Status dos Bairros</h2>
            <button
              onClick={() => {
                setEditingNeighborhood(null);
                setFormData({ bairro: '', status: 'normal' });
                setShowModal(true);
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Adicionar Bairro</span>
            </button>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bairro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Atualização
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {neighborhoods.map((neighborhood) => (
                    <tr key={neighborhood.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {neighborhood.bairro}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(neighborhood.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(neighborhood.updated_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(neighborhood)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(neighborhood.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {neighborhoods.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        Nenhum bairro cadastrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
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
                      required
                      className="input-field"
                      value={formData.bairro}
                      onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      placeholder="Ex: Centro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status do Abastecimento
                    </label>
                    <select
                      className="input-field"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="normal">Normal</option>
                      <option value="intermitente">Intermitente</option>
                      <option value="falta">Sem Água</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingNeighborhood(null);
                        setFormData({ bairro: '', status: 'normal' });
                      }}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingNeighborhood ? 'Atualizar' : 'Adicionar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}