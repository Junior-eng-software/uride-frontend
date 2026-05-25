import axiosClient from '../api/axiosClient';

export interface CurrentUser {
    id: string;
    fullName: string;
    email: string;
}

export async function getUserMe(): Promise<CurrentUser> {
    const response = await axiosClient.get<CurrentUser>('/Users/me');
    return response.data;
}
