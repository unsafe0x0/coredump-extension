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
const Byte_INTERVAL = 2 * 60 * 1000;
let lastByteTime = null;
let typingTimer = null;
let privateKey = null;
let startTime = null;
const sendByte = async (language, timeSpent) => {
    if (!privateKey)
        return;
    try {
        const response = await axios_1.default.post(API_URL, {
            privateKey,
            languageName: language,
            timeSpent,
        });
        if (response.status === 200) {
            lastByteTime = Date.now();
        }
        else {
            console.error("Failed to send byte:", response.statusText);
        }
    }
    catch (error) {
        console.error("Failed to send byte:", error);
    }
};
const onDidChangeTextDocument = (event) => {
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
const onDidSaveTextDocument = (document) => {
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
                .update("byteRace.privateKey", privateKey, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Private key set to: ${privateKey}`);
        }
        catch (error) {
            vscode.window.showErrorMessage("Failed to save private key.");
        }
    }
};
const loadPrivateKey = () => {
    const config = vscode.workspace.getConfiguration();
    privateKey = config.get("byteRace.privateKey") || null;
};
function activate(context) {
    loadPrivateKey();
    const disposableSessionKeyCommand = vscode.commands.registerCommand("byteRace.inputPrivateKey", inputPrivateKey);
    const disposableSave = vscode.workspace.onDidSaveTextDocument(onDidSaveTextDocument);
    const disposableChange = vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument);
    context.subscriptions.push(disposableSessionKeyCommand, disposableSave, disposableChange);
}
function deactivate() {
    if (typingTimer) {
        clearTimeout(typingTimer);
    }
}
//# sourceMappingURL=extension.js.map