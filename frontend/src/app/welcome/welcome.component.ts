import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  showButton = false;
  fullTextDisplayed = false;
  text = "Ciao! Benvenuto su Home Zone Analyzer. Prima di procedere, ti chiediamo di compilare il questionario. Ci permetterà di capire le tue preferenze riguardo alla presenza di punti di interesse nel vicinato del tuo futuro immobile. Premi il pulsante qui sotto per iniziare!";
  element: HTMLElement | null = null;
  timeout: any;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.element = document.getElementById('speechText');
    this.typeText();
  }

  startQuestionnaire() {
    this.router.navigate(['/questionario']);
  }

  typeText() {
    let index = 0;

    const type = () => {
      if (this.element && index < this.text.length && !this.fullTextDisplayed) {
        this.element.innerHTML += this.text.charAt(index);
        index++;
        this.timeout = setTimeout(type, 50); // Velocità di scrittura (50ms per carattere)
      } else {
        this.showButton = true; // Mostra il bottone alla fine del testo
      }
    }

    type();
  }

  showFullText() {
    if (this.element) {
      clearTimeout(this.timeout); // Ferma l'effetto di scrittura
      this.element.innerHTML = this.text; // Mostra tutto il testo
      this.showButton = true; // Mostra il bottone
      this.fullTextDisplayed = true; // Impedisce ulteriori scritture
    }
  }
}
