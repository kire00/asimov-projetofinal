import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;

  constructor(private fb: FormBuilder, private afAuth: AngularFireAuth) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onForgotPassword() {
    const { email } = this.forgotPasswordForm.value;
    this.afAuth.sendPasswordResetEmail(email)
      .then(() => {
        alert('Password reset link sent!');
      })
      .catch(error => {
        alert('Failed to send reset link: ' + error.message);
      });
  }
}
