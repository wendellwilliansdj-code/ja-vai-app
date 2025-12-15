export enum UserRole {
  PASSENGER = 'PASSENGER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN'
}

export enum RideStatus {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  ACCEPTED = 'ACCEPTED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum VehicleType {
  STANDARD = 'Standard',
  COMFORT = 'Comfort',
  BLACK = 'Black'
}

export enum PaymentMethod {
  CREDIT_CARD = 'Cartão de Crédito',
  PIX = 'Pix',
  WALLET = 'Carteira Digital',
  CASH = 'Dinheiro'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  rating?: number;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  pickup: Location;
  dropoff: Location;
  vehicleType: VehicleType;
  price: number;
  status: RideStatus;
  driverId?: string;
  distanceKm: number;
  estimatedTimeMin: number;
  paymentMethod?: PaymentMethod;
  driverVehicle?: string;
  driverPlate?: string;
}

export interface RideHistoryItem {
  id: string;
  date: string;
  pickup: string;
  dropoff: string;
  price: number;
  driver: string;
  rating?: number;
}

export interface EarningsData {
  day: string;
  amount: number;
  rides: number;
}