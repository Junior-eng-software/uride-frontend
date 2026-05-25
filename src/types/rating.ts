import type { Ride } from './rides';

export interface RatingResponse {
  id: string;
  rideId: string;
  raterId: string;
  raterName: string;
  rateeId: string;
  rateeName: string;
  score: number;
  comment: string;
  createdAt: string;
}

export interface UserRatingSummaryResponse {
  userId: string;
  averageScore: number;
  totalRatings: number;
  ratings: RatingResponse[];
}

export interface RatingNavigationState {
  ride: Ride;
  rateeId: string;
  rateeName: string;
  rateeRole: 'driver' | 'passenger';
}