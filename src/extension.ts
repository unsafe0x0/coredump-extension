import * as vscode from "vscode";
import axios from "axios";

const API_URL = "https://byterace.vercel.app/api/activity";

interface CodingActivity {
  language: string;
  duration: number;
}

let currentLanguage: string | null = null;
let lastActivityTime: number = Date.now();
let codingData: CodingActivity[] = [];
let isSending = false;
let inactivityTimeout: NodeJS.Timeout | null = null;
let languageChangedTimeout: NodeJS.Timeout | null = null;
let debounceTimeout: NodeJS.Timeout | null = null;
const languageChangeDelay = 30000;

function getPrivateKey(): string | undefined {
  const config = vscode.workspace.getConfiguration("byteRace");
  return config.get<string>("privateKey");
}

async function setPrivateKey(privateKey: string) {
  const config = vscode.workspace.getConfiguration("byteRace");
  await config.update(
    "privateKey",
    privateKey,
    vscode.ConfigurationTarget.Global
  );
}

function trackLanguage(language: string) {
  const now = Date.now();
  if (currentLanguage && inactivityTimeout) {
    const duration = (now - lastActivityTime) / 1000;
    if (duration >= 30) {
      codingData.push({ language: currentLanguage, duration });
    }
  }

  currentLanguage = language;
  lastActivityTime = now;

  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }

  if (languageChangedTimeout) {
    clearTimeout(languageChangedTimeout);
  }

  languageChangedTimeout = setTimeout(() => {
    sendData(language);
  }, languageChangeDelay);
}

async function sendData(language: string) {
  const privateKey = getPrivateKey();
  if (!privateKey) {
    return;
  }

  if (codingData.length > 0 && !isSending) {
    isSending = true;
    try {
      for (const item of codingData) {
        if (item.language === language && item.duration >= 30) {
          const dataToSend = {
            privateKey,
            languageName: item.language,
            timeSpent: item.duration,
          };

          await axios.post(API_URL, dataToSend);
        }
      }
      codingData = [];
    } catch (error) {
      console.error("Error sending data:", error);
    } finally {
      isSending = false;
    }
  }
}

function startInactivityTimer() {
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout);
  }

  inactivityTimeout = setTimeout(() => {
    sendData(currentLanguage || "");
  }, 30000);
}

export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.onDidChangeTextDocument((event) => {
    const document = event.document;
    const language = document.languageId;
    trackLanguage(language);
    startInactivityTimer();
  });

  vscode.window.onDidChangeTextEditorSelection(() => {
    startInactivityTimer();
  });

  const setPrivateKeyCommand = vscode.commands.registerCommand(
    "byteRace.setPrivateKey",
    async () => {
      const privateKey = await vscode.window.showInputBox({
        prompt: "Enter your private key",
        placeHolder: "Paste your private key here",
      });

      if (!privateKey) {
        return;
      }

      try {
        await setPrivateKey(privateKey);
      } catch (error) {
        console.error("Error setting private key:", error);
      }
    }
  );

  context.subscriptions.push(setPrivateKeyCommand);
}

export function deactivate() {
  sendData(currentLanguage || "");
}
