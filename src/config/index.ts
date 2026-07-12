/**
 * @file configService — single source of truth for every JSON-driven config.
 *
 * Purpose: consolidate access to campus, ui, vr, settings and voice configs so
 * components stay declarative. Adding a new config means adding a JSON file +
 * a getter here — no component-level import changes.
 *
 * Usage:
 *   import { config } from "@/config";
 *   const buttons = config.ui.hud;
 *   const script = config.voiceFor("main-gate");
 */
import campusJson from "./campus.json";
import uiJson from "./ui.json";
import vrJson from "./vr.json";
import settingsJson from "./settings.json";
import voiceJson from "./voice.json";
import { PANORAMAS, getPanorama, type Panorama, type Hotspot, type Category } from "@/data/panoramas";
import { DEPARTMENTS, type Department } from "@/data/departments";

export type CampusConfig = typeof campusJson;
export type UiConfig = typeof uiJson;
export type VrConfig = typeof vrJson;
export type SettingsConfig = typeof settingsJson;
export type VoiceConfig = typeof voiceJson;

export const config = {
  campus: campusJson as CampusConfig,
  ui: uiJson as UiConfig,
  vr: vrJson as VrConfig,
  settings: settingsJson as SettingsConfig,
  voice: voiceJson as VoiceConfig,

  panoramas: PANORAMAS,
  departments: DEPARTMENTS,

  getPanorama,

  /** Voice narration script for a panorama; falls back to the panorama description. */
  voiceFor(id: string): string {
    const scripted = (voiceJson.scripts as Record<string, string>)[id];
    if (scripted) return scripted;
    const p = getPanorama(id);
    return p ? `${p.title}. ${p.description}` : "";
  },
};

export type { Panorama, Hotspot, Category, Department };
