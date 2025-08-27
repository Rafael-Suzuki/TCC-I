import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import Cookies from 'js-cookie';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🚀 Iniciando processo de login...');
    console.log('📝 Dados do formulário:', formData);
    console.log('🌐 URL da API:', `${process.env.NEXT_PUBLIC_API_URL}/auth/login`);

    try {
      console.log('📡 Enviando requisição para API...');
      console.log('🌐 URL completa:', `${process.env.NEXT_PUBLIC_API_URL}/auth/login`);
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, formData);
      
      console.log('✅ Resposta recebida da API:');
      console.log('Status:', response.status);
      console.log('Headers:', response.headers);
      console.log('Data:', response.data);
      
      if (response.data.success) {
        console.log('🎉 Login bem-sucedido! Processando dados...');
        
        let userData, token;
        
        console.log('🔍 Verificando tipo de response.data.data:', typeof response.data.data);
        
        // Verificar se response.data.data é uma string (JSON aninhado) ou objeto
        if (typeof response.data.data === 'string') {
          console.log('📝 response.data.data é string, fazendo parse...');
          try {
            const loginData = JSON.parse(response.data.data);
            console.log('✅ Parse bem-sucedido:', loginData);
            userData = loginData.data.user;
            token = loginData.data.token;
          } catch (parseError) {
            console.error('❌ Erro ao fazer parse do JSON:', parseError);
            console.error('String que causou erro:', response.data.data);
            throw new Error('Erro ao processar dados de login');
          }
        } else {
          console.log('📝 response.data.data é objeto');
          userData = response.data.data.user;
          token = response.data.data.token;
        }
        
        console.log('👤 Dados do usuário extraídos:', userData);
        console.log('🔑 Token extraído:', token ? 'Token válido recebido' : 'Token não encontrado');
        
        if (!userData || !token) {
          console.error('❌ Dados incompletos:');
          console.error('userData:', userData);
          console.error('token:', token);
          throw new Error('Dados de login incompletos');
        }
        
        console.log('💾 Salvando dados nos cookies e localStorage...');
        
        // Salvar token nos cookies
        Cookies.set('token', token, { expires: 7 });
        Cookies.set('user', JSON.stringify(userData), { expires: 7 });
        
        // Also save to localStorage for consistency
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('✅ Dados salvos com sucesso!');
        console.log('🔄 Redirecionando para dashboard...');
        
        // Redirecionar para dashboard
        await router.push('/dashboard');
        console.log('✅ Redirecionamento executado!');
      } else {
        console.error('❌ Login falhou - response.data.success é false');
        console.error('Mensagem:', response.data.message);
        throw new Error(response.data.message || 'Login falhou');
      }
    } catch (error) {
      console.error('💥 ERRO NO LOGIN:');
      console.error('Tipo do erro:', error.constructor.name);
      console.error('Mensagem:', error.message);
      
      if (error.response) {
        console.error('📊 Detalhes da resposta de erro:');
        console.error('Status:', error.response.status);
        console.error('StatusText:', error.response.statusText);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        console.error('📡 Erro de rede - sem resposta do servidor:');
        console.error('Request:', error.request);
      } else {
        console.error('⚙️ Erro de configuração:', error.message);
      }
      
      setError(
        error.response?.data?.message || 
        error.response?.data?.error?.message || 
        error.message ||
        'Erro ao fazer login. Verifique suas credenciais.'
      );
    } finally {
      console.log('🏁 Finalizando processo de login...');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Monitor de Água</title>
        <meta name="description" content="Login para administradores do sistema" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              💧 Monitor de Água
            </h1>
            <h2 className="text-xl text-gray-600">
              João Monlevade
            </h2>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input-field"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="mt-1 relative">
                  <input
                    id="senha"
                    name="senha"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="input-field pr-10"
                    placeholder="Sua senha"
                    value={formData.senha}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Entrando...
                    </div>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </div>
            </form>



            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                ← Voltar ao mapa público
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}