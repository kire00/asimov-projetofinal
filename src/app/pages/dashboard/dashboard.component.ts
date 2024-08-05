import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  constructor(private afAuth: AngularFireAuth, private router: Router) { }

  logout() {
    this.afAuth.signOut().then(() => this.router.navigate(['/login']));
  }
}
