import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileStateService {
    fileId = signal<string | null>(null);
    isLoading = signal<boolean>(false);
    fileType = signal<string | null>(null);

    setFileId(id: string) {
        this.fileId.set(id);
    }

    setIsLoading(isLoading: boolean) {
        this.isLoading.set(isLoading);
    }

    setFileType(type: string) {
        this.fileType.set(type);
    }

    getFileId(): string | null {
        return this.fileId();
    }

    getIsLoading(): boolean {
        return this.isLoading();
    }

    getFileType(): string | null {
        return this.fileType();
    }
}
