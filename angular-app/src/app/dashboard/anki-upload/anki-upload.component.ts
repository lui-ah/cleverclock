import { Component, Inject } from '@angular/core';
import { NgxFileDragDropModule } from 'ngx-file-drag-drop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import {MatListModule} from '@angular/material/list';
import { NgClass, NgFor } from '@angular/common';
import { TrimPipe } from '../../pipes/trim.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule, } from '@angular/forms';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { items } from './mock-data'
import { Card } from '../../types/types';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-anki-upload',
  standalone: true,
  imports: [
    NgxFileDragDropModule, 
    MatExpansionModule,
    MatIconModule,
    MatFormFieldModule,
    MatDividerModule,
    MatListModule,
    NgFor,
    TrimPipe,
    MatTooltipModule,
    MatSlideToggleModule,
    NgClass,
    FormsModule,
    MatBottomSheetModule,
  ],
  templateUrl: './anki-upload.component.html',
  styleUrl: './anki-upload.component.scss'
})
export class AnkiUploadComponent {
  items = items;
  
  constructor(private _bottomSheet: MatBottomSheet) {}

  openBottomSheet(card: Card): void {
    this._bottomSheet.open(BottomSheet, {
      data: card,
    });
  }

  hasPointingDevice: boolean = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i) ? false : true;

  questions = this.items.map(item => ({
    topic: item,
    question: `What is ${item}?`
  }));
}

type Side = 'front' | 'back';

interface DialogData extends Card {
  side: Side;
};

@Component({
  selector: 'bottom-sheet',
  templateUrl: 'bottom-sheet.html',
  styleUrl: './anki-upload.component.scss',
  standalone: true,
  imports: [
    MatListModule,
    MatIconModule,
    MatCheckboxModule,
  ],
})
export class BottomSheet {
  card: Card;
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: Card, public dialog: MatDialog) {
    this.card = data;
  }

  openDialog(card: Card, side: 'front' | 'back') {
    this.dialog.open(DialogWData, {
      data: {...card, side},
    });
  } 
}

@Component({
  selector: 'dialog',
  templateUrl: 'dialog.html',
  styleUrl: './anki-upload.component.scss',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatInputModule, FormsModule, MatButtonModule],
})
export class DialogWData {
  text: string;
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.text = data[data.side];
  }
  saveSide() {
    console.error('not implemented yet');
  }
}