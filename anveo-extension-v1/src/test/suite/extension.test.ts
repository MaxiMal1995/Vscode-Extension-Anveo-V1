import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExtensionContext, extensions } from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	let extensionContext: ExtensionContext;
	suiteSetup(async () => {
		await extensions.getExtension('vscode-samples.helloworld-sample')!.activate();
		extensionContext = (global as any).testExtensionContext;
	});

	test('state', () => {
		const extension = vscode.extensions.getExtension(
			'vscode-samples.helloworld-sample',
		);
		assert.ok(!!extension);
		assert.ok(!!extensionContext);
		assert.ok(!!extensionContext.globalState);
	});
});