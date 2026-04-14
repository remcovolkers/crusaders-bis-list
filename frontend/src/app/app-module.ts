import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { App } from './app';
import { appRoutes } from './app.routes';
import { API_URL } from '@crusaders-bis-list/frontend-auth';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    RouterModule.forRoot(appRoutes),
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: API_URL, useValue: environment.apiUrl },
  ],
  bootstrap: [App],
})
export class AppModule {}
