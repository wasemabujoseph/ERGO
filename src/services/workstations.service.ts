import { fetchRows, appendRow, updateRowInSheet, isSheetsConfigured } from '../lib/googleSheets';

export interface Workstation {
  id: string;
  name: string;
  department: string;
  stage: string; // risk_detected, ai_evaluation, corrective_action, compliance
  riskScore: number;
  rebaScore: number;
  rulaScore: number;
  assignedOperator: string;
  shift: string;
  exposureHours: number;
  lastUpdate: string;
  history: Array<{ date: string; event: string; details: string }>;
  violations: string[];
  actionPlan: string;
  companyId: string;
  plantId: string;
}

export interface TenantPlant {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number]; // [lat, lng] for rendering on the map
  status: 'nominal' | 'warning' | 'critical';
}

export interface TenantCompany {
  id: string;
  name: string;
  plants: TenantPlant[];
}

export const ENTERPRISE_TENANTS: TenantCompany[] = [
  {
    id: 'co-1',
    name: 'Tesla Inc.',
    plants: [
      { id: 'pl-1', name: 'Texas Gigafactory', location: 'Austin, USA', coordinates: [30.224, -97.625], status: 'warning' },
      { id: 'pl-2', name: 'Berlin Gigafactory', location: 'Berlin, Germany', coordinates: [52.391, 13.791], status: 'nominal' }
    ]
  },
  {
    id: 'co-2',
    name: 'BMW Group',
    plants: [
      { id: 'pl-3', name: 'Munich Assembly', location: 'Munich, Germany', coordinates: [48.179, 11.574], status: 'critical' },
      { id: 'pl-4', name: 'Regensburg Plant', location: 'Regensburg, Germany', coordinates: [48.995, 12.128], status: 'nominal' }
    ]
  },
  {
    id: 'co-3',
    name: 'General Motors',
    plants: [
      { id: 'pl-5', name: 'Detroit Assembly', location: 'Detroit, USA', coordinates: [42.381, -83.023], status: 'warning' },
      { id: 'pl-6', name: 'Ramos Arizpe Plant', location: 'Ramos Arizpe, Mexico', coordinates: [25.539, -100.932], status: 'nominal' }
    ]
  }
];

const MOCK_WORKSTATIONS: Workstation[] = [
  // Tesla Austin (pl-1)
  {
    id: 'node-101',
    name: 'Packing Station 04B',
    department: 'Packaging',
    stage: 'corrective_action',
    riskScore: 78,
    rebaScore: 8,
    rulaScore: 7,
    assignedOperator: 'John Doe',
    shift: 'A',
    exposureHours: 8,
    lastUpdate: '2026-05-18',
    history: [
      { date: '2026-05-14', event: 'Initial RULA / REBA Assessment Logged', details: 'Trunk flexing > 45° identified. Score: 8/10 (High Risk).' },
      { date: '2026-05-15', event: 'AI Visual Risk Analysis Completed', details: 'Gemini recommended a lift table layout change and a 150mm height adjustment.' },
      { date: '2026-05-16', event: 'Engineering Change Request (ECR-401) Issued', details: 'Priced at $1,400. Assigned to Sarah Rivera.' }
    ],
    violations: ['Awkward static bending', 'Excessive wrist deviation'],
    actionPlan: 'Install scissor lift table to support pallet loading heights dynamically.',
    companyId: 'co-1',
    plantId: 'pl-1'
  },
  {
    id: 'node-102',
    name: 'Battery Pack Assembly Dock',
    department: 'Battery Assembly',
    stage: 'risk_detected',
    riskScore: 85,
    rebaScore: 10,
    rulaScore: 8,
    assignedOperator: 'Marcus Chen',
    shift: 'B',
    exposureHours: 6,
    lastUpdate: '2026-05-17',
    history: [
      { date: '2026-05-17', event: 'Sensor Triggered Overload Alert', details: 'Push force exceeded rules threshold (24 kg-f required to launch cart).' }
    ],
    violations: ['Excessive manual cart inertia', 'Torso twisting during lift'],
    actionPlan: 'Upgrade roller casters to 150mm high efficiency polyurethane.',
    companyId: 'co-1',
    plantId: 'pl-1'
  },
  {
    id: 'node-103',
    name: 'Austin Drive Unit Bay 12',
    department: 'Powertrain',
    stage: 'compliance',
    riskScore: 24,
    rebaScore: 2,
    rulaScore: 3,
    assignedOperator: 'Emma Watson',
    shift: 'A',
    exposureHours: 8,
    lastUpdate: '2026-05-18',
    history: [
      { date: '2026-05-10', event: 'Assessment registered', details: 'Primary arm reach circle evaluated at 38cm (Optimal).' },
      { date: '2026-05-12', event: 'AI validation pass', details: 'Clear structural clearance confirmed.' },
      { date: '2026-05-18', event: 'Compliance verification completed', details: 'ISO 11228 compliance cert logged.' }
    ],
    violations: [],
    actionPlan: 'Regular posture audit verification scheduled quarterly.',
    companyId: 'co-1',
    plantId: 'pl-1'
  },
  // Tesla Berlin (pl-2)
  {
    id: 'node-104',
    name: 'Stamping Press Control Panel',
    department: 'Stamping',
    stage: 'compliance',
    riskScore: 15,
    rebaScore: 1,
    rulaScore: 2,
    assignedOperator: 'Dieter Müller',
    shift: 'A',
    exposureHours: 8,
    lastUpdate: '2026-05-15',
    history: [
      { date: '2026-05-15', event: 'ErgoAudit completed', details: 'Ergonomic stand-up mat and console rotation angle verified.' }
    ],
    violations: [],
    actionPlan: 'Monitor keyboard placement height quarterly.',
    companyId: 'co-1',
    plantId: 'pl-2'
  },
  // BMW Munich (pl-3)
  {
    id: 'node-105',
    name: 'BMW Trim Line 3 - Overhead Cable Harness',
    department: 'Final Assembly',
    stage: 'risk_detected',
    riskScore: 92,
    rebaScore: 11,
    rulaScore: 9,
    assignedOperator: 'Hans Schmidt',
    shift: 'A',
    exposureHours: 8,
    lastUpdate: '2026-05-18',
    history: [
      { date: '2026-05-18', event: 'Extreme Overhead Reach Alert', details: 'Operator spends > 40% of cycle time with hands above shoulder level. RULA: 9.' }
    ],
    violations: ['High-frequency overhead loading', 'Shoulder extension'],
    actionPlan: 'Provide mechanical overhead manipulator arm or implement job rotation.',
    companyId: 'co-2',
    plantId: 'pl-3'
  },
  {
    id: 'node-106',
    name: 'Body Welding Cell B-34',
    department: 'Welding',
    stage: 'ai_evaluation',
    riskScore: 65,
    rebaScore: 7,
    rulaScore: 6,
    assignedOperator: 'Luca Rossi',
    shift: 'C',
    exposureHours: 8,
    lastUpdate: '2026-05-17',
    history: [
      { date: '2026-05-16', event: 'Initial assessment logged', details: 'Torso flexion of 35 degrees during heavy tool support.' }
    ],
    violations: ['Unbalanced load holding'],
    actionPlan: 'Awaiting AI vision posture analysis to optimize overhead spring balancer tension.',
    companyId: 'co-2',
    plantId: 'pl-3'
  },
  // BMW Regensburg (pl-4)
  {
    id: 'node-107',
    name: 'BMW Cockpit Insertion JIG',
    department: 'Assembly',
    stage: 'compliance',
    riskScore: 32,
    rebaScore: 3,
    rulaScore: 3,
    assignedOperator: 'Klara Weber',
    shift: 'B',
    exposureHours: 8,
    lastUpdate: '2026-05-12',
    history: [
      { date: '2026-05-12', event: 'Compliance verification', details: 'Articulated manipulator arm completely eliminates static lift weight.' }
    ],
    violations: [],
    actionPlan: 'Ensure monthly calibration audits of the cockpit lifting arm.',
    companyId: 'co-2',
    plantId: 'pl-4'
  },
  // GM Detroit (pl-5)
  {
    id: 'node-108',
    name: 'Detroit Seat Install Bay 01',
    department: 'Trim Assembly',
    stage: 'corrective_action',
    riskScore: 82,
    rebaScore: 9,
    rulaScore: 8,
    assignedOperator: 'Robert Davis',
    shift: 'A',
    exposureHours: 10,
    lastUpdate: '2026-05-18',
    history: [
      { date: '2026-05-12', event: 'Postural Alert Traced', details: 'Repetitive spine twisting to pull heavy seat components into cab. REBA: 9.' },
      { date: '2026-05-14', event: 'AI Engineering Action Recommendation', details: 'Suggested mechanical lifter rail installation.' },
      { date: '2026-05-15', event: 'ECR-502 created', details: 'Budget $2,800. Assigned to engineering leader Kyle Vance.' }
    ],
    violations: ['Heavy lift twisting', 'Lateral neck bending'],
    actionPlan: 'Retrofit tool balance assist and mechanical lifter harness.',
    companyId: 'co-3',
    plantId: 'pl-5'
  },
  {
    id: 'node-109',
    name: 'Rear Bumper Subassembly Bench',
    department: 'Subassembly',
    stage: 'risk_detected',
    riskScore: 71,
    rebaScore: 8,
    rulaScore: 7,
    assignedOperator: 'Jessica Martinez',
    shift: 'B',
    exposureHours: 8,
    lastUpdate: '2026-05-16',
    history: [
      { date: '2026-05-16', event: 'Trunk angle alert', details: 'Constant leaning over deep parts bin to reach bolts.' }
    ],
    violations: ['Extreme forward static reach'],
    actionPlan: 'Replace static bins with tilted gravity flow storage bins.',
    companyId: 'co-3',
    plantId: 'pl-5'
  },
  // GM Ramos Arizpe (pl-6)
  {
    id: 'node-110',
    name: 'Ramos Tire Mount Station',
    department: 'Chassis',
    stage: 'compliance',
    riskScore: 28,
    rebaScore: 3,
    rulaScore: 4,
    assignedOperator: 'Alejandro Gomez',
    shift: 'A',
    exposureHours: 8,
    lastUpdate: '2026-05-14',
    history: [
      { date: '2026-05-14', event: 'Verification Signoff completed', details: 'Pneumatic tire lift assists reduce lumbar shear force by 85%.' }
    ],
    violations: [],
    actionPlan: 'Perform preventative maintenance check on pneumatic lifter every 10,000 cycles.',
    companyId: 'co-3',
    plantId: 'pl-6'
  }
];

const LOCAL_STORAGE_KEY = 'ergoflow_workstations';

function sanitizeWorkstation(ws: any): Workstation {
  if (!ws) return ws;
  
  let history = ws.history;
  if (typeof history === 'string') {
    if (history.trim().startsWith('[')) {
      try {
        history = JSON.parse(history);
      } catch (e) {
        history = [];
      }
    } else {
      history = [];
    }
  }
  if (!Array.isArray(history)) {
    history = [];
  }

  let violations = ws.violations;
  if (typeof violations === 'string') {
    if (violations.trim().startsWith('[')) {
      try {
        violations = JSON.parse(violations);
      } catch (e) {
        violations = [];
      }
    } else {
      violations = [];
    }
  }
  if (!Array.isArray(violations)) {
    violations = [];
  }

  return {
    ...ws,
    id: String(ws.id),
    name: ws.name || 'Unnamed Workstation',
    department: ws.department || 'General Operations',
    stage: ws.stage || 'assessment',
    riskScore: typeof ws.riskScore === 'number' ? ws.riskScore : (parseInt(ws.riskScore) || 0),
    rebaScore: typeof ws.rebaScore === 'number' ? ws.rebaScore : (parseInt(ws.rebaScore) || 0),
    rulaScore: typeof ws.rulaScore === 'number' ? ws.rulaScore : (parseInt(ws.rulaScore) || 0),
    assignedOperator: ws.assignedOperator || 'Unassigned',
    shift: ws.shift || 'A',
    exposureHours: typeof ws.exposureHours === 'number' ? ws.exposureHours : (parseFloat(ws.exposureHours) || 8),
    lastUpdate: ws.lastUpdate || new Date().toISOString().split('T')[0],
    actionPlan: ws.actionPlan || '',
    companyId: ws.companyId || 'co-1',
    plantId: ws.plantId || 'pl-1',
    history,
    violations
  };
}

function getLocalWorkstations(): Workstation[] {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        return parsed.map(sanitizeWorkstation);
      }
    } catch (e) {
      // fallback
    }
  }
  const seeded = MOCK_WORKSTATIONS.map(sanitizeWorkstation);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveLocalWorkstations(data: Workstation[]) {
  const sanitized = data.map(sanitizeWorkstation);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
}

export async function getWorkstations(companyId?: string, plantId?: string): Promise<Workstation[]> {
  let list: Workstation[] = [];
  if (isSheetsConfigured()) {
    try {
      const data = await fetchRows<Workstation>('Workstations');
      if (data && data.length > 0) {
        list = data.map(sanitizeWorkstation);
        saveLocalWorkstations(list);
      } else {
        console.log('[WorkstationsService] Google Sheet is empty. Seeding with mock data...');
        for (const ws of MOCK_WORKSTATIONS) {
          await appendRow<Workstation>('Workstations', ws);
        }
        list = MOCK_WORKSTATIONS.map(sanitizeWorkstation);
        saveLocalWorkstations(list);
      }
    } catch (error) {
      console.warn('[WorkstationsService] Failed to fetch from Google Sheets. Using local backup.', error);
      list = getLocalWorkstations();
    }
  } else {
    list = getLocalWorkstations();
  }

  // Filter if tenant coordinates are specified
  if (companyId) {
    list = list.filter(w => w.companyId === companyId);
  }
  if (plantId) {
    list = list.filter(w => w.plantId === plantId);
  }

  return list;
}

export async function createWorkstation(workstation: Omit<Workstation, 'id'>): Promise<Workstation> {
  const id = `node-${Date.now().toString().slice(-3)}`;
  const newWorkstation: Workstation = sanitizeWorkstation({ ...workstation, id });

  if (isSheetsConfigured()) {
    try {
      const result = await appendRow<Workstation>('Workstations', newWorkstation);
      const sanitizedResult = sanitizeWorkstation(result);
      const local = getLocalWorkstations();
      saveLocalWorkstations([sanitizedResult, ...local]);
      return sanitizedResult;
    } catch (error) {
      console.error('[WorkstationsService] Failed to save to Google Sheets, saving locally.', error);
    }
  }

  const local = getLocalWorkstations();
  const updated = [newWorkstation, ...local];
  saveLocalWorkstations(updated);
  return newWorkstation;
}

export async function updateWorkstation(id: string, updates: Partial<Workstation>): Promise<Workstation> {
  if (isSheetsConfigured()) {
    try {
      const result = await updateRowInSheet<Workstation>('Workstations', id, updates);
      const sanitizedResult = sanitizeWorkstation(result);
      const local = getLocalWorkstations();
      const updatedLocal = local.map(w => w.id === id ? { ...w, ...sanitizedResult } : w);
      saveLocalWorkstations(updatedLocal);
      return sanitizedResult;
    } catch (error) {
      console.error('[WorkstationsService] Failed to update in Google Sheets, updating locally.', error);
    }
  }

  const local = getLocalWorkstations();
  let updatedWorkstation: Workstation | null = null;
  const updated = local.map(w => {
    if (w.id === id) {
      updatedWorkstation = sanitizeWorkstation({ ...w, ...updates });
      return updatedWorkstation;
    }
    return w;
  });

  if (!updatedWorkstation) {
    throw new Error(`Workstation with id ${id} not found.`);
  }

  saveLocalWorkstations(updated);
  return updatedWorkstation;
}
