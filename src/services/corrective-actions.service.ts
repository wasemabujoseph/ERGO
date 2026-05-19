import { fetchRows, appendRow, updateRowInSheet, isSheetsConfigured } from '../lib/googleSheets';

export interface CorrectiveAction {
  id: string;
  workstationId: string;
  description: string;
  budget: number;
  owner: string;
  status: string;
  date: string;
}

const LOCAL_STORAGE_KEY = 'ergoflow_corrective_actions';

function getLocalCorrectiveActions(): CorrectiveAction[] {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  return local ? JSON.parse(local) : [];
}

function saveLocalCorrectiveActions(data: CorrectiveAction[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export async function getCorrectiveActions(): Promise<CorrectiveAction[]> {
  if (isSheetsConfigured()) {
    try {
      const data = await fetchRows<CorrectiveAction>('CorrectiveActions');
      if (data && data.length > 0) {
        saveLocalCorrectiveActions(data);
        return data;
      }
    } catch (error) {
      console.warn('[CorrectiveActionsService] Failed to fetch from Google Sheets. Using local backup.');
    }
  }
  return getLocalCorrectiveActions();
}

export async function createCorrectiveAction(action: Omit<CorrectiveAction, 'id'>): Promise<CorrectiveAction> {
  const id = `ecr-${Date.now().toString().slice(-3)}`;
  const newAction: CorrectiveAction = { ...action, id };

  if (isSheetsConfigured()) {
    try {
      const result = await appendRow<CorrectiveAction>('CorrectiveActions', newAction);
      const local = getLocalCorrectiveActions();
      saveLocalCorrectiveActions([result, ...local]);
      return result;
    } catch (error) {
      console.error('[CorrectiveActionsService] Failed to save to Google Sheets, saving locally.');
    }
  }

  const local = getLocalCorrectiveActions();
  const updated = [newAction, ...local];
  saveLocalCorrectiveActions(updated);
  return newAction;
}

export async function updateCorrectiveActionStatus(id: string, status: string): Promise<CorrectiveAction> {
  if (isSheetsConfigured()) {
    try {
      const result = await updateRowInSheet<CorrectiveAction>('CorrectiveActions', id, { status });
      const local = getLocalCorrectiveActions();
      const updatedLocal = local.map(a => a.id === id ? { ...a, status } : a);
      saveLocalCorrectiveActions(updatedLocal);
      return result;
    } catch (error) {
      console.error('[CorrectiveActionsService] Failed to update status in Google Sheets, updating locally.');
    }
  }

  const local = getLocalCorrectiveActions();
  let updatedAction: CorrectiveAction | null = null;
  const updated = local.map(a => {
    if (a.id === id) {
      updatedAction = { ...a, status };
      return updatedAction;
    }
    return a;
  });

  if (!updatedAction) {
    throw new Error(`Corrective Action ECR with id ${id} not found.`);
  }

  saveLocalCorrectiveActions(updated);
  return updatedAction;
}
