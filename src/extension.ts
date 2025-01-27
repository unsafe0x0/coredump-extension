import * as vscode from "vscode";
import axios from "axios";

const API_URL = "https://byterace.vercel.app/api/activity";
const Byte_INTERVAL = 2 * 60 * 1000;

let lastByteTime: number | null = null;
let typingTimer: NodeJS.Timeout | null = null;
let privateKey: string | null = null;
let startTime: number | null = null;

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

const onDidChangeTextDocument = (event: vscode.TextDocumentChangeEvent) => {
  if (typingTimer) {
    clearTimeout(typingTimer);
  }

  if (!startTime) {
    startTime = Date.now();
  }

  typingTimer = setTimeout(() => {
    const now = Date.now();
    const language = event.document.languageId;

    if (!lastByteTime || now - lastByteTime >= Byte_INTERVAL) {
      const timeSpent = (now - (startTime || 0)) / 1000 / 60;
      sendByte(language, timeSpent);
      startTime = now;
    }
  }, Byte_INTERVAL);
};

const onDidSaveTextDocument = (document: vscode.TextDocument) => {
  const language = document.languageId;
  if (startTime) {
    const timeSpent = (Date.now() - startTime) / 1000 / 60;
    sendByte(language, timeSpent);
    startTime = Date.now();
  }
};

const inputPrivateKey = async () => {
  const result = await vscode.window.showInputBox({
    prompt: "Enter ByteRace private key:",
    placeHolder: "Private Key",
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
      vscode.window.showInformationMessage(`Private key set to: ${privateKey}`);
    } catch (error) {
      vscode.window.showErrorMessage("Failed to save private key.");
    }
  }
};

const loadPrivateKey = () => {
  const config = vscode.workspace.getConfiguration();
  privateKey = config.get("byteRace.privateKey") || null;
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
}