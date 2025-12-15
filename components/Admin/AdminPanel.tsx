import React from 'react';
import { Users, Activity, DollarSign, Map as MapIcon, ShieldCheck } from 'lucide-react';
import { MapSimulation } from '../Map/MapSimulation';
import { RideStatus } from '../../types';

export const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
             <div className="bg-black text-white p-2 rounded-lg">
                <ShieldCheck size={24} />
             </div>
             <div>
               <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
               <p className="text-xs text-gray-500">Já vai Operations Center</p>
             </div>
           </div>
          <button onClick={onLogout} className="text-red-500 hover:underline text-sm font-medium">Sair</button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           {[
             { label: 'Motoristas Ativos', val: '1,204', icon: Users, color: 'bg-blue-500' },
             { label: 'Corridas Agora', val: '342', icon: MapIcon, color: 'bg-green-500' },
             { label: 'Receita (Hoje)', val: 'R$ 12,450', icon: DollarSign, color: 'bg-black' },
             { label: 'Disponibilidade', val: '99.9%', icon: Activity, color: 'bg-purple-500' },
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between border border-gray-100">
                <div>
                   <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">{stat.label}</p>
                   <p className="text-2xl font-bold mt-1 text-gray-900">{stat.val}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white shadow-md`}>
                   <stat.icon size={24} />
                </div>
             </div>
           ))}
        </div>

        {/* Main Content Grid: Map & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Live Map Section (Takes up 2 cols) */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                   <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
                      <div>
                        <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <Activity size={18} className="text-green-500 animate-pulse"/>
                            Monitoramento de Frota
                        </h2>
                        <p className="text-xs text-gray-500">Localização em tempo real dos parceiros ativos</p>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                          Ao Vivo
                      </span>
                   </div>
                   <div className="flex-1 relative">
                       <MapSimulation status={RideStatus.IDLE} userType="admin" />
                   </div>
                </div>
            </div>

            {/* Recent Transactions (Takes up 1 col) */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[500px] flex flex-col">
                   <div className="p-5 border-b">
                      <h2 className="font-bold text-lg text-gray-900">Transações Recentes</h2>
                      <p className="text-xs text-gray-500">Últimas atualizações financeiras</p>
                   </div>
                   <div className="flex-1 overflow-y-auto">
                       <table className="w-full text-left">
                          <tbody className="divide-y divide-gray-50">
                             {[1,2,3,4,5,6,7,8].map(i => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors cursor-default">
                                   <td className="p-4">
                                      <div className="flex justify-between items-start mb-1">
                                          <span className="font-bold text-sm text-gray-900">Passageiro {i}</span>
                                          <span className="font-bold text-sm text-green-600">R$ {(10 + Math.random() * 40).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs text-gray-500">
                                          <span>Motorista ID #{1000+i}</span>
                                          <span className="bg-gray-100 px-1.5 py-0.5 rounded">Pix</span>
                                      </div>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                   </div>
                   <div className="p-3 border-t bg-gray-50 text-center">
                       <button className="text-sm font-medium text-blue-600 hover:text-blue-800">Ver Todas</button>
                   </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};