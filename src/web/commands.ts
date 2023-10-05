import { Disposable, ProgressLocation, Uri, commands, env, window } from "vscode";
import { DevBoxClient } from "./client";
import { DevBox } from "./treeView";
import { getSettings } from "./settings";

export function registerCommands(client: DevBoxClient): Disposable {
    return Disposable.from(
        commands.registerCommand('vscode-dev-box-unofficial.startDevBox', async (devBox?: { project: string; userId: string; label: string}) => {
            if (!getSettings().endpoint) {
                const endpoint = await window.showInputBox({
                    prompt: 'Enter the Dev Center endpoint',
                    placeHolder: 'https://GUID-devcenter-DEVCENTER_NAME.REGION.devcenter.azure.com'
                });
                if (!endpoint) {
                    return;
                }
                await client.setEndpoint(endpoint);
            }
            if (!devBox) {
                const devBoxes = new Map<string, { project: string; userId: string; label: string }>();
                for await (const box of client.getDevBoxes()) {
                    if (box.actionState === 'Stopped') {
                        devBoxes.set(box.name!, {
                            project: box.projectName!,
                            userId: box.user!,
                            label: box.name!
                        });
                    }
                }
                if (devBoxes.size === 0) {
                    window.showInformationMessage('No stopped Dev Boxes found');
                    return;
                }
                const chosen = await window.showQuickPick([...devBoxes.keys()], {
                    placeHolder: 'Select a Dev Box to start'
                });
                if (!chosen) {
                    return;
                }
                
                devBox = devBoxes.get(chosen) as { project: string; userId: string; label: string };
            }
            return window.withProgress({ location: ProgressLocation.Notification, title: `Starting ${devBox.label}...` }, async () => {
                await client.startDevBox(devBox!.project, devBox!.userId, devBox!.label);
            });
        }),
        commands.registerCommand('vscode-dev-box-unofficial.stopDevBox', async (devBox?: { project: string; userId: string; label: string}) => {
            if (!getSettings().endpoint) {
                const endpoint = await window.showInputBox({
                    prompt: 'Enter the Dev Center endpoint',
                    placeHolder: 'https://GUID-devcenter-DEVCENTER_NAME.REGION.devcenter.azure.com'
                });
                if (!endpoint) {
                    return;
                }
                await client.setEndpoint(endpoint);
            }
            if (!devBox) {
                const devBoxes = new Map<string, { project: string; userId: string; label: string }>();
                for await (const box of client.getDevBoxes()) {
                    if (box.actionState === 'Started') {
                        devBoxes.set(box.name!, {
                            project: box.projectName!,
                            userId: box.user!,
                            label: box.name!
                        });
                    }
                }
                if (devBoxes.size === 0) {
                    window.showInformationMessage('No running Dev Boxes found');
                    return;
                }
                const chosen = await window.showQuickPick([...devBoxes.keys()], {
                    placeHolder: 'Select a Dev Box to stop'
                });
                if (!chosen) {
                    return;
                }
                
                devBox = devBoxes.get(chosen) as { project: string; userId: string; label: string };
            }
            return window.withProgress({ location: ProgressLocation.Notification, title: `Stopping ${devBox.label}...` }, async () => {
                await client.stopDevBox(devBox!.project, devBox!.userId, devBox!.label);
            });
        }),
        commands.registerCommand('vscode-dev-box-unofficial.openDevBox', async (devBox?: { project: string; userId: string; label: string}) => {
            if (!getSettings().endpoint) {
                const endpoint = await window.showInputBox({
                    prompt: 'Enter the Dev Center endpoint',
                    placeHolder: 'https://GUID-devcenter-DEVCENTER_NAME.REGION.devcenter.azure.com'
                });
                if (!endpoint) {
                    return;
                }
                await client.setEndpoint(endpoint);
            }
            if (!devBox) {
                const devBoxes = new Map<string, { project: string; userId: string; label: string }>();
                for await (const box of client.getDevBoxes()) {
                    if (box.actionState === 'Started') {
                        devBoxes.set(box.name!, {
                            project: box.projectName!,
                            userId: box.user!,
                            label: box.name!
                        });
                    }
                }
                if (devBoxes.size === 0) {
                    window.showInformationMessage('No running Dev Boxes found');
                    return;
                }
                const chosen = await window.showQuickPick([...devBoxes.keys()], {
                    placeHolder: 'Select a Dev Box to open'
                });
                if (!chosen) {
                    return;
                }
                
                devBox = devBoxes.get(chosen) as { project: string; userId: string; label: string };
            }
            const info = await client.getRemoteConnectionInfo(devBox.project, devBox.userId, devBox.label);
            return info.webUrl && env.openExternal(Uri.parse(info.webUrl));
        }),
        commands.registerCommand('vscode-dev-box-unofficial.deleteDevBox', async (devBox: DevBox) => {
            return window.withProgress({ location: ProgressLocation.Notification, title: `Deleting ${devBox.label}...` }, () => {
                return client.deleteDevBox(devBox.project, devBox.userId, devBox.label);
            });
        }),
        commands.registerCommand('vscode-dev-box-unofficial.createDevBox', async () => {
            if (!getSettings().endpoint) {
                const endpoint = await window.showInputBox({
                    prompt: 'Enter the Dev Center endpoint',
                    placeHolder: 'https://GUID-devcenter-DEVCENTER_NAME.REGION.devcenter.azure.com'
                });
                if (!endpoint) {
                    return;
                }
                await client.setEndpoint(endpoint);
            }
            const existingBoxNames = new Array<string>();
            for await (const box of client.getDevBoxes()) {
                existingBoxNames.push(box.name!);
            }

            const devBoxName = await window.showInputBox({
                prompt: 'Enter a name for the Dev Box',
                placeHolder: 'Dev Box Name',
                validateInput: (value) => {
                    if (!value) {
                        return 'Dev Box Name is required';
                    } else {
                        if (existingBoxNames.includes(value)) {
                            return `Dev Box '${value}' already exists`;
                        }
                    }
                    return undefined;
                }
            });
            if (!devBoxName) {
                return;
            }

            // choose a project
            const projects = [];
            for await (const project of client.getProjects()) {
                projects.push(project);
            }
            const projectNames = projects.map((p) => p.name!);
            const projectName = await window.showQuickPick(projectNames, {
                placeHolder: 'Select a project'
            });

            if (!projectName) {
                return;
            }

            // choose a pool
            const pools = await client.getPools(projectName);

            if (pools.length === 0) {
                window.showErrorMessage('No pools found');
                return;
            }

            const poolNames = pools.map((p) => p.name!);
            const poolName = await window.showQuickPick(poolNames, {
                placeHolder: 'Select a pool'
            });

            if (!poolName) {
                return;
            }

            const devBox = await window.withProgress({ location: ProgressLocation.Notification, title: `Creating ${devBoxName}...` }, async () => {
                return client.createDevBox(projectName, devBoxName, poolName);
            });
            return devBox;
        }),
        commands.registerCommand('vscode-dev-box-unofficial.configureDevBoxEndpoint', async () => {
            const endpoint = await window.showInputBox({
                prompt: 'Enter the Dev Center endpoint',
                placeHolder: 'https://GUID-devcenter-DEVCENTER_NAME.REGION.devcenter.azure.com'
            });
            if (endpoint) {
                await client.setEndpoint(endpoint);
            }
        }),
        commands.registerCommand('vscode-dev-box-unofficial.openDevBoxPortal', () => env.openExternal(Uri.parse('https://devbox.microsoft.com')))
    );
}