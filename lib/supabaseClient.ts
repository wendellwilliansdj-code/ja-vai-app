import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function DriverView() {
  const [rides, setRides] = useState<any[]>([]);

  useEffect(() => {
    // Busca corridas pendentes
    const fetchRides = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'pending');
      if (error) console.error(error);
      else setRides(data);
    };

    fetchRides();

    // Realtime: adiciona novas corridas e atualiza existentes
    const subscription = supabase
      .from('rides')
      .on('INSERT', payload => setRides(prev => [...prev, payload.new]))
      .on('UPDATE', payload =>
        setRides(prev =>
          prev.map(r => (r.id === payload.new.id ? payload.new : r))
        )
      )
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, []);

  const acceptRide = async (rideId: string) => {
    const { data, error } = await supabase
      .from('rides')
      .update({ status: 'accepted', driver_id: 'meu_driver_id' }) // Substitua pelo ID real do motorista
      .eq('id', rideId);

    if (error) console.error(error);
    else console.log('Corrida aceita:', data);
  };

  return (
    <div className="p-4">
      {rides.length === 0 ? (
        <p>Sem corridas disponíveis no momento.</p>
      ) : (
        rides.map(ride => (
          <div key={ride.id} className="mb-4 p-4 border rounded shadow">
            <p><strong>Origem:</strong> {ride.origin}</p>
            <p><strong>Destino:</strong> {ride.destination}</p>
            <button
              className="mt-2 px-4 py-2 bg-brand-accent text-white rounded"
              onClick={() => acceptRide(ride.id)}
            >
              Aceitar Corrida
            </button>
          </div>
        ))
      )}
    </div>
  );
}
