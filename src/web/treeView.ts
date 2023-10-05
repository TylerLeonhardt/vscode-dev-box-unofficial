import * as vscode from 'vscode';
import { DevBoxClient } from './client';

class DevBoxDataProvider implements vscode.TreeDataProvider<DevBox> {
    private _onDidChangeTreeData = new vscode.EventEmitter<DevBox | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private _devBoxes: DevBox[] = [];


    constructor(
        context: vscode.ExtensionContext,
        private readonly _client: DevBoxClient
    ) {
        context.subscriptions.push(vscode.commands.registerCommand('vscode-dev-box-unofficial.refreshDevBoxes', () => this.refresh()));
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('devBoxUnofficial')) {
                this.refreshWithBackoff();
            }
        }));
        context.subscriptions.push(this._client.onDidChangeDevBox(() => {
            this.refreshWithBackoff();
        }));
        this.refreshWithBackoff();
    }

    private async refreshWithBackoff(): Promise<void> {
        const maxAttempts = 10;
        let attempts = 0;
        let delay = 10000;
        while (attempts < maxAttempts) {
            try {
                this.refresh();
                break;
            } catch (error) {
                console.error(`Error refreshing dev boxes: ${error}`);
                attempts++;
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
    }


    refresh(element?: DevBox): void {
        if (element) {
            this._onDidChangeTreeData.fire(element);
        } else {
            this._devBoxes = [];
            this._onDidChangeTreeData.fire(undefined);
        }
    }

    async getChildren(element?: DevBox): Promise<DevBox[]> {
        if (element) {
            return [];
        } else {
            const devBoxes = [];
            for await (const box of this._client.getDevBoxes()) {
                console.log(box);
                devBoxes.push(box);
            }
            this._devBoxes = devBoxes.map((d) => ({
                id: d.uniqueId!,
                label: d.name!,
                description: d.actionState!,
                contextValue: d.actionState,
                project: d.projectName!,
                userId: d.user!,
                poolName: d.poolName!,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                iconPath: new vscode.ThemeIcon('server'),
            }));
            return this._devBoxes;
        }
    }

    getTreeItem(element: DevBox): vscode.TreeItem {
        return element;
    }
}

export class DevBox extends vscode.TreeItem {
    children?: DevBox[];

    constructor(
        public readonly id: string,
        public readonly label: string,
        public readonly project: string,
        public readonly userId: string,
        public readonly poolName: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }

    iconPath = new vscode.ThemeIcon('server');
}

export class DevBoxTreeView implements vscode.TreeDataProvider<DevBox> {
    private _onDidChangeTreeData = new vscode.EventEmitter<DevBox | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private _devBoxDataProvider: DevBoxDataProvider;

    constructor(context: vscode.ExtensionContext, client: DevBoxClient) {
        this._devBoxDataProvider = new DevBoxDataProvider(context, client);
        const treeView = vscode.window.createTreeView('devBox', { treeDataProvider: this._devBoxDataProvider });
        context.subscriptions.push(treeView);
        this._devBoxDataProvider.onDidChangeTreeData((e) => this._onDidChangeTreeData.fire(e));
    }

    getTreeItem(element: DevBox): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: DevBox): Promise<DevBox[]> {
        return this._devBoxDataProvider.getChildren(element);
    }

    refresh(element?: DevBox): void {
        this._devBoxDataProvider.refresh(element);
    }
}
