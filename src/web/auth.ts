import { AuthenticationSession, authentication } from "vscode";

const provider = 'microsoft';
const scopes = ['https://devcenter.azure.com/.default'];

export async function getAuth(): Promise<AuthenticationSession> {
    return await authentication.getSession(provider, scopes, { createIfNone: true });
}

function base64Decode(text: string): string {
	// modification of https://stackoverflow.com/a/38552302
	const replacedCharacters = text.replace(/-/g, '+').replace(/_/g, '/');
	const decodedText = decodeURIComponent(atob(replacedCharacters).split('').map(function (c) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	}).join(''));
	return decodedText;
}

export const DEV_CENTER_CLIENT_CREDENTIAL = {
    async getToken() {
        const auth = await getAuth();
        // crack open the JWT auth token to get expiration time
        let expiresAt: number;
        try {
            const claims = JSON.parse(base64Decode(auth.accessToken.split('.')[1]));
            expiresAt = claims.exp;
        } catch (e) {
            // try the id token
            const claims = JSON.parse(base64Decode((auth as any).idToken.split('.')[1]));
            expiresAt = claims.exp;
        }

        return {
            token: auth.accessToken,
            expiresOnTimestamp: expiresAt
        };
    }
};
