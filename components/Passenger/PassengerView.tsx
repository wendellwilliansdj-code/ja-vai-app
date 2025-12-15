import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Star, CreditCard, Phone, XCircle, Check, History, Wallet, Banknote, QrCode, Locate, Navigation, UserCircle, Search } from 'lucide-react';
import { VEHICLES } from '../../constants';
import { Button } from '../ui/Button';
import { MapSimulation } from '../Map/MapSimulation';
import { RideStatus, VehicleType, RideRequest, PaymentMethod, RideHistoryItem, Location } from '../../types';

interface PassengerViewProps {
  onLogout: () => void;
  onRequestRide: (req: Partial<RideRequest>) => void;
  currentRide: RideRequest | null;
  status: RideStatus;
  cancelRide: () => void;
  onRateDriver: (rating: number) => void;
  userRealLocation: Location;
  onSwitchRole: () => void;
}

const MOCK_HISTORY: RideHistoryItem[] = [
  { id: '1', date: 'Hoje, 09:30', pickup: 'Av. Brasil, 500', dropoff: 'Centro', price: 14.50, driver: 'Carlos M.', rating: 5 },
];

export const PassengerView: React.FC<PassengerViewProps> = ({ 
  onLogout, 
  onRequestRide, 
  currentRide,
  status,
  cancelRide,
  onRateDriver,
  userRealLocation,
  onSwitchRole
}) => {
  const [pickup, setPickup] = useState(userRealLocation.address);
  const [dropoff, setDropoff] = useState('');
  
  const [pickupCoords, setPickupCoords] = useState<Location>(userRealLocation);
  const [dropoffCoords, setDropoffCoords] = useState<Location | null>(null);
  
  // Dados reais da rota (não estimativa)
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeDuration, setRouteDuration] = useState(0);

  const [selectedVehicle, setSelectedVehicle] = useState(VehicleType.STANDARD);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CREDIT_CARD);
  const [step, setStep] = useState<'location' | 'vehicle' | 'active'>('location');
  const [showHistory, setShowHistory] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  useEffect(() => {
    if (userRealLocation.address !== "Patos de Minas - MG" && pickup.includes("Patos de Minas")) {
      setPickup(userRealLocation.address);
      setPickupCoords(userRealLocation);
    }
  }, [userRealLocation]);

  const geocodeAddress = async (address: string): Promise<Location | null> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name.split(',')[0]
        };
      }
      return null;
    } catch (error) {
      console.error("Erro ao geocodificar:", error);
      return null;
    }
  };

  // Busca a rota real de carro para obter distância e tempo precisos
  const fetchRouteDetails = async (start: Location, end: Location) => {
    try {
      // Usa o profile 'driving' para garantir a rota de carro mais fácil/rápida
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteDistance(route.distance / 1000); // Metros para KM
        setRouteDuration(Math.ceil(route.duration / 60)); // Segundos para Minutos
        return true;
      }
    } catch (error) {
      console.error("Erro ao calcular rota:", error);
    }
    return false;
  };

  const calculatePrice = (multiplier: number) => {
    const BASE_FARE = 4.50;
    // Preço dinâmico baseado na distância real da rota
    const dist = routeDistance > 0 ? routeDistance : 1;
    return ((BASE_FARE + (dist * 2.20)) * multiplier).toFixed(2);
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;

    setIsSearchingAddress(true);

    let finalPickup = pickupCoords;
    if (pickup !== userRealLocation.address) {
       const foundPickup = await geocodeAddress(pickup);
       if (foundPickup) finalPickup = { ...foundPickup, address: pickup };
    }

    const foundDropoff = await geocodeAddress(dropoff);
    
    if (foundDropoff) {
      setPickupCoords(finalPickup);
      setDropoffCoords(foundDropoff);
      
      // Busca detalhes da rota real antes de ir para a próxima tela
      await fetchRouteDetails(finalPickup, foundDropoff);
      
      setIsSearchingAddress(false);
      setStep('vehicle');
    } else {
      setIsSearchingAddress(false);
      alert("Endereço de destino não encontrado.");
    }
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: `Minha Localização`
          };
          setPickup(loc.address);
          setPickupCoords(loc);
          setIsLocating(false);
        },
        () => setIsLocating(false)
      );
    }
  };

  const confirmRequest = () => {
    if (!dropoffCoords) return;

    onRequestRide({
      pickup: { ...pickupCoords, address: pickup },
      dropoff: { ...dropoffCoords, address: dropoff },
      vehicleType: selectedVehicle,
      price: parseFloat(calculatePrice(VEHICLES.find(v => v.type === selectedVehicle)?.multiplier || 1)),
      distanceKm: parseFloat(routeDistance.toFixed(1)),
      estimatedTimeMin: routeDuration + 2, // Tempo de rota + 2 min margem
      paymentMethod
    });
    setStep('active');
  };

  React.useEffect(() => {
    if (status === RideStatus.COMPLETED) setShowRatingModal(true);
  }, [status]);

  const submitRating = () => {
    onRateDriver(rating);
    setShowRatingModal(false);
    setRating(0);
    setStep('location');
    setDropoff('');
    setDropoffCoords(null);
  };

  if (status !== RideStatus.IDLE && status !== RideStatus.COMPLETED && step !== 'active') {
    setStep('active');
  }

  const getPaymentIcon = (method: PaymentMethod) => {
    switch(method) {
      case PaymentMethod.CREDIT_CARD: return <CreditCard size={16} className="mr-2"/>;
      case PaymentMethod.PIX: return <QrCode size={16} className="mr-2"/>;
      case PaymentMethod.WALLET: return <Wallet size={16} className="mr-2"/>;
      case PaymentMethod.CASH: return <Banknote size={16} className="mr-2"/>;
    }
  };

  return (
    <div className="flex flex-col h-screen md:flex-row bg-white">
      <div className="w-full md:w-[400px] flex flex-col h-[50vh] md:h-full bg-white shadow-xl z-20 order-2 md:order-1 relative">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-black text-white md:bg-white md:text-black">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-xl">Já vai</h1>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onSwitchRole} className="text-xs border px-2 py-1 rounded hover:bg-gray-100 hover:text-black transition-colors" title="Alternar para Motorista">
                Sou Motorista
             </button>
             <button onClick={onLogout} className="text-sm underline opacity-80">Sair</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'location' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold">Para onde?</h2>
              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute left-3 top-3.5 text-gray-400"><Navigation size={16} className="text-black" /></div>
                  <input type="text" value={pickup} onChange={e => setPickup(e.target.value)} className="w-full bg-gray-100 p-3 pl-9 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black" placeholder="Local de partida" />
                  <button type="button" onClick={handleLocateMe} disabled={isLocating} className="absolute right-2 top-2 p-1.5 hover:bg-gray-200 rounded-full text-gray-500"><Locate size={18} className={isLocating ? "animate-spin" : ""} /></button>
                  <div className="absolute left-[19px] top-10 w-0.5 h-6 bg-gray-300 z-10"></div>
                </div>
                <div className="relative">
                   <div className="absolute left-3 top-3.5 text-gray-400"><div className="w-2 h-2 bg-black rounded-none m-1"></div></div>
                   <input type="text" value={dropoff} onChange={e => setDropoff(e.target.value)} className="w-full bg-gray-100 p-3 pl-9 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black" placeholder="Digite o endereço completo..." required />
                </div>
                <div className="pt-4">
                  <Button type="submit" isLoading={isSearchingAddress}>
                     {isSearchingAddress ? 'Calculando Rota...' : 'Buscar Corrida'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {step === 'vehicle' && (
            <div className="space-y-4 animate-fade-in">
               <button onClick={() => setStep('location')} className="text-sm text-gray-500 mb-2">← Voltar</button>
               <h2 className="text-xl font-bold mb-4">Escolha uma viagem</h2>
               <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                 <MapPin size={12}/> {routeDistance.toFixed(1)} km • <Clock size={12}/> ~{routeDuration} min
               </div>
               <div className="space-y-3">
                 {VEHICLES.map(v => (
                   <div key={v.type} onClick={() => setSelectedVehicle(v.type)} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${selectedVehicle === v.type ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-300'}`}>
                     <div className="flex items-center">
                       <img src={v.image} alt={v.type} className="w-16 h-10 object-contain mr-4" />
                       <div><h3 className="font-bold text-sm">{v.type}</h3><p className="text-xs text-gray-500">{v.desc}</p></div>
                     </div>
                     <div className="text-right"><p className="font-bold text-sm">R$ {calculatePrice(v.multiplier)}</p></div>
                   </div>
                 ))}
               </div>
               <Button onClick={confirmRequest} className="mt-4">Confirmar {selectedVehicle}</Button>
            </div>
          )}

          {step === 'active' && currentRide && (
            <div className="space-y-6 animate-fade-in">
               <div className="text-center py-4">
                  {status === RideStatus.SEARCHING && (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
                      <h2 className="text-xl font-bold text-yellow-800">Procurando Motorista...</h2>
                      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mt-2"></div>
                      <p className="text-xs text-yellow-600 mt-2">Dica: Use "Sou Motorista" no menu para aceitar.</p>
                    </div>
                  )}
                  {(status === RideStatus.ACCEPTED || status === RideStatus.ARRIVED) && (
                     <div>
                        <h2 className="text-xl font-bold">{status === RideStatus.ARRIVED ? 'Motorista chegou!' : 'Motorista a caminho'}</h2>
                        <div className="mt-4 flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-green-100">
                           <div className="flex items-center gap-3">
                             <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Driver" className="w-full h-full object-cover" /></div>
                             <div className="text-left"><p className="font-bold">João S.</p><p className="text-xs text-gray-500">4.9 • {currentRide.vehicleType}</p></div>
                           </div>
                           <p className="font-bold text-lg bg-white border px-2 rounded">{currentRide.driverPlate || 'ABC-1234'}</p>
                        </div>
                     </div>
                  )}
                  {status === RideStatus.IN_PROGRESS && (
                     <div>
                        <h2 className="text-xl font-bold text-green-600">Em viagem</h2>
                        <p className="text-gray-500 text-sm mt-2">Aproveite o passeio pela rota otimizada.</p>
                     </div>
                  )}
               </div>
               
               <div className="space-y-3">
                 {status === RideStatus.SEARCHING && <Button variant="danger" onClick={cancelRide}>Cancelar</Button>}
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 h-[50vh] md:h-full order-1 md:order-2 bg-gray-100 relative">
        <MapSimulation 
           status={status} 
           userType="passenger" 
           currentRequest={currentRide || undefined} 
           userLocation={userRealLocation}
           previewDropoff={step === 'vehicle' ? dropoffCoords : undefined}
           previewPickup={step === 'vehicle' ? pickupCoords : undefined}
        />
        {showRatingModal && (
          <div className="absolute inset-0 bg-black/70 z-[3000] flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
                <h2 className="text-2xl font-bold mb-4">Avalie sua viagem</h2>
                <div className="flex justify-center gap-2 mb-6">
                  {[1,2,3,4,5].map((star) => (<button key={star} onClick={() => setRating(star)} className={`text-3xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>))}
                </div>
                <Button onClick={submitRating} disabled={rating === 0}>Enviar</Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};