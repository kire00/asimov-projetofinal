import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private afAuth: AngularFireAuth, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedCredentials = localStorage.getItem('rememberMe');
      if (savedCredentials) {
        const { email, password } = JSON.parse(savedCredentials);
        this.loginForm.setValue({ email, password, rememberMe: true });
      }
    }
  }

  onLogin() {
    const { email, password, rememberMe } = this.loginForm.value;
    this.afAuth.signInWithEmailAndPassword(email, password)
      .then(() => {
        if (rememberMe) {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('rememberMe', JSON.stringify({ email, password }));
          }
        } else {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('rememberMe');
          }
        }
        alert('Sucesso no Login');
        this.router.navigate(['/dashboard']);
      })
      .catch(error => {
        alert('Login falhou: ' + error.message);
      });
  }
}
