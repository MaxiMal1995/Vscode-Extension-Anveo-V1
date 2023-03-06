"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectUsingSoap = exports.requestBuilder = void 0;
var fs = require("fs");
const soap = require("soap");
const axios = require("axios");
const unirest = require("unirest");
const path = require("path");
const unzipper = require("unzipper");
const vscode = require("vscode");
// GET request for remote image in node.js
function requestBuilder(user, pass, server, instance, company, tenant, currentFileName, currentFileContent, callType, authenticationType, webServiceName) {
    if (webServiceName === "Soap") {
        connectUsingSoap(user, pass, server, instance, company, tenant, currentFileName, currentFileContent, callType);
    }
}
exports.requestBuilder = requestBuilder;
function connectUsingSoap(user, pass, server, instance, company, tenant, currentFileName, currentFileContent, callType) {
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
    }).then(function (response) {
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
                if (callType === "exportScriptsOnly") {
                    client.exportScriptsOnly({}, async function (err, result, rawResponse, soapHeader, rawRequest) {
                        let decodedText;
                        decodedText = Buffer.from(result.return_value, "base64").toString("utf-8");
                        decodedText = JSON.parse(decodedText);
                        let decodedScript = Buffer.from(decodedText[0].content, "base64").toString("utf-8");
                        console.log(decodedScript);
                        if (!vscode.workspace.workspaceFolders) {
                            return;
                        }
                        const workspacefolder = vscode.workspace.workspaceFolders[0];
                        const filePath = vscode.Uri.file(path.join(workspacefolder.uri.fsPath, decodedText[0].fileName + decodedText[0].fileType));
                        // await writeFile(filePath, decodedScript); this line is used 
                    });
                }
            });
        });
    });
}
exports.connectUsingSoap = connectUsingSoap;
//# sourceMappingURL=extraCode.js.map