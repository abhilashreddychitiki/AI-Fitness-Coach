import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  CreateGymInput,
  CreateMemberInput,
  Gym,
  Member,
  Plan,
  PlanStatus,
  PlanVideo,
  PlanWithRelations
} from "@/types";

interface LocalDatabase {
  gyms: Gym[];
  members: Member[];
  plans: Plan[];
}

const EMPTY_DB: LocalDatabase = {
  gyms: [],
  members: [],
  plans: []
};

let writeQueue: Promise<unknown> = Promise.resolve();

export async function createGym(input: CreateGymInput): Promise<Gym> {
  return withDatabase((db) => {
    const gym: Gym = {
      id: randomUUID(),
      name: input.name.trim(),
      equipment: uniqueStrings(input.equipment),
      class_types: uniqueStrings(input.class_types),
      style_notes: input.style_notes?.trim() || "friendly, motivating, and practical",
      created_at: new Date().toISOString()
    };

    db.gyms.push(gym);
    return clone(gym);
  });
}

export async function getGym(id: string): Promise<Gym | null> {
  const db = await readDatabase();
  return clone(db.gyms.find((gym) => gym.id === id) || null);
}

export async function listGyms(): Promise<Gym[]> {
  const db = await readDatabase();
  return clone(db.gyms.sort((a, b) => b.created_at.localeCompare(a.created_at)));
}

export async function createMember(input: CreateMemberInput): Promise<Member> {
  return withDatabase((db) => {
    const gym = db.gyms.find((candidate) => candidate.id === input.gym_id);
    if (!gym) {
      throw new Error("Gym not found");
    }

    const member: Member = {
      id: randomUUID(),
      gym_id: input.gym_id,
      name: input.name.trim(),
      goal: input.goal,
      fitness_level: input.fitness_level,
      injuries: input.injuries?.trim() || "",
      created_at: new Date().toISOString()
    };

    db.members.push(member);
    return clone(member);
  });
}

export async function getMember(id: string): Promise<Member | null> {
  const db = await readDatabase();
  return clone(db.members.find((member) => member.id === id) || null);
}

export async function listMembersByGym(gymId: string): Promise<Member[]> {
  const db = await readDatabase();
  return clone(
    db.members
      .filter((member) => member.gym_id === gymId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export async function createPlan(input: {
  member_id: string;
  gym_id: string;
  videos: PlanVideo[];
  status?: PlanStatus;
}): Promise<Plan> {
  return withDatabase((db) => {
    const member = db.members.find((candidate) => candidate.id === input.member_id);
    const gym = db.gyms.find((candidate) => candidate.id === input.gym_id);
    if (!member || !gym) {
      throw new Error("Cannot create a plan without a valid member and gym");
    }

    const plan: Plan = {
      id: randomUUID(),
      member_id: input.member_id,
      gym_id: input.gym_id,
      videos: input.videos.map((video) => ({ ...video, status: video.status || "pending" })),
      status: input.status || "pending",
      created_at: new Date().toISOString()
    };

    db.plans.push(plan);
    return clone(plan);
  });
}

export async function getPlan(id: string): Promise<Plan | null> {
  const db = await readDatabase();
  return clone(db.plans.find((plan) => plan.id === id) || null);
}

export async function getLatestPlanForMember(memberId: string): Promise<Plan | null> {
  const db = await readDatabase();
  return clone(
    db.plans
      .filter((plan) => plan.member_id === memberId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null
  );
}

export async function getPlanWithRelations(planId: string): Promise<PlanWithRelations | null> {
  const db = await readDatabase();
  const plan = db.plans.find((candidate) => candidate.id === planId);
  if (!plan) {
    return null;
  }

  const member = db.members.find((candidate) => candidate.id === plan.member_id);
  const gym = db.gyms.find((candidate) => candidate.id === plan.gym_id);
  if (!member || !gym) {
    return null;
  }

  return clone({ plan, member, gym });
}

export async function listPlansByGym(gymId: string): Promise<Plan[]> {
  const db = await readDatabase();
  return clone(
    db.plans
      .filter((plan) => plan.gym_id === gymId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  );
}

export async function updatePlanVideo(
  planId: string,
  videoIndex: number,
  patch: Partial<PlanVideo>
): Promise<Plan> {
  return withDatabase((db) => {
    const plan = db.plans.find((candidate) => candidate.id === planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    if (!plan.videos[videoIndex]) {
      throw new Error("Video index not found");
    }

    plan.videos[videoIndex] = {
      ...plan.videos[videoIndex],
      ...patch
    };
    plan.status = derivePlanStatus(plan.videos);

    return clone(plan);
  });
}

export async function updatePlanStatus(planId: string, status: PlanStatus): Promise<Plan> {
  return withDatabase((db) => {
    const plan = db.plans.find((candidate) => candidate.id === planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    plan.status = status;
    return clone(plan);
  });
}

function derivePlanStatus(videos: PlanVideo[]): PlanStatus {
  if (videos.every((video) => video.status === "ready")) {
    return "ready";
  }

  if (videos.every((video) => video.status === "ready" || video.status === "failed")) {
    return "failed";
  }

  if (videos.some((video) => video.status === "generating" || video.status === "ready")) {
    return "generating";
  }

  return "pending";
}

function withDatabase<T>(operation: (db: LocalDatabase) => T | Promise<T>): Promise<T> {
  const next = writeQueue.then(async () => {
    const db = await readDatabase();
    const result = await operation(db);
    await writeDatabase(db);
    return result;
  });

  writeQueue = next.catch(() => undefined);
  return next;
}

async function readDatabase(): Promise<LocalDatabase> {
  const filePath = databasePath();

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    return {
      gyms: Array.isArray(parsed.gyms) ? parsed.gyms : [],
      members: Array.isArray(parsed.members) ? parsed.members : [],
      plans: Array.isArray(parsed.plans) ? parsed.plans : []
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }

    await writeDatabase(EMPTY_DB);
    return clone(EMPTY_DB);
  }
}

async function writeDatabase(db: LocalDatabase): Promise<void> {
  const filePath = databasePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function databasePath(): string {
  return path.join(process.cwd(), ".data", "butterbase-local.json");
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
