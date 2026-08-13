export type Role = 'admin' | 'technician';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
}

export interface Part {
  name: string;
  cost: number;
  quantity: number;
}

export type JobStatus = 'pending' | 'in_progress' | 'completed';

export interface Job {
  id: string;
  title: string;
  description: string;
  equipment: string;
  date: number;
  location: string;
  technicianId: string;
  technicianName: string;
  status: JobStatus;
  photos: string[];
  partsUsed: Part[];
  resolutionNotes: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
