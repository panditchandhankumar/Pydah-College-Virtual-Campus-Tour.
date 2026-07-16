import { createServerFn } from "@tanstack/react-start";
import { getHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const hotspotSchema = z.object({
  yaw: z.number(),
  pitch: z.number(),
}).passthrough();

const upsertInput = z.object({
  sceneId: z.string().min(1).max(200),
  hotspots: z.array(hotspotSchema).max(500),
  adminToken: z.string().min(1),
});

const deleteInput = z.object({
  sceneId: z.string().min(1).max(200),
  adminToken: z.string().min(1),
});

function verifyToken(provided: string) {
  const expected = process.env.ADMIN_WRITE_TOKEN;
  if (!expected) throw new Error("Server admin token not configured");
  // Constant-length-ish compare (values are short admin token)
  if (provided.length !== expected.length || provided !== expected) {
    throw new Error("Unauthorized");
  }
}

export const upsertHotspotOverride = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => upsertInput.parse(d))
  .handler(async ({ data }) => {
    verifyToken(data.adminToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("hotspot_overrides")
      .upsert(
        {
          scene_id: data.sceneId,
          hotspots: data.hotspots as unknown as never,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "scene_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteHotspotOverride = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => deleteInput.parse(d))
  .handler(async ({ data }) => {
    verifyToken(data.adminToken);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("hotspot_overrides")
      .delete()
      .eq("scene_id", data.sceneId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
