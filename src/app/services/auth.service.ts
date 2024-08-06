
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<any>;

  constructor(private afAuth: AngularFireAuth) {
    this.user$ = this.afAuth.authState.pipe(
      map(user => user ? user : null)
    );
  }

  isLoggedIn(): Observable<boolean> {
    return this.user$.pipe(
      map(user => !!user)
    );
  }
}
