import { DEV_CENTER_CLIENT_CREDENTIAL } from "./auth";
import createClient, { AzureDevCenterClient, DevBox, DevBoxOutput, DevCenterListAllDevBoxes200Response, PoolListResultOutput, ProjectListResultOutput, RemoteConnectionOutput } from "@azure-rest/developer-devcenter";
import { getSettings, setEndpoint } from "./settings";
import { Disposable, EventEmitter, workspace } from "vscode";

interface IDevBoxOperationResponse {
    id: string;
    name: string;
    status: string;
    startTime: string;
}

export class DevBoxClient extends Disposable {
    // on did change emitter
    private _onDidChangeDevBox = new EventEmitter<void>();
    readonly onDidChangeDevBox = this._onDidChangeDevBox.event;

    #client: AzureDevCenterClient | undefined;
    constructor() {
        super(() => this.dispose());
        const settings = getSettings();
        if (settings.endpoint) {
            this.#client = createClient(getSettings().endpoint!, DEV_CENTER_CLIENT_CREDENTIAL);
        }
    }

    dispose() {
        this._onDidChangeDevBox.dispose();
    }

    async setEndpoint(endpoint: string) {
        await setEndpoint(endpoint);
        this.#client = createClient(getSettings().endpoint!, DEV_CENTER_CLIENT_CREDENTIAL);
    }

    async getRemoteConnectionInfo(projectName: string, userId: string, devBoxName: string) {
        if (!this.#client) {
            throw new Error('Client not initialized');
        }

        const operation = this.#client.path(
            '/projects/{projectName}/users/{userId}/devboxes/{devBoxName}/remoteConnection',
            projectName,
            userId,
            devBoxName
        );
        const result = await operation.get();
        if (result.status === '200') {
            return result.body as RemoteConnectionOutput;
        }

        throw new Error(`Unexpected response code ${result.status}`);
    }

    async *getDevBoxes(pageSize: number = 100) {
        if (!this.#client) {
            throw new Error('Client not initialized');
        }

        let continuationToken: string | undefined = undefined;
        do {
            const operation = this.#client.path('/devboxes');
            const result = await operation.get({ queryParameters : { '$top': pageSize, '$skiptoken': continuationToken }});
            if (result.status === '200') {
                const devBoxes = (result as DevCenterListAllDevBoxes200Response).body.value;
                for (const devBox of devBoxes) {
                    yield devBox;
                }
                continuationToken = (result as DevCenterListAllDevBoxes200Response).body.nextLink?.split('skiptoken=')[1];
            } else {
                throw new Error(`Unexpected response code ${result.status}`);
            }
        } while (continuationToken);
    }

    async startDevBox(projectName: string, userId: string, devBoxName: string): Promise<IDevBoxOperationResponse> {
        if (!this.#client) {
            throw new Error('Client not initialized');
        }

        const operation = this.#client.path(
            '/projects/{projectName}/users/{userId}/devboxes/{devBoxName}:start',
            projectName,
            userId,
            devBoxName
        );
        const result = await operation.post();
        if (result.status === '202') {
            this._onDidChangeDevBox.fire();
            return result.body as any as IDevBoxOperationResponse;
        }

        throw new Error(`Unexpected response code ${result.status}`);
    }

    async stopDevBox(projectName: string, userId: string, devBoxName: string) {
        if (!this.#client) {
            throw new Error('Client not initialized');
        }

        const operation = this.#client.path(
            '/projects/{projectName}/users/{userId}/devboxes/{devBoxName}:stop',
            projectName,
            userId,
            devBoxName
        );
        const result = await operation.post();
        if (result.status === '202') {
            this._onDidChangeDevBox.fire();
            return result.body as any as IDevBoxOperationResponse;
        }

        throw new Error(`Unexpected response code ${result.status}`);
    }

    async deleteDevBox(projectName: string, userId: string, devBoxName: string) {
        if (!this.#client) {
            throw new Error('Client not initialized');
        }

        const operation = this.#client.path(
            '/projects/{projectName}/users/{userId}/devboxes/{devBoxName}',
            projectName,
            userId,
            devBoxName
        );
        const result = await operation.delete();
        if (result.status === '202') {
            this._onDidChangeDevBox.fire();
            return result.body as any as IDevBoxOperationResponse;
        }

        console.error(result.body);
        throw new Error(`Unexpected response code ${result.status}`);
    }

    async *getProjects(pageSize: number = 100) {
        if (!this.#client) {
            throw new Error('Client not initialized');
        }

        let continuationToken: string | undefined = undefined;
        do {
            const operation = this.#client.path('/projects');
            const result = await operation.get({
                queryParameters: {
                    '$top': pageSize,
                    '$continuationToken': continuationToken
                }
            });
            if (result.status === '200') {
                const projects = result.body as ProjectListResultOutput;
                for (const project of projects.value) {
                    yield project;
                }
                continuationToken = projects.nextLink?.split('$continuationToken=')[1];
            } else {
                throw new Error(`Unexpected response code ${result.status}`);
            }
        } while (continuationToken);
    }

    // todo handle pagination
    async getPools(projectName: string) {
        if (!this.#client) {
            throw new Error('Client not initialized');
        }

        const operation = this.#client.path(
            '/projects/{projectName}/pools',
            projectName
        );
        const result = await operation.get();
        if (result.status === '200') {
            return (result.body as PoolListResultOutput).value;
        }

        throw new Error(`Unexpected response code ${result.status}`);
    }

    async createDevBox(projectName: string, devBoxName: string, poolName: string) {
        if (!this.#client) {
            throw new Error('Client not initialized');
        }

        const operation = this.#client.path(
            '/projects/{projectName}/users/{userId}/devboxes/{devBoxName}',
            projectName,
            'me',
            devBoxName
        );
        const result = await operation.put({
            body: {
                poolName
            }
        });
        if (result.status === '200' || result.status === '201') {
            const output = result.body as DevBoxOutput;
            this._onDidChangeDevBox.fire();
            return output;
        }
        
        console.log(result);
        throw new Error(`Unexpected response code ${result.status}`);
    }
}
