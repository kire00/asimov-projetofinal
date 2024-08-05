import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-produtos',
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.scss']
})
export class ProdutosComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  filterForm: FormGroup;
  productForm: FormGroup;
  showModal: boolean = false;
  showOptionsModal: boolean = false;
  editMode: boolean = false;
  currentProductId: string | null = null;
  selectedProduct: Product | null = null;
  sortCriteria: string = 'name';

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      registrationDate: [''],
      type: ['']
    });

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      brand: ['', Validators.required],
      description: ['', Validators.required],
      registrationDate: [{ value: new Date(), disabled: true }],
      lastEditDate: [{ value: new Date(), disabled: true }],
      editedBy: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  async loadProducts() {
    const productsSnapshot = await this.db.collection('products').get().toPromise();
    if (productsSnapshot) {
      this.products = await Promise.all(productsSnapshot.docs.map(async productSnap => {
        const productData = productSnap.data() as Product;
        productData.id = productSnap.id;

        const stockSnapshot = await this.db.collection('stock', ref => ref.where('productName', '==', productData.name)).get().toPromise();
        if (stockSnapshot && !stockSnapshot.empty) {
          productData.stock = stockSnapshot.docs.reduce((acc, doc) => {
            const data = doc.data() as { quantity: number };
            return acc + data.quantity;
          }, 0);
        } else {
          productData.stock = 0;
        }

        return productData;
      }));
      this.applyFilters();
    }
  }

  applyFilters() {
    const { name, registrationDate, type } = this.filterForm.value;
    this.filteredProducts = this.products.filter(product => {
      const matchesName = name ? product.name.toLowerCase().includes(name.toLowerCase()) : true;
      const matchesDate = registrationDate ? new Date(product.registrationDate.seconds * 1000).toISOString().split('T')[0] === registrationDate : true;
      const matchesType = type ? product.type === type : true;
      return matchesName && matchesDate && matchesType;
    });
    this.sortProducts();
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

  editProduct(product: Product | null) {
    if (product) {
      this.editMode = true;
      this.currentProductId = product.id!;
      this.productForm.patchValue({
        name: product.name,
        type: product.type,
        brand: product.brand,
        description: product.description,
        registrationDate: product.registrationDate.toDate().toISOString().split('T')[0],
        lastEditDate: product.lastEditDate.toDate().toISOString().split('T')[0],
        editedBy: product.editedBy
      });
      this.showModal = true;
      this.closeOptionsModal(); // Fechar o modal de opções ao editar
    }
  }

  updateProduct() {
    if (this.productForm.valid && this.currentProductId) {
      const currentUser = this.afAuth.currentUser;
      currentUser.then(user => {
        const updatedProduct = {
          ...this.productForm.value,
          lastEditDate: firebase.firestore.Timestamp.fromDate(new Date()),
          editedBy: user?.email || 'Unknown'
        };
        this.db.collection('products').doc(this.currentProductId!).update(updatedProduct).then(() => {
          // Adiciona o histórico de edição no documento do usuário
          const userRef = this.db.collection('users').doc(user?.uid);
          userRef.update({
            history: firebase.firestore.FieldValue.arrayUnion({
              action: 'Edição',
              product: updatedProduct.name,
              lote: this.currentProductId,
              date: firebase.firestore.Timestamp.fromDate(new Date())
            })
          }).then(() => {
            alert('Produto atualizado com sucesso');
            this.showModal = false;
            this.editMode = false;
            this.productForm.reset();
          }).catch(error => {
            alert('Erro ao registrar histórico: ' + error.message);
          });
        }).catch(error => {
          alert('Erro ao atualizar produto: ' + error.message);
        });
      });
    }
  }

  deleteProduct(productId: string | undefined) {
    if (productId && confirm('Tem certeza que deseja excluir este produto?')) {
      this.db.collection('products').doc(productId).delete().then(() => {
        alert('Produto excluído com sucesso');
        this.closeOptionsModal(); // Fechar o modal de opções ao excluir
      }).catch(error => {
        alert('Erro ao excluir produto: ' + error.message);
      });
    }
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editMode = false;
    this.productForm.reset();
  }

  openOptionsModal(product: Product) {
    this.selectedProduct = product;
    this.showOptionsModal = true;
  }

  closeOptionsModal() {
    this.showOptionsModal = false;
    this.selectedProduct = null;
  }
}
