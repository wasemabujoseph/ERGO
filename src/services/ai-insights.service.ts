import { fetchRows, appendRow, isSheetsConfigured } from '../lib/googleSheets';

export interface AIInsight {
  id: string;
  workstationId?: string;
  task: string;
  hazardDetected: boolean;
  estimatedAngle: string;
  rulaCalculated: number;
  criticalFinding: string;
  engineeringMitigation: string;
  date: string;
}

const LOCAL_STORAGE_KEY = 'ergoflow_ai_insights';

function getLocalAIInsights(): AIInsight[] {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  return local ? JSON.parse(local) : [];
}

function saveLocalAIInsights(data: AIInsight[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export async function getAIInsights(): Promise<AIInsight[]> {
  if (isSheetsConfigured()) {
    try {
      const data = await fetchRows<AIInsight>('AIInsights');
      if (data && data.length > 0) {
        saveLocalAIInsights(data);
        return data;
      }
    } catch (error) {
      console.warn('[AIInsightsService] Failed to fetch from Google Sheets. Using local backup.');
    }
  }
  return getLocalAIInsights();
}

export async function createAIInsight(insight: Omit<AIInsight, 'id'>): Promise<AIInsight> {
  const id = `ai-ins-${Date.now().toString().slice(-4)}`;
  const newInsight: AIInsight = { ...insight, id };

  if (isSheetsConfigured()) {
    try {
      const result = await appendRow<AIInsight>('AIInsights', newInsight);
      const local = getLocalAIInsights();
      saveLocalAIInsights([result, ...local]);
      return result;
    } catch (error) {
      console.error('[AIInsightsService] Failed to save to Google Sheets, saving locally.');
    }
  }

  const local = getLocalAIInsights();
  const updated = [newInsight, ...local];
  saveLocalAIInsights(updated);
  return newInsight;
}
export async function getPlants() {
  return [
    { id: 'plant-1', name: 'Detroit Assembly Plant' },
    { id: 'plant-2', name: 'Chicago Stamping Facility' },
    { id: 'plant-3', name: 'Munich Packaging Hub' }
  ];
}
