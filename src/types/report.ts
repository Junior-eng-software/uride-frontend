export interface CreateReportPayload {
    reportedId: string;
    rideId: string;
    reason: string;
    evidenceUrl?: string;
}