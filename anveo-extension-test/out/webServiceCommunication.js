"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectUsingOdata = exports.connectUsingSoap = exports.requestBuilder = void 0;
const vscode = require("vscode");
var fs = require("fs");
const soap = require("soap");
const axios = require("axios");
const unirest = require("unirest");
const path = require("path");
const extension_1 = require("./extension");
// GET request for remote image in node.js
const fsPromises = require("fs").promises;
function requestBuilder(user, pass, server, instance, company, tenant, currentFileName, currentFileContent, callType, authenticationType, webServiceName, contextVscode) {
    console.log("Start of web service file");
    if (webServiceName === "Soap") {
        connectUsingSoap(user, pass, server, instance, company, tenant, currentFileName, currentFileContent, callType, contextVscode);
    }
    if (webServiceName === "OData") {
        connectUsingOdata(user, pass, server, instance, company, tenant, currentFileName, currentFileContent, callType);
    }
}
exports.requestBuilder = requestBuilder;
function connectUsingSoap(user, pass, server, instance, company, tenant, currentFileName, currentFileContent, callType, contextVscode) {
    let encodedString = encodeURIComponent(company);
    let urlStatus = server +
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
        validateStatus: function (status) {
            console.log("test0001");
            return status < 500; // Resolve only if the status code is less than 500
        },
    })
        .then(function (response) {
        let wsdlFilename = __dirname + "\\" + Date.now() + "WD.wsdl";
        fs.writeFile(wsdlFilename, response.data, () => {
            soap.createClient(wsdlFilename, (err, client) => {
                if (err) {
                    console.log(err);
                    return;
                }
                fs.unlink(wsdlFilename, () => {
                    console.log("wsdl deleted");
                });
                client.setSecurity(new soap.BasicAuthSecurity(user, pass));
                console.log("here");
                if (callType === "Create Connection") {
                    client.Ping({}, async function (err, result, rawResponse, soapHeader, rawRequest) {
                        let authenticationType = currentFileName;
                        let webServiceName = currentFileContent;
                        let username = user;
                        (0, extension_1.savePassword)(user, pass);
                        // Save the file
                        if (!vscode.workspace.workspaceFolders) {
                            return;
                        }
                        const workspacefolder = vscode.workspace.workspaceFolders[0];
                        const filePath = vscode.Uri.file(path.join(workspacefolder.uri.fsPath, "anveoLaunch.json"));
                        try {
                            await (0, extension_1.readFile)(filePath);
                            await (0, extension_1.updateAnveoLaunch)(username, server, instance, company, tenant, filePath, currentFileName, currentFileContent);
                        }
                        catch (error) {
                            //if anveoLaunch.json doesnot exits then create new file
                            if (error &&
                                error.code === "ENOENT") {
                                const firstObjectSet = [];
                                firstObjectSet.push({
                                    username,
                                    server,
                                    instance,
                                    company,
                                    tenant,
                                    authenticationType,
                                    webServiceName,
                                });
                                await (0, extension_1.writeFile)(filePath, JSON.stringify(firstObjectSet, null, 2));
                            }
                            else {
                                vscode.window.showErrorMessage(`Error saving data:${error.message}`);
                            }
                        }
                    });
                }
                else if (callType === "SaveScript") {
                    console.log(currentFileName);
                    //let actualName = con.globalState.get(currentFileName);
                    let scriptName;
                    scriptName = contextVscode.globalState.get(currentFileName);
                    client.SaveScript({
                        param1: scriptName,
                        param2: currentFileContent,
                    }, function (err, result, rawResponse, soapHeader, rawRequest) {
                        console.log(result);
                    });
                }
                else if (callType === "exportScriptsOnly") {
                    //Create filePath using workspace api
                    client.exportScriptsOnly({}, async function (err, result, rawResponse, soapHeader, rawRequest) {
                        // console.log(result);
                        let decodedText;
                        let decodedLibraries;
                        decodedText = Buffer.from(result.return_value, "base64").toString("utf-8");
                        decodedText = JSON.parse(decodedText);
                        let decodedScript;
                        if (!vscode.workspace.workspaceFolders) {
                            return;
                        }
                        const workspacefolder = vscode.workspace.workspaceFolders[0];
                        let key = "";
                        let value = "";
                        for (let i = 0; i < decodedText.length; i++) {
                            decodedScript = Buffer.from(decodedText[i].content, "base64").toString("utf-8");
                            value = decodedText[i].ActualName;
                            key = decodedText[i].fileName;
                            decodedLibraries = decodedText[i].libraries;
                            console.log(decodedLibraries);
                            console.log(key + 'Lib');
                            contextVscode.globalState.update(key + 'Lib', decodedLibraries);
                            contextVscode.globalState.update(key, value);
                            const fileName = decodedText[i].fileName;
                            const fileType = decodedText[i].fileType;
                            const fileContent = decodedScript;
                            let folderName;
                            switch (fileType) {
                                case ".lua":
                                    folderName = "Lua Scripts";
                                    break;
                                case ".html":
                                    folderName = "HTML Files";
                                    break;
                                case ".js":
                                    folderName = "JavaScript Files";
                                    break;
                                default:
                                    folderName = "Other Files";
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
                            await (0, extension_1.writeFile)(filePath, fileContent);
                        }
                    });
                }
            });
        });
    })
        .catch(function (error) {
        // Handle error response
        vscode.window.showErrorMessage("Connection error");
        console.log(error);
        return;
    });
}
exports.connectUsingSoap = connectUsingSoap;
function connectUsingOdata(user, pass, server, instance, company, tenant, currentFileName, currentFileContent, callType) {
    let encodedString = encodeURIComponent(company);
    //Business Central REST API
    var hostName = server + "/" + instance + "/ODATAV4/";
    var eTag = "12345678_xyz"; //Get current ETag first and use it to update
    //Item endpoint
    var authorizationBasic = Buffer.from(user + ":" + pass).toString("base64");
    var method = "";
    if (callType === "Create Connection") {
        method = "Ping";
    }
    else if (callType === "SaveScript") {
        method = "SaveScript";
    }
    else if (callType === "exportScriptsOnly") {
        method = "exportScriptsOnly";
    }
    var methodString = "vscode_Listner_" +
        method +
        "?company=" +
        encodedString +
        "&tenant=" +
        tenant;
    //Base64 conversion for authentication header
    if (callType === "Create Connection") {
        var createConnections = unirest("POST", hostName + methodString)
            .headers({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/json",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "If-Match": eTag,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: "Basic " + authorizationBasic,
        })
            .send()
            .end(function (res) {
            if (res.error) {
                throw new Error(res.error);
            }
            else {
                console.log(res.body.value);
            }
        });
    }
    else if (callType === "SaveScript") {
        var sendRequest = unirest("POST", hostName + methodString)
            .headers({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/json",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "If-Match": eTag,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: "Basic " + authorizationBasic,
        })
            .send({
            param1: currentFileName,
            param2: currentFileContent,
        })
            .end(function (res) {
            if (res.error) {
                throw new Error(res.error);
            }
            else {
                console.log(res.body.value);
            }
        });
    }
    else if (callType === "exportScriptsOnly") {
        var sendRequest = unirest("POST", hostName + methodString)
            .headers({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/json",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "If-Match": eTag,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Authorization: "Basic " + authorizationBasic,
        })
            .send()
            .end(function (res) {
            if (res.error) {
                throw new Error(res.error);
            }
            else {
                console.log(res.body.value);
            }
        });
    }
}
exports.connectUsingOdata = connectUsingOdata;
//# sourceMappingURL=webServiceCommunication.js.map