import { cookies } from "next/headers";

/** True when this browser holds a customer session. The token itself stays httpOnly. */
export const isSignedIn = async () => Boolean((await cookies()).get("customer_token")?.value);
