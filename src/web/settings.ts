import { workspace, ConfigurationTarget } from "vscode";

export interface IDevBoxSettings {
    endpoint?: string;
}

function update() {
    const settings = workspace.getConfiguration('devBoxUnofficial');
    return {
        endpoint: settings.get<string>('endpoint')
    };
}

let settings = update();
workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('devBoxUnofficial')) {
        settings = update();
    }
});

export function getSettings() {
    return settings;
}

export function setEndpoint(endpoint: string) {
    const settings = workspace.getConfiguration('devBoxUnofficial');
    return settings.update('endpoint', endpoint, ConfigurationTarget.Global);
}
