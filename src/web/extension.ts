// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { DevBoxClient } from './client';
import { DevBoxTreeView } from './treeView';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const client = new DevBoxClient();
	context.subscriptions.push(client);
	context.subscriptions.push(registerCommands(client));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('devBox', new DevBoxTreeView(context, client)));
}

// This method is called when your extension is deactivated
export function deactivate() {}
