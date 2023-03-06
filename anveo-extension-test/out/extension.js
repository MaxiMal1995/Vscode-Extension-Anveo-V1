"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePassword = exports.writeFile = exports.readFile = exports.updateAnveoLaunch = exports.NodeDependenciesProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const keytar = require("keytar");
const crypto = require('crypto');
const webServiceCommunication_1 = require("./webServiceCommunication");
const webview_1 = require("./webview");
//Main Activation function for the extension
function activate(context) {
    //Register Set connection command
    let webServiceName = "";
    let authenticationType = "";
    let askForConnection = vscode.commands.registerCommand("anveo.SetConnection", async () => {
        //Get the communication from user
        webServiceName = await showQuickPickProtocol();
        authenticationType = await showQuickAuth();
        if (authenticationType === "Basic Auth" ||
            authenticationType === "Basic Auth NTLM") {
            vscode.commands.executeCommand("anveo.createWebView");
        }
        else {
            vscode.window.showErrorMessage("O AUTH is not possible atm");
        }
    });
    let buildSoapWebView = vscode.commands.registerCommand("anveo.createWebView", () => {
        // Create and show panel
        const panel = vscode.window.createWebviewPanel("anveoExtension", "Anveo Extension", vscode.ViewColumn.One, {
            enableScripts: true,
        });
        // And set its HTML content
        panel.webview.html = (0, webview_1.getWebviewContent)();
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case "submit":
                    const { username, password, server, instance, company, tenant } = message.data;
                    if (authenticationType === "Basic Auth" &&
                        webServiceName === "Soap") {
                        (0, webServiceCommunication_1.connectUsingSoap)(username, password, server, instance, company, tenant, authenticationType, webServiceName, "Create Connection", context);
                    }
                    if (authenticationType === "Basic Auth" &&
                        webServiceName === "OData") {
                        (0, webServiceCommunication_1.connectUsingOdata)(username, password, server, instance, company, tenant, "", "", "Create Connection");
                    }
                    return;
            }
        }, undefined, context.subscriptions);
    });
    let testPass = vscode.commands.registerCommand("anveo.testPassword", async () => {
        let pass = await retrievePassword("playground");
        vscode.window.showInformationMessage(pass);
    });
    //Onsave Document
    vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.languageId === "lua") {
            vscode.commands.executeCommand("anveo.onSaveLua");
        }
        else {
            console.log(document.languageId);
        }
    });
    let saveLuaScripts = vscode.commands.registerCommand("anveo.onSaveLua", async () => {
        let activeEditor = vscode.window.activeTextEditor;
        let currentFileName = "";
        if (!activeEditor) {
            return;
        }
        let document = activeEditor.document;
        currentFileName = path.parse(document.fileName).name;
        console.log(currentFileName);
        let scriptName;
        scriptName = context.globalState.get(currentFileName);
        if (!scriptName) {
            const errorMessage = "File not found in action list table";
            vscode.window.setStatusBarMessage(errorMessage, 10000);
            setTimeout(() => {
                vscode.window.setStatusBarMessage("");
            }, 5000);
            return;
        }
        else {
            const saveMessage = "Script saved!";
            vscode.window.setStatusBarMessage(saveMessage, 10000);
            setTimeout(() => {
                vscode.window.setStatusBarMessage("");
            }, 5000);
            await requestConstructor("SaveScript", context);
        }
    });
    let activateOnOpenExtension = vscode.commands.registerCommand("anveo.testsaveScript", () => {
        // Your code for the command
        vscode.window.showInformationMessage("Extension is active now.");
    });
    let requestScriptsFromServer = vscode.commands.registerCommand("anveo.requestAllScript", () => {
        // run the correct codeunit called exportScriptsOnly using SOAP or ODATA
        requestConstructor("exportScriptsOnly", context);
    });
    // Create a new script
    let createScript = vscode.commands.registerCommand("anveo.createNewScript", () => {
        // Create and show panel
        const panel = vscode.window.createWebviewPanel("anveoExtension", "Anveo Extension", vscode.ViewColumn.One, {
            enableScripts: true,
        });
        panel.webview.html = (0, webview_1.createScriptHtmlContent)();
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case "createScript":
                    const { scriptName, description, version, scriptType } = message.data;
                    if (scriptName === "") {
                        vscode.window.showInformationMessage("Script name cannot be empty");
                        return;
                    }
                    panel.dispose();
                    vscode.window.showInformationMessage("Script is created");
            }
        }, undefined, context.subscriptions);
    });
    // Create a new script
    let showLibContent = vscode.commands.registerCommand("anveo.showScriptLibs", () => {
        // Create and show panel
        const panel = vscode.window.createWebviewPanel("anveoExtension", "Anveo Extension", vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        const nonce = crypto.randomBytes(16).toString('base64');
        let activeEditor = vscode.window.activeTextEditor;
        let currentFileName = "";
        if (!activeEditor) {
            return;
        }
        let document = activeEditor.document;
        currentFileName = path.parse(document.fileName).name;
        let libraries;
        let count = 0;
        let index;
        panel.webview.html = (0, webview_1.libHtmlContent)(nonce, currentFileName);
        panel.webview.onDidReceiveMessage(message => {
            if (message.type === 'getLibraryNames') {
                const fileName = message.fileName;
                libraries = context.globalState.get(currentFileName + 'Lib');
                panel.webview.postMessage({ type: 'libraryNames', libraryNames: libraries });
            }
        }, undefined, context.subscriptions);
        /* interface WebViewMessage {
           command: string;
           data?: any;
           oldLibraryName?: string;
           newLibraryName?: string;
         }
         
         panel.webview.onDidReceiveMessage((message: WebViewMessage) => {
           const currentFileName = vscode.window.activeTextEditor?.document.fileName || '';
         
           switch (message.command) {
             case 'addLibrary':
               let newLibraryName_ = message.newLibraryName;
               const existingLibraries = context.globalState.get(currentFileName + 'Lib', []);
               context.globalState.update(currentFileName + 'Lib', [...existingLibraries, newLibraryName_]);
               panel.webview.postMessage({
                 command: 'updateLibraries',
                 data: existingLibraries,
               });
               break;
         
             case 'editLibrary':
               const oldLibraryName = message.oldLibraryName;
               let newLibraryName = message.newLibraryName;
               const libraries = context.globalState.get(currentFileName + 'Lib', []);
               
               const index = libraries.indexOf(oldLibraryName);
               if (index !== -1) {
                 libraries[index] = newLibraryName;
                 context.globalState.update(currentFileName + 'Lib', libraries);
                 webviewPanel.webview.postMessage({
                   command: 'updateLibraries',
                   data: libraries,
                 });
               }
               break;
         
             case 'deleteLibrary':
               const libraryNameToDelete = message.oldLibraryName;
               const librariesToDeleteFrom = context.globalState.get(currentFileName + 'Lib', []);
               const indexToDelete = librariesToDeleteFrom.indexOf(libraryNameToDelete);
               if (indexToDelete !== -1) {
                 librariesToDeleteFrom.splice(indexToDelete, 1);
                 context.globalState.update(currentFileName + 'Lib', librariesToDeleteFrom);
                 webviewPanel.webview.postMessage({
                   command: 'updateLibraries',
                   data: librariesToDeleteFrom,
                 });
               }
               break;
         
             default:
               console.warn('Received unknown command from webview:', message.command);
               break;
           }
         });*/
    });
    let scriptNames = vscode.commands.registerCommand("anveo.getScriptsName", () => {
        // run the correct codeunit called exportScriptsOnly using SOAP or ODATA
        let scriptName;
        scriptName = context.globalState.get("TEST_EXTENSION_VSCODLib");
        if (!scriptName) {
            return;
        }
        console.log(scriptName);
        vscode.window.showInformationMessage(scriptName);
    });
    const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
    if (!rootPath) {
        return;
    }
    vscode.window.registerTreeDataProvider('nodeDependencies', new NodeDependenciesProvider(rootPath));
    vscode.window.createTreeView('nodeDependencies', {
        treeDataProvider: new NodeDependenciesProvider(rootPath)
    });
    context.subscriptions.push(askForConnection, buildSoapWebView, testPass, saveLuaScripts, activateOnOpenExtension, requestScriptsFromServer, scriptNames, createScript);
}
class NodeDependenciesProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }
        if (element) {
            return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
        }
        else {
            const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
            if (this.pathExists(packageJsonPath)) {
                return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
            }
            else {
                vscode.window.showInformationMessage('Workspace has no package.json');
                return Promise.resolve([]);
            }
        }
    }
    /**
     * Given the path to package.json, read all its dependencies and devDependencies.
     */
    getDepsInPackageJson(packageJsonPath) {
        if (this.pathExists(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const toDep = (moduleName, version) => {
                if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
                    return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
                }
                else {
                    return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None);
                }
            };
            const deps = packageJson.dependencies
                ? Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep]))
                : [];
            const devDeps = packageJson.devDependencies
                ? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep]))
                : [];
            return deps.concat(devDeps);
        }
        else {
            return [];
        }
    }
    pathExists(p) {
        try {
            fs.accessSync(p);
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
exports.NodeDependenciesProvider = NodeDependenciesProvider;
class Dependency extends vscode.TreeItem {
    constructor(label, version, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.version = version;
        this.collapsibleState = collapsibleState;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
    }
}
//Get Type of service Communication
async function showQuickPickProtocol() {
    const typeOfInstance = ["Soap", "OData"];
    const selectedProtocol = await vscode.window.showQuickPick(typeOfInstance, {
        placeHolder: "Select Web service Communication type",
        title: "Important which port is opened for web service Communication",
    });
    return selectedProtocol;
}
//Get Type of Authentification
async function showQuickAuth() {
    const typeOfAuth = ["Basic Auth", "Basic Auth NTLM", "O AUTH"];
    const selectedAuth = await vscode.window.showQuickPick(typeOfAuth, {
        placeHolder: "Select User Authentification",
        title: "User Authentification",
    });
    return selectedAuth;
}
//Get Type of service Communication
async function showQuickPickLoginSystems(anveoLaunch) {
    const serverStrings = [];
    for (let i = 0; i < anveoLaunch.length; i++) {
        serverStrings.push("User: " + anveoLaunch[i].username + " Server: " + anveoLaunch[i].server);
    }
    const selectedProtocol = await vscode.window.showQuickPick(serverStrings, {
        placeHolder: "Select server",
        title: "Target system to save script",
    });
    const selectedIndex = parseInt(serverStrings.indexOf(selectedProtocol));
    return selectedIndex;
}
async function updateAnveoLaunch(username, server, instance, company, tenant, filePath, authenticationType, webServiceName) {
    let anveoLaunch;
    let exists = false;
    try {
        const anveoLaunchContent = await readFile(filePath);
        if (anveoLaunchContent === "") {
            //File is empty but exists
            let emptySet = [];
            if (emptySet) {
                emptySet.push({
                    username,
                    server,
                    instance,
                    company,
                    tenant,
                    authenticationType,
                    webServiceName,
                });
                await writeFile(filePath, JSON.stringify(emptySet, null, 2));
            }
        }
        else {
            anveoLaunch = JSON.parse(anveoLaunchContent);
            for (let i = 0; i < anveoLaunch.length; i++) {
                if (anveoLaunch[i].username === username &&
                    anveoLaunch[i].server === server &&
                    anveoLaunch[i].instanceName === instance &&
                    anveoLaunch[i].companyText === company &&
                    anveoLaunch[i].tenent === tenant) {
                    exists = true;
                    vscode.window.showInformationMessage("This configuration already exists.");
                    break;
                }
            }
            if (!exists) {
                anveoLaunch.push({
                    username,
                    server,
                    instance,
                    company,
                    tenant,
                    authenticationType,
                    webServiceName,
                });
                await writeFile(filePath, JSON.stringify(anveoLaunch, null, 4));
            }
        }
    }
    catch (error) {
        anveoLaunch = [];
    }
}
exports.updateAnveoLaunch = updateAnveoLaunch;
async function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath.fsPath, "utf8", (error, data) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(data);
            }
        });
    });
}
exports.readFile = readFile;
async function writeFile(filePath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath.fsPath, data, (error) => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
exports.writeFile = writeFile;
async function savePassword(username, password) {
    return keytar.setPassword("anveo-extension-v1", username, password);
}
exports.savePassword = savePassword;
async function retrievePassword(username) {
    return keytar.getPassword("anveo-extension-v1", username);
}
/* 1st -->Here check if there is a anveoLaunch.json file exits
    and if not then give message that no connection is setup yet.

    2nd --> if there is only one object in array then save the file and get the correct password
    from the windows system
    
    3rd --> if there are more then one systems then create a input box give name of server, instance, company and tenent as
    combine string and then user selected one should be pass to the connectUsingSoap function
    
  Important thing to discuss with Nils and Victor if there are multiple users/systems are added in the
  appLauch should i ask everytime where they would like to send the request? onSaveDocuemnet

  1st --> if file exists and empty or file doesn't exists then error*/
async function requestConstructor(requestName, contextVsCode) {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }
    let currenFileContent = "";
    let currentFileName = "";
    if (requestName === "SaveScript") {
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }
        let document = activeEditor.document;
        currenFileContent = document.getText();
        currentFileName = path.parse(document.fileName).name;
    }
    const workspacefolder = vscode.workspace.workspaceFolders[0];
    const filePath = vscode.Uri.file(path.join(workspacefolder.uri.fsPath, "anveoLaunch.json"));
    try {
        const anveoLaunchContent = await readFile(filePath);
        let anveoLaunch;
        if (anveoLaunchContent === "") {
            vscode.window.showInformationMessage("No system login found please use setcommand to create anveoLaunch.json");
            return;
        }
        //check the content of the file has just one config data or many
        anveoLaunch = JSON.parse(anveoLaunchContent);
        let pass;
        if (anveoLaunch.length === 1) {
            pass = await retrievePassword(anveoLaunch[0].username);
            (0, webServiceCommunication_1.requestBuilder)(anveoLaunch[0].username, pass, anveoLaunch[0].server, anveoLaunch[0].instance, anveoLaunch[0].company, anveoLaunch[0].tenant, currentFileName, currenFileContent, requestName, anveoLaunch[0].authenticationType, anveoLaunch[0].webServiceName, contextVsCode);
        }
        else {
            //create a quick box to show the server name
            vscode.window.showInformationMessage("Please select database before sending the request");
            let selectedIndex = await showQuickPickLoginSystems(anveoLaunch);
            pass = await retrievePassword(anveoLaunch[selectedIndex].username);
            console.log(pass);
            console.log("njansdkjaslkd");
            (0, webServiceCommunication_1.requestBuilder)(anveoLaunch[selectedIndex].username, pass, anveoLaunch[selectedIndex].server, anveoLaunch[selectedIndex].instance, anveoLaunch[selectedIndex].company, anveoLaunch[selectedIndex].tenant, currentFileName, currenFileContent, requestName, anveoLaunch[selectedIndex].authenticationType, anveoLaunch[selectedIndex].webServiceName, contextVsCode);
        }
        return;
    }
    catch (error) {
        if (error && error.code === "ENOENT") {
            vscode.window.showInformationMessage("No system login found please use setcommand to create anveoLaunch.json");
            return;
        }
    }
    // vscode.window.showInformationMessage("script saved");
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map