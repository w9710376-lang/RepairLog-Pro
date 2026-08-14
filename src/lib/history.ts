import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { JobHistoryEvent } from '../types';

export const logJobHistory = async (
  jobId: string,
  userId: string,
  userName: string,
  action: JobHistoryEvent['action'],
  details: string
) => {
  try {
    const historyRef = collection(db, 'jobHistory');
    await addDoc(historyRef, {
      jobId,
      userId,
      userName,
      action,
      details,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Failed to log job history", error);
  }
};
