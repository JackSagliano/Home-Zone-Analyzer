import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login-page/login-page.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './auth.guard';
import { RegisterComponent } from './register/register.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { QuestionarioComponent } from './questionario/questionario.component';
@NgModule({
  imports: [RouterModule.forRoot([
    { path: '', redirectTo: '/home', pathMatch: 'full' },
  {  path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'accedi', component: LoginComponent },
  {path: 'registrati', component: RegisterComponent},
  { path: 'welcome', component: WelcomeComponent, canActivate: [AuthGuard] }, // Aggiungi la nuova rotta
   {path: 'questionario', component: QuestionarioComponent, canActivate: [AuthGuard]}
], {useHash : true }
  )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
