import { 
  writeBatch,
  doc,
  DocumentData,
  DocumentReference,
  WriteBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const BATCH_LIMIT = 500; // Firestore 배치 작업 제한

interface BatchOperation {
  type: 'set' | 'update' | 'delete';
  ref: DocumentReference<DocumentData>;
  data?: DocumentData;
}

export class BatchService {
  private operations: BatchOperation[] = [];
  private currentBatch: WriteBatch;

  constructor() {
    this.currentBatch = writeBatch(db);
  }

  private async executeBatch() {
    await this.currentBatch.commit();
    this.currentBatch = writeBatch(db);
  }

  async add(operation: BatchOperation) {
    this.operations.push(operation);

    switch (operation.type) {
      case 'set':
        this.currentBatch.set(operation.ref, operation.data!);
        break;
      case 'update':
        this.currentBatch.update(operation.ref, operation.data!);
        break;
      case 'delete':
        this.currentBatch.delete(operation.ref);
        break;
    }

    if (this.operations.length >= BATCH_LIMIT) {
      await this.executeBatch();
      this.operations = [];
    }
  }

  async commit() {
    if (this.operations.length > 0) {
      await this.executeBatch();
      this.operations = [];
    }
  }
}

// 배치 작업 유틸리티 함수들
export const batchSet = async (
  collectionPath: string,
  documents: { id: string; data: DocumentData }[]
) => {
  const batchService = new BatchService();

  for (const { id, data } of documents) {
    await batchService.add({
      type: 'set',
      ref: doc(db, collectionPath, id),
      data
    });
  }

  await batchService.commit();
};

export const batchUpdate = async (
  collectionPath: string,
  updates: { id: string; data: Partial<DocumentData> }[]
) => {
  const batchService = new BatchService();

  for (const { id, data } of updates) {
    await batchService.add({
      type: 'update',
      ref: doc(db, collectionPath, id),
      data
    });
  }

  await batchService.commit();
};

export const batchDelete = async (
  collectionPath: string,
  documentIds: string[]
) => {
  const batchService = new BatchService();

  for (const id of documentIds) {
    await batchService.add({
      type: 'delete',
      ref: doc(db, collectionPath, id)
    });
  }

  await batchService.commit();
}; 