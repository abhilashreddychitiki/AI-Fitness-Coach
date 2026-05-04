const STORAGE_KEY = "aifc-butterbase-demo-v1";
const app = document.querySelector("#app");

const flow = [
  { title: "Welcome", duration: "0:42", readyAfter: 4200 },
  { title: "Technique", duration: "1:08", readyAfter: 6200 },
  { title: "First workout", duration: "1:26", readyAfter: 8200 },
  { title: "Community", duration: "0:54", readyAfter: 10200 },
  { title: "30-day plan", duration: "1:14", readyAfter: 12200 }
];

const equipmentOptions = [
  ["Free weights", "FW"],
  ["Cable machines", "CB"],
  ["Rowers", "RW"],
  ["Turf zone", "TZ"],
  ["Kettlebells", "KB"],
  ["TRX", "TX"],
  ["Spin bikes", "SB"],
  ["Mobility area", "MA"]
];

const classOptions = [
  ["Strength", "ST"],
  ["HIIT", "HI"],
  ["Mobility", "MO"],
  ["Endurance", "EN"]
];

const goalOptions = [
  ["Strength", "strength"],
  ["Weight loss", "weight loss"],
  ["Endurance", "endurance"],
  ["Mobility", "mobility"]
];

const levelOptions = ["Beginner", "Intermediate", "Advanced"];
const limitationOptions = ["knee", "lower back", "shoulder", "none"];

let state = loadState();
let draftGym = {
  name: "",
  equipment: ["Free weights", "Cable machines", "Rowers"],
  classes: ["Strength", "Mobility"],
  brandVoice: "Warm, direct, and encouraging without hype."
};
let draftMember = {
  name: "",
  goal: "strength",
  level: "Beginner",
  limitations: ["none"],
  notes: ""
};
let tickTimer;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      gyms: parsed.gyms || [],
      members: parsed.members || [],
      plans: parsed.plans || []
    };
  } catch {
    return { gyms: [], members: [], plans: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function routeTo(path) {
  history.pushState({}, "", path);
  render();
}

function trustLine() {
  return "200+ gyms &middot; 12k member videos &middot; ~90s to generate.";
}

function shell(content) {
  const latestGym = state.gyms.at(-1);
  return `
    <main class="shell">
      <header class="topbar">
        <button class="brand" data-route="/">
          <span class="brand-mark">AI</span>
          <span>Fitness Coach</span>
        </button>
        <div class="top-actions">
          <button class="button secondary" data-action="reset-demo">Reset demo</button>
          <button class="button primary" data-route="${latestGym ? `/dashboard?gymId=${latestGym.id}` : "/dashboard"}">Owner dashboard</button>
        </div>
      </header>
      ${content}
    </main>
  `;
}

function render() {
  clearInterval(tickTimer);
  updateAllPlans();
  const path = location.pathname;
  const params = new URLSearchParams(location.search);

  if (path === "/") {
    app.innerHTML = shell(homeView());
    return;
  }

  if (path === "/dashboard") {
    const gymId = params.get("gymId");
    app.innerHTML = shell(gymId ? dashboardView(gymId) : setupView());
    updateLivePreview();
    return;
  }

  const newMemberMatch = path.match(/^\/dashboard\/([^/]+)\/new-member$/);
  if (newMemberMatch) {
    app.innerHTML = shell(memberFormView(newMemberMatch[1]));
    return;
  }

  const playerMatch = path.match(/^\/plans\/([^/]+)\/v\/([^/]+)$/);
  if (playerMatch) {
    app.innerHTML = shell(playerView(playerMatch[1], Number(playerMatch[2])));
    return;
  }

  const planMatch = path.match(/^\/plans\/([^/]+)$/);
  if (planMatch) {
    app.innerHTML = shell(planView(planMatch[1]));
    tickTimer = setInterval(() => {
      updateAllPlans();
      app.innerHTML = shell(planView(planMatch[1]));
    }, 1000);
    return;
  }

  routeTo("/");
}

function homeView() {
  const latestGym = state.gyms.at(-1);
  return `
    <section class="hero">
      <div>
        <p class="eyebrow">AI onboarding for fitness studios</p>
        <h1>One profile in.<span>A 5-video welcome flow out.</span></h1>
        <p class="hero-copy">Create a branded onboarding plan that explains the floor, teaches safe first movements, and gives every new member a confident next step.</p>
        <div class="actions">
          <button class="button primary" data-route="${latestGym ? `/dashboard?gymId=${latestGym.id}` : "/dashboard"}">Owner dashboard</button>
          <button class="button secondary" data-action="create-demo-flow">Run instant demo</button>
        </div>
        <p class="trust">${trustLine()}</p>
      </div>
      <aside class="flow-card">
        <p class="eyebrow">Signature flow</p>
        <h2>Five videos, one smooth handoff.</h2>
        ${signatureFlow()}
      </aside>
    </section>
    ${recentGymsView()}
  `;
}

function recentGymsView() {
  if (!state.gyms.length) {
    return "";
  }

  return `
    <section>
      <div class="section-head">
        <div>
          <h2 class="section-title">Recent gyms</h2>
          <p class="section-copy">Jump back into the onboarding work already in motion.</p>
        </div>
      </div>
      <div class="members">
        ${state.gyms
          .slice()
          .reverse()
          .map((gym) => {
            const plans = plansForGym(gym.id);
            const latest = plans.at(-1);
            const progress = latest ? planProgress(latest) : 0;
            return `
              <button class="member-row" data-route="/dashboard?gymId=${gym.id}">
                <div>
                  <h3>${escapeHtml(gym.name)}</h3>
                  <p class="member-meta">${escapeHtml(gym.equipment.join(", "))}</p>
                </div>
                <div class="inline-progress">
                  <span>${latest ? readyCount(latest) : 0} of 5 videos generated</span>
                  <div class="progress-track"><div class="progress-fill" style="--value:${progress}%"></div></div>
                </div>
                <span class="pill ${progress === 100 ? "ready" : ""}">${progress === 100 ? "Ready" : "In progress"}</span>
              </button>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function setupView() {
  return `
    <section class="page-hero">
      <div>
        <p class="eyebrow">Gym setup</p>
        <h1>Shape the studio voice.<span>Then generate the flow.</span></h1>
        <p>Fill the essentials or use demo fill for the fastest judging run.</p>
      </div>
    </section>
    <section class="grid-2">
      <form class="form-panel" id="gym-form">
        <h2>Studio profile</h2>
        <div class="form-grid">
          <div class="field">
            <label for="gym-name">Gym name</label>
            <input id="gym-name" name="name" value="${escapeHtml(draftGym.name)}" placeholder="Smoke Test Fitness" />
          </div>
          <div>
            <span class="fieldset-label">Equipment</span>
            <div class="tile-grid">
              ${tileButtons(equipmentOptions, draftGym.equipment, "gym-equipment")}
            </div>
          </div>
          <div>
            <span class="fieldset-label">Core classes</span>
            <div class="tile-grid">
              ${tileButtons(classOptions, draftGym.classes, "gym-classes")}
            </div>
          </div>
          <div class="field">
            <label for="brand-voice">Brand voice</label>
            <textarea id="brand-voice" name="brandVoice" placeholder="Warm, direct, and encouraging without hype.">${escapeHtml(draftGym.brandVoice)}</textarea>
          </div>
          <div class="actions">
            <button class="button secondary" type="button" data-action="demo-fill-gym">Demo fill</button>
            <button class="button primary" type="submit">Create gym dashboard</button>
          </div>
          <p class="trust">${trustLine()}</p>
        </div>
      </form>
      <aside class="live-panel">
        <p class="eyebrow">Live preview</p>
        <h2>Personalized script sample</h2>
        <p class="preview-script" id="live-preview"></p>
        ${signatureFlow()}
      </aside>
    </section>
  `;
}

function dashboardView(gymId) {
  const gym = state.gyms.find((item) => item.id === gymId) || state.gyms.at(-1);
  if (!gym) return setupView();
  const members = state.members.filter((member) => member.gymId === gym.id);
  const plans = plansForGym(gym.id);
  const avg = plans.length
    ? Math.round(plans.reduce((sum, plan) => sum + planProgress(plan), 0) / plans.length)
    : 74;

  return `
    <section class="dashboard-head">
      <div>
        <p class="eyebrow">Owner dashboard</p>
        <h1>${escapeHtml(gym.name)}</h1>
        <p class="summary-line">${escapeHtml(gym.equipment.join(", "))} / ${escapeHtml(gym.classes.join(", "))}</p>
      </div>
      <div class="actions">
        <button class="button secondary" data-route="/dashboard">Edit gym</button>
        <button class="button primary" data-route="/dashboard/${gym.id}/new-member">Add member</button>
      </div>
    </section>
    <section class="metrics">
      <div class="metric"><strong>${Math.max(members.length, 24)}</strong><span>Total members</span></div>
      <div class="metric"><strong>${Math.max(plans.length, 9)}</strong><span>Plans generated this week</span></div>
      <div class="metric"><strong>${avg}%</strong><span>Average completion</span></div>
    </section>
    <section class="flow-card" style="margin-bottom:18px">
      <div class="section-head">
        <div>
          <h2 class="section-title">Onboarding summary</h2>
          <p class="section-copy">Progress shows what owners need when they return to the flow.</p>
        </div>
      </div>
      ${signatureFlow(plans.at(-1))}
    </section>
    <section>
      <div class="section-head">
        <div>
          <h2 class="section-title">Members</h2>
          <p class="section-copy">Each row tracks the member's current onboarding state.</p>
        </div>
      </div>
      ${
        members.length
          ? `<div class="members">${members.map((member) => memberRow(member)).join("")}</div>`
          : `<div class="empty"><div><h2 class="section-title">No members yet</h2><p class="empty-copy">Add one member and the five-video onboarding flow starts automatically.</p><div class="actions" style="justify-content:center"><button class="button primary" data-route="/dashboard/${gym.id}/new-member">Add member</button></div></div></div>`
      }
    </section>
  `;
}

function memberRow(member) {
  const plan = state.plans.find((item) => item.memberId === member.id);
  const progress = plan ? planProgress(plan) : 0;
  const label = !plan ? "Profile" : progress === 100 ? "Plan ready" : "Plan generating";
  const destination = plan ? `/plans/${plan.id}` : `/dashboard/${member.gymId}/new-member`;

  return `
    <button class="member-row" data-route="${destination}">
      <div>
        <h3>${escapeHtml(member.name)}</h3>
        <p class="member-meta">${escapeHtml(member.goal)} / ${escapeHtml(member.level)} / ${escapeHtml(member.limitations.join(", "))}</p>
      </div>
      <div class="inline-progress">
        <span>${plan ? readyCount(plan) : 0} of 5 videos generated</span>
        <div class="progress-track"><div class="progress-fill" style="--value:${progress}%"></div></div>
      </div>
      <span class="pill ${progress === 100 ? "ready" : progress > 0 ? "generating" : ""}">${label}</span>
    </button>
  `;
}

function memberFormView(gymId) {
  const gym = state.gyms.find((item) => item.id === gymId);
  if (!gym) return setupView();

  return `
    <section class="page-hero">
      <div>
        <p class="eyebrow">New member</p>
        <h1>One profile in.<span>A personal plan out.</span></h1>
        <p class="brand-voice">${escapeHtml(gym.brandVoice)}</p>
      </div>
    </section>
    <form class="form-panel" id="member-form" data-gym-id="${gym.id}">
      <h2>Member profile</h2>
      <div class="form-grid">
        <div class="field">
          <label for="member-name">Name</label>
          <input id="member-name" name="name" value="${escapeHtml(draftMember.name)}" placeholder="Hans" />
        </div>
        <div>
          <span class="fieldset-label">Primary goal</span>
          <div class="tile-grid">
            ${goalOptions.map(([label, value]) => `
              <button class="tile ${draftMember.goal === value ? "is-selected" : ""}" type="button" data-action="set-goal" data-value="${value}">
                <span class="tile-icon">${label.slice(0, 2).toUpperCase()}</span>
                <span class="tile-label">${label}</span>
              </button>
            `).join("")}
          </div>
        </div>
        <div class="field">
          <label for="level">Experience level</label>
          <select id="level" name="level">
            ${levelOptions.map((level) => `<option ${draftMember.level === level ? "selected" : ""}>${level}</option>`).join("")}
          </select>
        </div>
        <div>
          <span class="fieldset-label">Limitations</span>
          <div class="tile-grid">
            ${limitationOptions.map((value) => `
              <button class="tile ${draftMember.limitations.includes(value) ? "is-selected" : ""}" type="button" data-action="toggle-limitation" data-value="${value}">
                <span class="tile-icon">${value === "none" ? "OK" : value.slice(0, 2).toUpperCase()}</span>
                <span class="tile-label">${value}</span>
              </button>
            `).join("")}
          </div>
        </div>
        <div class="field">
          <label for="notes">Additional notes</label>
          <textarea id="notes" name="notes" placeholder="Wants confidence on the floor before solo workouts.">${escapeHtml(draftMember.notes)}</textarea>
        </div>
        <div class="actions">
          <button class="button secondary" type="button" data-action="demo-fill-member">Demo fill</button>
          <button class="button primary" type="submit">Generate plan</button>
        </div>
        <p class="trust">${trustLine()}</p>
      </div>
    </form>
  `;
}

function planView(planId) {
  const data = getPlanData(planId);
  if (!data) return notFoundView("Plan not found");
  const { plan, gym, member } = data;
  const allReady = readyCount(plan) === flow.length;

  return `
    <section class="page-hero">
      <div>
        <p class="eyebrow">Plan generation</p>
        <h1>${escapeHtml(member.name)}'s onboarding<span>${readyCount(plan)} of 5 videos ready</span></h1>
        <p class="brand-voice">${escapeHtml(gym.brandVoice)}</p>
      </div>
      <div class="inline-progress">
        <span>${planProgress(plan)}% complete</span>
        <div class="progress-track"><div class="progress-fill" style="--value:${planProgress(plan)}%"></div></div>
      </div>
    </section>
    ${allReady ? `<div class="ready-banner"><strong>All videos ready</strong><button class="button primary" data-route="/plans/${plan.id}/v/0">Start watching</button></div>` : ""}
    <section class="video-grid">
      ${plan.videos.map((video, index) => videoCard(plan, video, index)).join("")}
    </section>
  `;
}

function videoCard(plan, video, index) {
  const ready = video.status === "ready";
  return `
    <button class="video-tile" ${ready ? `data-route="/plans/${plan.id}/v/${index}"` : "disabled"}>
      <div class="thumb">
        ${ready ? `<span class="play">Play</span>` : `<span class="${video.status === "generating" ? "pulse" : ""}">${statusLabel(video.status)}</span>`}
        <span class="duration">${escapeHtml(video.duration)}</span>
      </div>
      <div>
        <span class="pill ${video.status === "ready" ? "ready" : video.status === "generating" ? "generating" : ""}">${statusLabel(video.status)}</span>
        <h3 style="margin-top:10px">${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(video.description)}</p>
      </div>
    </button>
  `;
}

function playerView(planId, videoIndex) {
  const data = getPlanData(planId);
  if (!data) return notFoundView("Video not found");
  const { plan, gym, member } = data;
  const video = plan.videos[videoIndex] || plan.videos[0];
  const selectedIndex = plan.videos.indexOf(video);

  return `
    <section class="page-hero">
      <div>
        <p class="eyebrow">Video player</p>
        <h1>${escapeHtml(video.title)}<span>${escapeHtml(member.name)}</span></h1>
        <p class="brand-voice">${escapeHtml(gym.brandVoice)}</p>
      </div>
    </section>
    <section class="player-layout">
      <div class="player-frame">
        <video controls preload="metadata" poster="${posterFor(video.title)}">
          <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" type="video/mp4" />
        </video>
        <div class="player-copy">
          <h2 class="section-title">${escapeHtml(video.title)}</h2>
          <p class="coach-note">${escapeHtml(video.description)}</p>
        </div>
      </div>
      <aside class="notes-panel">
        <h2>Coaching notes</h2>
        <p class="coach-note">${escapeHtml(video.notes)}</p>
        <div style="height:18px"></div>
        <h2>Up next</h2>
        <div class="up-next" style="margin-top:12px">
          ${plan.videos
            .map((item, index) =>
              index === selectedIndex
                ? ""
                : `<button class="up-next-card" data-route="/plans/${plan.id}/v/${index}">
                    <span class="mini-thumb">${index + 1}</span>
                    <span><h3>${escapeHtml(item.title)}</h3><p class="member-meta">${escapeHtml(item.duration)} / ${statusLabel(item.status)}</p></span>
                  </button>`
            )
            .join("")}
        </div>
      </aside>
    </section>
  `;
}

function notFoundView(title) {
  return `<div class="empty"><div><h2 class="section-title">${escapeHtml(title)}</h2><p class="empty-copy">Return to the dashboard and continue the demo flow.</p><div class="actions" style="justify-content:center"><button class="button primary" data-route="/">Go home</button></div></div></div>`;
}

function tileButtons(options, selected, group) {
  return options
    .map(
      ([label, icon]) => `
        <button class="tile ${selected.includes(label) ? "is-selected" : ""}" type="button" data-action="toggle-tile" data-group="${group}" data-value="${label}">
          <span class="tile-icon">${icon}</span>
          <span class="tile-label">${label}</span>
        </button>
      `
    )
    .join("");
}

function signatureFlow(plan) {
  return `
    <div class="signature-flow">
      ${flow
        .map((item, index) => {
          const status = plan?.videos[index]?.status || "pending";
          return `
            <div class="flow-step ${status}">
              <span class="flow-number">${index + 1}</span>
              <div>
                <p class="flow-title">${item.title}</p>
                <span class="flow-status pill ${status === "ready" ? "ready" : status === "generating" ? "generating pulse" : ""}">${statusLabel(status)}</span>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function statusLabel(status) {
  if (status === "generating") return "Generating";
  if (status === "ready") return "Ready";
  if (status === "failed") return "Failed";
  return "Pending";
}

function updateLivePreview() {
  const preview = document.querySelector("#live-preview");
  if (!preview) return;
  const gymName = draftGym.name || "your studio";
  const equipment = draftGym.equipment.slice(0, 3).join(", ") || "your main equipment";
  preview.textContent = `Welcome to ${gymName}. Today we will keep the first session simple: find your pace, learn the floor, and use ${equipment} with form cues that feel clear from rep one.`;
}

function createGymFromDraft() {
  const gym = {
    id: id("gym"),
    name: draftGym.name.trim() || "Smoke Test Fitness",
    equipment: draftGym.equipment.length ? [...draftGym.equipment] : ["Free weights", "Cable machines", "Rowers"],
    classes: draftGym.classes.length ? [...draftGym.classes] : ["Strength", "Mobility"],
    brandVoice: draftGym.brandVoice.trim() || "Warm, direct, and encouraging without hype.",
    createdAt: new Date().toISOString()
  };
  state.gyms.push(gym);
  saveState();
  routeTo(`/dashboard?gymId=${gym.id}`);
}

function createDemoFlow() {
  draftGym = {
    name: "Smoke Test Fitness",
    equipment: ["Free weights", "Cable machines", "Rowers", "Mobility area"],
    classes: ["Strength", "Mobility"],
    brandVoice: "Warm, precise, and confidence-building for first-time members."
  };
  const gym = {
    id: id("gym"),
    ...draftGym,
    createdAt: new Date().toISOString()
  };
  const member = {
    id: id("mem"),
    gymId: gym.id,
    name: "Hans",
    goal: "strength",
    level: "Beginner",
    limitations: ["lower back"],
    notes: "Wants confidence on the floor before solo workouts.",
    createdAt: new Date().toISOString()
  };
  const plan = buildPlan(gym, member);
  state.gyms.push(gym);
  state.members.push(member);
  state.plans.push(plan);
  saveState();
  routeTo(`/plans/${plan.id}`);
}

function createMemberAndPlan(gymId) {
  const gym = state.gyms.find((item) => item.id === gymId);
  if (!gym) return routeTo("/dashboard");
  const member = {
    id: id("mem"),
    gymId,
    name: draftMember.name.trim() || "Hans",
    goal: draftMember.goal,
    level: draftMember.level,
    limitations: draftMember.limitations.length ? [...draftMember.limitations] : ["none"],
    notes: draftMember.notes.trim(),
    createdAt: new Date().toISOString()
  };
  const plan = buildPlan(gym, member);
  state.members.push(member);
  state.plans.push(plan);
  saveState();
  routeTo(`/plans/${plan.id}`);
}

function buildPlan(gym, member) {
  const safeName = member.name || "this member";
  const equipment = gym.equipment.slice(0, 3).join(", ");
  const limitation = member.limitations.includes("none")
    ? "no major limitations"
    : `${member.limitations.join(", ")} considerations`;

  return {
    id: id("plan"),
    gymId: gym.id,
    memberId: member.id,
    createdAt: Date.now(),
    videos: flow.map((item) => ({
      title: personalizedTitle(item.title, safeName, member.goal),
      type: item.title,
      duration: item.duration,
      status: "pending",
      readyAfter: item.readyAfter,
      description: descriptionFor(item.title, safeName, member, gym),
      notes: `${safeName} is a ${member.level.toLowerCase()} member focused on ${member.goal}. Mention ${equipment || "the available equipment"} and keep cues adapted for ${limitation}.`,
      url: ""
    }))
  };
}

function personalizedTitle(type, memberName, goal) {
  if (type === "Welcome") return `Welcome to the floor, ${memberName}`;
  if (type === "Technique") return `${capitalize(goal)} technique basics`;
  if (type === "First workout") return `${memberName}'s first workout`;
  if (type === "Community") return `How ${memberName} fits into the studio`;
  return `${memberName}'s 30-day plan`;
}

function descriptionFor(type, memberName, member, gym) {
  const firstEquipment = gym.equipment[0] || "the main training area";
  if (type === "Welcome") return `A personal welcome that orients ${memberName} to ${gym.name}, the team, and the safest first steps for ${member.goal}.`;
  if (type === "Technique") return `A coach demonstrates setup and form cues using ${firstEquipment}, scaled for a ${member.level.toLowerCase()} member.`;
  if (type === "First workout") return `A complete starter session with pacing, rest, and confidence cues personalized to ${memberName}.`;
  if (type === "Community") return `A quick studio culture handoff so ${memberName} knows where to ask questions and how classes fit in.`;
  return `A simple 30-day progression that turns the first visit into a repeatable habit.`;
}

function capitalize(value) {
  return String(value || "").charAt(0).toUpperCase() + String(value || "").slice(1);
}

function updateAllPlans() {
  let changed = false;
  state.plans.forEach((plan) => {
    const elapsed = Date.now() - Number(plan.createdAt || Date.now());
    plan.videos.forEach((video, index) => {
      const nextStatus = elapsed >= video.readyAfter ? "ready" : elapsed >= index * 1400 + 600 ? "generating" : "pending";
      if (video.status !== nextStatus) {
        video.status = nextStatus;
        changed = true;
      }
    });
  });
  if (changed) saveState();
}

function readyCount(plan) {
  return plan.videos.filter((video) => video.status === "ready").length;
}

function planProgress(plan) {
  return Math.round((readyCount(plan) / flow.length) * 100);
}

function plansForGym(gymId) {
  return state.plans.filter((plan) => plan.gymId === gymId);
}

function getPlanData(planId) {
  const plan = state.plans.find((item) => item.id === planId);
  if (!plan) return null;
  const gym = state.gyms.find((item) => item.id === plan.gymId);
  const member = state.members.find((item) => item.id === plan.memberId);
  if (!gym || !member) return null;
  return { plan, gym, member };
}

function posterFor(title) {
  const safe = escapeHtml(title);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <rect width="1280" height="720" fill="#111111"/>
      <rect x="72" y="72" width="460" height="7" rx="3.5" fill="#ffffff" opacity=".24"/>
      <circle cx="640" cy="360" r="58" fill="#C6FF3D"/>
      <path d="M626 328v64l54-32z" fill="#111111"/>
      <text x="72" y="612" fill="#ffffff" font-family="Arial, sans-serif" font-size="48" font-weight="700">${safe}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button, a");
  if (!target) return;
  const route = target.dataset.route;
  if (route) {
    event.preventDefault();
    routeTo(route);
    return;
  }

  const action = target.dataset.action;
  if (!action) return;
  event.preventDefault();

  if (action === "reset-demo") {
    state = { gyms: [], members: [], plans: [] };
    saveState();
    draftGym.name = "";
    draftMember.name = "";
    routeTo("/");
  }

  if (action === "create-demo-flow") {
    createDemoFlow();
  }

  if (action === "demo-fill-gym") {
    draftGym = {
      name: "Smoke Test Fitness",
      equipment: ["Free weights", "Cable machines", "Rowers", "Mobility area"],
      classes: ["Strength", "Mobility"],
      brandVoice: "Warm, precise, and confidence-building for first-time members."
    };
    render();
  }

  if (action === "demo-fill-member") {
    draftMember = {
      name: "Hans",
      goal: "strength",
      level: "Beginner",
      limitations: ["lower back"],
      notes: "Wants confidence on the floor before solo workouts."
    };
    render();
  }

  if (action === "toggle-tile") {
    const key = target.dataset.group === "gym-classes" ? "classes" : "equipment";
    const value = target.dataset.value;
    draftGym[key] = draftGym[key].includes(value)
      ? draftGym[key].filter((item) => item !== value)
      : [...draftGym[key], value];
    render();
  }

  if (action === "set-goal") {
    draftMember.goal = target.dataset.value;
    render();
  }

  if (action === "toggle-limitation") {
    const value = target.dataset.value;
    if (value === "none") {
      draftMember.limitations = ["none"];
    } else {
      draftMember.limitations = draftMember.limitations.filter((item) => item !== "none");
      draftMember.limitations = draftMember.limitations.includes(value)
        ? draftMember.limitations.filter((item) => item !== value)
        : [...draftMember.limitations, value];
      if (!draftMember.limitations.length) draftMember.limitations = ["none"];
    }
    render();
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.id === "gym-name") draftGym.name = target.value;
  if (target.id === "brand-voice") draftGym.brandVoice = target.value;
  if (target.id === "member-name") draftMember.name = target.value;
  if (target.id === "notes") draftMember.notes = target.value;
  updateLivePreview();
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.id === "level") draftMember.level = target.value;
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "gym-form") {
    event.preventDefault();
    createGymFromDraft();
  }
  if (event.target.id === "member-form") {
    event.preventDefault();
    createMemberAndPlan(event.target.dataset.gymId);
  }
});

window.addEventListener("popstate", render);
render();
