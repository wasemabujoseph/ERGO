import { fetchRows, appendRow, isSheetsConfigured } from '../lib/googleSheets';

export interface Assessment {
  id: string;
  workstationId: string;
  type: 'reba_rula' | 'niosh' | 'pushpull' | 'audit';
  date: string;
  evaluator: string;
  score: number;
  details: string;
  metadata?: any;
}

const LOCAL_STORAGE_KEY = 'ergoflow_assessments';

function getLocalAssessments(): Assessment[] {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  return local ? JSON.parse(local) : [];
}

function saveLocalAssessments(data: Assessment[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export async function getAssessments(): Promise<Assessment[]> {
  if (isSheetsConfigured()) {
    try {
      const data = await fetchRows<Assessment>('Assessments');
      if (data && data.length > 0) {
        saveLocalAssessments(data);
        return data;
      }
    } catch (error) {
      console.warn('[AssessmentsService] Failed to fetch from Google Sheets. Using local backup.');
    }
  }
  return getLocalAssessments();
}

export async function createAssessment(assessment: Omit<Assessment, 'id'>): Promise<Assessment> {
  const id = `assess-${Date.now().toString().slice(-4)}`;
  const newAssessment: Assessment = { ...assessment, id };

  if (isSheetsConfigured()) {
    try {
      const result = await appendRow<Assessment>('Assessments', newAssessment);
      const local = getLocalAssessments();
      saveLocalAssessments([result, ...local]);
      return result;
    } catch (error) {
      console.error('[AssessmentsService] Failed to save to Google Sheets, saving locally.');
    }
  }

  const local = getLocalAssessments();
  const updated = [newAssessment, ...local];
  saveLocalAssessments(updated);
  return newAssessment;
}
