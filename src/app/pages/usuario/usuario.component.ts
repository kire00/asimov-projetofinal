import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

interface User {
  uid: string;
  name: string;
  email: string;
  identificationCode: string;
  registrationDate: any; 
  role: string;
  imageURL?: string;
}

@Component({
  selector: 'app-usuario',
  templateUrl: './usuario.component.html',
  styleUrls: ['./usuario.component.scss']
})
export class UsuarioComponent implements OnInit {
  users: User[] = [];
  currentUser: User | null = null;
  currentPage: number = 0;
  usersPerPage: number = 3;

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.db.collection('users').doc(user.uid).get().subscribe(doc => {
          if (doc.exists) {
            this.currentUser = doc.data() as User;
            if (this.currentUser?.role !== 'admin') {
              console.error("Acesso negado: Apenas administradores podem acessar a página de usuários.");
              this.router.navigate(['/dashboard']);
            } else {
              this.loadUsers();
            }
          }
        });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  loadUsers(): void {
    this.db.collection('users').snapshotChanges().subscribe(usersSnapshot => {
      this.users = usersSnapshot.map(userSnap => {
        const userData = userSnap.payload.doc.data() as User;
        userData.uid = userSnap.payload.doc.id;
        userData.registrationDate = userData.registrationDate?.toDate ? userData.registrationDate.toDate() : userData.registrationDate;
        return userData;
      });
      this.users.sort((a, b) => a.role === 'admin' ? -1 : 1); 
    });
  }

  deleteUser(userId: string) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      this.db.collection('users').doc(userId).delete().then(() => {
        alert('Usuário excluído com sucesso');
      }).catch(error => {
        alert('Erro ao excluir usuário: ' + error.message);
      });
    }
  }

  viewUserProfile(userId: string) {
    this.router.navigate(['/perfil', userId]);
  }

  logout() {
    this.afAuth.signOut().then(() => this.router.navigate(['/login']));
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  nextPage() {
    if (this.currentPage < Math.ceil(this.users.length / this.usersPerPage) - 1) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.users.length / this.usersPerPage);
  }
}
