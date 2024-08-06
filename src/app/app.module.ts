import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from '../environments/environment';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { ForgotPasswordComponent } from './pages/auth/forgot-password/forgot-password.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EstoqueComponent } from './pages/estoque/estoque.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { RegistroBaixasComponent } from './pages/registro-baixas/registro-baixas.component';
import { UsuarioComponent } from './pages/usuario/usuario.component';
import { AuthGuard } from './guards/auth.guard';
import { RedirectGuard } from './guards/redirect.guard';

const appRoutes: Routes = [
  { path: '', component: HomeComponent, canActivate: [RedirectGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'home', component: HomeComponent },
  { path: 'perfil', component: PerfilComponent },
  { path: 'usuarios', component: UsuarioComponent },
  { path: 'produtos', component: ProdutosComponent },
  { path: 'estoque', component: EstoqueComponent },
  { path: 'registros', component: RegistroBaixasComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    ForgotPasswordComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    DashboardComponent,
    EstoqueComponent,
    PerfilComponent,
    ProdutosComponent,
    RegistroBaixasComponent,
    UsuarioComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    provideClientHydration(),
    provideFirebaseApp(() => initializeApp({"projectId":"projeto-final-asimov-69208","appId":"1:76072453337:web:b46ef9cf6d10a4d89deac8","storageBucket":"projeto-final-asimov-69208.appspot.com","apiKey":"AIzaSyBehNXOucBxbn7KzSKNFMU3FtULGRRVNvk","authDomain":"projeto-final-asimov-69208.firebaseapp.com","messagingSenderId": "76072453337"})),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
