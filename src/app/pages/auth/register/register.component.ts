import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Router } from '@angular/router';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  passwordForm: FormGroup;
  step: number = 1;
  defaultImageUrl: string = 'https://firebasestorage.googleapis.com/v0/b/projeto-final-asimov-69208.appspot.com/o/avatar.png?alt=media'; 

  constructor(
    private fb: FormBuilder,
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private storage: AngularFireStorage,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      identificationCode: ['', Validators.required],
      role: ['', Validators.required]
    });

    this.passwordForm = this.fb.group({
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  nextStep() {
    if (this.registerForm.valid) {
      const identificationCode = this.registerForm.value.identificationCode;

      this.db.collection('users', ref => ref.where('identificationCode', '==', identificationCode))
        .get()
        .subscribe(snapshot => {
          if (snapshot.empty) {
            this.step = 2;
          } else {
            alert('O Código de identificação já está em uso.');
          }
        });
    }
  }

  onRegister() {
    if (this.passwordForm.valid) {
      const { name, email, identificationCode, role } = this.registerForm.value;
      const { password, confirmPassword } = this.passwordForm.value;

      if (password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
      }

      this.afAuth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          if (user) {
            // Pega o UID do usuário
            const uid = user.uid;
            const registrationDate = firebase.firestore.Timestamp.fromDate(new Date());

            // Salva os dados do usuário no Firestore, incluindo a URL da imagem padrão e a data de registro
            this.db.collection('users').doc(uid).set({
              name: name,
              email: email,
              identificationCode: identificationCode,
              role: role,
              uid: uid,
              imageURL: this.defaultImageUrl,
              registrationDate: registrationDate
            }).then(() => {
              alert('Cadastro realizado com sucesso');
              this.router.navigate(['/']);
            });
          }
        })
        .catch(error => {
          alert('Falha no cadastro: ' + error.message);
        });
    }
  }
}
