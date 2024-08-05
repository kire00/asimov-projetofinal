import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import firebase from 'firebase/compat/app';

interface Log {
  id?: string;
  productId: string;
  productName: string;
  productDescription: string;
  productType: string;
  action: string;
  quantity: number;
  date: firebase.firestore.Timestamp;
  user: string;
}

interface Product {
  id?: string;
  name: string;
  type: string;
  description: string;
}

@Component({
  selector: 'app-registro-baixas',
  templateUrl: './registro-baixas.component.html',
  styleUrls: ['./registro-baixas.component.scss']
})
export class RegistroBaixasComponent implements OnInit {
  logs: Log[] = [];
  filteredLogs: Log[] = [];
  filterForm: FormGroup;
  sortCriteria: string = 'date'; // default sort criteria

  constructor(
    private db: AngularFirestore,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      productName: [''],
      user: [''],
      date: [''],
      lote: [''],
      type: ['']
    });
  }

  ngOnInit(): void {
    this.loadLogs();
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  async loadLogs() {
    const logsSnapshot = await this.db.collection('stockLogs').get().toPromise();
    if (logsSnapshot) {
      const logs = await Promise.all(logsSnapshot.docs.map(async logSnap => {
        const logData = logSnap.data() as Log;
        logData.id = logSnap.id;

        const productRef = await this.db.collection('products').doc(logData.productId).get().toPromise();
        if (productRef && productRef.exists) {
          const productData = productRef.data() as Product;
          logData.productName = productData?.name ?? 'Desconhecido';
          logData.productDescription = productData?.description ?? 'Desconhecido';
          logData.productType = productData?.type ?? 'Desconhecido';
        } else {
          logData.productName = 'Desconhecido';
          logData.productDescription = 'Desconhecido';
          logData.productType = 'Desconhecido';
        }

        return logData;
      }));
      this.logs = logs;
      this.applyFilters();
    }
  }

  applyFilters() {
    const { productName, user, date, lote, type } = this.filterForm.value;
    this.filteredLogs = this.logs.filter(log => {
      const matchesProductName = productName ? log.productName.toLowerCase().includes(productName.toLowerCase()) : true;
      const matchesUser = user ? log.user.toLowerCase().includes(user.toLowerCase()) : true;
      const matchesDate = date ? this.isSameDay(log.date.toDate(), new Date(date)) : true;
      const matchesLote = lote ? log.productId.toLowerCase().includes(lote.toLowerCase()) : true;
      const matchesType = type ? log.productType === type : true;
      return matchesProductName && matchesUser && matchesDate && matchesLote && matchesType;
    });
    this.sortLogs();
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
           date1.getUTCMonth() === date2.getUTCMonth() &&
           date1.getUTCDate() === date2.getUTCDate();
  }

  sortLogs() {
    if (this.sortCriteria === 'date') {
      this.filteredLogs.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
    } else if (this.sortCriteria === 'dateAsc') {
      this.filteredLogs.sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());
    } else if (this.sortCriteria === 'name') {
      this.filteredLogs.sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (this.sortCriteria === 'nameDesc') {
      this.filteredLogs.sort((a, b) => b.productName.localeCompare(a.productName));
    }
  }

  onSortChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.setSortCriteria(selectElement.value);
  }

  setSortCriteria(criteria: string) {
    this.sortCriteria = criteria;
    this.sortLogs();
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}