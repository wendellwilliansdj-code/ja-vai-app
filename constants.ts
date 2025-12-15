import { VehicleType, EarningsData } from './types';

export const VEHICLES = [
  {
    type: VehicleType.STANDARD,
    multiplier: 1,
    image: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
    desc: 'Viagens econômicas para o dia a dia'
  },
  {
    type: VehicleType.COMFORT,
    multiplier: 1.4,
    image: 'https://cdn-icons-png.flaticon.com/512/575/575782.png',
    desc: 'Carros mais novos com espaço extra'
  },
  {
    type: VehicleType.BLACK,
    multiplier: 2.2,
    image: 'https://cdn-icons-png.flaticon.com/512/2318/2318460.png',
    desc: 'Viagens de luxo com motoristas profissionais'
  }
];

export const MOCK_EARNINGS: EarningsData[] = [
  { day: 'Seg', amount: 120, rides: 8 },
  { day: 'Ter', amount: 145, rides: 10 },
  { day: 'Qua', amount: 90, rides: 6 },
  { day: 'Qui', amount: 180, rides: 12 },
  { day: 'Sex', amount: 240, rides: 15 },
  { day: 'Sab', amount: 310, rides: 20 },
  { day: 'Dom', amount: 190, rides: 11 },
];

// Fallback: Patos de Minas, MG (caso o GPS não seja permitido)
export const INITIAL_MAP_CENTER = {
  lat: -18.5789,
  lng: -46.5181,
  address: "Patos de Minas - MG"
};