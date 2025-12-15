import React, { useState } from 'react';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';
import { Mail, Phone, Facebook, Github, Upload, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface AuthScreenProps {
  onLogin: (role: UserRole) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.PASSENGER);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone,
              role: role // Salva se é Motorista ou Passageiro nos metadados do usuário
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Registro com sucesso
          alert("Conta criada com sucesso! Se necessário, verifique seu e-mail.");
          onLogin(role);
        }
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          // Recupera o papel do usuário (role) salvo nos metadados
          const userRole = data.user.user_metadata?.role as UserRole || UserRole.PASSENGER;
          onLogin(userRole);
        }
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      setErrorMsg(error.message || "Ocorreu um erro na autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Left Side - Hero */}
      <div className="hidden md:flex w-1/2 bg-gray-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="relative z-10 max-w-lg">
          <h1 className="text-6xl font-bold mb-6 tracking-tighter">Já vai</h1>
          <p className="text-xl text-gray-300 mb-8">
            Viaje com segurança, conforto e tecnologia. A plataforma completa para passageiros e motoristas.
          </p>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <ShieldCheck className="text-green-400" size={16} /> Pagamento Seguro
             </div>
             <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <ShieldCheck className="text-green-400" size={16} /> Motoristas Verificados
             </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white text-black">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="mt-2 text-gray-500">
              {mode === 'login' ? 'Entre para continuar' : 'Comece sua jornada hoje'}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          {/* Role Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              type="button"
              onClick={() => setRole(UserRole.PASSENGER)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === UserRole.PASSENGER ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
            >
              Passageiro
            </button>
            <button 
              type="button"
              onClick={() => setRole(UserRole.DRIVER)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === UserRole.DRIVER ? 'bg-black text-white shadow-sm' : 'text-gray-500'}`}
            >
              Motorista
            </button>
            <button 
              type="button"
              onClick={() => setRole(UserRole.ADMIN)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${role === UserRole.ADMIN ? 'bg-gray-200 text-gray-800' : 'text-gray-500'}`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
               <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-black outline-none" placeholder="Seu nome" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Celular</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-black outline-none" placeholder="(11) 99999-9999" />
                  </div>
                </div>
               </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-black outline-none" placeholder="seu@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-black outline-none" placeholder="••••••••" />
            </div>

            {/* Driver Specific Documents */}
            {role === UserRole.DRIVER && mode === 'signup' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-sm text-blue-800 mb-2">Verificação de Motorista</h3>
                <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-blue-50 transition-colors">
                   <Upload className="text-blue-400 mb-2" size={24} />
                   <span className="text-xs text-blue-600 font-medium">Upload CNH (Frente e Verso)</span>
                </div>
                <p className="text-[10px] text-blue-400 mt-2">Seus documentos serão validados por nossa equipe em até 24h.</p>
              </div>
            )}

            <Button type="submit" isLoading={isLoading} className="mt-4">
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">ou continue com</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button type="button" className="flex items-center justify-center gap-2 p-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"><Facebook size={18} className="text-blue-600"/> Facebook</button>
             <button type="button" className="flex items-center justify-center gap-2 p-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"><Github size={18}/> GitHub</button>
          </div>

          <div className="text-center mt-6">
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-sm font-semibold hover:underline">
              {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};