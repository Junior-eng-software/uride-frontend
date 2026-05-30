import axiosClient from '../api/axiosClient';

export interface CurrentUser {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    career?: string | null;
    referenceZone?: string | null;
}

export async function getUserMe(): Promise<CurrentUser> {
    const response = await axiosClient.get<CurrentUser>('/Users/me');
    return response.data;
}
