"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
const vscode_1 = require("vscode");
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    let extensionContext;
    suiteSetup(async () => {
        await vscode_1.extensions.getExtension('vscode-samples.helloworld-sample').activate();
        extensionContext = global.testExtensionContext;
    });
    test('state', () => {
        const extension = vscode.extensions.getExtension('vscode-samples.helloworld-sample');
        assert.ok(!!extension);
        assert.ok(!!extensionContext);
        assert.ok(!!extensionContext.globalState);
    });
});
//# sourceMappingURL=extension.test.js.map