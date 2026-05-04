import { buildPlanPrompt } from "@/lib/prompts";
import type { Gym, Member, PlanVideo } from "@/types";

interface ZaiChoice {
  message?: {
    content?: string;
  };
}

interface ZaiChatResponse {
  choices?: ZaiChoice[];
}

type RawPlanVideo = Partial<Pick<PlanVideo, "title" | "description" | "seedancePrompt">> & {
  prompt?: string;
};

const DEFAULT_ZAI_MODEL = "glm-5.1";

export async function generatePlanWithZai(member: Member, gym: Gym): Promise<PlanVideo[]> {
  if (process.env.USE_REAL_ZAI !== "true" || !process.env.ZAI_API_KEY) {
    return buildDemoPlan(member, gym);
  }

  try {
    const prompt = buildPlanPrompt(member, gym);
    const baseUrl = process.env.ZAI_BASE_URL || "https://api.z.ai/api/paas/v4";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ZAI_API_KEY}`,
        "Content-Type": "application/json",
        "Accept-Language": "en-US,en"
      },
      body: JSON.stringify({
        model: process.env.ZAI_MODEL || DEFAULT_ZAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Z.AI request failed with ${response.status}`);
    }

    const payload = (await response.json()) as ZaiChatResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Z.AI returned an empty response");
    }

    return normalizePlanVideos(parsePlanJson(content), member, gym);
  } catch (error) {
    console.error("Plan generation failed, using demo fallback", error);
    return buildDemoPlan(member, gym);
  }
}

function parsePlanJson(content: string): RawPlanVideo[] {
  const trimmed = content.trim();
  const jsonText = trimmed.startsWith("[") ? trimmed : trimmed.match(/\[[\s\S]*\]/)?.[0];
  if (!jsonText) {
    throw new Error("Z.AI response did not contain a JSON array");
  }

  const parsed = JSON.parse(jsonText) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Z.AI response JSON was not an array");
  }

  return parsed as RawPlanVideo[];
}

function normalizePlanVideos(videos: RawPlanVideo[], member: Member, gym: Gym): PlanVideo[] {
  const cleaned = videos.slice(0, 5).map((video, index) => ({
    title: safeText(video.title, `Video ${index + 1}`),
    description: safeText(video.description, `A personalized onboarding segment for ${member.name}.`),
    seedancePrompt: safeText(video.seedancePrompt || video.prompt, demoPrompt(index, member, gym)),
    status: "pending" as const
  }));

  while (cleaned.length < 5) {
    const index = cleaned.length;
    cleaned.push({
      title: demoTitle(index, member, gym),
      description: demoDescription(index, member, gym),
      seedancePrompt: demoPrompt(index, member, gym),
      status: "pending"
    });
  }

  return cleaned;
}

function buildDemoPlan(member: Member, gym: Gym): PlanVideo[] {
  return Array.from({ length: 5 }, (_, index) => ({
    title: demoTitle(index, member, gym),
    description: demoDescription(index, member, gym),
    seedancePrompt: demoPrompt(index, member, gym),
    status: "pending" as const
  }));
}

function demoTitle(index: number, member: Member, gym: Gym): string {
  const titles = [
    `Welcome to ${gym.name}, ${member.name}`,
    `${goalLabel(member.goal)} Technique Basics`,
    `Your First ${member.fitness_level} Training Flow`,
    `Classes and Recovery at ${gym.name}`,
    `${member.name}'s Next 30 Days`
  ];

  return titles[index] || `Onboarding Video ${index + 1}`;
}

function demoDescription(index: number, member: Member, gym: Gym): string {
  const equipment = readableList(gym.equipment);
  const classes = readableList(gym.class_types);
  const descriptions = [
    `A personal welcome that orients ${member.name} to the floor, the team, and the safest first steps for ${member.goal}.`,
    `A coach demonstrates setup and form cues using ${equipment}, scaled for a ${member.fitness_level} member.`,
    `A simple first workout connects warmup, strength, conditioning, and cooldown into a plan ${member.name} can repeat confidently.`,
    `The series connects ${member.name}'s goal with ${classes}, recovery habits, and community touchpoints inside ${gym.name}.`,
    `A clear next-step plan turns the first visit into a sustainable 30-day routine with progress milestones.`
  ];

  return descriptions[index] || `A personalized onboarding segment for ${member.name}.`;
}

function demoPrompt(index: number, member: Member, gym: Gym): string {
  const equipment = readableList(gym.equipment);
  const style = gym.style_notes || "friendly, clean, motivating";
  const prompts = [
    `A welcoming personal trainer greets ${member.name} inside ${gym.name}, walking past ${equipment}, upbeat lighting, approachable coaching energy, branded gym atmosphere, clear orientation shots for a new ${member.fitness_level} member focused on ${member.goal}.`,
    `A trainer demonstrates safe beginner-friendly technique for ${member.goal}, showing proper setup, controlled movement, and modifications around ${equipment}, confident coaching tone, modern gym floor, realistic pacing, supportive close-up form cues.`,
    `A coach leads a practical ${member.fitness_level} workout circuit using ${equipment}, combining warmup, strength, conditioning, and cooldown, visually tailored to ${member.name}'s ${member.goal} goal, steady camera movement, polished gym onboarding style.`,
    `A gym coach introduces useful classes and recovery habits at ${gym.name}, showing community moments, stretching, hydration, and smart pacing, with ${style} brand personality and a plan that respects ${member.injuries || "no listed limitations"}.`,
    `A trainer reviews ${member.name}'s next 30 days on the gym floor, pointing to equipment, calendar milestones, and confidence-building habits, cinematic but realistic fitness onboarding video, encouraging close, clear call to return tomorrow.`
  ];

  return prompts[index] || prompts[0];
}

function goalLabel(goal: string): string {
  return goal
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function readableList(items: string[]): string {
  if (items.length === 0) {
    return "the available equipment";
  }

  if (items.length === 1) {
    return items[0];
  }

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
