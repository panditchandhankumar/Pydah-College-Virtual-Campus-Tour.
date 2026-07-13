import adminBlock360 from "@/assets/admin-block-360.jpg.asset.json";
import library360 from "@/assets/library-360.jpg.asset.json";
import cafeteria360 from "@/assets/cafeteria-360.jpg.asset.json";
import mainCircle360 from "@/assets/main-circle-360.jpg.asset.json";
import ground360 from "@/assets/ground-360.jpg.asset.json";
import sittingGround360 from "@/assets/sitting-ground-360.jpg.asset.json";
import collegeFront360 from "@/assets/college-front-360.jpg.asset.json";
import engineeringMiddle360 from "@/assets/engineering-middle-360.jpg.asset.json";

export type Category =
  | "entrance"
  | "road"
  | "junction"
  | "academic"
  | "facility"
  | "recreation"
  | "parking";

export type HotspotIcon =
  | "arrow"
  | "building"
  | "gate"
  | "cse"
  | "ece"
  | "cafeteria"
  | "seminar"
  | "library"
  | "parking"
  | "ground"
  | "garden"
  | "info"
  | "nav";

export type HotspotStyle = "circle" | "rounded" | "pill" | "glass" | "floating";
export type HotspotDisplay = "icon" | "iconText" | "text";
export type HotspotAnimation = "none" | "bob" | "pulse" | "spin";

export interface Hotspot {
  targetId: string;
  yaw: number; // degrees
  pitch: number;
  label?: string;
  arrow?: "up" | "right" | "down" | "left";
  /** Visual appearance — all optional, sensible defaults applied at render */
  icon?: HotspotIcon;
  size?: number; // px, default 54
  background?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  glow?: boolean;
  shadow?: boolean;
  opacity?: number; // 0-1
  style?: HotspotStyle;
  display?: HotspotDisplay;
  tooltip?: string;
  description?: string;
  animation?: HotspotAnimation;
  visible?: boolean;
  enabled?: boolean;
}

export interface Panorama {
  id: string;
  title: string;
  description: string;
  category: Category;
  panorama: string;
  thumbnail: string;
  /** position on the mini-map, 0-100 percent */
  map: { x: number; y: number };
  facilities: string[];
  hotspots: Hotspot[];
}

// Photo Sphere Viewer public demo panoramas — used as placeholders per node.
// Swap the URL of any node for a real PYDAH 360° capture without touching UI.
const CDN = "https://photo-sphere-viewer-data.netlify.app/assets";
const P = {
  gate: `${CDN}/tour/key-biscayne-1.jpg`,
  road: `${CDN}/tour/key-biscayne-2.jpg`,
  circle: `${CDN}/tour/key-biscayne-3.jpg`,
  park: `${CDN}/tour/key-biscayne-4.jpg`,
  open: `${CDN}/tour/key-biscayne-5.jpg`,
  ground: `${CDN}/tour/key-biscayne-6.jpg`,
  ece: `${CDN}/tour/key-biscayne-7.jpg`,
  sphere: `${CDN}/sphere.jpg`,
  sphereTest: `${CDN}/sphere-test.jpg`,
  cropped: `${CDN}/sphere-cropped.jpg`,
};
const T = {
  gate: `${CDN}/tour/key-biscayne-1-thumb.jpg`,
  road: `${CDN}/tour/key-biscayne-2-thumb.jpg`,
  circle: `${CDN}/tour/key-biscayne-3-thumb.jpg`,
  park: `${CDN}/tour/key-biscayne-4-thumb.jpg`,
  open: `${CDN}/tour/key-biscayne-5-thumb.jpg`,
  ground: `${CDN}/tour/key-biscayne-6-thumb.jpg`,
  ece: `${CDN}/tour/key-biscayne-7-thumb.jpg`,
  sphere: `${CDN}/sphere-small.jpg`,
  sphereTest: `${CDN}/sphere-test.jpg`,
  cropped: `${CDN}/sphere-cropped.jpg`,
};

export const PANORAMAS: Panorama[] = [
  {
    id: "main-gate",
    title: "Main Gate",
    description:
      "The grand entrance to PYDAH campus — signature archway, security desk and visitor drop-off.",
    category: "entrance",
    panorama: P.gate,
    thumbnail: T.gate,
    map: { x: 45, y: 15 },
    facilities: ["Security desk", "Visitor parking", "Info kiosk"],
    hotspots: [
      { targetId: "straight-road", yaw: 0, pitch: -3, arrow: "up" },
      { targetId: "main-circle", yaw: 15, pitch: -5, arrow: "up" },
      { targetId: "ground", yaw: -80, pitch: -3, arrow: "left" },
      { targetId: "security-office", yaw: 70, pitch: -2, arrow: "right" },
    ],
  },
  {
    id: "straight-road",
    title: "Straight Road",
    description:
      "The tree-lined arterial road from the main gate leading into the central circle of the campus.",
    category: "road",
    panorama: P.road,
    thumbnail: T.road,
    map: { x: 45, y: 30 },
    facilities: ["Pedestrian walk", "Landscaping"],
    hotspots: [
      { targetId: "main-gate", yaw: 180, pitch: -3, arrow: "down" },
      { targetId: "main-circle", yaw: 0, pitch: -3, arrow: "up" },
    ],
  },
  {
    id: "main-circle",
    title: "Main Circle",
    description:
      "Central junction of the campus. Roads branch out to every academic and recreational zone from here.",
    category: "junction",
    panorama: mainCircle360.url,
    thumbnail: mainCircle360.url,
    map: { x: 45, y: 55 },
    facilities: ["Central roundabout", "Signage", "Benches"],
    hotspots: [
      { targetId: "engineering-block", yaw: 0, pitch: -6, label: "Engineering Block", arrow: "up" },
      { targetId: "sitting-park", yaw: -60, pitch: -3, arrow: "left" },
      { targetId: "open-ground", yaw: 90, pitch: -3, arrow: "right" },
      { targetId: "bike-parking", yaw: 180, pitch: -3, arrow: "down" },
      { targetId: "main-gate", yaw: 160, pitch: -3, arrow: "down" },
    ],
  },
  {
    id: "ground",
    title: "Ground",
    description:
      "The main sports ground with cricket pitch and athletics track adjoining the entrance road.",
    category: "recreation",
    panorama: ground360.url,
    thumbnail: ground360.url,
    map: { x: 13, y: 55 },
    facilities: ["Cricket pitch", "Athletics track", "Spectator area"],
    hotspots: [
      { targetId: "main-gate", yaw: 45, pitch: -3, arrow: "up" },
      { targetId: "main-circle", yaw: 90, pitch: -3, arrow: "right" },
    ],
  },
  {
    id: "security-office",
    title: "Security Office",
    description:
      "24×7 security cabin at the main gate handling visitor entry, vehicle pass and campus surveillance.",
    category: "facility",
    panorama: P.sphereTest,
    thumbnail: T.sphereTest,
    map: { x: 55, y: 10 },
    facilities: ["Visitor log", "CCTV monitors", "Public address"],
    hotspots: [{ targetId: "main-gate", yaw: 180, pitch: -3, arrow: "down" }],
  },
  {
    id: "engineering-block",
    title: "Engineering Block",
    description:
      "The engineering academic hub — home to CSE, ECE, principal's office, admissions and administrative rooms.",
    category: "academic",
    panorama: engineeringMiddle360.url,
    thumbnail: engineeringMiddle360.url,
    map: { x: 65, y: 42 },
    facilities: ["Classrooms", "Labs", "Faculty rooms", "Seminar hall"],
    hotspots: [
      { targetId: "cse-department", yaw: -40, pitch: -3, arrow: "left" },
      { targetId: "ece-department", yaw: 40, pitch: -3, arrow: "right" },
      { targetId: "admission-block", yaw: -90, pitch: 0, arrow: "left" },
      { targetId: "principal-office", yaw: 0, pitch: -3, arrow: "up" },
      { targetId: "office-room", yaw: 90, pitch: -3, arrow: "right" },
      { targetId: "cafeteria", yaw: 60, pitch: -3, arrow: "right" },
      { targetId: "seminar-hall", yaw: -120, pitch: -3, arrow: "left" },
      { targetId: "main-circle", yaw: 180, pitch: -3, label: "Main Circle (Back)", arrow: "down" },
      { targetId: "main-gate", yaw: 200, pitch: -5, label: "Main Gate", arrow: "down" },
    ],
  },

  {
    id: "sitting-park",
    title: "Sitting Park",
    description:
      "A landscaped park with benches and shade — the campus's favourite spot to relax between classes.",
    category: "recreation",
    panorama: P.park,
    thumbnail: T.park,
    map: { x: 30, y: 55 },
    facilities: ["Benches", "Gardens", "Walkways"],
    hotspots: [
      { targetId: "main-circle", yaw: 90, pitch: -3, arrow: "right" },
      { targetId: "open-ground", yaw: 30, pitch: -3, arrow: "up" },
    ],
  },
  {
    id: "open-ground",
    title: "Sitting Ground",
    description:
      "Sitting ground in front of the Engineering and Degree blocks — a wide open lawn used for gatherings and relaxation.",
    category: "recreation",
    panorama: sittingGround360.url,
    thumbnail: sittingGround360.url,
    map: { x: 70, y: 75 },
    facilities: ["Open lawn", "Building views", "Seating edges"],
    hotspots: [
      { targetId: "main-circle", yaw: 180, pitch: -3, arrow: "down" },
      { targetId: "degree-block", yaw: 60, pitch: -3, arrow: "right" },
      { targetId: "engineering-block", yaw: -60, pitch: -3, arrow: "left" },
      { targetId: "main-gate", yaw: 210, pitch: -3, arrow: "down" },
    ],
  },
  {
    id: "bike-parking",
    title: "Bike Parking",
    description:
      "Covered two-wheeler parking bay for students and staff at the southern end of the campus.",
    category: "parking",
    panorama: P.cropped,
    thumbnail: T.cropped,
    map: { x: 45, y: 92 },
    facilities: ["Two-wheeler bays", "Rain cover", "Security patrol"],
    hotspots: [{ targetId: "main-circle", yaw: 0, pitch: -3, arrow: "up" }],
  },
  {
    id: "cse-department",
    title: "CSE Department",
    description:
      "Computer Science & Engineering — AI/ML lab, cybersecurity range, project rooms and faculty cabins.",
    category: "academic",
    panorama: library360.url,
    thumbnail: library360.url,
    map: { x: 58, y: 36 },
    facilities: ["AI/ML lab", "Cybersecurity lab", "Project studio"],
    hotspots: [
      { targetId: "engineering-block", yaw: 180, pitch: -3, arrow: "down" },
      { targetId: "main-circle", yaw: 160, pitch: -3, arrow: "down" },
      { targetId: "labs", yaw: 45, pitch: -3, arrow: "right" },
      { targetId: "classrooms", yaw: -45, pitch: -3, arrow: "left" },
    ],
  },
  {
    id: "ece-department",
    title: "ECE Department",
    description:
      "Electronics & Communication — embedded systems lab, VLSI design lab and communication test benches.",
    category: "academic",
    panorama: P.ece,
    thumbnail: T.ece,
    map: { x: 72, y: 36 },
    facilities: ["Embedded lab", "VLSI lab", "Communication lab"],
    hotspots: [
      { targetId: "engineering-block", yaw: 180, pitch: -3, arrow: "down" },
      { targetId: "main-circle", yaw: 200, pitch: -3, arrow: "down" },
      { targetId: "labs", yaw: -60, pitch: -3, arrow: "left" },
    ],
  },
  {
    id: "admission-block",
    title: "Admission Block",
    description:
      "The Admission Cell — enquiries, application processing, counselling and document verification.",
    category: "academic",
    panorama: adminBlock360.url,
    thumbnail: adminBlock360.url,
    map: { x: 76, y: 22 },
    facilities: ["Enquiry desk", "Counselling", "Document verification"],
    hotspots: [
      { targetId: "engineering-block", yaw: 180, pitch: -3, arrow: "down" },
      { targetId: "main-gate", yaw: -90, pitch: -3, arrow: "left" },
    ],
  },
  {
    id: "principal-office",
    title: "Principal Office",
    description:
      "Office of the Principal — academic leadership and institutional administration.",
    category: "academic",
    panorama: adminBlock360.url,
    thumbnail: adminBlock360.url,
    map: { x: 60, y: 46 },
    facilities: ["Principal's desk", "Meeting area"],
    hotspots: [
      { targetId: "engineering-block", yaw: 180, pitch: -3, arrow: "down" },
    ],
  },
  {
    id: "office-room",
    title: "Office Room",
    description:
      "General administrative office — accounts, records, examination cell and staff coordination.",
    category: "academic",
    panorama: adminBlock360.url,
    thumbnail: adminBlock360.url,
    map: { x: 70, y: 46 },
    facilities: ["Accounts", "Records", "Exam cell"],
    hotspots: [
      { targetId: "engineering-block", yaw: 180, pitch: -3, arrow: "down" },
    ],
  },
  {
    id: "labs",
    title: "Labs",
    description:
      "Shared engineering laboratories used across CSE and ECE for practicals and project work.",
    category: "academic",
    panorama: P.park,
    thumbnail: T.park,
    map: { x: 55, y: 40 },
    facilities: ["Workstations", "Instruments", "Server rack"],
    hotspots: [
      { targetId: "cse-department", yaw: 200, pitch: -3, arrow: "down" },
      { targetId: "ece-department", yaw: 160, pitch: -3, arrow: "down" },
    ],
  },
  {
    id: "classrooms",
    title: "Classrooms",
    description:
      "Smart classrooms with projectors, whiteboards and tiered seating for lecture sessions.",
    category: "academic",
    panorama: P.road,
    thumbnail: T.road,
    map: { x: 78, y: 40 },
    facilities: ["Smart boards", "Projector", "AC halls"],
    hotspots: [
      { targetId: "cse-department", yaw: 200, pitch: -3, arrow: "left" },
    ],
  },
  {
    id: "degree-block",
    title: "Degree Block",
    description:
      "Frontal view showing both the Engineering block (left) and the Degree block (right) — arts, science and commerce classrooms.",
    category: "academic",
    panorama: collegeFront360.url,
    thumbnail: collegeFront360.url,
    map: { x: 90, y: 55 },
    facilities: ["Lecture halls", "Faculty rooms", "Library annex"],
    hotspots: [
      { targetId: "engineering-block", yaw: -90, pitch: -3, arrow: "left" },
      { targetId: "main-circle", yaw: 250, pitch: -3, arrow: "left" },
      { targetId: "open-ground", yaw: 200, pitch: -3, arrow: "down" },
      { targetId: "main-gate", yaw: 300, pitch: -3, arrow: "up" },
    ],
  },

  {
    id: "cafeteria",
    title: "Cafeteria",
    description:
      "Campus cafeteria beside the Engineering College — snacks, meals and student hangout.",
    category: "facility",
    panorama: cafeteria360.url,
    thumbnail: cafeteria360.url,
    map: { x: 86.5, y: 38 },
    facilities: ["Food counters", "Seating", "Beverages"],
    hotspots: [
      { targetId: "engineering-block", yaw: 200, pitch: -3, arrow: "left" },
      { targetId: "main-circle", yaw: 180, pitch: -3, arrow: "down" },
      { targetId: "main-gate", yaw: 220, pitch: -3, arrow: "down" },
    ],
  },
  {
    id: "seminar-hall",
    title: "Seminar Hall",
    description:
      "Seminar Hall near the Faculty Block — hosts guest lectures, workshops and department events.",
    category: "academic",
    panorama: P.sphere,
    thumbnail: T.sphere,
    map: { x: 53.5, y: 47.5 },
    facilities: ["Stage", "Projector", "Tiered seating"],
    hotspots: [
      { targetId: "engineering-block", yaw: 60, pitch: -3, arrow: "right" },
      { targetId: "main-circle", yaw: 180, pitch: -3, arrow: "down" },
    ],
  },
];

export const getPanorama = (id: string) => PANORAMAS.find((p) => p.id === id);
