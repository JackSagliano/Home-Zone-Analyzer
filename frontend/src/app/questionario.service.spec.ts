import { TestBed } from '@angular/core/testing';

import { QuestionarioService } from './questionario.service';

describe('QuestionarioService', () => {
  let service: QuestionarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestionarioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
