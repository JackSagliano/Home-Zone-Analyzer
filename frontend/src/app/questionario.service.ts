import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class QuestionarioService {
  private questionarioData: any;

  setQuestionarioData(data: any) {
    this.questionarioData = data;
  }

  getQuestionarioData() {
    return this.questionarioData;
  }
  
}
