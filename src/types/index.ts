export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface Vehicle {
  id: string;
  aadharNumber: string;
  mobileNumber: string;
  registeredOwnerName: string;
  registrationNumber: string;
  guardianInfo: string;
  dateOfRegistration: string;
  address: string;
  registrationValidUpto: string;
  taxUpto: string;
  insuranceUpto: string;
  fcValidUpto: string;
  hypothecatedTo: string;
  permitUpto: string;
  chassisNumber: string;
  bodyType: string;
  engineNumber: string;
  colour: string;
  vehicleClass: string;
  fuelUsed: string;
  makersName: string;
  cubicCapacity: string;
  makersClassification: string;
  seatingCapacity: string;
  monthYearOfManufacture: string;
  ulw: string;
  gvw: string;
  subject: string;
  registeringAuthority: string;
  pucNumber: string;
  pucDate: string;
  pucTenure: string;
  pucFrom: string;
  pucTo: string;
  pucContactNo: string;
  pucAddress: string;
  insuranceCompanyName: string;
  insuranceType: string;
  policyNumber: string;
  insuranceDate: string;
  insuranceTenure: string;
  insuranceFrom: string;
  insuranceTo: string;
  insuranceContactNo: string;
  insuranceAddress: string;
  type: string;
  // FITNESS
  fcNumber: string;
  fcTenureFrom: string;
  fcTenureTo: string;
  fcContactNo: string;
  fcAddress: string;
  // PERMIT
  permitNumber: string;
  permitTenureFrom: string;
  permitTenureTo: string;
  permitContactNo: string;
  permitAddress: string;
  // TAX
  taxNumber: string;
  taxTenureFrom: string;
  taxTenureTo: string;
  taxContactNo: string;
  taxAddress: string;
}

export interface DashboardStat {
  title: string;
  value: number;
  icon: string;
  change: number;
  color: string;
  bgColor?: string;
  label: string; 
}

export interface ServiceOrder {
  id: string;
  vehicleNumber: string;
  serviceType: 'TRANSFER' | 'PERMIT' | 'HPA' | 'HPT' | 'FITNESS' | 'POLLUTION' | 'INSURANCE';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  customerName: string;
  agentName?: string;
  amountPaid:number;
}

export interface RenewalDue {
  id: string;
  vehicleNumber: string;
  ownerName: string;
  renewalType: 'INSURANCE' | 'TAX' | 'FC' | 'PERMIT' | 'PUC';
  dueDate: string;
  status: 'UPCOMING' | 'OVERDUE';
  daysLeft: number;
  amount: number;
  vehicleDetails?: {
    makersName: string;
    model: string;
    registrationDate: string;
    chassisNumber: string;
    engineNumber: string;
    fuelType: string;
  };
}