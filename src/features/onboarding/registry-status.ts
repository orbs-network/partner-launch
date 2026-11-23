/** Local activation placeholder until the partner API is connected. */
export type PartnerActivationStatus = "pending" | "active" | "unconfirmed";

export async function mockActivationStatus(partnerId: string): Promise<PartnerActivationStatus> {
  if (!partnerId.trim()) throw new Error("Status unavailable");
  return "unconfirmed";
}
