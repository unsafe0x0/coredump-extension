import * as vscode from "vscode";
import axios from "axios";

const API_URL = "https://byterace.vercel.app/api/activity";

interface CodingActivity {
  language: string;
  duration: number;
}

let currentLanguage: string | null = null;
let startTime: number | null = null;
let codingData: CodingActivity[] = [];
let isSending = false;
let lastSentTime: number = Date.now();

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
  if (currentLanguage && startTime) {
    const duration = (now - startTime) / 1000;
    codingData.push({ language: currentLanguage, duration });
  }
  currentLanguage = language;
  startTime = now;
}

async function sendData() {
  const privateKey = getPrivateKey();
  if (!privateKey) {
    vscode.window.showErrorMessage(
      'Private key is not set. Use the command "ByteRace: Set Private Key" to configure it.'
    );
    return;
  }

  const currentTime = Date.now();
  const timeDifference = (currentTime - lastSentTime) / 1000;

  if (codingData.length > 0 && timeDifference >= 60 && !isSending) {
    isSending = true;
    try {
      for (const item of codingData) {
        const dataToSend = {
          privateKey,
          languageName: item.language,
          timeSpent: item.duration,
        };

        await axios.post(API_URL, dataToSend);
      }

      codingData = [];
      lastSentTime = currentTime;
    } catch (error) {
      console.error("Error sending data:", error);
      vscode.window.showErrorMessage(
        "Failed to send coding data to the server."
      );
    } finally {
      isSending = false;
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.onDidChangeTextDocument((event) => {
    const document = event.document;
    const language = document.languageId;
    trackLanguage(language);
  });

  setInterval(sendData, 1000);

  context.subscriptions.push(
    new vscode.Disposable(() => {
      sendData();
    })
  );

  const setPrivateKeyCommand = vscode.commands.registerCommand(
    "byteRace.setPrivateKey",
    async () => {
      const privateKey = await vscode.window.showInputBox({
        prompt: "Enter your private key",
        placeHolder: "Paste your private key here",
      });

      if (!privateKey) {
        vscode.window.showErrorMessage("No private key provided.");
        return;
      }

      try {
        await setPrivateKey(privateKey);
        vscode.window.showInformationMessage("Private key set successfully!");
      } catch (error) {
        console.error("Error setting private key:", error);
        vscode.window.showErrorMessage("Failed to set private key.");
      }
    }
  );

  context.subscriptions.push(setPrivateKeyCommand);
}

export function deactivate() {
  sendData();
}
