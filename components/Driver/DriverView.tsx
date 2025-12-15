import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { DollarSign, Navigation, Shield, User, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { MapSimulation } from '../Map/MapSimulation';
import { RideStatus, RideRequest, Location } from '../../types';
import { MOCK_EARNINGS } from '../../constants';

interface DriverViewProps {
  onLogout: () => void;
  incomingRequest: RideRequest | null;
  currentRide: RideRequest | null;
  acceptRide: () => void;
  completeRide: () => void;
  status: RideStatus;
  isOnline: boolean;
  toggleOnline: () => void;
  userRealLocation: Location;
  onSwitchRole: () => void;
}

export const DriverView: React.FC<DriverViewProps> = ({
  onLogout,
  incomingRequest,
  currentRide,
  acceptRide,
  completeRide,
  status,
  isOnline,
  toggleOnline,
  userRealLocation,
  onSwitchRole
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'earnings'>('home');

  useEffect(() => {
    if (incomingRequest) setActiveTab('home');
  }, [incomingRequest]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-black text-white p-4 flex justify-between items-center shadow-lg z-20">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center border-2 border-green-500"><User size={20}/></div>
           <div><h1 className="font-bold text-sm">João Silva</h1><p className="text-xs text-gray-400">4.9 ★</p></div>
        </div>
        <div className="flex items-center gap-3">
           <Button onClick={toggleOnline} className={`!w-auto px-4 py-1.5 !rounded-full text-xs ${isOnline ? 'bg-white text-black' : 'bg-green-600'}`}>
             {isOnline ? 'Offline' : 'Online'}
           </Button>
           <button onClick={onSwitchRole} className="text-xs bg-gray-800 px-2 py-1.5 rounded hover:bg-gray-700">Sou Passageiro</button>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {activeTab === 'home' && (
           <div className="flex-1 relative bg-gray-100 h-full w-full">
              <MapSimulation 
                status={status} 
                userType="driver" 
                currentRequest={currentRide || incomingRequest || undefined}
                userLocation={userRealLocation}
              />
              
              {/* Overlay Offline */}
              {!isOnline && (
                 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="bg-white p-6 rounded-xl text-center shadow-xl">
                      <h2 className="text-xl font-bold">Você está offline</h2>
                      <Button onClick={toggleOnline} className="bg-green-600 mt-4">Ficar Online</Button>
                    </div>
                 </div>
              )}

              {/* Pedido Recebido */}
              {incomingRequest && status === RideStatus.SEARCHING && (
                 <div className="absolute bottom-4 left-4 right-4 z-30 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-[10px] font-bold uppercase">Nova Solicitação</span>
                                <h2 className="text-2xl font-bold mt-1">{incomingRequest.estimatedTimeMin} min <span className="text-sm font-normal text-gray-500">({incomingRequest.distanceKm} km)</span></h2>
                            </div>
                            <h2 className="text-3xl font-bold text-black">R$ {incomingRequest.price.toFixed(2)}</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="ghost" className="bg-gray-100 text-gray-800">Recusar</Button>
                            <Button onClick={acceptRide} className="bg-black text-white">Aceitar</Button>
                        </div>
                    </div>
                 </div>
              )}

              {/* Em Corrida */}
              {status === RideStatus.IN_PROGRESS && (
                 <div className="absolute bottom-4 left-4 right-4 bg-white p-5 rounded-2xl shadow-xl z-20 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold">Passageiro</p>
                      <h3 className="font-bold text-xl">{currentRide?.passengerName}</h3>
                    </div>
                    <Button onClick={completeRide} className="!w-auto bg-green-600 px-6">Finalizar</Button>
                 </div>
              )}
           </div>
        )}
      </div>
      
      <div className="bg-white border-t flex justify-around p-3 md:hidden z-30 relative">
         <button onClick={() => setActiveTab('home')} className={`p-2 rounded-lg ${activeTab === 'home' ? 'bg-gray-100' : ''}`}><Navigation size={24}/></button>
         <button onClick={() => setActiveTab('earnings')} className={`p-2 rounded-lg ${activeTab === 'earnings' ? 'bg-gray-100' : ''}`}><DollarSign size={24}/></button>
      </div>
    </div>
  );
};