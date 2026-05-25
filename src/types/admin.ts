export type ReportStatus = 'Pending' | 'Resolved' | 'Dismissed';

export interface AdminReport {
    id: string;
    reporterId: string;
    reporterName: string;
    reportedId: string;
    reportedName: string;
    rideId: string | null;
    reason: string;
    evidenceUrl: string | null;
    status: ReportStatus;
    createdAt: string;
    updatedAt: string;
}

export interface SuspendUserRequest {
    isSuspended: boolean;
}
