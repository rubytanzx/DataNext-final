import { Injectable, signal } from '@angular/core';
import { ChatWidget, UploadedFile } from '../types/widget.types';

export type NbChatMsg =
  | { id: number; type: 'user'; text: string; attachments?: UploadedFile[] }
  | { id: number; type: 'thinking' }
  | { id: number; type: 'ai'; text: string; widgets?: ChatWidget[] };

@Injectable({ providedIn: 'root' })
export class WidgetSelectionService {
  selectedWidgets  = signal<ChatWidget[]>([]);
  conversation     = signal<NbChatMsg[]>([]);
  searchQuery      = signal<string>('');
  pendingAsset     = signal<ChatWidget | null>(null);
}
