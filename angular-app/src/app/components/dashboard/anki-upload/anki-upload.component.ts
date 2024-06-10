import { Component, Inject, inject } from '@angular/core';
import { NgxFileDragDropModule } from 'ngx-file-drag-drop';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { AsyncPipe, CommonModule, NgClass, NgFor } from '@angular/common';
import { TrimPipe } from '@pipes/trim.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule, } from '@angular/forms';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Card, CardNoId } from '@custom-types/types';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DatabaseService } from '@services/database.service';
import { Observable, firstValueFrom, map } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    AsyncPipe,
    MatSnackBarModule,
  ],
  templateUrl: './anki-upload.component.html',
  styleUrl: './anki-upload.component.scss'
})
export class AnkiUploadComponent {
  items: Observable<Card[]>;
  hasPointingDevice: boolean = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i) ? false : true;

  constructor(private _bottomSheet: MatBottomSheet, private db: DatabaseService, public dialog: MatDialog, private _snackBar: MatSnackBar) {
    this.items = db.cards;
  }

  async uploadFile(files: File[]) {
    if(!files.length) return;
    
    const file = files[0]; // We only support one file at a time.
    let cards: CardNoId[] = [];

    this._snackBar.open("Eine Sekunde...", "Ok", {
      duration: 1000,
    });
    
    try {
      cards = await this.db.getCards(file);
    } catch (error) {
      if (error instanceof TypeError) {
        this.openSnackBar(error.message, 'Ok');
      } else if (error instanceof Error) {
        this.openSnackBar(error.message, 'Ok');
      }
      return;
    }

    const wantsToUpload = await firstValueFrom(this.openDialog(cards.length).afterClosed());
    
    if (wantsToUpload) {
      cards.forEach(async item => await this.db.uploadCard(item));
    }
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }

  openDialog(count: number) {
    return this.dialog.open(ConfirmDialog, {
      data: count,
    });
  }

  openBottomSheet(card: Card): void {
    this._bottomSheet.open(BottomSheet, {
      data: card,
    });
  }

  updateCard(event: boolean, card: Card) {
    // The slide toggle does not have an invert function, so we have to do it manually.
    // Which is kind of ugly, but it works.
    card.disabled = !event;
    this.db.updateCard(card);
  }

  identify(_index: number, item: Card) {
    return item.disabled + '' + item.id!;
  }
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
    CommonModule,
  ],
})
export class BottomSheet {
  card: Observable<Card>;
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) data: Card, public dialog: MatDialog, private db: DatabaseService, private _bottomSheetRef: MatBottomSheetRef<BottomSheet>) {
    this.card = db.getCard(data.id!);
  }

  openDialog(card: Card, side: 'front' | 'back') {
    this.dialog.open(DialogWData, {
      data: { ...card, side },
    });
  }

  async delete() {
    const card = await firstValueFrom(this.card);
    this.db.deleteCard(card);
    this._bottomSheetRef.dismiss();
  }
}

@Component({
  selector: 'dialog',
  templateUrl: 'dialog.html',
  styleUrl: './anki-upload.component.scss',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogModule,
    MatDialogContent,
    MatInputModule,
    FormsModule,
    MatButtonModule,
  ],
})
export class DialogWData {
  text: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData, private db: DatabaseService) {
    this.text = data[data.side];
  }
  saveSide() {
    this.db.updateCard({ ...this.data, [this.data.side]: this.text });
  }
}

@Component({
  selector: 'confirm-dialog',
  templateUrl: 'confirm-upload-dialog.html',
  styleUrl: './anki-upload.component.scss',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogModule,
    MatDialogContent,
    MatInputModule,
    FormsModule,
    MatButtonModule,
  ],
})
export class ConfirmDialog {
  count: number;
  constructor(@Inject(MAT_DIALOG_DATA) public data: number, private db: DatabaseService) {
    this.count = data;
  }
}