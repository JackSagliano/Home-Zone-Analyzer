import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuestionarioService } from '../questionario.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-questionario',
  templateUrl: './questionario.component.html',
  styleUrls: ['./questionario.component.css']
})
export class QuestionarioComponent implements OnInit {
  questionarioForm: FormGroup;
  questions = [
    //vicinanza
    { domanda: 'Quanto è importante per te la presenza di cinema nel vicinato?', tipo: 'cinema', value: 0 },
    { domanda: 'Quanto è importante per te la presenza di impianti sportivi nel vicinato?', tipo: 'impianti sportivi', value: 0 },
    { domanda: 'Quanto è importante per te la presenza di stazioni ferroviarie nel vicinato?', tipo: 'stazioni ferroviarie', value: 0 },
    { domanda: 'Quanto è importante per te la presenza di ospedali nel vicinato?', tipo: 'ospedali', value: 0 },
    { domanda: 'Quanto è importante per te la presenza di biblioteche nel vicinato?', tipo: 'biblioteche', value: 0 },
    //densità
    { domanda: 'Quanto è importante per te la presenza di almeno due aree verdi nel vicinato?', tipo: 'aree verdi', value: 0 },
    { domanda: 'Quanto è importante per te la presenza di almeno due teatri nel vicinato?', tipo: 'teatri', value: 0 },
    { domanda: 'Quanto è importante per te la presenza di almeno due musei nel vicinato?', tipo: 'musei', value: 0 },
    { domanda: 'Quanto è importante per te la presenza di almeno due fermate autobus nelle vicinanze?', tipo: 'fermate autobus', value: 0 },
    { domanda: 'Quanto è importante per te la presenza di almeno due reti wifi gratuite nelle vicinanze?', tipo: 'wifi gratuito', value: 0 }
  ];

Math = Math
  constructor(private fb: FormBuilder, private questionarioService: QuestionarioService, private router: Router) {
    this.questionarioForm = this.fb.group({});
    this.questions.forEach(question => {
      this.questionarioForm.addControl(question.tipo, this.fb.control(question.value));
    });
     console.log(this.questionarioForm)
  }
  ngOnInit(): void {
    

  }


  updateRangeValue(event: any, index: number) {
    const value = event.target.value;
    this.questions[index].value = value;
  }
  onSubmit() {
    const isValid = this.questions.some(question => question.value > 0);
    if(isValid){
      this.questionarioService.setQuestionarioData(this.questions);
      if(localStorage.getItem('questionarioData')){
        localStorage.removeItem('questionarioData')
      }
      localStorage.setItem('questionarioData', JSON.stringify(this.questions)); // Salva le domande in localStorage
      console.log(this.questionarioForm.value)
      this.router.navigate(['/home']);
    } else {
      document.getElementById('error-popup')!.style.display = 'block';
      setTimeout(() => {
        document.getElementById('error-popup')!.style.display = 'none';
      }, 1000);
      
    }
    }
    
}
