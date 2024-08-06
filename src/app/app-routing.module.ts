import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login.component';
import { ForgotPasswordComponent } from './pages/auth/forgot-password/forgot-password.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { UsuarioComponent } from './pages/usuario/usuario.component';
import { ProdutosComponent } from './pages/produtos/produtos.component';
import { EstoqueComponent } from './pages/estoque/estoque.component';
import { RegistroBaixasComponent } from './pages/registro-baixas/registro-baixas.component';
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
  { path: 'perfil/:uid', component: PerfilComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

