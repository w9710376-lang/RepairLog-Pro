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

export interface JobAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
}

export type JobStatus = 'pending' | 'in_progress' | 'completed';

export interface JobHistoryEvent {
  id: string;
  jobId: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'status_changed' | 'deleted' | 'part_updated' | 'note_updated' | 'attachment_updated' | 'photo_updated';
  details: string;
  timestamp: number;
}

export interface Job {
  title: string;
  description: string;
  equipment: string;
  date: number;
  location: string;
  technicianId: string;
  technicianName: string;
  status: JobStatus;
  photos: string[];
  attachments?: JobAttachment[];
  partsUsed: Part[];
  resolutionNotes: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
