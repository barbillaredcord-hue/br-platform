import { verifyRegistrationResponse } from "@simplewebauthn/server";
import {
  clearRegistrationChallenge,
  getRegistrationChallenge,
  saveCredential,
} from "@/lib/card/webauthn-store";

export async function POST(request: Request) {
  const challenge = getRegistrationChallenge();

  if (!challenge) {
    return Response.json(
      { verified: false, error: "No registration challenge found" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const rpID = process.env.BR_CARD_RP_ID || "localhost";
  const expectedOrigin =
    process.env.BR_CARD_ORIGIN || "http://localhost:3000";

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    clearRegistrationChallenge();

    if (!verification.verified || !verification.registrationInfo) {
      return Response.json(
        { verified: false, error: "Registration verification failed" },
        { status: 400 }
      );
    }

    const { credential } = verification.registrationInfo;

    saveCredential({
      id: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
    });

    return Response.json({
      verified: true,
      credentialId: credential.id,
    });
  } catch (error) {
    clearRegistrationChallenge();

    return Response.json(
      {
        verified: false,
        error:
          error instanceof Error
            ? error.message
            : "Verification failed",
      },
      { status: 400 }
    );
  }
}

