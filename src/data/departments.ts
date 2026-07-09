export interface Department {
  id: string;
  name: string;
  short: string;
  overview: string;
  courses: string[];
  labs: string[];
  achievements: string[];
  color: string; // token name suffix for accents
}

export const DEPARTMENTS: Department[] = [
  {
    id: "cse",
    name: "Computer Science & Engineering",
    short: "CSE",
    overview:
      "Programs in software engineering, AI/ML, cybersecurity, and cloud systems with a project-first curriculum.",
    courses: ["B.Tech CSE", "B.Tech AI & DS", "M.Tech CSE", "M.Tech Cyber Security"],
    labs: ["AI/ML Research Lab", "Cybersecurity Range", "Cloud & DevOps Lab", "HCI Studio"],
    achievements: [
      "Smart India Hackathon 2024 winners",
      "12 patents filed in the last three years",
      "Placement average ₹9.4 LPA",
    ],
    color: "accent",
  },
  {
    id: "ece",
    name: "Electronics & Communication",
    short: "ECE",
    overview:
      "VLSI, embedded systems, communication networks and signal processing with hands-on FPGA and SDR labs.",
    courses: ["B.Tech ECE", "M.Tech VLSI", "M.Tech Embedded Systems"],
    labs: ["VLSI Design Lab", "Embedded Systems Lab", "SDR & Antenna Lab"],
    achievements: ["Best Paper – IEEE Region 10", "IoT product incubated with a Series-A startup"],
    color: "secondary",
  },
  {
    id: "mech",
    name: "Mechanical Engineering",
    short: "MECH",
    overview:
      "Design, thermal, manufacturing and mechatronics streams with a fully equipped workshop and CAD/CAM suite.",
    courses: ["B.Tech Mechanical", "M.Tech Thermal", "M.Tech CAD/CAM"],
    labs: ["CAD/CAM Studio", "Thermal Engineering Lab", "Robotics & Mechatronics"],
    achievements: ["National SAE BAJA finalists", "Formula Student car unveiled 2025"],
    color: "primary",
  },
  {
    id: "civil",
    name: "Civil Engineering",
    short: "CIVIL",
    overview:
      "Structural, transportation, geotech and environmental streams with strong industry collaborations.",
    courses: ["B.Tech Civil", "M.Tech Structural", "M.Tech Environmental"],
    labs: ["Structural Testing Lab", "GIS & Surveying", "Environmental Lab"],
    achievements: ["Consulted on 3 municipal smart-city projects"],
    color: "secondary",
  },
  {
    id: "eee",
    name: "Electrical & Electronics",
    short: "EEE",
    overview:
      "Power systems, renewable energy, control systems and industrial automation, with a smart-grid testbed.",
    courses: ["B.Tech EEE", "M.Tech Power Systems", "M.Tech Renewable Energy"],
    labs: ["Smart Grid Testbed", "Power Electronics Lab", "Automation Lab"],
    achievements: ["Solar micro-grid pilot with state utility"],
    color: "accent",
  },
  {
    id: "mba",
    name: "School of Management",
    short: "MBA",
    overview:
      "AICTE-approved MBA with specialisations in Finance, Marketing, Analytics and Operations.",
    courses: ["MBA", "Executive MBA", "PGDM Analytics"],
    labs: ["Bloomberg Terminal Lab", "Behavioural Lab"],
    achievements: ["100% placements in flagship batch"],
    color: "primary",
  },
];
