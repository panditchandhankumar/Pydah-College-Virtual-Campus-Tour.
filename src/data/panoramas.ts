import adminBlock360 from "@/assets/admin-block-360.jpg.asset.json";
import library360 from "@/assets/library-360.jpg.asset.json";

export type Category = "entrance" | "academic" | "facility" | "residential" | "recreation";

export interface Hotspot {
  targetId: string;
  yaw: number; // radians or degrees (we use degrees, viewer accepts strings)
  pitch: number;
  label: string;
  arrow?: "up" | "right" | "down" | "left";
}

export interface Panorama {
  id: string;
  title: string;
  description: string;
  category: Category;
  panorama: string;
  thumbnail: string;
  /** position on the mini map, 0-100 percent */
  map: { x: number; y: number };
  facilities: string[];
  hotspots: Hotspot[];
}

// Placeholder equirectangular panoramas from the open Photo Sphere Viewer demo set.
// Swap these URLs for real PYDAH campus 360° captures once available.
const CDN = "https://photo-sphere-viewer-data.netlify.app/assets";

export const PANORAMAS: Panorama[] = [
  {
    id: "main-gate",
    title: "Main Gate",
    description:
      "The grand entrance to PYDAH campus, framed by manicured lawns and the signature archway welcoming students and visitors.",
    category: "entrance",
    panorama: `${CDN}/tour/key-biscayne-1.jpg`,
    thumbnail: `${CDN}/tour/key-biscayne-1-thumb.jpg`,
    map: { x: 55, y: 12 },
    facilities: ["Security desk", "Visitor parking", "Info kiosk"],
    hotspots: [
      { targetId: "administration", yaw: 40, pitch: -5, label: "Administration" },
      { targetId: "library", yaw: 130, pitch: -3, label: "Central Library" },
    ],
  },
  {
    id: "administration",
    title: "Administration Block",
    description:
      "Home to the Principal's office, admissions, examination cell and finance departments — the operational heart of the college.",
    category: "academic",
    panorama: adminBlock360.url,
    thumbnail: adminBlock360.url,
    map: { x: 75, y: 22 },
    facilities: ["Principal's office", "Admissions", "Exam cell", "Accounts"],
    hotspots: [
      { targetId: "main-gate", yaw: -140, pitch: -5, label: "Main Gate" },
      { targetId: "vice-principal-cabin", yaw: -126, pitch: 12, label: "Vice Principal Cabin" },
      { targetId: "admission-cell", yaw: -128, pitch: -2, label: "Admission Cell" },
      { targetId: "aspire-arena", yaw: -104, pitch: 2, label: "Aspire Arena", arrow: "right" },
      { targetId: "library", yaw: 60, pitch: -3, label: "Library" },
      { targetId: "cse-block", yaw: 160, pitch: -3, label: "CSE Block" },
    ],
  },
  {
    id: "admission-cell",
    title: "Admission Cell",
    description:
      "The Admission Cell handles enquiries, applications and counselling for prospective students across all programmes.",
    category: "academic",
    panorama: adminBlock360.url,
    thumbnail: adminBlock360.url,
    map: { x: 78, y: 20 },
    facilities: ["Enquiry desk", "Counselling room", "Application processing"],
    hotspots: [
      { targetId: "administration", yaw: 0, pitch: -5, label: "Administration" },
    ],
  },
  {
    id: "vice-principal-cabin",
    title: "Vice Principal Cabin",
    description:
      "Office of the Vice Principal — academic leadership, faculty coordination and student mentorship.",
    category: "academic",
    panorama: adminBlock360.url,
    thumbnail: adminBlock360.url,
    map: { x: 73, y: 24 },
    facilities: ["Vice Principal's desk", "Meeting area"],
    hotspots: [
      { targetId: "administration", yaw: 0, pitch: -5, label: "Administration" },
    ],
  },
  {
    id: "aspire-arena",
    title: "Aspire Arena",
    description:
      "Aspire Arena — the central hall inside the Administration Block for notices, event displays and student assembly.",
    category: "facility",
    panorama: adminBlock360.url,
    thumbnail: adminBlock360.url,
    map: { x: 76, y: 26 },
    facilities: ["Notice boards", "Assembly space"],
    hotspots: [
      { targetId: "administration", yaw: 0, pitch: -5, label: "Administration" },
    ],
  },
  {
    id: "library",
    title: "Central Library",
    description:
      "A quiet, light-filled reading environment with over 80,000 volumes, digital archives, and dedicated research pods.",
    category: "facility",
    panorama: library360.url,
    thumbnail: library360.url,
    map: { x: 52, y: 42 },
    facilities: ["Reading hall", "Digital library", "Journal archive", "Discussion rooms"],
    hotspots: [
      { targetId: "administration", yaw: -60, pitch: -5, label: "Administration" },
      { targetId: "cse-block", yaw: 90, pitch: -3, label: "CSE Block" },
      { targetId: "innovation-lab", yaw: 30, pitch: -2, label: "Innovation Lab" },
    ],
  },
  {
    id: "cse-block",
    title: "CSE Department",
    description:
      "Computer Science block featuring modern classrooms, AI/ML lab, cybersecurity range, and collaborative learning spaces.",
    category: "academic",
    panorama: `${CDN}/tour/key-biscayne-4.jpg`,
    thumbnail: `${CDN}/tour/key-biscayne-4-thumb.jpg`,
    map: { x: 72, y: 42 },
    facilities: ["AI/ML lab", "Cybersecurity range", "Seminar hall", "Faculty rooms"],
    hotspots: [
      { targetId: "library", yaw: -90, pitch: -3, label: "Library" },
      { targetId: "innovation-lab", yaw: 45, pitch: -3, label: "Innovation Lab" },
      { targetId: "cafeteria", yaw: 150, pitch: -5, label: "Cafeteria" },
    ],
  },
  {
    id: "innovation-lab",
    title: "Innovation Lab",
    description:
      "A maker space for robotics, IoT prototyping, 3D printing and student startups — where PYDAH's next big ideas take shape.",
    category: "facility",
    panorama: `${CDN}/tour/key-biscayne-5.jpg`,
    thumbnail: `${CDN}/tour/key-biscayne-5-thumb.jpg`,
    map: { x: 45, y: 55 },
    facilities: ["3D printing", "Robotics arena", "IoT workbench", "Incubation desks"],
    hotspots: [
      { targetId: "cse-block", yaw: -135, pitch: -3, label: "CSE Block" },
      { targetId: "auditorium", yaw: 60, pitch: -3, label: "Auditorium" },
    ],
  },
  {
    id: "auditorium",
    title: "Auditorium",
    description:
      "1,200-seat auditorium hosting convocations, tech fests, guest lectures and cultural performances year round.",
    category: "facility",
    panorama: `${CDN}/sphere.jpg`,
    thumbnail: `${CDN}/sphere-small.jpg`,
    map: { x: 92, y: 60 },
    facilities: ["1,200 seats", "Green rooms", "AV control", "Stage lighting"],
    hotspots: [
      { targetId: "innovation-lab", yaw: -120, pitch: -3, label: "Innovation Lab" },
      { targetId: "cafeteria", yaw: 100, pitch: -3, label: "Cafeteria" },
    ],
  },
  {
    id: "cafeteria",
    title: "Cafeteria",
    description:
      "A vibrant multi-cuisine cafeteria and open-air court — the social crossroads of the campus.",
    category: "recreation",
    panorama: `${CDN}/sphere-test.jpg`,
    thumbnail: `${CDN}/sphere-test.jpg`,
    map: { x: 70, y: 75 },
    facilities: ["Multi-cuisine counters", "Barista", "Outdoor seating"],
    hotspots: [
      { targetId: "cse-block", yaw: -60, pitch: -3, label: "CSE Block" },
      { targetId: "hostel", yaw: 90, pitch: -3, label: "Hostel" },
    ],
  },
  {
    id: "hostel",
    title: "Student Hostel",
    description:
      "Modern residential blocks with 24/7 security, common rooms, high-speed Wi-Fi, gym and study lounges.",
    category: "residential",
    panorama: `${CDN}/tour/key-biscayne-6.jpg`,
    thumbnail: `${CDN}/tour/key-biscayne-6-thumb.jpg`,
    map: { x: 45, y: 88 },
    facilities: ["Wi-Fi", "Gym", "Study lounges", "Mess hall"],
    hotspots: [
      { targetId: "cafeteria", yaw: -90, pitch: -3, label: "Cafeteria" },
      { targetId: "playground", yaw: 60, pitch: -3, label: "Playground" },
    ],
  },
  {
    id: "playground",
    title: "Sports Ground",
    description:
      "Full-size cricket and football ground with athletics track, tennis courts and floodlit basketball court.",
    category: "recreation",
    panorama: `${CDN}/sphere.jpg`,
    thumbnail: `${CDN}/sphere-small.jpg`,
    map: { x: 10, y: 55 },
    facilities: ["Cricket ground", "Football pitch", "Tennis court", "Athletics track"],
    hotspots: [
      { targetId: "hostel", yaw: -140, pitch: -3, label: "Hostel" },
      { targetId: "main-gate", yaw: 40, pitch: -3, label: "Main Gate" },
    ],
  },
];

export const getPanorama = (id: string) => PANORAMAS.find((p) => p.id === id);
