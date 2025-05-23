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
const API_URL = "https://bashforge.vercel.app/api/activity";
const SEND_INTERVAL_MS = 45 * 1000;
const MIN_SEND_DURATION_MS = 30 * 1000;
const IDLE_THRESHOLD_MS = 1 * 60 * 1000;
let privateKey = null;
let lastActivityTimestamp = Date.now();
let lastSentTimestamp = 0;
let accumulatedActiveTime = 0;
let idleTimer = null;
const bashForge = async (language) => {
    if (!privateKey || accumulatedActiveTime < MIN_SEND_DURATION_MS)
        return;
    const timeSpentMinutes = accumulatedActiveTime / 1000 / 60;
    accumulatedActiveTime = 0;
    try {
        await axios_1.default.post(API_URL, {
            privateKey,
            languageName: language,
            timeSpent: timeSpentMinutes,
        });
        lastSentTimestamp = Date.now();
    }
    catch (error) {
        console.error("Failed to send data:", error);
    }
};
const resetIdleTimer = () => {
    if (idleTimer)
        clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        accumulatedActiveTime = 0;
        lastActivityTimestamp = Date.now();
    }, IDLE_THRESHOLD_MS);
};
const onDidChangeTextDocument = (event) => {
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
const onDidChangeActiveTextEditor = (editor) => {
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
const onDidChangeWindowState = (state) => {
    const now = Date.now();
    if (state.focused) {
        lastActivityTimestamp = now;
        resetIdleTimer();
    }
    else {
        if (now - lastActivityTimestamp < IDLE_THRESHOLD_MS) {
            accumulatedActiveTime += now - lastActivityTimestamp;
        }
        if (now - lastSentTimestamp >= SEND_INTERVAL_MS) {
            const editor = vscode.window.activeTextEditor;
            if (editor)
                bashForge(editor.document.languageId);
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
                .update("bashForge.privateKey", privateKey, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage("Private key saved.");
        }
        catch {
            vscode.window.showErrorMessage("Failed to save private key.");
        }
    }
};
const loadPrivateKey = () => {
    const config = vscode.workspace.getConfiguration();
    privateKey = config.get("bashForge.privateKey") || null;
};
function activate(context) {
    loadPrivateKey();
    context.subscriptions.push(vscode.commands.registerCommand("bashForge.inputPrivateKey", inputPrivateKey), vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument), vscode.window.onDidChangeActiveTextEditor(onDidChangeActiveTextEditor), vscode.window.onDidChangeWindowState(onDidChangeWindowState));
}
function deactivate() {
    if (idleTimer)
        clearTimeout(idleTimer);
}
//# sourceMappingURL=extension.js.map