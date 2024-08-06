import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

interface User {
  name: string;
  email: string;
  identificationCode: string;
  registrationDate: Date;
  role: string;
  imageURL?: string;
  history?: Array<{
    action: string;
    product: string;
    lote: string;
    date: firebase.firestore.Timestamp;
  }>;
  uid: string;
}

interface Log {
  action: string;
  productId: string;
  productName: string;
  date: firebase.firestore.Timestamp;
}

interface Product {
  id?: string;
  name: string;
  type: string;
  brand: string;
  description: string;
  stock: number;
  registrationDate: firebase.firestore.Timestamp;
  lastEditDate: firebase.firestore.Timestamp;
  editedBy: string;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  user: User | null = null;
  totalProductsViewed = 0;
  selectedFile: File | null = null;
  defaultImageUrl: string = 'https://firebasestorage.googleapis.com/v0/b/projeto-final-asimov-69208.appspot.com/o/avatar.png?alt=media';
  showModal = false;
  sortCriteria: string = 'date'; 
  sortedHistory: Array<{
    action: string;
    product: string;
    lote: string;
    date: firebase.firestore.Timestamp;
  }> = [];
  isAdminViewingOtherProfile: boolean = false; 

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private storage: AngularFireStorage,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.checkAuthState();
  }

  checkAuthState() {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        const uid = this.route.snapshot.paramMap.get('uid');
        if (uid) {
          this.isAdminViewingOtherProfile = uid !== user.uid;
          this.loadUserProfile(uid);
        } else {
          this.loadUserProfile(user.uid);
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  async loadUserProfile(uid: string): Promise<void> {
    try {
      const doc = await this.db.collection('users').doc(uid).get().toPromise();
      if (doc && doc.exists) {
        const userData = doc.data() as User;
        if (userData) {
          const registrationDate = (userData.registrationDate as unknown as firebase.firestore.Timestamp)?.toDate();
          this.user = {
            name: userData.name || '',
            email: userData.email || '',
            identificationCode: userData.identificationCode || '',
            registrationDate: registrationDate || new Date(),
            role: userData.role || '',
            imageURL: userData.imageURL || this.defaultImageUrl,
            history: [],
            uid: uid
          };
  
          // Load history from StockLog
          const stockLogsSnapshot = await this.db.collection('stockLogs', ref => ref.where('user', '==', userData.email)).get().toPromise();
          if (stockLogsSnapshot) {
            for (const log of stockLogsSnapshot.docs) {
              const logData = log.data() as Log;
              const productDoc = await this.db.collection('products').doc(logData.productId).get().toPromise();
              const productName = productDoc && productDoc.exists ? (productDoc.data() as Product).name : 'Unknown';
              this.user!.history!.push({
                action: logData.action,
                product: productName,
                lote: logData.productId,
                date: logData.date
              });
            }
          }
  
          // Load history from ProductEdits
          const editsSnapshot = await this.db.collection('productEdits', ref => ref.where('editedBy', '==', userData.email)).get().toPromise();
          if (editsSnapshot) {
            editsSnapshot.forEach(editDoc => {
              const editData = editDoc.data() as {
                action: string;
                product: string;
                lote: string;
                date: firebase.firestore.Timestamp;
              };
              this.user!.history!.push(editData);
            });
          }
  
          if (this.user!.history) {
            this.totalProductsViewed = this.user!.history.length;
            this.sortedHistory = this.sortHistory(this.user!.history);
          }
        } else {
          console.log("User data not found in database.");
        }
      } else {
        console.log("User document does not exist.");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }
  
  

  sortHistory(history: Array<{ action: string; product: string; lote: string; date: firebase.firestore.Timestamp }>): Array<{ action: string; product: string; lote: string; date: firebase.firestore.Timestamp }> {
    return history.sort((a, b) => {
      if (this.sortCriteria === 'date') {
        return b.date.toDate().getTime() - a.date.toDate().getTime(); 
      } else {
        return a.date.toDate().getTime() - b.date.toDate().getTime();
      }
    });
  }

  onSortChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.sortCriteria = selectElement.value;
    if (this.user?.history) {
      this.sortedHistory = this.sortHistory(this.user.history);
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSaveProfile() {
    if (this.user && this.selectedFile) {
      const uniqueFileName = `${Date.now()}_${this.selectedFile.name}`;
      const filePath = `profileImages/${this.user.uid}/${uniqueFileName}`;
      const fileRef = this.storage.ref(filePath);

      const task = this.storage.upload(filePath, this.selectedFile);
      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(url => {
            if (this.user) {
              this.user.imageURL = url;
              this.db.collection('users').doc(this.user.uid).update({
                imageURL: url
              }).then(() => {
                alert('Foto de perfil atualizada com sucesso');
                this.showModal = false;
              }).catch(error => {
                alert('Erro ao atualizar foto de perfil: ' + error.message);
              });
            } else {
              alert('Erro: Usuário não carregado.');
            }
          }, error => {
            console.error("Error getting download URL:", error);
          });
        })
      ).subscribe({
        error: error => {
          console.error("Error during file upload:", error);
        }
      });
    } else {
      alert('Por favor, selecione uma foto de perfil.');
    }
  }

  showFileInputModal() {
    this.showModal = true;
  }

  hideFileInputModal() {
    this.showModal = false;
  }

  logout() {
    this.afAuth.signOut().then(() => this.router.navigate(['/login']));
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  goBack() {
    this.router.navigate(['/usuarios']);
  }
}
