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
      "A future-ready program in software engineering, algorithms, full-stack development, cloud computing and cybersecurity with a project-first curriculum.",
    courses: ["B.Tech CSE", "M.Tech CSE", "Integrated B.Tech + M.Tech"],
    labs: ["AI/ML Research Lab", "Cybersecurity Range", "Cloud & DevOps Lab", "Full-Stack Studio"],
    achievements: [
      "Smart India Hackathon winners",
      "12 patents filed in the last three years",
      "Placement average ₹9.4 LPA",
    ],
    color: "accent",
  },
  {
    id: "ece",
    name: "Electronics & Communication Engineering",
    short: "ECE",
    overview:
      "VLSI, embedded systems, communication networks, signal processing and IoT with hands-on FPGA and SDR labs.",
    courses: ["B.Tech ECE", "M.Tech VLSI", "M.Tech Embedded Systems"],
    labs: ["VLSI Design Lab", "Embedded Systems Lab", "SDR & Antenna Lab", "IoT Lab"],
    achievements: ["Best Paper – IEEE Region 10", "IoT product incubated with a startup"],
    color: "secondary",
  },
  {
    id: "mech",
    name: "Mechanical Engineering",
    short: "MECH",
    overview:
      "Design, thermal, manufacturing, robotics and mechatronics with a fully equipped workshop and CAD/CAM suite.",
    courses: ["B.Tech Mechanical", "M.Tech Thermal", "M.Tech CAD/CAM"],
    labs: ["CAD/CAM Studio", "Thermal Engineering Lab", "Robotics & Mechatronics", "Automotive Lab"],
    achievements: ["National SAE BAJA finalists", "Formula Student car unveiled"],
    color: "primary",
  },
  {
    id: "ai",
    name: "Artificial Intelligence",
    short: "AI",
    overview:
      "A specialized program focused on intelligent systems, machine learning, deep learning, computer vision, NLP and robotics.",
    courses: ["B.Tech AI", "M.Tech AI", "Integrated B.Tech + M.Tech AI"],
    labs: ["Deep Learning Lab", "Computer Vision Lab", "NLP Studio", "Robotics & AI Lab"],
    achievements: ["Kaggle competitions top-10 finish", "AI research published in Scopus journals"],
    color: "accent",
  },
  {
    id: "aiml",
    name: "Artificial Intelligence & Machine Learning",
    short: "AI&ML",
    overview:
      "Blends data science, machine learning, big data analytics and intelligent application development for industry-ready AI engineers.",
    courses: ["B.Tech AI & ML", "M.Tech AI & ML", "PG Diploma Data Science"],
    labs: ["Data Science Lab", "Machine Learning Lab", "Big Data Analytics Lab", "Intelligent Systems Lab"],
    achievements: ["Industry projects with analytics firms", "AI-powered startup incubated"],
    color: "secondary",
  },
  {
    id: "mba",
    name: "Master of Business Administration",
    short: "MBA",
    overview:
      "AICTE-approved MBA program with specialisations in Finance, Marketing, Human Resources, Analytics and Operations.",
    courses: ["MBA", "Executive MBA", "PGDM Analytics"],
    labs: ["Bloomberg Terminal Lab", "Business Analytics Lab", "Behavioural Lab"],
    achievements: ["100% placements in flagship batch", "Corporate mentorship with top MNCs"],
    color: "primary",
  },
  {
    id: "mtech",
    name: "Master of Technology",
    short: "M.Tech",
    overview:
      "Advanced postgraduate programs across CSE, ECE, Mechanical, Civil and AI specialisations with research-driven projects and industry collaboration.",
    courses: ["M.Tech CSE", "M.Tech ECE", "M.Tech Mechanical", "M.Tech AI", "M.Tech Structural"],
    labs: ["Research & Development Lab", "Centre of Excellence", "Project Innovation Lab"],
    achievements: ["University ranks in GATE-based admissions", "Research grants from AICTE & DST"],
    color: "accent",
  },
];
