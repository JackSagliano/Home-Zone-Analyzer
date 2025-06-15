import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  public username: string = '';
  public password: string = '';
  public messaggio_errore : any;
  constructor(private authService: AuthService, private router: Router) {}

  registrati() {
    if(this.username == '' || this.password == ''){
      this.messaggio_errore = 'Completa i campi username e password';
      document.getElementById('error-popup')!.style.display = 'block';
  setTimeout(() => {
    document.getElementById('error-popup')!.style.display = 'none';
  }, 1200);
    } else {
    this.authService.register(this.username, this.password).subscribe(
      () => {
        this.router.navigate(['/accedi']);
      },
      (error:any) => {
        if (error.status === 400) {
          this.messaggio_errore = 'Username già in uso. Per favore, scegline un altro.';
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
          this.messaggio_errore = 'Registrazione fallita. Per favore, riprova.';
          document.getElementById('error-popup')!.style.display = 'block';
      setTimeout(() => {
        document.getElementById('error-popup')!.style.display = 'none';
      }, 1200);
        }
      }
    );
  }
}
}