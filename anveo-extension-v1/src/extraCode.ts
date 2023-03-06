"use strict";
var fs = require("fs");
const soap = require("soap");
const axios = require("axios");
const unirest = require("unirest");
import path = require("path");
import { pipeline } from "stream";
const unzipper = require("unzipper");
import * as vscode from "vscode";
// GET request for remote image in node.js

export function requestBuilder(
  user: string,
  pass: string,
  server: string,
  instance: string,
  company: string,
  tenant: string,
  currentFileName: string,
  currentFileContent: string,
  callType: string,
  authenticationType: string,
  webServiceName: string
) {
  if (webServiceName === "Soap") {
    connectUsingSoap(
      user,
      pass,
      server,
      instance,
      company,
      tenant,
      currentFileName,
      currentFileContent,
      callType
    );
  }
}

export function connectUsingSoap(
  user: string,
  pass: string,
  server: string,
  instance: string,
  company: string,
  tenant: string,
  currentFileName: string,
  currentFileContent: string,
  callType: string
) {
  let encodedString = encodeURIComponent(company);
  let urlStatus =
    server +
    "/" +
    instance +
    "/WS/" +
    encodedString +
    "/" +
    "Codeunit/vscode_Listner?tenant=" +
    tenant;

  axios({
    method: "get",
    url: urlStatus,
    auth: {
      username: user,
      password: pass,
    },
  }).then(function (response: any) {
    let wsdlFilename = __dirname + "\\" + Date.now() + "WD.wsdl";
    fs.writeFile(wsdlFilename, response.data, () => {
      soap.createClient(wsdlFilename, (err: any, client: any) => {
        if (err) {
          console.log(err);
          return;
        }

        fs.unlink(wsdlFilename, () => {
          console.log("wsdl deleted");
        });
         if (callType === "exportScriptsOnly") {
          client.exportScriptsOnly(
            {},
            async function (
              err: any,
              result: any,
              rawResponse: any,
              soapHeader: any,
              rawRequest: any
            ) {
              let decodedText: any;
              decodedText = Buffer.from(result.return_value, "base64").toString(
                "utf-8"
              );
          
              decodedText = JSON.parse(decodedText);

              let decodedScript = Buffer.from(
                decodedText[0].content,
                "base64"
              ).toString("utf-8");
              console.log(decodedScript);
              if (!vscode.workspace.workspaceFolders) {
                return;
              }
              const workspacefolder = vscode.workspace.workspaceFolders[0];
              const filePath = vscode.Uri.file(
                path.join(workspacefolder.uri.fsPath, decodedText[0].fileName + decodedText[0].fileType )
              );
             // await writeFile(filePath, decodedScript); this line is used 
          
            }
          );
        }
      });
    });
  });
}
/*

for (let i = 0; i < this.scripts.length; i++) {
    const fileName = this.scripts[i].fileName;
    const fileType = this.scripts[i].fileType;
    const fileContent = this.scripts[i].content;
  
    let folderName: string;
  
    switch (fileType) {
      case '.lua':
      case '.luax':
        folderName = 'Lua Scripts';
        break;
      case '.lib':
        folderName = 'Lua Libraries';
        break;
      case '.html':
        folderName = 'HTML Files';
        break;
      case '.js':
        folderName = 'JavaScript Files';
        break;
      default:
        folderName = 'Other Files';
        break;
    }
  
    const folderUri = vscode.Uri.joinPath(workspacefolder.uri, folderName);
    const folderExists = await fsPromises
      .access(folderUri.fsPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  
    if (!folderExists) {
      await fsPromises.mkdir(folderUri.fsPath);
    }
  
    const filePath = vscode.Uri.joinPath(folderUri, fileName + fileType);
    await writeFile(filePath, fileContent);
  }
  

  */