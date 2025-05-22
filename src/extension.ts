import * as vscode from "vscode";
import axios from "axios";

const API_URL = "https://bashforge.vercel.app/api/activity";
const SEND_INTERVAL_MS = 2 * 60 * 1000;
const MIN_SEND_DURATION_MS = 60 * 1000;
const IDLE_THRESHOLD_MS = 1 * 60 * 1000;

let privateKey: string | null = null;
let lastActivityTimestamp = Date.now();
let lastSentTimestamp = 0;
let accumulatedActiveTime = 0;
let idleTimer: NodeJS.Timeout | null = null;

const bashForge = async (language: string) => {
  if (!privateKey || accumulatedActiveTime < MIN_SEND_DURATION_MS) return;

  const timeSpentMinutes = accumulatedActiveTime / 1000 / 60;
  accumulatedActiveTime = 0;

  try {
    await axios.post(API_URL, {
      privateKey,
      languageName: language,
      timeSpent: timeSpentMinutes,
    });
    lastSentTimestamp = Date.now();
  } catch (error) {
    console.error("Failed to send byte:", error);
  }
};

const resetIdleTimer = () => {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    accumulatedActiveTime = 0;
    lastActivityTimestamp = Date.now();
  }, IDLE_THRESHOLD_MS);
};

const onDidChangeTextDocument = (event: vscode.TextDocumentChangeEvent) => {
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityTimestamp;

  if (timeSinceLastActivity < IDLE_THRESHOLD_MS) {
    accumulatedActiveTime += timeSinceLastActivity;
  }

  lastActivityTimestamp = now;
  resetIdleTimer();

  if (now - lastSentTimestamp >= SEND_INTERVAL_MS) {
    bashForge(event.document.languageId);
  }
};

const onDidChangeActiveTextEditor = (editor: vscode.TextEditor | undefined) => {
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityTimestamp;

  if (timeSinceLastActivity < IDLE_THRESHOLD_MS) {
    accumulatedActiveTime += timeSinceLastActivity;
  }

  lastActivityTimestamp = now;
  resetIdleTimer();

  if (editor && now - lastSentTimestamp >= SEND_INTERVAL_MS) {
    bashForge(editor.document.languageId);
  }
};

const onDidChangeWindowState = (state: vscode.WindowState) => {
  const now = Date.now();

  if (state.focused) {
    lastActivityTimestamp = now;
    resetIdleTimer();
  } else {
    if (now - lastActivityTimestamp < IDLE_THRESHOLD_MS) {
      accumulatedActiveTime += now - lastActivityTimestamp;
    }

    if (now - lastSentTimestamp >= SEND_INTERVAL_MS) {
      const editor = vscode.window.activeTextEditor;
      if (editor) bashForge(editor.document.languageId);
    }
  }
};

const inputPrivateKey = async () => {
  const result = await vscode.window.showInputBox({
    prompt: "Enter BashForge private key",
    ignoreFocusOut: true,
  });

  if (result) {
    privateKey = result;
    try {
      await vscode.workspace
        .getConfiguration()
        .update(
          "bashForge.privateKey",
          privateKey,
          vscode.ConfigurationTarget.Global
        );
      vscode.window.showInformationMessage("Private key saved.");
    } catch {
      vscode.window.showErrorMessage("Failed to save private key.");
    }
  }
};

const loadPrivateKey = () => {
  const config = vscode.workspace.getConfiguration();
  privateKey = config.get<string>("bashForge.privateKey") || null;
};

export function activate(context: vscode.ExtensionContext) {
  loadPrivateKey();

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "bashForge.inputPrivateKey",
      inputPrivateKey
    ),
    vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument),
    vscode.window.onDidChangeActiveTextEditor(onDidChangeActiveTextEditor),
    vscode.window.onDidChangeWindowState(onDidChangeWindowState)
  );
}

export function deactivate() {
  if (idleTimer) clearTimeout(idleTimer);
}
