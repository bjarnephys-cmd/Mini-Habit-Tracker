import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Habit, DailyHabitLog, ExercisePlan, CalendarReminder } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface SyncedBoardData {
  habits: Habit[];
  logs: Record<string, DailyHabitLog>;
  exercises: ExercisePlan[];
  reminders: CalendarReminder[];
  ownerId: string;
  updatedAt: string;
}

/**
 * Saves habit board data to Firestore for the authenticated user
 */
export async function saveBoardToCloud(userId: string, data: {
  habits: Habit[];
  logs: Record<string, DailyHabitLog>;
  exercises: ExercisePlan[];
  reminders: CalendarReminder[];
}): Promise<void> {
  const docPath = `users/${userId}/data/board`;
  try {
    const payload: SyncedBoardData = {
      ownerId: userId,
      updatedAt: new Date().toISOString(),
      habits: data.habits,
      logs: data.logs,
      exercises: data.exercises,
      reminders: data.reminders,
    };
    await setDoc(doc(db, 'users', userId, 'data', 'board'), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Subscribes in real time to board changes from another device
 */
export function subscribeToCloudBoard(
  userId: string,
  onUpdate: (data: Partial<SyncedBoardData>) => void,
  onError?: (err: Error) => void
) {
  const docPath = `users/${userId}/data/board`;
  const docRef = doc(db, 'users', userId, 'data', 'board');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SyncedBoardData;
        onUpdate(data);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  );
}
