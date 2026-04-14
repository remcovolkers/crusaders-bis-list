import { createAction, props } from '@ngrx/store';
import { AuthUser } from './auth.state';

export const loginWithGoogle = createAction('[Auth] Login With Google');
export const loginSuccess = createAction('[Auth] Login Success', props<{ user: AuthUser; token: string }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());
export const logout = createAction('[Auth] Logout');
export const checkAuthToken = createAction('[Auth] Check Token');
