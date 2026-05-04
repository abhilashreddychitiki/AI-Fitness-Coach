import { randomUUID } from "crypto";

export interface GeneratedVideo {
  generationId: string;
  videoUrl: string;
}

interface GenerationCreateResponse {
  id?: string;
  generationId?: string;
  data?: {
    id?: string;
    generationId?: string;
  };
}

interface GenerationStatusResponse {
  status?: string;
  video_url?: string;
  videoUrl?: string;
  url?: string;
  output?: {
    video_url?: string;
    videoUrl?: string;
    url?: string;
  };
  data?: {
    status?: string;
    video_url?: string;
    videoUrl?: string;
    url?: string;
  };
}

interface SeedanceV2CreateResponse {
  code?: number;
  message?: string;
  data?: {
    task_id?: string;
    status?: string;
    consumed_credits?: number;
  };
}

interface SeedanceV2StatusResponse {
  code?: number;
  message?: string;
  data?: {
    task_id?: string;
    status?: string;
    consumed_credits?: number;
    response?: string[];
    error_message?: string | null;
  };
}

const MOCK_VIDEO_URLS = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
];

export async function generateVideo(seedancePrompt: string, videoIndex = 0): Promise<GeneratedVideo> {
  const seedanceKeys = getSeedanceApiKeys();

  if (process.env.USE_REAL_VIDEO !== "true" || seedanceKeys.length === 0) {
    return generateMockVideo(videoIndex);
  }

  try {
    return await callSeedanceWithRotation(seedancePrompt, seedanceKeys);
  } catch (error) {
    if (shouldUseFallback(error) && process.env.EASYROUTER_API_KEY) {
      return callVideoProvider({
        baseUrl: process.env.EASYROUTER_BASE_URL || "https://easyrouter.io/api/v1",
        apiKey: process.env.EASYROUTER_API_KEY,
        prompt: seedancePrompt,
        providerName: "EasyRouter"
      });
    }

    if (shouldUseFallback(error) && process.env.IMAROUTER_API_KEY) {
      return callVideoProvider({
        baseUrl: process.env.IMAROUTER_BASE_URL || "https://api.imarouter.ai/v1",
        apiKey: process.env.IMAROUTER_API_KEY,
        prompt: seedancePrompt,
        providerName: "ImaRouter"
      });
    }

    if (process.env.ALLOW_MOCK_VIDEO_FALLBACK !== "false") {
      console.error("Video generation failed, using demo fallback", error);
      return generateMockVideo(videoIndex);
    }

    throw error;
  }
}

async function callSeedanceWithRotation(prompt: string, apiKeys: string[]): Promise<GeneratedVideo> {
  let lastError: unknown;

  for (const [index, apiKey] of apiKeys.entries()) {
    try {
      const baseUrl = process.env.SEEDANCE_BASE_URL || "https://seedanceapi.org/v2";
      const providerName = `Seedance key ${index + 1}`;

      if (baseUrl.includes("seedanceapi.org/v2")) {
        return await callSeedanceV2Provider({
          baseUrl,
          apiKey,
          prompt,
          providerName
        });
      }

      return await callVideoProvider({ baseUrl, apiKey, prompt, providerName });
    } catch (error) {
      lastError = error;
      if (!shouldUseFallback(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All Seedance keys failed");
}

async function callSeedanceV2Provider(options: {
  baseUrl: string;
  apiKey: string;
  prompt: string;
  providerName: string;
}): Promise<GeneratedVideo> {
  const createResponse = await fetch(`${options.baseUrl}/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: options.prompt,
      aspect_ratio: "16:9",
      duration: Number(process.env.SEEDANCE_DURATION || 5),
      model: process.env.SEEDANCE_MODEL || "seedance-2.0-fast"
    })
  });

  const created = (await createResponse.json()) as SeedanceV2CreateResponse;
  if (!createResponse.ok || created.code !== 200 || !created.data?.task_id) {
    const message = created.message || `request failed with ${createResponse.status}`;
    throw Object.assign(new Error(`${options.providerName} request failed: ${message}`), {
      status: createResponse.status
    });
  }

  const generationId = created.data.task_id;

  for (let attempt = 0; attempt < 36; attempt += 1) {
    await delay(10_000);

    const statusUrl = new URL(`${options.baseUrl}/status`);
    statusUrl.searchParams.set("task_id", generationId);

    const statusResponse = await fetch(statusUrl, {
      headers: {
        Authorization: `Bearer ${options.apiKey}`
      }
    });

    const statusPayload = (await statusResponse.json()) as SeedanceV2StatusResponse;
    if (!statusResponse.ok || statusPayload.code !== 200) {
      throw Object.assign(new Error(`${options.providerName} status failed: ${statusPayload.message || statusResponse.status}`), {
        status: statusResponse.status
      });
    }

    const status = (statusPayload.data?.status || "").toUpperCase();
    const videoUrl = statusPayload.data?.response?.[0];

    if (status === "SUCCESS" && videoUrl) {
      return { generationId, videoUrl };
    }

    if (status === "FAILED") {
      throw new Error(statusPayload.data?.error_message || `${options.providerName} generation failed`);
    }
  }

  throw new Error(`${options.providerName} generation timed out`);
}

async function callVideoProvider(options: {
  baseUrl: string;
  apiKey: string;
  prompt: string;
  providerName: string;
}): Promise<GeneratedVideo> {
  const createResponse = await fetch(`${options.baseUrl}/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.SEEDANCE_MODEL || "seedance-2.0",
      prompt: options.prompt,
      duration: 30
    })
  });

  if (!createResponse.ok) {
    const message = await createResponse.text();
    throw Object.assign(new Error(`${options.providerName} request failed: ${message}`), {
      status: createResponse.status
    });
  }

  const created = (await createResponse.json()) as GenerationCreateResponse;
  const generationId = created.generationId || created.id || created.data?.generationId || created.data?.id;
  if (!generationId) {
    throw new Error(`${options.providerName} did not return a generation id`);
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await delay(10_000);

    const statusResponse = await fetch(`${options.baseUrl}/generations/${generationId}`, {
      headers: {
        Authorization: `Bearer ${options.apiKey}`
      }
    });

    if (!statusResponse.ok) {
      throw Object.assign(new Error(`${options.providerName} status failed`), {
        status: statusResponse.status
      });
    }

    const statusPayload = (await statusResponse.json()) as GenerationStatusResponse;
    const status = statusPayload.status || statusPayload.data?.status;
    const videoUrl =
      statusPayload.video_url ||
      statusPayload.videoUrl ||
      statusPayload.url ||
      statusPayload.output?.video_url ||
      statusPayload.output?.videoUrl ||
      statusPayload.output?.url ||
      statusPayload.data?.video_url ||
      statusPayload.data?.videoUrl ||
      statusPayload.data?.url;

    if (videoUrl && ["completed", "complete", "succeeded", "ready"].includes((status || "").toLowerCase())) {
      return { generationId, videoUrl };
    }

    if (["failed", "error", "cancelled"].includes((status || "").toLowerCase())) {
      throw new Error(`${options.providerName} generation failed`);
    }
  }

  throw new Error(`${options.providerName} generation timed out`);
}

async function generateMockVideo(videoIndex: number): Promise<GeneratedVideo> {
  await delay(2_000 + videoIndex * 900);

  return {
    generationId: `demo-${randomUUID()}`,
    videoUrl: MOCK_VIDEO_URLS[videoIndex % MOCK_VIDEO_URLS.length]
  };
}

function shouldUseFallback(error: unknown): boolean {
  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : undefined;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    status === 401 ||
    status === 402 ||
    status === 429 ||
    message.includes("invalid api key") ||
    message.includes("unauthorized") ||
    message.includes("quota") ||
    message.includes("credit") ||
    message.includes("rate")
  );
}

function getSeedanceApiKeys(): string[] {
  const keys = [
    process.env.SEEDANCE_API_KEY,
    ...(process.env.SEEDANCE_API_KEYS || "").split(",")
  ];

  return Array.from(new Set(keys.map((key) => key?.trim()).filter((key): key is string => Boolean(key))));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
