import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectCurrentUser = createSelector(selectAuthState, (s) => s.user);
export const selectToken = createSelector(selectAuthState, (s) => s.token);
export const selectIsAuthenticated = createSelector(selectAuthState, (s) => !!s.user && !!s.token);
export const selectIsAdmin = createSelector(
  selectCurrentUser,
  (user) => user?.roles?.includes('admin' as any) ?? false,
);
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.loading);
