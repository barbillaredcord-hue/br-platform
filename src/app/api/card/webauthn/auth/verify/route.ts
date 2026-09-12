import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import {
  clearAuthenticationChallenge,
  getAuthenticationChallenge,
  getCredential,
  saveCredential,
} from "@/lib/card/webauthn-store";

export async function POST(request: Request) {
  const challenge = getAuthenticationChallenge();
  const credential = getCredential();

  if (!challenge || !credential) {
    return Response.json(
      {
        verified: false,
        error: "Authentication state not found",
      },
      { status: 400 }
    );
  }

  const body = await request.json();

  const rpID = process.env.BR_CARD_RP_ID || "localhost";
  const expectedOrigin =
    process.env.BR_CARD_ORIGIN || "http://localhost:3000";

  try {
    const publicKey = new Uint8Array(
      credential.publicKey.buffer.slice(
        credential.publicKey.byteOffset,
        credential.publicKey.byteOffset + credential.publicKey.byteLength
      ) as ArrayBuffer
    );

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: credential.id,
        publicKey,
        counter: credential.counter,
      },
      requireUserVerification: true,
    });

    clearAuthenticationChallenge();

    if (!verification.verified) {
      return Response.json(
        {
          verified: false,
          error: "Authentication failed",
        },
        { status: 401 }
      );
    }

    saveCredential({
      ...credential,
      counter: verification.authenticationInfo.newCounter,
    });

    return Response.json({
      verified: true,
    });
  } catch (error) {
    clearAuthenticationChallenge();

    return Response.json(
      {
        verified: false,
        error:
          error instanceof Error
            ? error.message
            : "Authentication failed",
      },
      { status: 400 }
    );
  }
}
