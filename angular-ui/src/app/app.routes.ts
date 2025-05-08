import { Routes } from '@angular/router';
import { TenComponentComponent } from './route/ten-component/ten-component.component';
import { HomeComponentComponent } from './route/home-component/home-component.component';

export const routes: Routes = [
    { path: '', component: HomeComponentComponent }, // This is the default route
    { path: 'hi', component: TenComponentComponent }, // This is a route to the ten-component
];

//export const routes: Routes = [];