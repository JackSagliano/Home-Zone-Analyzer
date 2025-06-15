import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginComponent implements OnInit{
  public username: string = '';
  public password: string = '';
  public messaggio_errore : any;
  constructor(private authService: AuthService, private router: Router) {}
  ngOnInit(): void {
    
  }

  accedi() {
    if(this.username == '' || this.password == ''){
      this.messaggio_errore = 'Completa i campi username e password';
          document.getElementById('error-popup')!.style.display = 'block';
          setTimeout(() => {
            document.getElementById('error-popup')!.style.display = 'none';
          }, 1200);
    } else {
    this.authService.login(this.username, this.password).subscribe(
      response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('username', this.username)
        this.router.navigate(['/welcome']);
      },
      error => {
        if (error.status === 401) {
          this.messaggio_errore = 'Credenziali errate. Per favore, riprova.';
          document.getElementById('error-popup')!.style.display = 'block';
          setTimeout(() => {
            document.getElementById('error-popup')!.style.display = 'none';
          }, 1200);
        } else if (error.status === 500) {
          this.messaggio_errore = 'Errore del server. Per favore, riprova più tardi.';
          document.getElementById('error-popup')!.style.display = 'block';
          setTimeout(() => {
            document.getElementById('error-popup')!.style.display = 'none';
          }, 1200);
        } else {
          this.messaggio_errore = 'Login fallito. Per favore, riprova.';
          document.getElementById('error-popup')!.style.display = 'block';
          setTimeout(() => {
            document.getElementById('error-popup')!.style.display = 'none';
          }, 1200);
        }
        console.error('Login failed', error);
      
      }
    );
  }
  }
}