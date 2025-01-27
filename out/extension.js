"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const API_URL = "https://byterace.vercel.app/api/activity";
let currentLanguage = null;
let lastActivityTime = Date.now();
let codingData = [];
let isSending = false;
let inactivityTimeout = null;
let languageChangedTimeout = null;
let debounceTimeout = null;
const languageChangeDelay = 30000;
function getPrivateKey() {
    const config = vscode.workspace.getConfiguration("byteRace");
    return config.get("privateKey");
}
async function setPrivateKey(privateKey) {
    const config = vscode.workspace.getConfiguration("byteRace");
    await config.update("privateKey", privateKey, vscode.ConfigurationTarget.Global);
}
function trackLanguage(language) {
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
async function sendData(language) {
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
                    await axios_1.default.post(API_URL, dataToSend);
                }
            }
            codingData = [];
        }
        catch (error) {
            console.error("Error sending data:", error);
        }
        finally {
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
function activate(context) {
    vscode.workspace.onDidChangeTextDocument((event) => {
        const document = event.document;
        const language = document.languageId;
        trackLanguage(language);
        startInactivityTimer();
    });
    vscode.window.onDidChangeTextEditorSelection(() => {
        startInactivityTimer();
    });
    const setPrivateKeyCommand = vscode.commands.registerCommand("byteRace.setPrivateKey", async () => {
        const privateKey = await vscode.window.showInputBox({
            prompt: "Enter your private key",
            placeHolder: "Paste your private key here",
        });
        if (!privateKey) {
            return;
        }
        try {
            await setPrivateKey(privateKey);
        }
        catch (error) {
            console.error("Error setting private key:", error);
        }
    });
    context.subscriptions.push(setPrivateKeyCommand);
}
function deactivate() {
    sendData(currentLanguage || "");
}
//# sourceMappingURL=extension.js.map