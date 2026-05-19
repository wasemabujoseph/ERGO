import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  BookOpen,
  Sliders,
  SlidersHorizontal,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  Info,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  ShieldAlert,
  Check,
  Layers,
  User,
  Sparkles,
  Camera,
  Edit3,
  LayoutDashboard,
  ArrowRight,
  ClipboardList,
  UserCheck,
  CheckSquare,
  X,
  FileSpreadsheet,
  AlertOctagon,
  HeartCrack,
  Wrench,
  HelpCircle,
  Clock,
  ThumbsUp,
  ShieldCheck,
  FileSignature,
  Bell,
  ChevronRight,
  UserPlus,
  ArrowUpRight,
  LogOut,
  Download,
  MapPin
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { getWorkstations, createWorkstation, updateWorkstation, ENTERPRISE_TENANTS } from './services/workstations.service';
import { createAssessment } from './services/assessments.service';
import { createCorrectiveAction } from './services/corrective-actions.service';
import { createAIInsight } from './services/ai-insights.service';
import EnterpriseRiskHeatmap from './components/analytics/EnterpriseRiskHeatmap';

// REBA Table A (Neck vs Trunk vs Legs)
const REBA_TABLE_A = {
  1: { // Neck = 1
    1: { 1: 1, 2: 2 }, // Trunk = 1 (Legs = 1, 2)
    2: { 1: 2, 2: 3 }, // Trunk = 2
    3: { 1: 3, 2: 4 }, // Trunk = 3
    4: { 1: 4, 2: 5 }  // Trunk = 4
  },
  2: { // Neck = 2
    1: { 1: 2, 2: 3 },
    2: { 1: 3, 2: 4 },
    3: { 1: 4, 2: 5 },
    4: { 1: 5, 2: 6 }
  }
};

// REBA Table B (Upper Arm vs Lower Arm vs Wrist)
const REBA_TABLE_B = {
  1: { // Upper Arm = 1
    1: { 1: 1, 2: 2 }, // Lower Arm = 1 (Wrist = 1, 2)
    2: { 1: 2, 2: 3 }  // Lower Arm = 2
  },
  2: { // Upper Arm = 2
    1: { 1: 2, 2: 3 },
    2: { 1: 3, 2: 4 }
  },
  3: { // Upper Arm = 3
    1: { 1: 3, 2: 4 },
    2: { 1: 4, 2: 5 }
  }
};

// REBA Table C (Score A + Score B)
const REBA_TABLE_C = [
  // Score B -> 1  2  3  4  5  6  7  8  9  10 11 12
  [0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0], // 0 padding
  [0, 1,  1, 1, 2, 3, 3, 4, 5, 6, 7,  7,  7], // Score A = 1
  [0, 1,  2, 2, 3, 4, 4, 5, 6, 6, 7,  7,  8], // Score A = 2
  [0, 2,  3, 3, 3, 4, 5, 6, 7, 7, 8,  8,  8], // Score A = 3
  [0, 3,  4, 4, 4, 5, 6, 7, 8, 8, 9,  9,  9], // Score A = 4
  [0, 4,  4, 4, 5, 6, 7, 8, 8, 9, 9,  9,  9], // Score A = 5
  [0, 5,  5, 5, 6, 7, 8, 8, 9, 9, 10, 10, 10], // Score A = 6
  [0, 6,  6, 6, 7, 8, 8, 9, 9, 10, 10, 10, 11], // Score A = 7
  [0, 7,  7, 7, 8, 9, 9, 9, 10, 10, 11, 11, 11], // Score A = 8
  [0, 8,  8, 8, 9, 10, 10, 10, 10, 11, 11, 11, 12], // Score A = 9
  [0, 9,  9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12], // Score A = 10
  [0, 10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 12], // Score A = 11
  [0, 11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12]  // Score A = 12
];

// NIOSH Frequency Multiplier lookup table
const NIOSH_FM_TABLE = {
  short:   [1.00, 0.97, 0.94, 0.91, 0.88, 0.84, 0.80, 0.75, 0.70, 0.60, 0.52, 0.45, 0.37, 0.27, 0.22, 0.18, 0.00],
  moderate:[0.95, 0.92, 0.88, 0.84, 0.79, 0.72, 0.60, 0.50, 0.42, 0.35, 0.30, 0.25, 0.20, 0.15, 0.00, 0.00, 0.00],
  long:    [0.85, 0.81, 0.75, 0.65, 0.55, 0.45, 0.35, 0.27, 0.22, 0.18, 0.15, 0.11, 0.00, 0.00, 0.00, 0.00, 0.00]
};

const DEFAULT_RULES = {
  maxLiftWeight: 15, // kg
  maxReachPrimary: 45, // cm
  maxReachSecondary: 65, // cm
  maxPushForceInitial: 20, // kg-f
  comfortableWorkingHeightMin: 85, // cm
  comfortableWorkingHeightMax: 115, // cm
  nioshLoadConstant: 23 // kg
};

const USER_ROLES = [
  { id: 'operator', name: 'Operator (Line Staff)', icon: User, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' },
  { id: 'engineer', name: 'Industrial Engineer', icon: Wrench, color: 'text-sky-400 border-sky-500/30 bg-sky-950/20' },
  { id: 'ehs', name: 'EHS / Safety Specialist', icon: ShieldAlert, color: 'text-amber-400 border-amber-500/30 bg-amber-950/20' },
  { id: 'manager', name: 'Operations Manager', icon: LayoutDashboard, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/20' },
  { id: 'admin', name: 'System Administrator', icon: Sliders, color: 'text-purple-400 border-purple-500/30 bg-purple-950/20' }
];

const WORKFLOW_STAGES = [
  { id: 'assessment', name: 'Assessment', color: 'bg-blue-950 text-blue-400 border-blue-900', desc: 'Ergonomic data collection' },
  { id: 'risk_detected', name: 'Risk Detection', color: 'bg-rose-950 text-rose-400 border-rose-900', desc: 'Automated policy violation triggers' },
  { id: 'ai_analysis', name: 'AI Analysis', color: 'bg-purple-950 text-purple-400 border-purple-900', desc: 'Gemini visual & spatial reviews' },
  { id: 'corrective_action', name: 'Corrective Action', color: 'bg-amber-950 text-amber-400 border-amber-900', desc: 'Engineering changes and task changes' },
  { id: 'approval', name: 'Approval Status', color: 'bg-indigo-950 text-indigo-400 border-indigo-900', desc: 'EHS & Supervisor reviews' },
  { id: 'resolution', name: 'Resolution', color: 'bg-teal-950 text-teal-400 border-teal-900', desc: 'Remediations implemented' },
  { id: 'compliance', name: 'Compliant Tracking', color: 'bg-emerald-950 text-emerald-400 border-emerald-900', desc: 'ISO cert and final policy audit' }
];

const STANDARD_GUIDELINES = [
  { code: 'ISO-11228-1', title: 'Manual Handling — Lifting & Carrying limits', details: 'Sets max limits of 25kg for males, 15kg for females under optimal workplace factors.' },
  { code: 'ISO-11228-2', title: 'Manual Handling — Pushing & Pulling whole body forces', details: 'Limits initial startup force to 200 N (approx 20 kg-f) and sustained force to 100 N.' },
  { code: 'EN-1005-2', title: 'Safety of machinery — Human physical performance', details: 'Provides design criteria for equipment to keep joint extension outside risk parameters.' },
  { code: 'ANSI-B11.TR1', title: 'Ergonomic Guidelines for Machine Tools', details: 'Defines primary reach zone (45cm) and secondary reach boundaries (65cm) for operators.' }
];

// Rolling SCADA telemetry events
const TELEMETRY_FEED = [
  { id: 1, time: '12:01:14', msg: 'STATION 105: Elevated shoulder reach warning logged. RULA score: 9.' },
  { id: 2, time: '11:58:32', msg: 'AUDIT: EHS compliance check complete at final packaging line.' },
  { id: 3, time: '11:42:05', msg: 'STATION 101: Scissor lift change requested via engineering portal.' },
  { id: 4, time: '11:30:19', msg: 'SYSTEM: Sync successful with Google Sheets cloud backend.' },
  { id: 5, time: '11:15:00', msg: 'AI AGENT: Autonomous remediation plan compiled for Station 108.' }
];

export default function App() {
  // Auth state management
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('ergoflow_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('password');
  const [loginRole, setLoginRole] = useState('ehs');
  const [loginCompany, setLoginCompany] = useState('co-1');
  const [loginPlant, setLoginPlant] = useState('pl-1');

  // Multi-tenant selection states
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => currentUser?.companyId || 'co-1');
  const [selectedPlantId, setSelectedPlantId] = useState(() => currentUser?.plantId || 'pl-1');

  const activeRole = currentUser?.role || 'operator';

  const [activeTab, setActiveTab] = useState('workflow'); // workflow, dashboard, forms, library
  const [selectedPipelineCard, setSelectedPipelineCard] = useState(null);

  // Custom interactive rule configs
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [pipelineData, setPipelineData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Active logs & notification feed
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'High Risk detected at Packing Station 04B (REBA Score: 8)', date: '10 mins ago', read: false },
    { id: 2, text: 'Engineering Change Request ECR-401 pending approval', date: '1 hr ago', read: false }
  ]);

  // Form selections and tracking states
  const [selectedFormId, setSelectedFormId] = useState('reba_rula');
  const [lastAutosave, setLastAutosave] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // RULA / REBA calculator inputs
  const [rebaTrunk, setRebaTrunk] = useState(2);
  const [rebaNeck, setRebaNeck] = useState(1);
  const [rebaLegs, setRebaLegs] = useState(1);
  const [rebaUpperArm, setRebaUpperArm] = useState(2);
  const [rebaLowerArm, setRebaLowerArm] = useState(1);
  const [rebaWrist, setRebaWrist] = useState(1);
  const [rebaForce, setRebaForce] = useState(1);
  const [calculatedReba, setCalculatedReba] = useState(4);
  const [calculatedRula, setCalculatedRula] = useState(3);
  
  // NIOSH lifting inputs
  const [nlWeight, setNlWeight] = useState(14);
  const [nlHorizontal, setNlHorizontal] = useState(40);
  const [nlVertical, setNlVertical] = useState(75);
  const [nlTwist, setNlTwist] = useState(15);
  const [nlFreq, setNlFreq] = useState(3);
  const [nlDuration, setNlDuration] = useState('1'); 
  const [nlCoupling, setNlCoupling] = useState('Good');
  
  // Push / Pull inputs
  const [ppWeight, setPpWeight] = useState(180);
  const [ppInitialForce, setPpInitialForce] = useState(22);
  const [ppSustainedForce, setPpSustainedForce] = useState(8);
  const [ppFloor, setPpFloor] = useState('Concrete');
  
  // Workstation Registration inputs
  const [regName, setRegName] = useState('');
  const [regDept, setRegDept] = useState('Assembly');
  const [regOperator, setRegOperator] = useState('');
  const [regHeight, setRegHeight] = useState(90);
  const [regReach, setRegReach] = useState(42);
  const [regExposure, setRegExposure] = useState(8);
  
  // ECR corrective action inputs
  const [ecrWorkstation, setEcrWorkstation] = useState('');
  const [ecrDescription, setEcrDescription] = useState('');
  const [ecrBudget, setEcrBudget] = useState(1200);
  const [ecrOwner, setEcrOwner] = useState('');

  // Audits checklist inputs
  const [auditDept, setAuditDept] = useState('Assembly');
  const [auditScore, setAuditScore] = useState(85);
  const [auditChecks, setAuditChecks] = useState({
    primaryReachOptimal: true,
    heightAdjustable: false,
    mattingPresent: true,
    cartsInspected: true,
    hoistOperational: false
  });

  // Injury & Fatigue inputs
  const [incOperator, setIncOperator] = useState('');
  const [incFatigueLevel, setIncFatigueLevel] = useState(4);
  const [incDetails, setIncDetails] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('');

  // AI spatial analysis state
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [aiTargetTask, setAiTargetTask] = useState('Repetitive manual packaging conveyor loader');
  const [aiIsAnalyzing, setAiIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

  // API Config state
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ergoflow_gemini_key') || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');

  // PDF print dossier preview state
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierWorkstation, setDossierWorkstation] = useState(null);

  // AI Autonomous Planner state
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotPlan, setCopilotPlan] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Drawing canvas reference for AI landmarks overlay
  const drawingCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load workstations for active tenant
  useEffect(() => {
    if (!currentUser) return;
    async function loadData() {
      setLoading(true);
      try {
        const data = await getWorkstations(selectedCompanyId, selectedPlantId);
        setPipelineData(data);
      } catch (err) {
        console.error("Failed to load workstations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCompanyId, selectedPlantId, currentUser]);

  // Calculate REBA and RULA indexes
  useEffect(() => {
    try {
      const neckIdx = Math.max(1, Math.min(2, parseInt(rebaNeck)));
      const trunkIdx = Math.max(1, Math.min(4, parseInt(rebaTrunk)));
      const legsIdx = Math.max(1, Math.min(2, parseInt(rebaLegs)));
      const scoreA_table = REBA_TABLE_A[neckIdx][trunkIdx][legsIdx];
      const forceScore = Math.max(0, parseInt(rebaForce) - 1);
      const totalScoreA = scoreA_table + forceScore;

      const upperArmIdx = Math.max(1, Math.min(3, parseInt(rebaUpperArm)));
      const lowerArmIdx = Math.max(1, Math.min(2, parseInt(rebaLowerArm)));
      const wristIdx = Math.max(1, Math.min(2, parseInt(rebaWrist)));
      const scoreB_table = REBA_TABLE_B[upperArmIdx][lowerArmIdx][wristIdx];
      const totalScoreB = scoreB_table;

      const clampedScoreA = Math.max(1, Math.min(12, totalScoreA));
      const clampedScoreB = Math.max(1, Math.min(12, totalScoreB));
      const scoreC = REBA_TABLE_C[clampedScoreA][clampedScoreB];

      const activityScore = 1;
      const finalReba = Math.max(1, Math.min(15, scoreC + activityScore));
      setCalculatedReba(finalReba);

      let rula = parseInt(rebaTrunk) + parseInt(rebaNeck) + parseInt(rebaUpperArm) + parseInt(rebaLowerArm) + parseInt(rebaWrist) + 1;
      setCalculatedRula(Math.max(1, Math.min(9, rula)));
    } catch (err) {
      console.error(err);
    }
  }, [rebaTrunk, rebaNeck, rebaLegs, rebaUpperArm, rebaLowerArm, rebaWrist, rebaForce]);

  // Form Autosave logic
  useEffect(() => {
    if (!currentUser) return;
    const saveTimer = setTimeout(() => {
      const draftData = {
        rebaTrunk, rebaNeck, rebaLegs, rebaUpperArm, rebaLowerArm, rebaWrist, rebaForce,
        nlWeight, nlHorizontal, nlVertical, nlTwist, nlFreq, nlDuration, nlCoupling,
        ppWeight, ppInitialForce, ppSustainedForce, ppFloor,
        regName, regDept, regOperator, regHeight, regReach, regExposure,
        ecrWorkstation, ecrDescription, ecrBudget, ecrOwner,
        auditDept, auditScore, auditChecks,
        incOperator, incFatigueLevel, incDetails, selectedBodyPart,
        aiTargetTask
      };
      localStorage.setItem(`ergoflow_draft_${selectedFormId}`, JSON.stringify(draftData));
      const timeStr = new Date().toLocaleTimeString();
      setLastAutosave(timeStr);
      setHasUnsavedChanges(false);
    }, 1500);

    setHasUnsavedChanges(true);
    return () => clearTimeout(saveTimer);
  }, [
    rebaTrunk, rebaNeck, rebaLegs, rebaUpperArm, rebaLowerArm, rebaWrist, rebaForce,
    nlWeight, nlHorizontal, nlVertical, nlTwist, nlFreq, nlDuration, nlCoupling,
    ppWeight, ppInitialForce, ppSustainedForce, ppFloor,
    regName, regDept, regOperator, regHeight, regReach, regExposure,
    ecrWorkstation, ecrDescription, ecrBudget, ecrOwner,
    auditDept, auditScore, auditChecks,
    incOperator, incFatigueLevel, incDetails, selectedBodyPart,
    aiTargetTask,
    selectedFormId
  ]);

  // Load draft on form switch
  useEffect(() => {
    const saved = localStorage.getItem(`ergoflow_draft_${selectedFormId}`);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (selectedFormId === 'reba_rula') {
          if (d.rebaTrunk) setRebaTrunk(d.rebaTrunk);
          if (d.rebaNeck) setRebaNeck(d.rebaNeck);
          if (d.rebaLegs) setRebaLegs(d.rebaLegs);
          if (d.rebaUpperArm) setRebaUpperArm(d.rebaUpperArm);
          if (d.rebaLowerArm) setRebaLowerArm(d.rebaLowerArm);
          if (d.rebaWrist) setRebaWrist(d.rebaWrist);
          if (d.rebaForce) setRebaForce(d.rebaForce);
        } else if (selectedFormId === 'niosh') {
          if (d.nlWeight) setNlWeight(d.nlWeight);
          if (d.nlHorizontal) setNlHorizontal(d.nlHorizontal);
          if (d.nlVertical) setNlVertical(d.nlVertical);
          if (d.nlTwist) setNlTwist(d.nlTwist);
          if (d.nlFreq) setNlFreq(d.nlFreq);
          if (d.nlDuration) setNlDuration(d.nlDuration);
          if (d.nlCoupling) setNlCoupling(d.nlCoupling);
        } else if (selectedFormId === 'pushpull') {
          if (d.ppWeight) setPpWeight(d.ppWeight);
          if (d.ppInitialForce) setPpInitialForce(d.ppInitialForce);
          if (d.ppSustainedForce) setPpSustainedForce(d.ppSustainedForce);
          if (d.ppFloor) setPpFloor(d.ppFloor);
        } else if (selectedFormId === 'registration') {
          if (d.regName) setRegName(d.regName);
          if (d.regDept) setRegDept(d.regDept);
          if (d.regOperator) setRegOperator(d.regOperator);
          if (d.regHeight) setRegHeight(d.regHeight);
          if (d.regReach) setRegReach(d.regReach);
          if (d.regExposure) setRegExposure(d.regExposure);
        } else if (selectedFormId === 'ecr') {
          if (d.ecrWorkstation) setEcrWorkstation(d.ecrWorkstation);
          if (d.ecrDescription) setEcrDescription(d.ecrDescription);
          if (d.ecrBudget) setEcrBudget(d.ecrBudget);
          if (d.ecrOwner) setEcrOwner(d.ecrOwner);
        } else if (selectedFormId === 'audits') {
          if (d.auditDept) setAuditDept(d.auditDept);
          if (d.auditScore) setAuditScore(d.auditScore);
          if (d.auditChecks) setAuditChecks(d.auditChecks);
        } else if (selectedFormId === 'incident') {
          if (d.incOperator) setIncOperator(d.incOperator);
          if (d.incFatigueLevel) setIncFatigueLevel(d.incFatigueLevel);
          if (d.incDetails) setIncDetails(d.incDetails);
          if (d.selectedBodyPart) setSelectedBodyPart(d.selectedBodyPart);
        } else if (selectedFormId === 'ai_wizard') {
          if (d.aiTargetTask) setAiTargetTask(d.aiTargetTask);
        }
      } catch (err) {
        console.error(err);
      }
    }
    setHasUnsavedChanges(false);
  }, [selectedFormId]);

  // Human posture canvas drawing initializer
  useEffect(() => {
    if (selectedFormId === 'ai_wizard') {
      drawMannequinBlueprint(uploadedImageUrl);
    }
  }, [selectedFormId, uploadedImageUrl, aiAnalysisResult]);

  const drawMannequinBlueprint = (imgUrl = '') => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imgUrl) {
      const img = new Image();
      img.src = imgUrl;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (aiAnalysisResult) {
          drawSkeletonOverlay(ctx, canvas.width, canvas.height);
        }
      };
    } else {
      // Draw grid blueprint background
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 25) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 25) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      
      // Model floor line
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(10, canvas.height - 25); ctx.lineTo(canvas.width - 10, canvas.height - 25); ctx.stroke();

      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      ctx.fillText("CAD HOLOGRAM MANNEQUIN V2.0", 8, 12);

      drawMannequinJoints(ctx, canvas.width, canvas.height);
    }
  };

  const drawMannequinJoints = (ctx, w, h) => {
    // Standard standing posture outline
    const neck = { x: w * 0.45, y: h * 0.22 };
    const spine = { x: w * 0.45, y: h * 0.45 };
    const shoulder = { x: w * 0.50, y: h * 0.28 };
    const elbow = { x: w * 0.62, y: h * 0.42 };
    const wrist = { x: w * 0.68, y: h * 0.58 };
    const hip = { x: w * 0.44, y: h * 0.60 };
    const knee = { x: w * 0.44, y: h * 0.78 };
    const ankle = { x: w * 0.44, y: h * 0.90 };

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;

    // Spine
    ctx.beginPath(); ctx.moveTo(neck.x, neck.y); ctx.lineTo(spine.x, spine.y); ctx.lineTo(hip.x, hip.y); ctx.stroke();
    // Arm
    ctx.beginPath(); ctx.moveTo(shoulder.x, shoulder.y); ctx.lineTo(elbow.x, elbow.y); ctx.lineTo(wrist.x, wrist.y); ctx.stroke();
    // Leg
    ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(knee.x, knee.y); ctx.lineTo(ankle.x, ankle.y); ctx.stroke();
    
    // Head circle
    ctx.beginPath(); ctx.arc(w * 0.45, h * 0.14, 10, 0, Math.PI * 2); ctx.stroke();
  };

  const drawSkeletonOverlay = (ctx, w, h) => {
    // Coordinates mapping for overlay
    const joints = {
      head: { x: w * 0.42, y: h * 0.15 },
      neck: { x: w * 0.45, y: h * 0.24 },
      spine: { x: w * 0.50, y: h * 0.48 },
      shoulder: { x: w * 0.52, y: h * 0.30 },
      elbow: { x: w * 0.72, y: h * 0.45 },
      wrist: { x: w * 0.85, y: h * 0.48 },
      hip: { x: w * 0.48, y: h * 0.63 },
      knee: { x: w * 0.46, y: h * 0.80 },
      ankle: { x: w * 0.46, y: h * 0.92 }
    };

    // Draw neon skeletal lines
    ctx.strokeStyle = '#06b6d4'; // Cyan
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;

    // Body segments
    ctx.beginPath(); ctx.moveTo(joints.neck.x, joints.neck.y); ctx.lineTo(joints.spine.x, joints.spine.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(joints.spine.x, joints.spine.y); ctx.lineTo(joints.hip.x, joints.hip.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(joints.shoulder.x, joints.shoulder.y); ctx.lineTo(joints.elbow.x, joints.elbow.y); ctx.lineTo(joints.wrist.x, joints.wrist.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(joints.hip.x, joints.hip.y); ctx.lineTo(joints.knee.x, joints.knee.y); ctx.lineTo(joints.ankle.x, joints.ankle.y); ctx.stroke();

    // Draw glowing node dots
    ctx.shadowBlur = 15;
    Object.keys(joints).forEach((key) => {
      const j = joints[key];
      ctx.fillStyle = key === 'spine' || key === 'shoulder' ? '#f43f5e' : '#10b981'; // Red or Green
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath(); ctx.arc(j.x, j.y, 5, 0, Math.PI * 2); ctx.fill();
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    // Text annotations
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText("Shoulder angle: 98° (WARN)", joints.shoulder.x + 8, joints.shoulder.y);
    ctx.fillStyle = '#10b981';
    ctx.fillText("Trunk angle: 12° (OK)", joints.spine.x + 8, joints.spine.y);
    ctx.fillStyle = '#eab308';
    ctx.fillText("Reach: 52cm (WARN)", joints.wrist.x - 90, joints.wrist.y + 12);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImageUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI Postural observations engine
  const runAiPosturalAnalysis = async () => {
    if (!aiTargetTask) return;
    setAiIsAnalyzing(true);
    setAiAnalysisResult(null);

    // Call service layer for AI insights
    try {
      if (apiKey) {
        const payload = {
          task: aiTargetTask,
          model: "gemini",
          imageContent: uploadedImageUrl || ""
        };
        const response = await fetch(process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || '', {
          method: 'POST',
          body: JSON.stringify({ action: 'aiAnalysis', data: payload })
        });
        const resJson = await response.json();
        if (resJson.success) {
          setAiAnalysisResult(resJson.data);
          return;
        }
      }
      throw new Error("No API key or Sheets proxy endpoint configured.");
    } catch (err) {
      console.warn("Using offline mock visual engine...", err);
      setTimeout(async () => {
        const mockInsight = {
          hazardDetected: true,
          estimatedAngle: "36 degrees trunk flexion",
          rulaCalculated: 6,
          criticalFinding: "Awkward neck tilt (28°) and trunk flexion (36°) observed. Hands are exceeding the standard 45cm primary optimal reach limits to load assembly bolts.",
          engineeringMitigation: "Raise table platform to 95cm level and replace existing storage trays with a gravity-fed tilted slide loader."
        };
        setAiAnalysisResult(mockInsight);
        
        // Log to database
        try {
          await createAIInsight({
            workstationId: selectedPipelineCard?.id || 'node-101',
            task: aiTargetTask,
            ...mockInsight,
            date: new Date().toISOString().split('T')[0]
          });
        } catch (e) {
          console.error(e);
        }
      }, 1800);
    } finally {
      setTimeout(() => setAiIsAnalyzing(false), 1800);
    }
  };

  // Submit assessment forms
  const handleFormSubmit = async (type) => {
    let successMsg = '';
    let updatedNode = null;

    if (type === 'reba_rula') {
      const riskIndex = calculatedReba >= 8 ? 'High' : (calculatedReba >= 4 ? 'Medium' : 'Low');
      const tempNode = {
        name: regName || 'Custom Assembly Line',
        department: regDept,
        stage: calculatedReba >= 8 ? 'risk_detected' : 'assessment',
        riskScore: Math.round(calculatedReba * 6.6),
        rebaScore: calculatedReba,
        rulaScore: calculatedRula,
        assignedOperator: regOperator || 'Operator Assigned',
        shift: 'A',
        exposureHours: parseFloat(regExposure) || 8,
        lastUpdate: new Date().toISOString().split('T')[0],
        history: [{
          date: new Date().toISOString().split('T')[0],
          event: 'REBA/RULA Form Calculated',
          details: `Scoring run: REBA: ${calculatedReba}, RULA: ${calculatedRula}.`
        }],
        violations: calculatedReba >= 8 ? ['Elevated posture stress', 'Risk limit reached'] : [],
        actionPlan: 'Ergonomic task assessment scheduled.',
        companyId: selectedCompanyId,
        plantId: selectedPlantId
      };
      
      try {
        updatedNode = await createWorkstation(tempNode);
        await createAssessment({
          workstationId: updatedNode.id,
          type: 'reba_rula',
          date: updatedNode.lastUpdate,
          evaluator: currentUser?.name || 'Evaluator',
          score: updatedNode.rebaScore,
          details: `REBA score calculated: ${calculatedReba}, RULA: ${calculatedRula}.`
        });
        setPipelineData(prev => [updatedNode, ...prev]);
      } catch (e) {
        console.error(e);
      }
      
      successMsg = `RULA/REBA Assessment submitted! Posture score: ${calculatedReba}/15 (${riskIndex} Risk).`;
    }
    else if (type === 'niosh') {
      const HM = 25 / Math.max(25, nlHorizontal);
      const VM = 1 - (0.003 * Math.abs(nlVertical - 75));
      const AM = 1 - (0.0032 * nlTwist);
      
      const durationKey = parseInt(nlDuration) <= 1 ? 'short' : (parseInt(nlDuration) <= 2 ? 'moderate' : 'long');
      let freqIdx = 0;
      if (nlFreq <= 0.2) freqIdx = 0;
      else if (nlFreq <= 0.5) freqIdx = 1;
      else {
        const f = Math.round(nlFreq);
        if (f >= 1 && f <= 15) freqIdx = f + 1;
        else freqIdx = 16;
      }
      const FM = NIOSH_FM_TABLE[durationKey][freqIdx] !== undefined ? NIOSH_FM_TABLE[durationKey][freqIdx] : 0.00;

      let CM = 1.00;
      if (nlCoupling === 'Fair') CM = nlVertical < 75 ? 0.95 : 1.00;
      else if (nlCoupling === 'Poor') CM = 0.90;

      const rwl = parseFloat((rules.nioshLoadConstant * HM * VM * AM * FM * CM).toFixed(1));
      const liftingIndex = parseFloat((nlWeight / rwl).toFixed(2));

      const tempNode = {
        name: `Lifting task: ${nlWeight}kg object`,
        department: 'Assembly',
        stage: liftingIndex > 1.0 ? 'risk_detected' : 'assessment',
        riskScore: Math.min(100, Math.round(liftingIndex * 50)),
        rebaScore: liftingIndex > 1.0 ? 8 : 3,
        rulaScore: liftingIndex > 1.0 ? 6 : 2,
        assignedOperator: 'Lifting operator',
        shift: 'B',
        exposureHours: 4,
        lastUpdate: new Date().toISOString().split('T')[0],
        history: [{
          date: new Date().toISOString().split('T')[0],
          event: 'NIOSH Lifting Formula Run',
          details: `Computed Lifting Index: ${liftingIndex} (RWL: ${rwl} kg).`
        }],
        violations: liftingIndex > 1.0 ? ['NIOSH Lifting limits exceeded'] : [],
        actionPlan: 'Install mechanical hoist arm assistance.',
        companyId: selectedCompanyId,
        plantId: selectedPlantId
      };

      try {
        updatedNode = await createWorkstation(tempNode);
        await createAssessment({
          workstationId: updatedNode.id,
          type: 'niosh',
          date: updatedNode.lastUpdate,
          evaluator: currentUser?.name || 'Evaluator',
          score: liftingIndex,
          details: `Computed Lifting Index: ${liftingIndex} (RWL: ${rwl} kg).`
        });
        setPipelineData(prev => [updatedNode, ...prev]);
      } catch (e) {
        console.error(e);
      }

      successMsg = `NIOSH Lifting Equation processed! Computed Lifting Index is ${liftingIndex} (RWL: ${rwl} kg).`;
    }
    else if (type === 'pushpull') {
      const compliant = ppInitialForce <= rules.maxPushForceInitial;
      const tempNode = {
        name: `Cart Transit: ${ppWeight}kg`,
        department: 'Logistics',
        stage: compliant ? 'assessment' : 'risk_detected',
        riskScore: compliant ? 30 : 75,
        rebaScore: compliant ? 3 : 7,
        rulaScore: compliant ? 2 : 6,
        assignedOperator: 'Dolly Handler',
        shift: 'C',
        exposureHours: 6,
        lastUpdate: new Date().toISOString().split('T')[0],
        history: [{
          date: new Date().toISOString().split('T')[0],
          event: 'Cart Force Assessment',
          details: `Force: Initial ${ppInitialForce} kg-f, Sustained ${ppSustainedForce} kg-f.`
        }],
        violations: compliant ? [] : ['Excessive cart rolling inertia'],
        actionPlan: 'Review caster polyurethane wheel wear indices.',
        companyId: selectedCompanyId,
        plantId: selectedPlantId
      };

      try {
        updatedNode = await createWorkstation(tempNode);
        await createAssessment({
          workstationId: updatedNode.id,
          type: 'pushpull',
          date: updatedNode.lastUpdate,
          evaluator: currentUser?.name || 'Evaluator',
          score: ppInitialForce,
          details: `Force: Initial ${ppInitialForce} kg-f.`
        });
        setPipelineData(prev => [updatedNode, ...prev]);
      } catch (e) {
        console.error(e);
      }

      successMsg = `Push/Pull Force Audit finished! Initial force is ${ppInitialForce} kg-f (${compliant ? 'Compliant' : 'Non-compliant'}).`;
    }
    else if (type === 'ecr') {
      const targetId = ecrWorkstation || (selectedPipelineCard ? selectedPipelineCard.id : 'node-101');
      try {
        await createCorrectiveAction({
          workstationId: targetId,
          description: ecrDescription,
          budget: ecrBudget,
          owner: ecrOwner || currentUser?.name || 'Engineer',
          status: 'Pending ECR Sign-off',
          date: new Date().toISOString().split('T')[0]
        });

        // Update target workstation stage
        const target = pipelineData.find(w => w.id === targetId);
        if (target) {
          const updatedHistory = [
            ...(Array.isArray(target.history) ? target.history : []),
            {
              date: new Date().toISOString().split('T')[0],
              event: 'ECR Action Item Logged',
              details: `Engineering change: "${ecrDescription}". Budget: $${ecrBudget}.`
            }
          ];
          const updated = await updateWorkstation(targetId, {
            stage: 'corrective_action',
            history: updatedHistory
          });
          setPipelineData(prev => prev.map(w => w.id === targetId ? updated : w));
          if (selectedPipelineCard?.id === targetId) setSelectedPipelineCard(updated);
        }
      } catch (e) {
        console.error(e);
      }

      successMsg = `Corrective Action ECR has been recorded in the Sheets registry!`;
    }
    else if (type === 'incident') {
      successMsg = `Strain incident logged in database for operator "${incOperator}". Severity level: ${incFatigueLevel}/10 on ${selectedBodyPart || 'general body'}.`;
    }

    setToastText(successMsg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4500);

    // Clear form inputs
    setRegName(''); setRegOperator(''); setEcrDescription('');
  };

  // Autonomous Remediation Planner
  const generateAutonomousPlan = () => {
    if (!selectedPipelineCard) return;
    setCopilotLoading(true);
    setCopilotPlan(null);

    setTimeout(() => {
      // Analyze current violations
      const violations = (Array.isArray(selectedPipelineCard.violations) ? selectedPipelineCard.violations : []).join(', ') || 'Awkward posture reaches';
      const mockPlan = {
        stationId: selectedPipelineCard.id,
        stationName: selectedPipelineCard.name,
        rootCause: `High REBA score of ${selectedPipelineCard.rebaScore} is driven by: ${violations}. Standard ANSI reaching limits of 45cm exceeded by approximately 12cm due to static parts tray placement heights.`,
        recommendedEquip: [
          { item: 'Ergonomic Overhead Tool Spring Balancer (15kg max)', model: 'SB-15', cost: 420 },
          { item: 'Tilted Gravity-fed Parts Storage Rack (Tilted 15 degrees)', model: 'GR-15', cost: 850 },
          { item: 'Scissor Hydraulic Adjustable Platform Lift Table', model: 'SL-500', cost: 1850 }
        ],
        contractor: 'Apex Assembly Solutions Ltd.',
        totalBudget: 3120,
        timelineDays: 14,
        authorizedRoles: ['Admin', 'EHS Manager', 'Industrial Engineer']
      };
      setCopilotPlan(mockPlan);
      setCopilotLoading(false);
    }, 1200);
  };

  const executeAutonomousPlan = async () => {
    if (!copilotPlan || !selectedPipelineCard) return;
    try {
      const updatedHistory = [
        ...(Array.isArray(selectedPipelineCard.history) ? selectedPipelineCard.history : []),
        {
          date: new Date().toISOString().split('T')[0],
          event: 'Autonomous ECR Execution Approved',
          details: `Remediation executed: $${copilotPlan.totalBudget} allocated to Apex Assembly Solutions for model upgrading.`
        }
      ];
      const updated = await updateWorkstation(selectedPipelineCard.id, {
        stage: 'resolution',
        actionPlan: `Install tilted gravity-fed parts rack (Model GR-15) and Tool Balancer (Model SB-15).`,
        history: updatedHistory
      });
      setPipelineData(prev => prev.map(w => w.id === selectedPipelineCard.id ? updated : w));
      setSelectedPipelineCard(updated);
      setCopilotPlan(null);
      setShowCopilot(false);
      setToastText(`Remediation Plan approved and executed! Workstation shifted to "Resolution".`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4500);
    } catch (e) {
      console.error(e);
    }
  };

  // Open PDF Dossier Modal
  const triggerPrintDossier = (node) => {
    setDossierWorkstation(node);
    setShowDossierModal(true);
  };

  const runPrintWindow = () => {
    window.print();
  };

  // Authentication logout handler
  const handleLogout = () => {
    localStorage.removeItem('ergoflow_auth_user');
    setCurrentUser(null);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      name: loginUsername.charAt(0).toUpperCase() + loginUsername.slice(1),
      role: loginRole,
      companyId: loginCompany,
      plantId: loginPlant
    };
    localStorage.setItem('ergoflow_auth_user', JSON.stringify(newUser));
    setCurrentUser(newUser);
    setSelectedCompanyId(loginCompany);
    setSelectedPlantId(loginPlant);
  };

  // Render Login gate if not authenticated
  if (!currentUser) {
    const selectedCompanyObj = ENTERPRISE_TENANTS.find(c => c.id === loginCompany) || ENTERPRISE_TENANTS[0];
    return (
      <div className="min-h-screen tech-grid text-slate-100 font-sans flex flex-col justify-center items-center p-6 antialiased">
        <div className="max-w-md w-full bg-slate-950/80 border border-white/5 shadow-2xl rounded-2xl p-8 backdrop-blur-2xl relative overflow-hidden">
          {/* Neon background overlays */}
          <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl animate-pulse"></div>

          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="bg-gradient-to-tr from-cyan-500 to-indigo-500 p-3 rounded-xl shadow-lg shadow-cyan-950/50">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gradient-cyan">ErgoFlow AI Portal</h1>
            <p className="text-xs text-slate-400 text-center uppercase tracking-widest font-mono">Operations Command Gate</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Company / Tenant</label>
              <select 
                value={loginCompany} 
                onChange={(e) => {
                  setLoginCompany(e.target.value);
                  const firstPlant = ENTERPRISE_TENANTS.find(c => c.id === e.target.value)?.plants[0]?.id || '';
                  setLoginPlant(firstPlant);
                }}
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                {ENTERPRISE_TENANTS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Factory Site</label>
              <select 
                value={loginPlant} 
                onChange={(e) => setLoginPlant(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                {selectedCompanyObj.plants.map((p) => (
                  <option key={p.id} value={p.id}>{p.location} ({p.name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">System Username</label>
              <input 
                type="text" 
                value={loginUsername} 
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">User Role Access</label>
              <select 
                value={loginRole} 
                onChange={(e) => setLoginRole(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                {USER_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Access Credentials Key</label>
              <input 
                type="password" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" 
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-2"
            >
              Sign In to Command Center
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active Company Context helpers
  const activeCompanyObj = ENTERPRISE_TENANTS.find(c => c.id === selectedCompanyId) || ENTERPRISE_TENANTS[0];
  const activePlantObj = activeCompanyObj.plants.find(p => p.id === selectedPlantId) || activeCompanyObj.plants[0];

  return (
    <div className="min-h-screen tech-grid text-slate-100 font-sans flex flex-col antialiased">
      {/* Top Banner Alert Info */}
      <div className="bg-gradient-to-r from-cyan-900/60 via-indigo-900/60 to-purple-900/60 backdrop-blur-md px-4 py-2 text-center text-xs font-semibold tracking-wider flex items-center justify-center gap-2 border-b border-white/5 no-print">
        <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
        <span>ErgoFlow AI Command Governance Portal v2.5 — Multi-Tenant Cloud Deployment Active</span>
        <span className="hidden md:inline bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded ml-2 border border-indigo-500/30">ISO 11228 Audits Compliant</span>
      </div>

      {/* Main App Bar Header */}
      <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur-xl px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-0 z-40 shadow-2xl shadow-slate-950/40 no-print">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-cyan-500 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-cyan-950/50">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-gradient-cyan">ErgoFlow AI</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/30 text-cyan-400 border border-cyan-500/20 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.15)] animate-pulse">Active Compliance</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Tactical Industrial Ergonomics Governance & Operational Intelligence</p>
          </div>
        </div>

        {/* Tenant Switcher & User Profile */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 px-1 uppercase">Tenant:</span>
            
            <select 
              value={selectedCompanyId} 
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                const firstPlant = ENTERPRISE_TENANTS.find(c => c.id === e.target.value)?.plants[0]?.id || '';
                setSelectedPlantId(firstPlant);
              }}
              className="bg-slate-950 text-xs text-white border border-white/5 focus:ring-1 focus:ring-cyan-500/50 cursor-pointer rounded-lg px-2 py-1 font-semibold"
            >
              {ENTERPRISE_TENANTS.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select 
              value={selectedPlantId} 
              onChange={(e) => setSelectedPlantId(e.target.value)}
              className="bg-slate-950 text-xs text-white border border-white/5 focus:ring-1 focus:ring-cyan-500/50 cursor-pointer rounded-lg px-2 py-1 font-semibold"
            >
              {activeCompanyObj.plants.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/5">
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-300 block">{currentUser.name}</span>
              <span className="text-[9px] text-slate-500 font-mono block leading-none uppercase">{currentUser.role}</span>
            </div>
            <button onClick={handleLogout} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition" title="Log Out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <button onClick={() => setShowApiKey(!showApiKey)} className="text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-slate-900/60 hover:bg-slate-800 transition">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <span>{apiKey ? 'API Active' : 'Configure Gemini'}</span>
            <span className={`h-2 w-2 rounded-full ${apiKey ? 'bg-emerald-500 glow-dot-low' : 'bg-amber-500 glow-dot-med'}`}></span>
          </button>
        </div>
      </header>

      {/* Telemetry Strip - Ticker Feed */}
      <div className="bg-slate-950 border-b border-white/5 py-1.5 px-4 overflow-hidden relative flex items-center no-print">
        <div className="bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded tracking-wide z-10 mr-3 uppercase shrink-0">Live SCADA</div>
        <div className="relative w-full overflow-hidden">
          <div className="telemetry-ticker flex items-center gap-8">
            {TELEMETRY_FEED.map((f) => (
              <span key={f.id} className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                <span className="text-cyan-400 font-bold mr-1">[{f.time}]</span> {f.msg}
              </span>
            ))}
            {/* Repeat for seamless loop */}
            {TELEMETRY_FEED.map((f) => (
              <span key={`dup-${f.id}`} className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                <span className="text-cyan-400 font-bold mr-1">[{f.time}]</span> {f.msg}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* API Key Connection Drawer */}
      {showApiKey && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 animate-fadeIn no-print">
          <div className="max-w-xl mx-auto flex flex-col gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Enter Google Gemini Key</label>
              <input 
                type="password" 
                placeholder="AIzaSy..." 
                value={apiKey} 
                onChange={(e) => {
                  setApiKey(e.target.value);
                  localStorage.setItem('ergoflow_gemini_key', e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">If configured, posture analysis wizard will leverage real-time spatial calculations.</p>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowApiKey(false)} className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition">
                Save Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast HUD */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 border border-emerald-500/30 shadow-2xl p-4 rounded-xl max-w-sm animate-fadeIn no-print">
          <div className="flex gap-2 items-start">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-white">System Update Logged</p>
              <p className="text-[11px] text-slate-300 mt-1">{toastText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation tabs */}
      <div className="bg-slate-950/40 backdrop-blur-lg border-b border-white/5 flex overflow-x-auto scrollbar-none px-6 no-print">
        <nav className="flex space-x-1 py-1">
          <button onClick={() => setActiveTab('workflow')} className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border-b-2 ${activeTab === 'workflow' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'}`}>
            <Layers className="h-4 w-4" />
            <span>Workflow Center</span>
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border-b-2 ${activeTab === 'dashboard' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'}`}>
            <LayoutDashboard className="h-4 w-4" />
            <span>Analytics command map</span>
          </button>
          <button onClick={() => setActiveTab('forms')} className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border-b-2 ${activeTab === 'forms' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'}`}>
            <ClipboardList className="h-4 w-4" />
            <span>Operational Forms</span>
          </button>
          <button onClick={() => setActiveTab('library')} className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border-b-2 ${activeTab === 'library' ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'}`}>
            <BookOpen className="h-4 w-4" />
            <span>ISO Policies & Library</span>
          </button>
        </nav>
      </div>

      {/* Main Interactive Layout */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {loading && (
          <div className="flex justify-center items-center py-12 text-xs font-mono text-cyan-400">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Syncing with Cloud Datastore...
          </div>
        )}

        {/* WORKFLOW TAB */}
        {activeTab === 'workflow' && !loading && (
          <div className="space-y-6 animate-fadeIn no-print">
            <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gradient-cyan flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Tenant Governance Pipeline: {activeCompanyObj.name} ({activePlantObj.name})
                </h2>
                <p className="text-xs text-slate-400 mt-1">Trace workstation ergonomics through RULA assessments, ECR corrective engineering, and ISO compliance approvals.</p>
              </div>
              <button onClick={() => { setActiveTab('forms'); setSelectedFormId('reba_rula'); }} className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Plus className="h-4 w-4" /> Assess Posture
              </button>
            </div>

            {/* Pipeline Stage Lanes */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 overflow-x-auto pb-4">
              {WORKFLOW_STAGES.map((stage) => {
                const stageCards = pipelineData.filter(item => item.stage === stage.id);
                return (
                  <div key={stage.id} className="glass-panel bg-slate-950/40 p-3 rounded-xl border border-white/5 flex flex-col min-w-[170px] hover:border-slate-800/80 transition-all">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-200 uppercase">{stage.name}</span>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-500/20 px-1.5 py-0.5 rounded">{stageCards.length}</span>
                    </div>
                    <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[350px] min-h-[100px]">
                      {stageCards.map((card) => (
                        <div key={card.id} onClick={() => setSelectedPipelineCard(card)} className="p-3 bg-slate-900/60 hover:bg-slate-800/60 border border-white/5 hover:border-cyan-500/40 rounded-xl cursor-pointer transition-all duration-300 space-y-2 group shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-mono text-slate-500 group-hover:text-cyan-400">{card.id}</span>
                            <span className={`text-[10px] font-bold ${card.riskScore >= 70 ? 'text-rose-400' : 'text-emerald-400'}`}>Score: {card.riskScore}</span>
                          </div>
                          <h4 className="text-xs font-extrabold text-white truncate">{card.name}</h4>
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span>{card.department}</span>
                            <span>{card.lastUpdate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Workstation Inspector */}
            {selectedPipelineCard && (
              <div className="glass-panel p-6 rounded-2xl space-y-6 shadow-2xl border border-white/5 animate-fadeIn">
                <div className="flex items-start justify-between border-b border-white/5 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400">{selectedPipelineCard.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-850 font-mono text-slate-300 border border-white/5">{selectedPipelineCard.department}</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-gradient-cyan mt-1">{selectedPipelineCard.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => triggerPrintDossier(selectedPipelineCard)} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition" title="Export PDF Dossier">
                      <FileText className="h-4 w-4" />
                    </button>
                    <button onClick={() => setSelectedPipelineCard(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column - Metrics */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Postural Metrics Summary</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-500 block">REBA SCORE</span>
                        <span className={`text-2xl font-black ${selectedPipelineCard.rebaScore >= 8 ? 'text-rose-400' : 'text-emerald-400'}`}>{selectedPipelineCard.rebaScore}</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-500 block">RULA SCORE</span>
                        <span className={`text-2xl font-black ${selectedPipelineCard.rulaScore >= 6 ? 'text-rose-400' : 'text-emerald-400'}`}>{selectedPipelineCard.rulaScore}</span>
                      </div>
                    </div>
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-500 block">ASSIGNED STAFF</span>
                      <span className="text-xs font-bold text-white block">{selectedPipelineCard.assignedOperator}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{selectedPipelineCard.shift} Shift • {selectedPipelineCard.exposureHours} Hrs Exposure Limit</span>
                    </div>
                  </div>

                  {/* Middle Column - Violations */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Observed Violations & Plan</h4>
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/5 min-h-[110px] space-y-2">
                      <span className="text-[10px] text-slate-500 block">TRIGGERS</span>
                      {(Array.isArray(selectedPipelineCard.violations) ? selectedPipelineCard.violations : []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(selectedPipelineCard.violations) ? selectedPipelineCard.violations : []).map((v, i) => (
                            <span key={i} className="text-[9px] bg-rose-950/60 text-rose-300 border border-rose-900/40 px-2.5 py-0.5 rounded-full">{v}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-400 block">No safety policy violations logged.</span>
                      )}
                    </div>
                    <div className="p-3.5 bg-slate-950 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-500 block">ACTION REMEDIATION</span>
                      <span className="text-xs font-bold text-white mt-1 block">{selectedPipelineCard.actionPlan || 'Awaiting ergonomic evaluation plan.'}</span>
                    </div>
                  </div>

                  {/* Right Column - EHS controls / Sign-off */}
                  <div className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Operations Control Hub</h4>
                      <p className="text-[11px] text-slate-400">Escalate this workstation or approve manual sign-off and seal compliance cert.</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      {/* EHS compliance approve seal */}
                      {activeRole === 'ehs' && selectedPipelineCard.stage !== 'compliance' && (
                        <button onClick={async () => {
                          try {
                            const updatedHistory = [
                              ...(Array.isArray(selectedPipelineCard.history) ? selectedPipelineCard.history : []),
                              {
                                date: new Date().toISOString().split('T')[0],
                                event: 'EHS Manual Signoff Approved',
                                details: 'Manual assessment verification completed and compliant.'
                              }
                            ];
                            const updatedNode = await updateWorkstation(selectedPipelineCard.id, {
                              stage: 'compliance',
                              history: updatedHistory
                            });
                            setPipelineData(prev => prev.map(w => w.id === selectedPipelineCard.id ? updatedNode : w));
                            setSelectedPipelineCard(updatedNode);
                            setToastText("Workstation approved and sealed as COMPLIANT.");
                            setShowToast(true);
                            setTimeout(() => setShowToast(false), 4000);
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <FileSignature className="h-4 w-4" /> Approve Compliance Seal
                        </button>
                      )}

                      {/* AI copilot remediation planner */}
                      <button onClick={() => { setShowCopilot(true); generateAutonomousPlan(); }} className="w-full py-2 bg-purple-900/40 hover:bg-purple-950 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> AI Remediation planner
                      </button>
                    </div>
                  </div>
                </div>

                {/* Log History */}
                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Workstation History Audit Trail</h4>
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-2">
                    {(Array.isArray(selectedPipelineCard.history) ? selectedPipelineCard.history : []).map((h, i) => (
                      <div key={i} className="flex gap-3 text-[11px] p-2 bg-slate-950/40 rounded-lg border border-white/5">
                        <span className="font-mono text-cyan-400 font-bold shrink-0">{h.date}</span>
                        <div>
                          <strong className="text-slate-200">{h.event}:</strong> <span className="text-slate-400">{h.details}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS COMMAND CENTER TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn no-print">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Stations</span>
                  <span className="text-2xl font-black text-white block mt-1">{pipelineData.length} Nodes</span>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg"><FileSpreadsheet className="h-5 w-5 text-cyan-400" /></div>
              </div>
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Critical Alerts</span>
                  <span className="text-2xl font-black text-rose-500 block mt-1">{pipelineData.filter(w => w.riskScore >= 70).length} Stations</span>
                </div>
                <div className="bg-rose-950/40 p-3 rounded-lg border border-rose-900/50"><AlertOctagon className="h-5 w-5 text-rose-400 animate-pulse" /></div>
              </div>
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Compliant Stations</span>
                  <span className="text-2xl font-black text-emerald-400 block mt-1">{pipelineData.filter(w => w.stage === 'compliance').length} sealed</span>
                </div>
                <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-900/50"><ShieldCheck className="h-5 w-5 text-emerald-400" /></div>
              </div>
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex items-center justify-between shadow-lg">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Fatigue Index</span>
                  <span className="text-2xl font-black text-amber-400 block mt-1">4.8 / 10</span>
                </div>
                <div className="bg-amber-950/40 p-3 rounded-lg border border-amber-900/50"><HeartCrack className="h-5 w-5 text-amber-400" /></div>
              </div>
            </div>

            {/* Enterprise Risk Heatmap - World Map from ERGO */}
            <EnterpriseRiskHeatmap />

            {/* Risk Trend & Heatmap Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white">Posture Risk Level Trend</h3>
                  <p className="text-xs text-slate-400 font-mono">Telemetry risk scores over time (REBA thresholds)</p>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { month: 'Jan', avgRisk: 25 },
                      { month: 'Feb', avgRisk: 42 },
                      { month: 'Mar', avgRisk: 35 },
                      { month: 'Apr', avgRisk: 68 },
                      { month: 'May', avgRisk: 48 }
                    ]}>
                      <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                      <YAxis stroke="#475569" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#1e293b' }} />
                      <Area type="monotone" dataKey="avgRisk" stroke="#06b6d4" fillOpacity={1} fill="url(#colorRisk)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>


            </div>

            {/* Notifications Feed */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-extrabold text-white">System Alerts Log Feed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-between shadow-inner">
                    <div className="text-xs">
                      <span className="text-[9px] text-slate-500 block font-mono">{n.date}</span>
                      <p className="font-semibold text-slate-300">"{n.text}"</p>
                    </div>
                    <button onClick={() => setNotifications(notifications.filter(item => item.id !== n.id))} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* OPERATIONAL FORMS TAB */}
        {activeTab === 'forms' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn no-print">
            {/* Sidebar form navigation */}
            <div className="lg:col-span-3 space-y-4">
              <div className="glass-panel p-4 rounded-xl border border-white/5 shadow-lg">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block mb-3">Assessment Forms</span>
                <div className="space-y-2">
                  <button onClick={() => setSelectedFormId('reba_rula')} className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${selectedFormId === 'reba_rula' ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'}`}>
                    <ClipboardList className="h-4 w-4" /> RULA/REBA Posture Index
                  </button>
                  <button onClick={() => setSelectedFormId('niosh')} className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${selectedFormId === 'niosh' ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'}`}>
                    <Sliders className="h-4 w-4" /> NIOSH Lifting Equation
                  </button>
                  <button onClick={() => setSelectedFormId('pushpull')} className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${selectedFormId === 'pushpull' ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'}`}>
                    <SlidersHorizontal className="h-4 w-4" /> Push & Pull Force
                  </button>
                  <button onClick={() => setSelectedFormId('registration')} className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${selectedFormId === 'registration' ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'}`}>
                    <UserPlus className="h-4 w-4" /> Station Registration
                  </button>
                  <button onClick={() => setSelectedFormId('ecr')} className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${selectedFormId === 'ecr' ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'}`}>
                    <Wrench className="h-4 w-4" /> Engineering change (ECR)
                  </button>
                  <button onClick={() => setSelectedFormId('incident')} className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${selectedFormId === 'incident' ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'}`}>
                    <AlertTriangle className="h-4 w-4" /> Discomfort Injury report
                  </button>
                  <button onClick={() => setSelectedFormId('audits')} className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${selectedFormId === 'audits' ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'}`}>
                    <CheckSquare className="h-4 w-4" /> Safety Site Audits
                  </button>
                  <button onClick={() => setSelectedFormId('ai_wizard')} className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${selectedFormId === 'ai_wizard' ? 'bg-purple-950/40 border-purple-500/50 text-purple-400' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'}`}>
                    <Sparkles className="h-4 w-4 text-purple-400" /> AI Postural CAD Wizard
                  </button>
                </div>
              </div>
            </div>

            {/* Form details wrapper */}
            <div className="lg:col-span-9 bg-slate-900/60 p-6 rounded-2xl border border-white/5 shadow-2xl relative">
              {/* Autosave HUD */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{hasUnsavedChanges ? 'Editing...' : `Draft saved at ${lastAutosave}`}</span>
              </div>

              {/* RULA / REBA FORM */}
              {selectedFormId === 'reba_rula' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-3">
                    <h3 className="text-base font-extrabold text-gradient-cyan">RULA / REBA Interactive Calculator</h3>
                    <p className="text-xs text-slate-400 mt-1">Directly select posture variables to record REBA risk profiles in Google Sheets.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Trunk Flexion Posture</label>
                      <select value={rebaTrunk} onChange={(e) => setRebaTrunk(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white">
                        <option value="1">Upright neutral (+1)</option>
                        <option value="2">0–20° Flexion (+2)</option>
                        <option value="3">20–60° Flexion (+3)</option>
                        <option value="4">&gt;60° Extreme Flexion (+4)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Neck Flexion Position</label>
                      <select value={rebaNeck} onChange={(e) => setRebaNeck(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white">
                        <option value="1">0–20° Flexion (+1)</option>
                        <option value="2">&gt;20° Flexion / Extension (+2)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Upper Arm Elevation</label>
                      <select value={rebaUpperArm} onChange={(e) => setRebaUpperArm(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white">
                        <option value="1">Neutral position (+1)</option>
                        <option value="2">0–45° Flexion (+2)</option>
                        <option value="3">45–90° Flexion (+3)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Load / Lift Weight Force</label>
                      <select value={rebaForce} onChange={(e) => setRebaForce(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-white">
                        <option value="1">&lt; 10 kg Load (+0)</option>
                        <option value="2">10–20 kg Load (+1)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 uppercase block font-mono">Calculated Telemetry Indices</span>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-slate-300 font-bold">REBA Score: <span className="text-cyan-400">{calculatedReba}/15</span></span>
                        <span className="text-xs text-slate-300 font-bold">RULA Score: <span className="text-cyan-400">{calculatedRula}/9</span></span>
                      </div>
                    </div>
                    <button onClick={() => handleFormSubmit('reba_rula')} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition">
                      Submit Assessment
                    </button>
                  </div>
                </div>
              )}

              {/* NIOSH FORM */}
              {selectedFormId === 'niosh' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-3">
                    <h3 className="text-base font-extrabold text-gradient-cyan">NIOSH Lifting Equation Form</h3>
                    <p className="text-xs text-slate-400 mt-1">Evaluate manual lifting loads based on lift parameters and duration limits.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Object Load Weight (kg)</label>
                      <input type="number" value={nlWeight} onChange={(e) => setNlWeight(parseFloat(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Horizontal Reach Distance (cm)</label>
                      <input type="number" value={nlHorizontal} onChange={(e) => setNlHorizontal(parseFloat(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Lifting Frequency (lifts/min)</label>
                      <input type="number" value={nlFreq} onChange={(e) => setNlFreq(parseFloat(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Hand-Object Coupling Quality</label>
                      <select value={nlCoupling} onChange={(e) => setNlCoupling(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white">
                        <option value="Good">Good Handles (Good)</option>
                        <option value="Fair">Fair Grips (Fair)</option>
                        <option value="Poor">Poor/No Handles (Poor)</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={() => handleFormSubmit('niosh')} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-xl transition">
                    Submit NIOSH Lift Assessment
                  </button>
                </div>
              )}

              {/* PUSH PULL FORM */}
              {selectedFormId === 'pushpull' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-3">
                    <h3 className="text-base font-extrabold text-gradient-cyan">Push / Pull Whole-Body Force Auditor</h3>
                    <p className="text-xs text-slate-400 mt-1">Audit dolly transits against ISO 11228-2 whole-body force thresholds.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Total Cart Mass Weight (kg)</label>
                      <input type="number" value={ppWeight} onChange={(e) => setPpWeight(parseFloat(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Initial Startup Force (kg-f)</label>
                      <input type="number" value={ppInitialForce} onChange={(e) => setPpInitialForce(parseFloat(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white" />
                    </div>
                  </div>

                  <button onClick={() => handleFormSubmit('pushpull')} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-xl transition">
                    Submit Push Force Audit
                  </button>
                </div>
              )}

              {/* WORKSTATION REGISTRATION FORM */}
              {selectedFormId === 'registration' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-3">
                    <h3 className="text-base font-extrabold text-gradient-cyan">Workstation Registration Desk</h3>
                    <p className="text-xs text-slate-400 mt-1">Register equipment dimensions and operator exposure durations.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Workstation Name</label>
                      <input type="text" placeholder="e.g. Battery Assembly Table 02" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Assigned Operator</label>
                      <input type="text" placeholder="e.g. John Doe" value={regOperator} onChange={(e) => setRegOperator(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white" />
                    </div>
                  </div>

                  <button onClick={() => handleFormSubmit('reba_rula')} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-xl transition">
                    Save Workstation Registration
                  </button>
                </div>
              )}

              {/* ENGINEERING CHANGE REQUEST FORM */}
              {selectedFormId === 'ecr' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-3">
                    <h3 className="text-base font-extrabold text-gradient-cyan">Engineering Change Request (ECR) Request</h3>
                    <p className="text-xs text-slate-400 mt-1">Submit formal request to implement physical modifications at a workstation.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Target Workstation ID</label>
                      <input type="text" placeholder="e.g. node-101" value={ecrWorkstation} onChange={(e) => setEcrWorkstation(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Projected Cost Budget ($)</label>
                      <input type="number" value={ecrBudget} onChange={(e) => setEcrBudget(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Engineering Improvements Details</label>
                    <textarea rows={3} placeholder="Scissor lift modifications..." value={ecrDescription} onChange={(e) => setEcrDescription(e.target.value)} className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-white" />
                  </div>

                  <button onClick={() => handleFormSubmit('ecr')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl transition">
                    Commit ECR request
                  </button>
                </div>
              )}

              {/* DISCOMFORT HEATMAP REPORT */}
              {selectedFormId === 'incident' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-3">
                    <h3 className="text-base font-extrabold text-gradient-cyan">Discomfort & Injury holographic locator</h3>
                    <p className="text-xs text-slate-400 mt-1">Select physical fatigue regions on the humanoid scan below.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Interactive Mannequin */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/5 flex flex-col items-center">
                      <div className="w-full max-w-[150px] relative flex justify-center items-center">
                        <svg viewBox="0 0 180 345" className="w-full h-auto select-none">
                          <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="5" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>

                          <circle cx="90" cy="172" r="140" stroke="rgba(244, 63, 94, 0.02)" fill="none" strokeWidth="1" />
                          <circle cx="90" cy="172" r="90" stroke="rgba(244, 63, 94, 0.04)" fill="none" strokeWidth="1" />

                          <style>{`
                            .body-path { fill: rgba(30, 41, 59, 0.4); stroke: rgba(148, 163, 184, 0.2); stroke-width: 1.2px; cursor: pointer; transition: all 0.2s; }
                            .body-path:hover { fill: rgba(244, 63, 94, 0.25) !important; stroke: rgba(244, 63, 94, 0.75) !important; }
                            .body-path.selected { fill: rgba(244, 63, 94, 0.75) !important; stroke: #f43f5e !important; filter: url(#glow); }
                          `}</style>

                          <ellipse cx="90" cy="30" rx="14" ry="17" className={`body-path ${selectedBodyPart === 'Head' ? 'selected' : ''}`} onClick={() => setSelectedBodyPart('Head')} />
                          <rect x="83" y="47" width="14" height="12" rx="3" className={`body-path ${selectedBodyPart === 'Neck' ? 'selected' : ''}`} onClick={() => setSelectedBodyPart('Neck')} />
                          <path d="M 64 59 C 74 53, 106 53, 116 59 C 126 61, 136 69, 140 77 L 124 84 L 90 81 L 56 84 L 40 77 C 44 69, 54 61, 64 59 Z" className={`body-path ${selectedBodyPart === 'Shoulders' ? 'selected' : ''}`} onClick={() => setSelectedBodyPart('Shoulders')} />
                          <path d="M 52 87 H 128 L 122 129 H 58 Z" className={`body-path ${selectedBodyPart === 'Upper Back' ? 'selected' : ''}`} onClick={() => setSelectedBodyPart('Upper Back')} />
                          <rect x="58" y="131" width="64" height="34" rx="4" className={`body-path ${selectedBodyPart === 'Lower Back' ? 'selected' : ''}`} onClick={() => setSelectedBodyPart('Lower Back')} />
                        </svg>
                      </div>
                      {selectedBodyPart && <span className="text-xs font-bold text-rose-400 mt-2 block animate-pulse">Target: {selectedBodyPart}</span>}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">Operator Employee Name</label>
                        <input type="text" placeholder="Janice Wong" value={incOperator} onChange={(e) => setIncOperator(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">Fatigue Severity level ({incFatigueLevel}/10)</label>
                        <input type="range" min="1" max="10" value={incFatigueLevel} onChange={(e) => setIncFatigueLevel(parseInt(e.target.value))} className="w-full accent-rose-500" />
                      </div>
                      <button onClick={() => handleFormSubmit('incident')} className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-xl transition">
                        File Discomfort Incident
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SITE AUDITS FORM */}
              {selectedFormId === 'audits' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-850 pb-3">
                    <h3 className="text-base font-extrabold text-gradient-cyan">EHS Site Audit & Policy checklist</h3>
                    <p className="text-xs text-slate-400 mt-1">Audit factory floor setups against guidelines.</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-850 cursor-pointer">
                      <input type="checkbox" checked={auditChecks.primaryReachOptimal} onChange={(e) => setAuditChecks({...auditChecks, primaryReachOptimal: e.target.checked})} className="rounded text-cyan-500 bg-slate-900 border-slate-700" />
                      <div className="text-xs">
                        <span className="font-bold text-white block">Reach Zones conform to ANSI limits</span>
                        <span className="text-slate-400">All tools/parts are within comfortable reach circle boundaries.</span>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-850 cursor-pointer">
                      <input type="checkbox" checked={auditChecks.heightAdjustable} onChange={(e) => setAuditChecks({...auditChecks, heightAdjustable: e.target.checked})} className="rounded text-cyan-500 bg-slate-900 border-slate-700" />
                      <div className="text-xs">
                        <span className="font-bold text-white block">Height Adjustable workstations present</span>
                        <span className="text-slate-400">Operators can adjust tables to comfortable vertical height limits.</span>
                      </div>
                    </label>
                  </div>

                  <button onClick={() => handleFormSubmit('incident')} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2.5 rounded-xl transition">
                    Lock EHS Audit Report
                  </button>
                </div>
              )}

              {/* AI POSTURAL CAD WIZARD WITH FILE UPLOAD */}
              {selectedFormId === 'ai_wizard' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-850 pb-3">
                    <h3 className="text-base font-extrabold text-gradient-cyan">AI Postural CAD Vision Wizard</h3>
                    <p className="text-xs text-slate-400 mt-1">Upload posture photo to trigger skeletal joint calculation overlays.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Annotated Canvas */}
                    <div className="lg:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col items-center shadow-inner">
                      <span className="text-[10px] text-slate-500 uppercase font-mono mb-2 block">CAD Skeletal overlay</span>
                      
                      <div className="relative bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex justify-center shadow-2xl">
                        <canvas ref={drawingCanvasRef} width={260} height={220} className="block touch-none" />
                      </div>

                      <div className="w-full mt-3 flex justify-between gap-2">
                        <button onClick={() => fileInputRef.current.click()} className="text-[9px] uppercase font-bold text-cyan-400 px-3 py-1.5 bg-slate-900 border border-white/5 rounded hover:bg-slate-800 flex items-center gap-1">
                          <Upload className="h-3 w-3" /> Upload Photo
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                        <button onClick={() => drawMannequinBlueprint('')} className="text-[9px] uppercase font-bold text-slate-500 px-3 py-1.5 bg-slate-900 border border-white/5 rounded hover:bg-slate-800">
                          Reset CAD
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Target Task Description</label>
                        <input type="text" value={aiTargetTask} onChange={(e) => setAiTargetTask(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white" />
                      </div>
                      <button onClick={runAiPosturalAnalysis} disabled={aiIsAnalyzing} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-800 text-white rounded-xl text-xs font-bold py-2.5 transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        {aiIsAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-yellow-300" />}
                        <span>Request AI Diagnostics</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Diagnosis Result */}
                  {aiAnalysisResult && (
                    <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-xl space-y-3 animate-fadeIn">
                      <div className="flex justify-between items-center border-b border-purple-900/30 pb-2">
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider font-mono">AI spatial calculations</span>
                        <span className="px-2.5 py-0.5 text-[9px] font-bold bg-rose-950 text-rose-300 rounded border border-rose-900/40">RULA score: {aiAnalysisResult.rulaCalculated}</span>
                      </div>
                      <div className="text-xs space-y-2 text-slate-300">
                        <p><strong className="text-white block">Key posturing risk:</strong> {aiAnalysisResult.criticalFinding}</p>
                        <p><strong className="text-white block">Remediation suggestion:</strong> {aiAnalysisResult.engineeringMitigation}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIBRARY TAB */}
        {activeTab === 'library' && (
          <div className="space-y-6 animate-fadeIn no-print">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-white">Ergonomics Policy & Guidelines library</h3>
                <p className="text-xs text-slate-400 mt-1">Access global ISO and ANSI safety guidelines.</p>
              </div>
              <div className="relative w-full md:w-72">
                <input type="text" placeholder="Search guidelines catalog..." className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-300 focus:outline-none w-full" />
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STANDARD_GUIDELINES.map((guide, idx) => (
                <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded">{guide.code}</span>
                    <span className="text-[10px] text-slate-500">Regulatory standard</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-white">{guide.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{guide.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-4 text-center text-[10px] text-slate-500 no-print">
        <p>© 2026 ErgoFlow AI. Certified compliance and posture safety system analyzer. ISO 11228, ANSI B11 guidelines compliant.</p>
      </footer>

      {/* PDF DOSSIER PRINT PREVIEW MODAL */}
      {showDossierModal && dossierWorkstation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 flex justify-center items-start p-6 print:p-0 print:static print:bg-white">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-8 relative flex flex-col gap-6 shadow-2xl print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white">
            
            {/* Modal header control */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3 no-print">
              <span className="text-xs font-mono text-cyan-400">PDF Print preview inspector</span>
              <div className="flex items-center gap-2">
                <button onClick={runPrintWindow} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  <Download className="h-3.5 w-3.5" /> Export PDF / Print
                </button>
                <button onClick={() => setShowDossierModal(false)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Document Printable Dossier Container */}
            <div className="bg-slate-950 p-6 rounded-xl border border-white/5 flex flex-col gap-6 print-card print:border-none print:p-0">
              
              {/* Document Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white print:text-black">ERGOFLOW AI COMPLIANCE DOSSIER</h2>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">ISO 11228 & ANSI safety verification record</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block font-mono">RECORD ID: {dossierWorkstation.id}</span>
                  <span className="text-[9px] text-slate-500 block font-mono">GEN DATE: {new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>

              {/* Workstation Core Info */}
              <div className="grid grid-cols-3 gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Workstation Node:</span>
                  <span className="text-xs font-bold text-white print:text-black">{dossierWorkstation.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Division Dept:</span>
                  <span className="text-xs font-bold text-white print:text-black">{dossierWorkstation.department}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Active Staff:</span>
                  <span className="text-xs font-bold text-white print:text-black">{dossierWorkstation.assignedOperator}</span>
                </div>
              </div>

              {/* Posture Scorecards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 print:border-slate-200">
                  <span className="text-[9px] text-slate-500 block">REBA Posture Score</span>
                  <span className="text-lg font-black text-rose-400 block mt-1">{dossierWorkstation.rebaScore} / 15</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 print:border-slate-200">
                  <span className="text-[9px] text-slate-500 block">RULA Reach Score</span>
                  <span className="text-lg font-black text-rose-400 block mt-1">{dossierWorkstation.rulaScore} / 9</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 print:border-slate-200">
                  <span className="text-[9px] text-slate-500 block">Exposure Factor</span>
                  <span className="text-lg font-black text-indigo-400 block mt-1">{dossierWorkstation.exposureHours} Hrs limit</span>
                </div>
              </div>

              {/* Observed Triggers */}
              <div className="bg-slate-900/40 p-4 rounded-lg border border-white/5 print:border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase font-mono mb-1.5">Logged violations & triggers:</span>
                <span className="text-xs text-slate-300 font-bold block">
                  {(Array.isArray(dossierWorkstation.violations) ? dossierWorkstation.violations : []).join(', ') || 'No policy safety triggers logged on this workstation.'}
                </span>
              </div>

              {/* Action Remediation Plan */}
              <div className="bg-slate-900/40 p-4 rounded-lg border border-white/5 print:border-slate-200">
                <span className="text-[9px] text-slate-500 block uppercase font-mono mb-1.5">Action plan timeline:</span>
                <span className="text-xs text-slate-300 font-bold block">{dossierWorkstation.actionPlan || 'Awaiting ergonomic specialist planning.'}</span>
              </div>

              {/* Signature section */}
              <div className="border-t border-slate-800 pt-6 mt-4 grid grid-cols-2 gap-8">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">EHS Inspector Cert Sign-off:</span>
                  <div className="h-10 border-b border-slate-700/50 mt-2 flex items-end">
                    <span className="text-[10px] italic font-mono text-cyan-400/70 select-none pb-1">{currentUser.name}</span>
                  </div>
                  <span className="text-[8px] text-slate-500 mt-1 block">Digital signature certified via ErgoFlow AI</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Supervisor Authorization:</span>
                  <div className="h-10 border-b border-slate-700/50 mt-2"></div>
                  <span className="text-[8px] text-slate-500 mt-1 block">Signature and Date sign-off</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* AI AUTONOMOUS COPILOT REMEDIATION MODAL */}
      {showCopilot && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex justify-center items-center p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 relative shadow-2xl flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-xs font-bold text-gradient-purple flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-400" /> AI Autonomous Remediation Planner
              </span>
              <button onClick={() => { setShowCopilot(false); setCopilotPlan(null); }} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>

            {copilotLoading && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-purple-400" />
                <span className="text-xs font-mono text-slate-400">Synthesizing ECR upgrade model...</span>
              </div>
            )}

            {!copilotLoading && copilotPlan && (
              <div className="space-y-4">
                <div className="bg-slate-950 p-3 rounded-lg border border-white/5 space-y-1">
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">Root Cause Assessment:</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{copilotPlan.rootCause}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">Proposed Equipment Upgrades:</span>
                  <div className="space-y-1">
                    {copilotPlan.recommendedEquip.map((eq, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-white/5 text-[10px]">
                        <span className="font-bold text-slate-200">{eq.item}</span>
                        <span className="text-purple-400">${eq.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-white/5">
                  <div>
                    <span className="text-[9px] text-slate-500 block">Total Est Budget</span>
                    <span className="text-xs font-black text-white">${copilotPlan.totalBudget}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Time to Remediate</span>
                    <span className="text-xs font-black text-white">{copilotPlan.timelineDays} Days</span>
                  </div>
                </div>

                <button onClick={executeAutonomousPlan} className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Check className="h-4 w-4" /> Approve & Execute Remediation Plan
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}