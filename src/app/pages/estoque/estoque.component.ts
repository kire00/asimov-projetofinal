import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import firebase from 'firebase/compat/app';

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

interface Stock {
  productId: string;
  batch: string;
  quantity: number;
  registrationDate: firebase.firestore.Timestamp;
}

interface StockLog {
  productId: string | undefined;
  action: string;
  quantity: number;
  date: firebase.firestore.Timestamp;
  user: string;
}

@Component({
  selector: 'app-estoque',
  templateUrl: './estoque.component.html',
  styleUrls: ['./estoque.component.scss']
})
export class EstoqueComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProducts: { [key: string]: number } = {};
  filterForm: FormGroup;
  sortCriteria: string = 'name'; // default sort criteria

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      registrationDate: [''],
      type: [''],
      lote: ['']
    });
  }

  ngOnInit(): void {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.db.collection('users').doc(user.uid).get().subscribe(doc => {
          const userData = doc.data() as { role?: string };
          if (userData && (userData.role === 'estoquista' || userData.role === 'admin')) {
            this.loadProducts();
            this.filterForm.valueChanges.subscribe(() => {
              this.applyFilters();
            });
          } else {
            this.router.navigate(['/']);
            console.error('Acesso negado. Usuário não autorizado.');
          }
        });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  async loadProducts() {
    const productsSnapshot = await this.db.collection('products').get().toPromise();
    if (productsSnapshot && productsSnapshot.docs) {
      this.products = await Promise.all(productsSnapshot.docs.map(async productSnap => {
        const productData = productSnap.data() as Product;
        productData.id = productSnap.id;

        // Buscar quantidade de estoque da coleção 'stock'
        const stockSnapshot = await this.db.collection('stock', ref => ref.where('productName', '==', productData.name)).get().toPromise();
        if (stockSnapshot && stockSnapshot.docs) {
          productData.stock = stockSnapshot.docs.reduce((acc, doc) => acc + (doc.data() as Stock).quantity, 0);
        } else {
          productData.stock = 0;
        }

        return productData;
      }));
      this.applyFilters();
    } else {
      console.error('Erro ao carregar produtos. productsSnapshot é undefined.');
    }
  }

  applyFilters() {
    const { name, registrationDate, type, lote } = this.filterForm.value;
    this.filteredProducts = this.products.filter(product => {
      const matchesName = name ? product.name.toLowerCase().includes(name.toLowerCase()) : true;
      const matchesDate = registrationDate ? this.isSameDay(product.registrationDate.toDate(), new Date(registrationDate)) : true;
      const matchesType = type ? product.type === type : true;
      const matchesLote = lote ? product.id?.toLowerCase().includes(lote.toLowerCase()) : true;
      return matchesName && matchesDate && matchesType && matchesLote;
    });
    this.sortProducts();
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
           date1.getUTCMonth() === date2.getUTCMonth() &&
           date1.getUTCDate() === date2.getUTCDate();
  }

  sortProducts() {
    if (this.sortCriteria === 'name') {
      this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortCriteria === 'nameDesc') {
      this.filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
    } else if (this.sortCriteria === 'registrationDate') {
      this.filteredProducts.sort((a, b) => b.registrationDate.toDate().getTime() - a.registrationDate.toDate().getTime());
    } else if (this.sortCriteria === 'registrationDateAsc') {
      this.filteredProducts.sort((a, b) => a.registrationDate.toDate().getTime() - b.registrationDate.toDate().getTime());
    }
  }

  onSortChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.setSortCriteria(selectElement.value);
  }

  setSortCriteria(criteria: string) {
    this.sortCriteria = criteria;
    this.sortProducts();
  }

  toggleProductSelection(productId: string) {
    if (this.selectedProducts[productId] !== undefined) {
      delete this.selectedProducts[productId];
    } else {
      this.selectedProducts[productId] = 0;
    }
  }

  handleStockChange(productId: string, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStock = parseInt(inputElement.value, 10);
    if (!isNaN(newStock) && newStock >= 0) {
      this.selectedProducts[productId] = newStock;
    } else {
      alert('A quantidade de estoque deve ser um número não negativo');
    }
  }

  async efetuarBaixa() {
    const currentUser = this.afAuth.currentUser;
    currentUser.then(user => {
      if (user) {
        const batch = this.db.firestore.batch();
        const now = firebase.firestore.Timestamp.fromDate(new Date());
        const userEmail = user.email || 'Unknown';

        const promises = Object.keys(this.selectedProducts).map(async (productId) => {
          const decreaseAmount = this.selectedProducts[productId];
          const productRef = this.db.collection('products').doc(productId).ref;

          // Obtenha o produto atual
          const productDoc = await productRef.get();
          if (productDoc.exists) {
            const productData = productDoc.data() as Product;
            const currentStock = productData.stock;

            // Buscar estoque da coleção 'stock'
            const stockSnapshot = await this.db.collection('stock', ref => ref.where('productName', '==', productData.name)).get().toPromise();
            if (stockSnapshot && stockSnapshot.docs.length > 0) {
              const stockData = stockSnapshot.docs.map(doc => doc.data() as Stock);
              const totalStock = stockData.reduce((acc, stock) => acc + stock.quantity, 0);

              // Verifica se o estoque é suficiente para a baixa
              if (totalStock >= decreaseAmount) {
                let remainingAmount = decreaseAmount;

                for (const stockDoc of stockSnapshot.docs) {
                  const stockRef = stockDoc.ref;
                  const stockItem = stockDoc.data() as Stock;

                  if (remainingAmount > 0) {
                    const availableStock = stockItem.quantity;

                    if (availableStock <= remainingAmount) {
                      batch.delete(stockRef);
                      remainingAmount -= availableStock;
                    } else {
                      batch.update(stockRef, { quantity: availableStock - remainingAmount });
                      remainingAmount = 0;
                    }
                  } else {
                    break;
                  }
                }

                batch.update(productRef, { stock: totalStock - decreaseAmount, lastEditDate: now, editedBy: userEmail });

                const log: StockLog = {
                  productId,
                  action: 'Baixa',
                  quantity: decreaseAmount,
                  date: now,
                  user: userEmail
                };
                const logRef = this.db.collection('stockLogs').doc().ref;
                batch.set(logRef, log);

                // Adiciona o registro de baixa no histórico do usuário
                const userRef = this.db.collection('users').doc(user.uid).ref;
                batch.update(userRef, {
                  history: firebase.firestore.FieldValue.arrayUnion({
                    action: 'Baixa',
                    product: productData.name,
                    lote: productId,
                    date: now.toDate() // Certifique-se de converter para Date
                  })
                });
              } else {
                alert(`Estoque insuficiente para o produto ${productData.name}`);
              }
            } else {
              alert(`Estoque não encontrado para o produto ${productData.name}`);
            }
          } else {
            alert('Produto não encontrado');
          }
        });

        Promise.all(promises).then(() => {
          batch.commit().then(() => {
            alert('Baixa de produtos efetuada com sucesso');
            this.selectedProducts = {};
            this.loadProducts(); // Reload products to update the stock
          }).catch(error => {
            alert('Erro ao efetuar baixa: ' + error.message);
          });
        });
      }
    });
  }

  getSelectedProductCount(): number {
    return Object.keys(this.selectedProducts).length;
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
