import type { Gym, Member } from "@/types";

export function buildPlanPrompt(member: Member, gym: Gym): string {
  return `
You are a fitness onboarding expert creating a personalized video series for a new gym member.

GYM PROFILE:
- Name: ${gym.name}
- Equipment: ${gym.equipment.join(", ")}
- Class types: ${gym.class_types.join(", ")}
- Brand style: ${gym.style_notes || "friendly, motivating, and practical"}

MEMBER PROFILE:
- Name: ${member.name}
- Primary goal: ${member.goal}
- Fitness level: ${member.fitness_level}
- Injuries/limitations: ${member.injuries || "none"}

Create a 5-video onboarding series for this member. Each video should:
1. Be specific to their goal and fitness level
2. Use the gym's actual equipment and classes
3. Feel personal and motivating, not generic
4. Build logically from intro to technique to plan to community to next steps

Respond ONLY with a valid JSON array of exactly 5 objects. No preamble, no markdown fences.
Each object must have: title (string), description (string, 1-2 sentences), seedancePrompt (string, detailed video generation prompt, 30-50 words).

The seedancePrompt should describe a real gym video scene with a trainer demonstrating, equipment shown, and the member's goal reflected visually.
`.trim();
}
