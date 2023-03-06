import * as vscode from "vscode";
import * as fs from "fs";
import path = require("path");
const keytar = require("keytar");
const crypto = require('crypto');
import {
  connectUsingSoap,
  connectUsingOdata,
  requestBuilder,
} from "./webServiceCommunication";
import { getWebviewContent, createScriptHtmlContent,libHtmlContent } from "./webview";

//Main Activation function for the extension
function activate(context: vscode.ExtensionContext) {
  //Register Set connection command

  let webServiceName: string | undefined = "";
  let authenticationType: string | undefined = "";
  let askForConnection = vscode.commands.registerCommand(
    "anveo.SetConnection",
    async () => {
      //Get the communication from user
      webServiceName = await showQuickPickProtocol();
      authenticationType = await showQuickAuth();

      if (
        authenticationType === "Basic Auth" ||
        authenticationType === "Basic Auth NTLM"
      ) {
        vscode.commands.executeCommand("anveo.createWebView");
      } else {
        vscode.window.showErrorMessage("O AUTH is not possible atm");
      }
    }
  );

  let buildSoapWebView = vscode.commands.registerCommand(
    "anveo.createWebView",
    () => {
      // Create and show panel
      const panel = vscode.window.createWebviewPanel(
        "anveoExtension",
        "Anveo Extension",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      // And set its HTML content
      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(
        async (message: any) => {
          switch (message.command) {
            case "submit":
              const { username, password, server, instance, company, tenant } =
                message.data;

              if (
                authenticationType === "Basic Auth" &&
                webServiceName === "Soap"
              ) {
                connectUsingSoap(
                  username,
                  password,
                  server,
                  instance,
                  company,
                  tenant,
                  authenticationType,
                  webServiceName,
                  "Create Connection",
                  context
                );
              }
              if (
                authenticationType === "Basic Auth" &&
                webServiceName === "OData"
              ) {
                connectUsingOdata(
                  username,
                  password,
                  server,
                  instance,
                  company,
                  tenant,
                  "",
                  "",
                  "Create Connection"
                );
              }
              return;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  let testPass = vscode.commands.registerCommand(
    "anveo.testPassword",
    async () => {
      let pass = await retrievePassword("playground");
      vscode.window.showInformationMessage(pass);
    }
  );
  //Onsave Document

  vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.languageId === "lua") {
      vscode.commands.executeCommand("anveo.onSaveLua");
    } else {
      console.log(document.languageId);
    }
  });

  let saveLuaScripts = vscode.commands.registerCommand(
    "anveo.onSaveLua",
    async () => {
      let activeEditor = vscode.window.activeTextEditor;
      let currentFileName = "";

      if (!activeEditor) {
        return;
      }
      let document = activeEditor.document;
      currentFileName = path.parse(document.fileName).name;
      console.log(currentFileName);
      let scriptName: string | undefined;
      scriptName = context.globalState.get(currentFileName);

      if (!scriptName) {
        const errorMessage = "File not found in action list table";
        vscode.window.setStatusBarMessage(errorMessage, 10000);
        
        setTimeout(() => {
            vscode.window.setStatusBarMessage("");
        }, 5000);
        
        

        return;
      } else {
        const saveMessage = "Script saved!";
        vscode.window.setStatusBarMessage(saveMessage, 10000);
        
        setTimeout(() => {
            vscode.window.setStatusBarMessage("");
        }, 5000);
        await requestConstructor("SaveScript", context);
      }
    }
  );

  let activateOnOpenExtension = vscode.commands.registerCommand(
    "anveo.testsaveScript",
    () => {
      // Your code for the command
      vscode.window.showInformationMessage("Extension is active now.");
    }
  );

  let requestScriptsFromServer = vscode.commands.registerCommand(
    "anveo.requestAllScript",
    () => {
      // run the correct codeunit called exportScriptsOnly using SOAP or ODATA
      requestConstructor("exportScriptsOnly", context);
    }
  );

  // Create a new script
  let createScript = vscode.commands.registerCommand(
    "anveo.createNewScript",
    () => {
      // Create and show panel
      const panel = vscode.window.createWebviewPanel(
        "anveoExtension",
        "Anveo Extension",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );
      panel.webview.html = createScriptHtmlContent();
      panel.webview.onDidReceiveMessage(
        async (message: any) => {
          switch (message.command) {
            case "createScript":
              const { scriptName, description, version, scriptType } =
                message.data;

              if (scriptName === "") {
                vscode.window.showInformationMessage(
                  "Script name cannot be empty"
                );
                return;
              }

              panel.dispose();
              vscode.window.showInformationMessage("Script is created");
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

    // Create a new script
    let showLibContent = vscode.commands.registerCommand(
      "anveo.showScriptLibs",
      () => {
        // Create and show panel
        const panel = vscode.window.createWebviewPanel(
          "anveoExtension",
          "Anveo Extension",
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            retainContextWhenHidden: true
          }
        );
        const nonce = crypto.randomBytes(16).toString('base64');
        
        let activeEditor = vscode.window.activeTextEditor;
        let currentFileName = "";
  
        if (!activeEditor) {
          return;
        }
        let document = activeEditor.document;
        currentFileName = path.parse(document.fileName).name;
        let libraries: any;
        let count  = 0;
        let index :any;
        panel.webview.html = libHtmlContent(nonce,currentFileName);

        panel.webview.onDidReceiveMessage(
          message => {
            if (message.type === 'getLibraryNames') {
              const fileName = message.fileName;
              libraries = context.globalState.get(currentFileName + 'Lib');
              panel.webview.postMessage({ type: 'libraryNames', libraryNames: libraries });
            }
          },
          undefined,
          context.subscriptions
        );        
      });

  let scriptNames = vscode.commands.registerCommand(
    "anveo.getScriptsName",
    () => {
      // run the correct codeunit called exportScriptsOnly using SOAP or ODATA
      let scriptName: string | undefined;
      scriptName = context.globalState.get("TEST_EXTENSION_VSCODLib");
      if (!scriptName) {
        return;
      }
      console.log(scriptName);
      vscode.window.showInformationMessage(scriptName);
    }
  );

  context.subscriptions.push(
    askForConnection,
    buildSoapWebView,
    testPass,
    saveLuaScripts,
    activateOnOpenExtension,
    requestScriptsFromServer,
    scriptNames,
    createScript
  );
}



//Get Type of service Communication
async function showQuickPickProtocol(): Promise<string | undefined> {
  const typeOfInstance = ["Soap", "OData"];
  const selectedProtocol = await vscode.window.showQuickPick(typeOfInstance, {
    placeHolder: "Select Web service Communication type",
    title: "Important which port is opened for web service Communication",
  });
  return selectedProtocol;
}

//Get Type of Authentification
async function showQuickAuth(): Promise<string | undefined> {
  const typeOfAuth = ["Basic Auth", "Basic Auth NTLM", "O AUTH"];
  const selectedAuth = await vscode.window.showQuickPick(typeOfAuth, {
    placeHolder: "Select User Authentification",
    title: "User Authentification",
  });
  return selectedAuth;
}

//Get Type of service Communication
async function showQuickPickLoginSystems(anveoLaunch: any) {
  const serverStrings: any = [];

  for (let i = 0; i < anveoLaunch.length; i++) {
    serverStrings.push(
      "User: " + anveoLaunch[i].username + " Server: " + anveoLaunch[i].server
    );
  }
  const selectedProtocol = await vscode.window.showQuickPick(serverStrings, {
    placeHolder: "Select server",
    title: "Target system to save script",
  });
  const selectedIndex = parseInt(serverStrings.indexOf(selectedProtocol));
  return selectedIndex;
}

export async function updateAnveoLaunch(
  username: string,
  server: string,
  instance: string,
  company: string,
  tenant: string,
  filePath: vscode.Uri,
  authenticationType: string | undefined,
  webServiceName: string | undefined
): Promise<any> {
  let anveoLaunch: any;
  let exists = false;
  try {
    const anveoLaunchContent = await readFile(filePath);
    if (anveoLaunchContent === "") {
      //File is empty but exists
      let emptySet: object[] = [];
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
    } else {
      anveoLaunch = JSON.parse(anveoLaunchContent);
      for (let i = 0; i < anveoLaunch.length; i++) {
        if (
          anveoLaunch[i].username === username &&
          anveoLaunch[i].server === server &&
          anveoLaunch[i].instanceName === instance &&
          anveoLaunch[i].companyText === company &&
          anveoLaunch[i].tenent === tenant
        ) {
          exists = true;
          vscode.window.showInformationMessage(
            "This configuration already exists."
          );
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
  } catch (error) {
    anveoLaunch = [];
  }
}

export async function readFile(filePath: vscode.Uri): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath.fsPath, "utf8", (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

export async function writeFile(filePath: vscode.Uri, data: any) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(filePath.fsPath, data, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export async function savePassword(username: string, password: string) {
  return keytar.setPassword("anveo-extension-v1", username, password);
}

async function retrievePassword(username: string) {
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
async function requestConstructor(
  requestName: string,
  contextVsCode: vscode.ExtensionContext
) {
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
  const filePath = vscode.Uri.file(
    path.join(workspacefolder.uri.fsPath, "anveoLaunch.json")
  );
  try {
    const anveoLaunchContent = await readFile(filePath);

    let anveoLaunch: any;
    if (anveoLaunchContent === "") {
      vscode.window.showInformationMessage(
        "No system login found please use setcommand to create anveoLaunch.json"
      );
      return;
    }
    //check the content of the file has just one config data or many
    anveoLaunch = JSON.parse(anveoLaunchContent);

    let pass: any;
    if (anveoLaunch.length === 1) {
      pass = await retrievePassword(anveoLaunch[0].username);

      requestBuilder(
        anveoLaunch[0].username,
        pass,
        anveoLaunch[0].server,
        anveoLaunch[0].instance,
        anveoLaunch[0].company,
        anveoLaunch[0].tenant,
        currentFileName,
        currenFileContent,
        requestName,
        anveoLaunch[0].authenticationType,
        anveoLaunch[0].webServiceName,
        contextVsCode
      );
    } else {
      //create a quick box to show the server name
      vscode.window.showInformationMessage(
        "Please select database before sending the request"
      );

      let selectedIndex = await showQuickPickLoginSystems(anveoLaunch);

      pass = await retrievePassword(anveoLaunch[selectedIndex].username);

      console.log(pass);
      console.log("njansdkjaslkd");
      requestBuilder(
        anveoLaunch[selectedIndex].username,
        pass,
        anveoLaunch[selectedIndex].server,
        anveoLaunch[selectedIndex].instance,
        anveoLaunch[selectedIndex].company,
        anveoLaunch[selectedIndex].tenant,
        currentFileName,
        currenFileContent,
        requestName,
        anveoLaunch[selectedIndex].authenticationType,
        anveoLaunch[selectedIndex].webServiceName,
        contextVsCode
      );
    }
    return;
  } catch (error) {
    if (error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      vscode.window.showInformationMessage(
        "No system login found please use setcommand to create anveoLaunch.json"
      );
      return;
    }
  }
  // vscode.window.showInformationMessage("script saved");
}

exports.activate = activate;
