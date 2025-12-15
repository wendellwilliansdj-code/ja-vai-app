import React, { useState, useEffect } from 'react';
import { UserRole, RideStatus, RideRequest, PaymentMethod, VehicleType, Location } from './types';
import { PassengerView } from './components/Passenger/PassengerView';
import { DriverView } from './components/Driver/DriverView';
import { AdminPanel } from './components/Admin/AdminPanel';
import { ChatWidget } from './components/Chat/ChatWidget';
import { AuthScreen } from './components/Auth/AuthScreen';
import { INITIAL_MAP_CENTER } from './constants';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserRole | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [rideStatus, setRideStatus] = useState<RideStatus>(RideStatus.IDLE);
  const [currentRide, setCurrentRide] = useState<RideRequest | null>(null);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [driverEarnings, setDriverEarnings] = useState(84.50);
  
  // Estado para localização real do usuário (GPS Sincronizado)
  const [userLocation, setUserLocation] = useState<Location>(INITIAL_MAP_CENTER);

  // Inicialização do Supabase Auth e GPS
  useEffect(() => {
    // 1. Verificar sessão atual do Supabase
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const role = session.user.user_metadata?.role as UserRole || UserRole.PASSENGER;
        setCurrentUser(role);
      }
      setLoadingSession(false);
    };

    checkSession();

    // 2. Ouvir mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role as UserRole || UserRole.PASSENGER;
        setCurrentUser(role);
      } else {
        setCurrentUser(null);
      }
    });

    const savedEarnings = localStorage.getItem('javai_driverEarnings');
    if (savedEarnings) setDriverEarnings(parseFloat(savedEarnings));

    // 3. RASTREAMENTO GPS
    let watchId: number;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Minha Localização Atual" 
          });
        },
        (error) => {
          console.warn("GPS Real indisponível, usando fallback.", error);
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 0, 
          timeout: 5000 
        }
      );
    }

    return () => {
      authListener.subscription.unsubscribe();
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('javai_driverEarnings', driverEarnings.toString());
  }, [driverEarnings]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setRideStatus(RideStatus.IDLE);
    setCurrentRide(null);
    setIsDriverOnline(false);
  };

  const switchRole = () => {
    // Função utilitária para permitir testes de fluxo completo em um único dispositivo
    if (currentUser === UserRole.PASSENGER) {
      setCurrentUser(UserRole.DRIVER);
      setIsDriverOnline(true);
    } else {
      setCurrentUser(UserRole.PASSENGER);
    }
  };

  // Passenger creates request
  const handleRequestRide = (req: Partial<RideRequest>) => {
    setRideStatus(RideStatus.SEARCHING);
    const newRide: RideRequest = {
      id: Date.now().toString(),
      passengerId: 'p1',
      passengerName: 'Você',
      pickup: req.pickup!,
      dropoff: req.dropoff!,
      vehicleType: req.vehicleType!,
      price: req.price!,
      status: RideStatus.SEARCHING,
      distanceKm: req.distanceKm!,
      estimatedTimeMin: req.estimatedTimeMin!,
      paymentMethod: req.paymentMethod
    };
    setCurrentRide(newRide);
  };

  // Driver accepts request
  const handleDriverAccept = () => {
    setRideStatus(RideStatus.ACCEPTED);
    setCurrentRide(prev => prev ? { 
      ...prev, 
      status: RideStatus.ACCEPTED, 
      driverId: 'me',
      driverVehicle: 'Honda Civic',
      driverPlate: 'JAV-2024'
    } : null);
    
    // Inicia a viagem automaticamente após aceitar (Fluxo simplificado)
    setTimeout(() => {
      setRideStatus(RideStatus.IN_PROGRESS);
    }, 1000);
  };

  // Driver finishes request
  const handleCompleteRide = () => {
    setRideStatus(RideStatus.COMPLETED);
    if (currentRide) {
       setDriverEarnings(prev => prev + currentRide.price);
    }

    // Reset loop after 3s
    setTimeout(() => {
       setRideStatus(RideStatus.IDLE);
       setCurrentRide(null);
    }, 3000);
  };

  const handleRateDriver = (rating: number) => {
     setRideStatus(RideStatus.IDLE);
     setCurrentRide(null);
  };

  const cancelRide = () => {
    setRideStatus(RideStatus.IDLE);
    setCurrentRide(null);
  };

  if (loadingSession) {
    return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Carregando Já vai...</div>;
  }

  if (!currentUser) {
    return <AuthScreen onLogin={setCurrentUser} />;
  }

  return (
    <>
      {currentUser === UserRole.PASSENGER && (
        <PassengerView 
          onLogout={handleLogout} 
          onRequestRide={handleRequestRide}
          currentRide={currentRide}
          status={rideStatus}
          cancelRide={cancelRide}
          onRateDriver={handleRateDriver}
          userRealLocation={userLocation}
          onSwitchRole={switchRole}
        />
      )}

      {currentUser === UserRole.DRIVER && (
        <DriverView 
          onLogout={handleLogout}
          incomingRequest={rideStatus === RideStatus.SEARCHING ? currentRide : null}
          currentRide={currentRide}
          acceptRide={handleDriverAccept}
          completeRide={handleCompleteRide}
          status={rideStatus}
          isOnline={isDriverOnline}
          toggleOnline={() => setIsDriverOnline(!isDriverOnline)}
          userRealLocation={userLocation}
          onSwitchRole={switchRole}
        />
      )}

      {currentUser === UserRole.ADMIN && (
        <AdminPanel onLogout={handleLogout} />
      )}

      {/* Global AI Chat Support */}
      <ChatWidget userRole={currentUser} />
    </>
  );
}