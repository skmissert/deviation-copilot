export interface EvidencePackage {
  deviation_id: string;
  batch_record: {
    batch_id: string;
    product: string;
    manufacturing_date: string;
    process_step: string;
    observed_parameter: string;
    target_range: string;
    recorded_value: string;
    operator_notes: string;
    anomaly: boolean;
  };
  equipment_log: {
    equipment_id: string;
    maintenance_status: string;
    calibration_date: string;
    event_logged: string;
    technician_comment: string;
    anomaly: boolean;
  };
  qc_test: {
    batch_id: string;
    test_name: string;
    specification: string;
    result: string;
    analyst_comment: string;
    anomaly: boolean;
  };
  environmental_monitoring: {
    location: string;
    date: string;
    humidity_pct: number;
    temperature_c: number;
    observation: string;
    anomaly: boolean;
  };
}

const evidencePackages: Record<string, EvidencePackage> = {
  "DEV-2025-001": {
    deviation_id: "DEV-2025-001",
    batch_record: {
      batch_id: "BT-145-2507A",
      product: "mRNA-145",
      manufacturing_date: "2025-07-01",
      process_step: "Formulation — LNP Encapsulation",
      observed_parameter: "Shift Handoff Documentation",
      target_range: "Complete sign-off required within 30 min of shift end",
      recorded_value: "Sign-off missing on pages 4 and 7",
      operator_notes: "Operator logged off early. Supervisor not notified of incomplete record.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-FORM-003",
      maintenance_status: "Current — last PM 2025-06-15",
      calibration_date: "2025-06-15",
      event_logged: "No equipment anomalies recorded during batch run.",
      technician_comment: "Equipment operating within normal parameters.",
      anomaly: false,
    },
    qc_test: {
      batch_id: "BT-145-2507A",
      test_name: "Encapsulation Efficiency",
      specification: "≥ 85%",
      result: "87.3%",
      analyst_comment: "Test result within specification. No QC anomaly detected.",
      anomaly: false,
    },
    environmental_monitoring: {
      location: "Manufacturing Suite 2",
      date: "2025-07-01",
      humidity_pct: 42,
      temperature_c: 21.5,
      observation: "Environmental conditions within normal operating range.",
      anomaly: false,
    },
  },
  "DEV-2025-002": {
    deviation_id: "DEV-2025-002",
    batch_record: {
      batch_id: "BT-123-2507B",
      product: "mRNA-123",
      manufacturing_date: "2025-07-05",
      process_step: "QC Release Testing — Potency",
      observed_parameter: "Analyst Procedure Compliance",
      target_range: "SOP-QC-015 Rev 4 compliance required",
      recorded_value: "Analyst used Rev 3 procedure — outdated method",
      operator_notes: "Analyst unaware of SOP revision published on 2025-06-20.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-HPLC-001",
      maintenance_status: "Current — last PM 2025-06-01",
      calibration_date: "2025-06-01",
      event_logged: "HPLC system within calibration. No anomalies.",
      technician_comment: "All performance checks passed at last calibration.",
      anomaly: false,
    },
    qc_test: {
      batch_id: "BT-123-2507B",
      test_name: "Potency Assay (Rev 3)",
      specification: "80–120% label claim",
      result: "94% label claim",
      analyst_comment: "Result obtained using superseded method. Test requires repetition with Rev 4 procedure.",
      anomaly: true,
    },
    environmental_monitoring: {
      location: "QC Laboratory Suite A",
      date: "2025-07-05",
      humidity_pct: 45,
      temperature_c: 22.0,
      observation: "Lab conditions within specification.",
      anomaly: false,
    },
  },
  "DEV-2025-003": {
    deviation_id: "DEV-2025-003",
    batch_record: {
      batch_id: "BT-101-2507C",
      product: "mRNA-101",
      manufacturing_date: "2025-07-08",
      process_step: "Packaging — Label Application",
      observed_parameter: "Label Application Documentation",
      target_range: "Lot traceability record complete with operator sign-off",
      recorded_value: "Lot number field left blank on 12 units",
      operator_notes: "Label printer jam resolved — documentation step skipped during recovery.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-LABEL-002",
      maintenance_status: "Current — last PM 2025-07-01",
      calibration_date: "2025-07-01",
      event_logged: "Label printer jam at 09:32. Jam cleared at 09:47.",
      technician_comment: "Printer jam caused by media misalignment. Corrected. Equipment continued normal operation.",
      anomaly: false,
    },
    qc_test: {
      batch_id: "BT-101-2507C",
      test_name: "Label Integrity Check",
      specification: "100% traceability required",
      result: "98% — 12 units missing lot number",
      analyst_comment: "12 units quarantined for re-labeling. Batch otherwise meeting specification.",
      anomaly: true,
    },
    environmental_monitoring: {
      location: "Packaging Suite 1",
      date: "2025-07-08",
      humidity_pct: 40,
      temperature_c: 20.8,
      observation: "Packaging suite conditions within specification.",
      anomaly: false,
    },
  },
  "DEV-2025-004": {
    deviation_id: "DEV-2025-004",
    batch_record: {
      batch_id: "BT-145-2507D",
      product: "mRNA-145",
      manufacturing_date: "2025-07-12",
      process_step: "Fill and Finish — Vial Filling",
      observed_parameter: "Fill Temperature",
      target_range: "2–8°C",
      recorded_value: "Recorded temperature: 11.4°C at time point 3",
      operator_notes: "Temperature alarm triggered at 11:15. Batch manufacturing suspended. QA notified.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-FILL-001",
      maintenance_status: "Calibration due 2025-07-10 — OVERDUE",
      calibration_date: "2025-04-10",
      event_logged: "Temperature sensor reading 3.4°C above true value per bench calibration check.",
      technician_comment: "Temperature sensor EQ-FILL-001-TS3 showing systematic positive bias. Calibration drift confirmed. Sensor replaced.",
      anomaly: true,
    },
    qc_test: {
      batch_id: "BT-145-2507D",
      test_name: "Thermal Stability Assessment",
      specification: "Product stable at 2–8°C; suspect above 10°C",
      result: "Thermal stability at risk — batch quarantined for extended stability testing",
      analyst_comment: "Batch quarantined per SOP-MFG-007. Extended stability study initiated.",
      anomaly: true,
    },
    environmental_monitoring: {
      location: "Fill Suite 1",
      date: "2025-07-12",
      humidity_pct: 38,
      temperature_c: 21.2,
      observation: "Room environment within specification. Equipment-specific temperature excursion only.",
      anomaly: false,
    },
  },
  "DEV-2025-005": {
    deviation_id: "DEV-2025-005",
    batch_record: {
      batch_id: "BT-123-2508A",
      product: "mRNA-123",
      manufacturing_date: "2025-08-01",
      process_step: "QC Release Testing — Particle Size",
      observed_parameter: "DLS Particle Size Measurement",
      target_range: "80–120 nm",
      recorded_value: "Instrument reading: 143 nm (OOS)",
      operator_notes: "OOS result flagged. Analyst confirmed instrument performance check failed. Equipment removed from service.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-DLS-002",
      maintenance_status: "Calibration overdue — last calibrated 2025-05-01",
      calibration_date: "2025-05-01",
      event_logged: "DLS instrument EQ-DLS-002 performance verification failed. Reference standard result: 104 nm (expected: 100 nm ± 2%).",
      technician_comment: "Laser alignment drift identified as root cause. Instrument requires full optical realignment and recalibration.",
      anomaly: true,
    },
    qc_test: {
      batch_id: "BT-123-2508A",
      test_name: "Particle Size Distribution (DLS)",
      specification: "80–120 nm, PDI < 0.2",
      result: "143 nm — OOS. Testing paused. Repeat testing on qualified instrument: 97 nm — within spec.",
      analyst_comment: "Initial OOS attributed to instrument calibration failure. Confirmed result obtained on backup instrument within specification.",
      anomaly: true,
    },
    environmental_monitoring: {
      location: "QC Lab Suite B",
      date: "2025-08-01",
      humidity_pct: 46,
      temperature_c: 22.5,
      observation: "Lab conditions normal. No environmental contribution to OOS.",
      anomaly: false,
    },
  },
  "DEV-2025-006": {
    deviation_id: "DEV-2025-006",
    batch_record: {
      batch_id: "BT-145-2508B",
      product: "mRNA-145",
      manufacturing_date: "2025-08-05",
      process_step: "Secondary Packaging",
      observed_parameter: "Carton Assembly Procedure",
      target_range: "SOP-PKG-008 Rev 2 — correct carton orientation",
      recorded_value: "5 cartons assembled with incorrect insert orientation",
      operator_notes: "New operator on shift. Training on Rev 2 not completed prior to assignment.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-PKG-004",
      maintenance_status: "Current",
      calibration_date: "2025-08-01",
      event_logged: "No equipment issues noted.",
      technician_comment: "Equipment operating normally.",
      anomaly: false,
    },
    qc_test: {
      batch_id: "BT-145-2508B",
      test_name: "Packaging Integrity Check",
      specification: "100% carton assembly compliance",
      result: "99.5% — 5 units corrected and re-inspected",
      analyst_comment: "5 units reworked and re-inspected. No product impact.",
      anomaly: false,
    },
    environmental_monitoring: {
      location: "Packaging Suite 2",
      date: "2025-08-05",
      humidity_pct: 41,
      temperature_c: 21.0,
      observation: "Conditions within normal range.",
      anomaly: false,
    },
  },
  "DEV-2025-007": {
    deviation_id: "DEV-2025-007",
    batch_record: {
      batch_id: "BT-101-2508C",
      product: "mRNA-101",
      manufacturing_date: "2025-08-08",
      process_step: "Formulation",
      observed_parameter: "Ambient Room Temperature",
      target_range: "20–24°C",
      recorded_value: "27.3°C — exceedance detected at 14:00",
      operator_notes: "Temperature alarm acknowledged. Manufacturing suspended. Environmental team notified.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-HVAC-101",
      maintenance_status: "Maintenance overdue — last service 2025-05-01",
      calibration_date: "2025-05-01",
      event_logged: "HVAC damper actuator failure detected. Airflow reduced by 40% in Manufacturing Suite 1.",
      technician_comment: "HVAC damper actuator EQ-HVAC-101-DA2 seized in partially closed position. Root cause of temperature exceedance confirmed.",
      anomaly: true,
    },
    qc_test: {
      batch_id: "BT-101-2508C",
      test_name: "Product Integrity Assessment",
      specification: "Thermal stability maintained at 20–24°C",
      result: "Batch quarantined. Accelerated stability study initiated to assess impact of temperature exceedance.",
      analyst_comment: "Batch under quarantine. All QC testing suspended pending stability assessment outcome.",
      anomaly: true,
    },
    environmental_monitoring: {
      location: "Manufacturing Suite 1",
      date: "2025-08-08",
      humidity_pct: 55,
      temperature_c: 27.3,
      observation: "Temperature exceedance: 27.3°C vs. 20–24°C specification. Duration of exceedance: approximately 2 hours.",
      anomaly: true,
    },
  },
  "DEV-2025-008": {
    deviation_id: "DEV-2025-008",
    batch_record: {
      batch_id: "BT-145-2508D",
      product: "mRNA-145",
      manufacturing_date: "2025-08-12",
      process_step: "Upstream Bioreactor Culture",
      observed_parameter: "pH Control",
      target_range: "7.0–7.4",
      recorded_value: "pH drifted to 6.85 at hour 18 of culture",
      operator_notes: "pH drift noted at routine monitoring check. Base addition initiated. pH corrected within 30 minutes.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-BIO-002",
      maintenance_status: "Current",
      calibration_date: "2025-08-01",
      event_logged: "pH controller base pump flow rate reduced by 15% over last 72 hours — gradual drift pattern.",
      technician_comment: "Pump calibration within spec at last check. Gradual drift likely due to process variation. No equipment anomaly confirmed.",
      anomaly: false,
    },
    qc_test: {
      batch_id: "BT-145-2508D",
      test_name: "In-Process pH Monitoring",
      specification: "pH 7.0–7.4",
      result: "pH 6.85 — brief excursion. Corrected within 30 min. Batch assessment: acceptable.",
      analyst_comment: "Brief pH excursion corrected. Extended IPC sampling performed. Batch quality unaffected.",
      anomaly: false,
    },
    environmental_monitoring: {
      location: "Manufacturing Suite 3",
      date: "2025-08-12",
      humidity_pct: 43,
      temperature_c: 21.8,
      observation: "Room environment within specification.",
      anomaly: false,
    },
  },
  "DEV-2025-009": {
    deviation_id: "DEV-2025-009",
    batch_record: {
      batch_id: "BT-123-2508E",
      product: "mRNA-123",
      manufacturing_date: "2025-08-15",
      process_step: "QC Analytical Testing — Identity",
      observed_parameter: "Analytical Raw Data Documentation",
      target_range: "All raw data files to be saved per SOP-QC-003",
      recorded_value: "Raw data file for identity test not saved to designated network location",
      operator_notes: "Analyst saved file to local drive only. Network backup not created. Discovered during record review.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-SPEC-003",
      maintenance_status: "Current",
      calibration_date: "2025-08-10",
      event_logged: "No equipment anomalies. All performance checks passed.",
      technician_comment: "Instrument operating normally.",
      anomaly: false,
    },
    qc_test: {
      batch_id: "BT-123-2508E",
      test_name: "Identity Testing (RT-PCR)",
      specification: "Identity confirmed vs. reference standard",
      result: "Identity confirmed — result valid. Data recovered from local backup.",
      analyst_comment: "Identity result valid. Data recovered and filed to correct location. No impact on batch quality.",
      anomaly: false,
    },
    environmental_monitoring: {
      location: "QC Lab Suite A",
      date: "2025-08-15",
      humidity_pct: 44,
      temperature_c: 22.2,
      observation: "Lab environment within specification.",
      anomaly: false,
    },
  },
  "DEV-2025-010": {
    deviation_id: "DEV-2025-010",
    batch_record: {
      batch_id: "BT-101-2508F",
      product: "mRNA-101",
      manufacturing_date: "2025-08-18",
      process_step: "Formulation — LNP preparation",
      observed_parameter: "Lipid Raw Material Identity",
      target_range: "Identity match to CoA required. Purity ≥ 98%",
      recorded_value: "Lipid component DSPC purity: 95.2% — below specification",
      operator_notes: "Out-of-specification incoming material identified during formulation preparation. Batch manufacturing suspended. QA notified.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-FORM-001",
      maintenance_status: "Current",
      calibration_date: "2025-08-01",
      event_logged: "No equipment anomalies detected.",
      technician_comment: "Formulation equipment operating normally.",
      anomaly: false,
    },
    qc_test: {
      batch_id: "BT-101-2508F",
      test_name: "Incoming Material Identity and Purity (DSPC Lot SL-2508-44)",
      specification: "Identity match required. Purity ≥ 98%",
      result: "Identity confirmed. Purity: 95.2% — FAILS specification. Lot rejected.",
      analyst_comment: "Supplier lot rejected. Alternate qualified lot sourced. Supplier notified per SOP-QS-002.",
      anomaly: true,
    },
    environmental_monitoring: {
      location: "Formulation Suite 2",
      date: "2025-08-18",
      humidity_pct: 40,
      temperature_c: 21.4,
      observation: "Environmental conditions within specification. No contribution to material non-conformance.",
      anomaly: false,
    },
  },
  "DEV-2025-012": {
    deviation_id: "DEV-2025-012",
    batch_record: {
      batch_id: "BT-123-2509B",
      product: "mRNA-123",
      manufacturing_date: "2025-09-05",
      process_step: "Fill and Finish — Stopper Insertion",
      observed_parameter: "Stopper Insertion Force",
      target_range: "15–25 N",
      recorded_value: "Average insertion force: 29.8 N — above specification",
      operator_notes: "Force alarm triggered. Line stopped. Engineering contacted for equipment assessment.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-FILL-003",
      maintenance_status: "Calibration overdue — last calibration 2025-06-01",
      calibration_date: "2025-06-01",
      event_logged: "Force sensor drift: calibration check shows +4.2 N systematic offset vs. reference load cell.",
      technician_comment: "Force sensor EQ-FILL-003-FS1 calibration drift confirmed. True insertion force within spec. Sensor replaced and recalibrated.",
      anomaly: true,
    },
    qc_test: {
      batch_id: "BT-123-2509B",
      test_name: "Container Closure Integrity Testing",
      specification: "No failures in CCIT per USP <1207>",
      result: "Pending — 100 vials sampled for CCIT. Testing in progress.",
      analyst_comment: "CCIT results pending. Batch on hold.",
      anomaly: false,
    },
    environmental_monitoring: {
      location: "Fill Suite 2",
      date: "2025-09-05",
      humidity_pct: 39,
      temperature_c: 21.1,
      observation: "Fill suite environment within specification.",
      anomaly: false,
    },
  },
  "DEV-2025-014": {
    deviation_id: "DEV-2025-014",
    batch_record: {
      batch_id: "BT-145-2509D",
      product: "mRNA-145",
      manufacturing_date: "2025-09-14",
      process_step: "Downstream Processing — Tangential Flow Filtration",
      observed_parameter: "Transmembrane Pressure (TMP)",
      target_range: "0.5–2.0 bar",
      recorded_value: "TMP: 2.8 bar — sustained exceedance for 45 minutes",
      operator_notes: "TMP alarm triggered. Process suspended. QA Director notified. Batch quarantined per critical deviation SOP.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-TFF-001",
      maintenance_status: "Current",
      calibration_date: "2025-09-01",
      event_logged: "Gradual TMP increase noted in last 3 batches. Rate of increase: +0.15 bar per batch.",
      technician_comment: "TFF membrane fouling pattern consistent with gradual drift. Membrane integrity check performed — membrane at end of lifetime.",
      anomaly: true,
    },
    qc_test: {
      batch_id: "BT-145-2509D",
      test_name: "Downstream Product Quality Assessment",
      specification: "Product concentration, purity, and integrity within specification",
      result: "Concentration: 85% of target (below 90% lower limit). Batch quarantined. Extended characterization initiated.",
      analyst_comment: "Critical impact on batch yield. Quarantine maintained pending full characterization. Regulatory assessment required.",
      anomaly: true,
    },
    environmental_monitoring: {
      location: "Downstream Processing Suite 1",
      date: "2025-09-14",
      humidity_pct: 42,
      temperature_c: 21.6,
      observation: "Environmental conditions within specification. No contribution to process excursion.",
      anomaly: false,
    },
  },
  "DEV-2025-016": {
    deviation_id: "DEV-2025-016",
    batch_record: {
      batch_id: "BT-101-2510A",
      product: "mRNA-101",
      manufacturing_date: "2025-10-02",
      process_step: "Manufacturing Suite 3 — All steps",
      observed_parameter: "Room Temperature",
      target_range: "20–24°C",
      recorded_value: "Temperature: 26.8°C. Duration: 3.5 hours.",
      operator_notes: "Environmental alarm triggered during batch manufacturing. Process suspended. Environmental team notified.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-HVAC-201",
      maintenance_status: "Service overdue — last service 2025-07-01",
      calibration_date: "2025-07-01",
      event_logged: "HVAC cooling coil condensate drain blocked. Coil icing resulted in reduced airflow and elevated room temperature.",
      technician_comment: "Blocked condensate drain confirmed as root cause. Drain cleared. Full HVAC system inspection performed.",
      anomaly: true,
    },
    qc_test: {
      batch_id: "BT-101-2510A",
      test_name: "Batch Stability Assessment",
      specification: "Product maintained at 20–24°C throughout processing",
      result: "Accelerated stability study initiated. Batch quarantined pending results.",
      analyst_comment: "Extended temperature exposure requires stability confirmation prior to release assessment.",
      anomaly: true,
    },
    environmental_monitoring: {
      location: "Manufacturing Suite 3",
      date: "2025-10-02",
      humidity_pct: 58,
      temperature_c: 26.8,
      observation: "Temperature exceedance: 26.8°C (limit: 24°C). Duration approximately 3.5 hours. Humidity also elevated at 58% (limit: 55%).",
      anomaly: true,
    },
  },
  "DEV-2025-019": {
    deviation_id: "DEV-2025-019",
    batch_record: {
      batch_id: "BT-101-2510D",
      product: "mRNA-101",
      manufacturing_date: "2025-10-13",
      process_step: "QC Release Testing — Potency",
      observed_parameter: "Cell-Based Potency Assay",
      target_range: "80–120% label claim",
      recorded_value: "Initial result: 64% label claim — OOS",
      operator_notes: "OOS result flagged immediately. Instrument failure investigation initiated. Repeat testing on backup instrument: 98% — within spec.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-READER-001",
      maintenance_status: "Calibration overdue",
      calibration_date: "2025-07-15",
      event_logged: "Microplate reader lamp intensity reduced to 72% of specification. Calibration check failed.",
      technician_comment: "Lamp replacement required. Systematic low-reading bias confirmed as root cause of OOS result.",
      anomaly: true,
    },
    qc_test: {
      batch_id: "BT-101-2510D",
      test_name: "Cell-Based Potency Assay",
      specification: "80–120% label claim",
      result: "Initial: 64% (OOS due to instrument failure). Confirmed result on backup instrument: 98% (within spec).",
      analyst_comment: "Confirmed OOS invalidated due to instrument failure. Batch quality confirmed on qualified backup instrument.",
      anomaly: true,
    },
    environmental_monitoring: {
      location: "QC Lab Suite C",
      date: "2025-10-13",
      humidity_pct: 44,
      temperature_c: 22.0,
      observation: "Lab environment within specification.",
      anomaly: false,
    },
  },
  "DEV-2025-020": {
    deviation_id: "DEV-2025-020",
    batch_record: {
      batch_id: "BT-145-2510E",
      product: "mRNA-145",
      manufacturing_date: "2025-10-17",
      process_step: "Upstream Bioreactor — Glucose Feed",
      observed_parameter: "Glucose Concentration",
      target_range: "3.0–6.0 g/L",
      recorded_value: "Glucose fell to 1.8 g/L at hour 36 — below lower limit",
      operator_notes: "Glucose alarm triggered. Additional glucose feed initiated. Process parameter recovered within specification after 2 hours.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-BIO-003",
      maintenance_status: "Current",
      calibration_date: "2025-10-01",
      event_logged: "Glucose feed pump performance check at last PM: flow rate 4% below target. Within tolerance but trending low.",
      technician_comment: "Pump performance trending toward lower control limit. Preventive maintenance recommended at next scheduled interval.",
      anomaly: false,
    },
    qc_test: {
      batch_id: "BT-145-2510E",
      test_name: "In-Process Cell Culture Analytics",
      specification: "Glucose 3.0–6.0 g/L; viability ≥ 80%",
      result: "Glucose excursion noted. Viability at time of excursion: 76% (below 80%). Extended cell recovery monitoring initiated.",
      analyst_comment: "Batch under investigation. Viability impact under assessment. Additional time points being sampled.",
      anomaly: true,
    },
    environmental_monitoring: {
      location: "Manufacturing Suite 4",
      date: "2025-10-17",
      humidity_pct: 43,
      temperature_c: 21.9,
      observation: "Room environment within specification. No environmental contribution.",
      anomaly: false,
    },
  },
  "DEV-2026-044": {
    deviation_id: "DEV-2026-044",
    batch_record: {
      batch_id: "BT-145-2602E",
      product: "mRNA-145",
      manufacturing_date: "2026-02-16",
      process_step: "Fill and Finish — Vial Filling",
      observed_parameter: "Fill Volume",
      target_range: "0.50 mL ± 0.02 mL",
      recorded_value: "Fill volume: 0.44 mL — OOS at multiple time points",
      operator_notes: "Fill volume alarm triggered during in-process check. Line stopped immediately. QA Director notified. Full batch quarantine enacted.",
      anomaly: true,
    },
    equipment_log: {
      equipment_id: "EQ-FILL-002",
      maintenance_status: "Calibration overdue — last calibration 2025-11-01",
      calibration_date: "2025-11-01",
      event_logged: "Peristaltic pump tubing showing wear. Flow rate calibration check failed — delivering 88% of target volume.",
      technician_comment: "Pump tubing replacement required. Calibration drift confirmed as root cause. Emergency maintenance in progress.",
      anomaly: true,
    },
    qc_test: {
      batch_id: "BT-145-2602E",
      test_name: "Fill Volume Check (IPC)",
      specification: "0.50 mL ± 0.02 mL per vial",
      result: "Average fill volume: 0.44 mL — critical OOS. All 100% vials sampled. 100% non-conforming.",
      analyst_comment: "Critical impact. Full batch rejection likely. QA Director and Regulatory team informed per SOP-QA-015.",
      anomaly: true,
    },
    environmental_monitoring: {
      location: "Fill Suite 1",
      date: "2026-02-16",
      humidity_pct: 37,
      temperature_c: 21.3,
      observation: "Fill suite environment within specification. No environmental contribution to fill volume excursion.",
      anomaly: false,
    },
  },
};

const defaultEvidence = (deviation_id: string, batch_id: string, product: string): EvidencePackage => ({
  deviation_id,
  batch_record: {
    batch_id,
    product,
    manufacturing_date: "2025-10-01",
    process_step: "Manufacturing Process Step",
    observed_parameter: "Process Parameter",
    target_range: "Within specification limits",
    recorded_value: "Parameter within specification",
    operator_notes: "Standard process operation. Deviation documented per SOP.",
    anomaly: false,
  },
  equipment_log: {
    equipment_id: "EQ-GEN-001",
    maintenance_status: "Current",
    calibration_date: "2025-09-01",
    event_logged: "No equipment anomalies recorded.",
    technician_comment: "Equipment operating within normal parameters at time of event.",
    anomaly: false,
  },
  qc_test: {
    batch_id,
    test_name: "Release Testing Panel",
    specification: "All parameters within specification",
    result: "All release tests within specification",
    analyst_comment: "No analytical anomalies detected.",
    anomaly: false,
  },
  environmental_monitoring: {
    location: "Manufacturing Area",
    date: "2025-10-01",
    humidity_pct: 42,
    temperature_c: 21.5,
    observation: "Environmental conditions within specification.",
    anomaly: false,
  },
});

export function getEvidence(deviation_id: string, batch_id: string, product: string): EvidencePackage {
  return evidencePackages[deviation_id] ?? defaultEvidence(deviation_id, batch_id, product);
}

import { DEVIATIONS_BY_ID } from "./deviations";

export function getEvidenceForDeviation(deviation_id: string): EvidencePackage {
  const dev = DEVIATIONS_BY_ID[deviation_id];
  return getEvidence(deviation_id, dev?.batch_id ?? "BATCH-UNKNOWN", dev?.product_id ?? "Unknown");
}
