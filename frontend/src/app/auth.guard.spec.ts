import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authGuard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  it('should return true for a logged-in user', (done: DoneFn) => {
    authService.isLoggedIn.and.returnValue(of(true));
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    authGuard.canActivate(route, state).subscribe((result) => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should navigate to /accedi for a logged-out user', (done: DoneFn) => {
    authService.isLoggedIn.and.returnValue(of(false));
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    authGuard.canActivate(route, state).subscribe((result) => {
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/accedi']);
      done();
    });
  });
});
