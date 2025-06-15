import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';  // Importa FormsModule
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './login-page/login-page.component';
import { HomeComponent } from './home/home.component';  // Importa HttpClientModule
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AppRoutingModule } from './app-routing.module';
import { RegisterComponent } from './register/register.component';
import { QuestionarioComponent } from './questionario/questionario.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { ReactiveFormsModule } from '@angular/forms'; // Importa ReactiveFormsModule
import { QuestionarioService } from './questionario.service';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    RegisterComponent,
    QuestionarioComponent,
    WelcomeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,  // Aggiungi FormsModule qui
    HttpClientModule,  // Aggiungi HttpClientModule qui
    AppRoutingModule,
    RouterModule,
    ReactiveFormsModule
  ],
  providers: [AuthGuard, AuthService, QuestionarioService],
  bootstrap: [AppComponent]
})
export class AppModule { }

