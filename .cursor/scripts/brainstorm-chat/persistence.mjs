import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  appendFileSync,
  renameSync,
  readdirSync,
  rmSync,
} from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const DEFAULT_STATE = {
  sessionId: "",
  sessionTopic: "",
  conversationGoal: "",
  definitionOfDone: "",
  orchestratorPhase: "clarify",
  lastOrchestratorHint: "",
  agentsPaused: false,
  waitingForHuman: false,
  turnsThisCycle: 0,
  updatedAt: 0,
};

/**
 * @param {string} dataDir
 */
export function createPersistence(dataDir) {
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(join(dataDir, "skills"), { recursive: true });
  mkdirSync(join(dataDir, "assets"), { recursive: true });

  const statePath = join(dataDir, "state.json");
  const messagesPath = join(dataDir, "messages.jsonl");
  const participantsPath = join(dataDir, "participants.json");
  const agentBindingsPath = join(dataDir, "agent-bindings.json");
  const assetsPath = join(dataDir, "assets.json");

  /** @type {ReturnType<typeof setTimeout> | null} */
  let saveTimer = null;

  function readJson(path, fallback) {
    if (!existsSync(path)) return fallback;
    try {
      return JSON.parse(readFileSync(path, "utf8"));
    } catch {
      return fallback;
    }
  }

  function writeJsonAtomic(path, data) {
    const tmp = `${path}.${randomUUID()}.tmp`;
    writeFileSync(tmp, JSON.stringify(data, null, 2));
    renameSync(tmp, path);
  }

  function scheduleSaveState(state) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      writeJsonAtomic(statePath, { ...state, updatedAt: Date.now() });
      saveTimer = null;
    }, 80);
  }

  function loadState() {
    const state = { ...DEFAULT_STATE, ...readJson(statePath, {}) };
    if (!state.sessionId) state.sessionId = randomUUID();
    return state;
  }

  function saveState(state) {
    scheduleSaveState(state);
  }

  function flushState(state) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    writeJsonAtomic(statePath, { ...state, updatedAt: Date.now() });
  }

  /** @returns {Array<{ id: string; author: string; text: string; ts: number }>} */
  function loadMessages() {
    if (!existsSync(messagesPath)) return [];
    const lines = readFileSync(messagesPath, "utf8").split("\n").filter(Boolean);
    /** @type {Array<{ id: string; author: string; text: string; ts: number }>} */
    const out = [];
    for (const line of lines) {
      try {
        out.push(JSON.parse(line));
      } catch {
        /* skip corrupt line */
      }
    }
    return out;
  }

  function appendMessage(message) {
    appendFileSync(messagesPath, `${JSON.stringify(message)}\n`);
  }

  function rewriteMessages(messages) {
    writeFileSync(
      messagesPath,
      messages.map((m) => JSON.stringify(m)).join("\n") + (messages.length ? "\n" : ""),
    );
  }

  /** @returns {Record<string, { name: string; label: string; color: string; persona?: string; skillPath?: string }>} */
  function loadDynamicParticipants() {
    return readJson(participantsPath, {});
  }

  /** @param {Record<string, { name: string; label: string; color: string; persona?: string; skillPath?: string }>} participants */
  function saveDynamicParticipants(participants) {
    writeJsonAtomic(participantsPath, participants);
  }

  /** @returns {Record<string, string>} */
  function loadAgentBindings() {
    return readJson(agentBindingsPath, {});
  }

  /** @param {Record<string, string>} bindings */
  function saveAgentBindings(bindings) {
    writeJsonAtomic(agentBindingsPath, bindings);
  }

  /** @returns {Array<{ id: string; path: string; author: string; tool: string; ts: number }>} */
  function loadAssets() {
    return readJson(assetsPath, []);
  }

  /** @param {{ id: string; path: string; author: string; tool: string; ts: number }} asset */
  function recordAsset(asset) {
    const assets = loadAssets();
    if (assets.some((a) => a.path === asset.path && a.author === asset.author)) return assets;
    assets.push(asset);
    writeJsonAtomic(assetsPath, assets);
    return assets;
  }

  /**
   * @param {string} id
   * @param {string} markdown
   */
  function writeSkillFile(id, markdown) {
    const dir = join(dataDir, "skills", id);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "SKILL.md");
    writeFileSync(path, markdown);
    return path;
  }

  function readSkillFile(skillPath) {
    if (!skillPath || !existsSync(skillPath)) return "";
    return readFileSync(skillPath, "utf8");
  }

  /** @param {string} sessionId */
  function clearSession(sessionId) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    writeJsonAtomic(statePath, {
      ...DEFAULT_STATE,
      sessionId,
      updatedAt: Date.now(),
    });
    rewriteMessages([]);
    writeJsonAtomic(participantsPath, {});
    writeJsonAtomic(agentBindingsPath, {});
    writeJsonAtomic(assetsPath, []);

    const skillsDir = join(dataDir, "skills");
    if (existsSync(skillsDir)) {
      for (const name of readdirSync(skillsDir)) {
        rmSync(join(skillsDir, name), { recursive: true, force: true });
      }
    }
  }

  return {
    dataDir,
    loadState,
    saveState,
    flushState,
    loadMessages,
    appendMessage,
    rewriteMessages,
    loadDynamicParticipants,
    saveDynamicParticipants,
    loadAgentBindings,
    saveAgentBindings,
    loadAssets,
    recordAsset,
    writeSkillFile,
    readSkillFile,
    clearSession,
  };
}
