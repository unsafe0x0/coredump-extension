import * as vscode from "vscode";
import axios from "axios";

const API_URL = "https://byterace.vercel.app/api/activity";
const BYTE_INTERVAL_MS = 2 * 60 * 1000;
const IDLE_THRESHOLD_MS = 1 * 60 * 1000;

let lastByteTime: number | null = null;
let typingTimer: NodeJS.Timeout | null = null;
let idleTimer: NodeJS.Timeout | null = null;
let privateKey: string | null = null;
let startTime: number | null = null;
let isIdle = false;

const sendByte = async (language: string, timeSpent: number) => {
  if (!privateKey) return;

  try {
    const response = await axios.post(API_URL, {
      privateKey,
      languageName: language,
      timeSpent,
    });

    if (response.status === 200) {
      lastByteTime = Date.now();
    } else {
      console.error("Failed to send byte:", response.statusText);
    }
  } catch (error) {
    console.error("Failed to send byte:", error);
  }
};

const resetIdleTimer = () => {
  if (idleTimer) {
    clearTimeout(idleTimer);
  }

  idleTimer = setTimeout(() => {
    isIdle = true;
    startTime = null;
  }, IDLE_THRESHOLD_MS);

  isIdle = false;
};

const onDidChangeTextDocument = (event: vscode.TextDocumentChangeEvent) => {
  resetIdleTimer();

  if (isIdle || !privateKey) {
    startTime = Date.now();
  }

  if (typingTimer) {
    clearTimeout(typingTimer);
  }

  if (!startTime) {
    startTime = Date.now();
  }

  typingTimer = setTimeout(() => {
    const now = Date.now();
    const language = event.document.languageId;

    if (!lastByteTime || now - lastByteTime >= BYTE_INTERVAL_MS) {
      if (!isIdle && startTime) {
        const elapsedMs = now - startTime;
        const timeSpentMinutes = elapsedMs / 1000 / 60;
        sendByte(language, timeSpentMinutes);
        startTime = now;
      }
    }
  }, BYTE_INTERVAL_MS);
};

const onDidSaveTextDocument = (document: vscode.TextDocument) => {
  resetIdleTimer();

  if (isIdle || !startTime) {
    startTime = Date.now();
    return;
  }

  const language = document.languageId;
  const now = Date.now();
  const elapsedMs = now - startTime;
  const timeSpentMinutes = elapsedMs / 1000 / 60;
  sendByte(language, timeSpentMinutes);
  startTime = now;
};

const inputPrivateKey = async () => {
  const result = await vscode.window.showInputBox({
    prompt: "Enter ByteRace private key:",
    placeHolder: "Private Key",
    ignoreFocusOut: true,
  });

  if (result) {
    privateKey = result;
    try {
      await vscode.workspace
        .getConfiguration()
        .update(
          "byteRace.privateKey",
          privateKey,
          vscode.ConfigurationTarget.Global
        );
      vscode.window.showInformationMessage("Private key saved successfully.");
    } catch {
      vscode.window.showErrorMessage("Failed to save private key.");
    }
  }
};

const loadPrivateKey = () => {
  const config = vscode.workspace.getConfiguration();
  privateKey = config.get<string>("byteRace.privateKey") || null;
};

export function activate(context: vscode.ExtensionContext) {
  loadPrivateKey();

  const disposableSessionKeyCommand = vscode.commands.registerCommand(
    "byteRace.inputPrivateKey",
    inputPrivateKey
  );

  const disposableSave = vscode.workspace.onDidSaveTextDocument(
    onDidSaveTextDocument
  );
  const disposableChange = vscode.workspace.onDidChangeTextDocument(
    onDidChangeTextDocument
  );

  context.subscriptions.push(
    disposableSessionKeyCommand,
    disposableSave,
    disposableChange
  );
}

export function deactivate() {
  if (typingTimer) {
    clearTimeout(typingTimer);
  }
  if (idleTimer) {
    clearTimeout(idleTimer);
  }
}
