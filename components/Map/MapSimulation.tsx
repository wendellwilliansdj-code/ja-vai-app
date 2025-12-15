import React, { useEffect, useRef, useState } from 'react';
import { RideStatus, RideRequest, Location } from '../../types';

// Declaração global do Leaflet
declare const L: any;

interface MapSimulationProps {
  status: RideStatus;
  userType: 'passenger' | 'driver' | 'admin';
  currentRequest?: RideRequest;
  userLocation?: Location;
  previewPickup?: Location | null;
  previewDropoff?: Location | null;
}

export const MapSimulation: React.FC<MapSimulationProps> = ({ 
  status, 
  userType, 
  currentRequest, 
  userLocation,
  previewPickup,
  previewDropoff
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  // Refs para marcadores
  const driverMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  
  // Controle de rota real
  const routeCoordsRef = useRef<[number, number][]>([]); // Array de lat/lng da rota real
  const animationFrameRef = useRef<number>(0);
  const routeProgressIndexRef = useRef<number>(0); 

  const createCustomIcon = (type: 'car' | 'pickup' | 'dropoff' | 'user') => {
    let html = '';
    let className = '';
    let iconSize = [32, 32];
    
    if (type === 'car') {
      html = `<div style="background:black; color:white; padding:6px; border-radius:50%; border:2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              </div>`;
      className = 'custom-car-icon';
    } else if (type === 'pickup') {
      html = `<div style="background:black; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
      className = 'custom-pickup-icon';
      iconSize = [16, 16];
    } else if (type === 'dropoff') {
      html = `<div style="display:flex; flex-direction:column; align-items:center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>
              </div>`;
      className = 'custom-dropoff-icon';
      iconSize = [32, 32];
    } else if (type === 'user') {
      html = `<div style="background:#2563EB; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);"></div>`;
      className = 'custom-user-icon';
      iconSize = [12, 12];
    }

    return L.divIcon({ className, html, iconSize, iconAnchor: [iconSize[0]/2, iconSize[1]/2] });
  };

  // 1. Inicializa o Mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([0, 0], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Atualiza Posição do Usuário (GPS Real)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation || userLocation.lat === 0) return;

    const userPos = [userLocation.lat, userLocation.lng];

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(userPos, {
        icon: createCustomIcon('user'),
        zIndexOffset: 900
      }).addTo(map);
      map.setView(userPos, 16);
    } else {
      userMarkerRef.current.setLatLng(userPos);
      
      // Se for Motorista ou Admin e não tiver rota, segue o usuário
      if ((userType === 'driver' || userType === 'admin') && status === RideStatus.IDLE) {
          map.setView(userPos, 16, { animate: true });
      }
    }
  }, [userLocation, status, userType]);

  // 3. Helper Fetch de Rota Real (OSRM)
  const fetchRealRoute = async (start: [number, number], end: [number, number]) => {
    try {
      // alternatives=false garante que o OSRM devolva apenas a melhor rota (mais fácil/rápida)
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=false&steps=true`);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        // OSRM retorna GeoJSON [lng, lat], Leaflet usa [lat, lng]
        const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        return coords;
      }
    } catch (e) {
      console.error("Erro ao buscar rota OSRM:", e);
    }
    // Fallback: Linha reta se a API falhar
    return [start, end];
  };

  // 4. Gerenciamento da Missão (Rota, Pickup, Dropoff)
  // Lida tanto com currentRequest quanto com preview (quando usuário está escolhendo veículo)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let targetPickup = currentRequest ? currentRequest.pickup : previewPickup;
    let targetDropoff = currentRequest ? currentRequest.dropoff : previewDropoff;

    // Se não tiver destino, limpa
    if (!targetPickup || !targetDropoff) {
      if (pickupMarkerRef.current) pickupMarkerRef.current.remove();
      if (dropoffMarkerRef.current) dropoffMarkerRef.current.remove();
      if (routePolylineRef.current) routePolylineRef.current.remove();
      if (driverMarkerRef.current && userType === 'passenger') driverMarkerRef.current.remove();
      
      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
      routePolylineRef.current = null;
      if (userType === 'passenger') driverMarkerRef.current = null;
      
      routeCoordsRef.current = [];
      routeProgressIndexRef.current = 0;
      return;
    }

    const pickupCoords: [number, number] = [targetPickup.lat, targetPickup.lng];
    const dropoffCoords: [number, number] = [targetDropoff.lat, targetDropoff.lng];

    // Adicionar Marcadores
    if (!pickupMarkerRef.current) pickupMarkerRef.current = L.marker(pickupCoords, { icon: createCustomIcon('pickup') }).addTo(map);
    else pickupMarkerRef.current.setLatLng(pickupCoords);

    if (!dropoffMarkerRef.current) dropoffMarkerRef.current = L.marker(dropoffCoords, { icon: createCustomIcon('dropoff') }).addTo(map);
    else dropoffMarkerRef.current.setLatLng(dropoffCoords);

    // Buscar e Desenhar Rota Real
    const updateRoute = async () => {
      const routePoints = await fetchRealRoute(pickupCoords, dropoffCoords);
      routeCoordsRef.current = routePoints;

      if (routePolylineRef.current) routePolylineRef.current.remove();
      
      routePolylineRef.current = L.polyline(routePoints, {
        color: '#2563EB', // Azul padrão GPS (mais visível)
        weight: 5,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Zoom na rota
      map.fitBounds(L.latLngBounds(routePoints), { padding: [50, 50] });

      // Configuração do Carro do Motorista (Visualização do Passageiro)
      // Exibe apenas se o status for ACCEPTED, ARRIVED ou IN_PROGRESS
      const shouldShowCar = userType === 'passenger' && (status === RideStatus.ACCEPTED || status === RideStatus.ARRIVED || status === RideStatus.IN_PROGRESS);

      if (shouldShowCar && !driverMarkerRef.current && routePoints.length > 0) {
         const startIdx = 0;
         driverMarkerRef.current = L.marker(routePoints[startIdx], {
             icon: createCustomIcon('car'),
             zIndexOffset: 1000
         }).addTo(map);
         // Resetar índice da rota ao criar o marcador
         routeProgressIndexRef.current = 0;
      } else if (!shouldShowCar && driverMarkerRef.current) {
         driverMarkerRef.current.remove();
         driverMarkerRef.current = null;
      }
    };

    updateRoute();

  }, [currentRequest, previewPickup, previewDropoff, userType, status]); // Adicionado status


  // 5. Animação do Carro
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!currentRequest || !map) return;

    // SE SOU MOTORISTA: O carro sou eu (GPS Real)
    if (userType === 'driver') {
        if (driverMarkerRef.current) driverMarkerRef.current.remove();
        return; 
    }

    // SE SOU PASSAGEIRO: Simular carro
    const animateCar = () => {
      if (!driverMarkerRef.current || routeCoordsRef.current.length === 0) return;

      const route = routeCoordsRef.current;
      
      // Velocidade da simulação
      const speedMultiplier = 2; 

      // Movimenta o carro se estiver em progresso ou aceito (simulando chegada/viagem)
      if (status === RideStatus.ACCEPTED || status === RideStatus.IN_PROGRESS) {
        routeProgressIndexRef.current += speedMultiplier;
        
        // Loop da animação
        if (routeProgressIndexRef.current >= route.length) {
            if (status === RideStatus.ACCEPTED) routeProgressIndexRef.current = 0; 
            else routeProgressIndexRef.current = route.length - 1; 
        }

        const newPos = route[Math.floor(routeProgressIndexRef.current)];
        if (newPos) {
           driverMarkerRef.current.setLatLng(newPos);
           
           // Se estiver na viagem, o passageiro (userMarker) move junto com o carro
           if (status === RideStatus.IN_PROGRESS && userMarkerRef.current) {
              userMarkerRef.current.setLatLng(newPos);
           }
        }
      }
      
      if (routeProgressIndexRef.current < route.length) {
         animationFrameRef.current = requestAnimationFrame(animateCar);
      }
    };

    if (routeCoordsRef.current.length > 0) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(animateCar);
    }

    return () => cancelAnimationFrame(animationFrameRef.current);

  }, [status, currentRequest, userType]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner border border-gray-200">
      <div id="map" ref={mapContainerRef} className="w-full h-full bg-gray-100" />
      <div className="absolute bottom-1 right-1 bg-white/80 px-2 py-0.5 text-[10px] text-gray-500 z-[1000] pointer-events-none rounded">
        © OpenStreetMap contributors, OSRM
      </div>
    </div>
  );
};