import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';
import { FileService } from '../../../services/FileService';
import { FileStateService } from '../../../services/FileStateService';
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';

@Component({
    selector: 'load-file',
    templateUrl: './load-file.component.html',
    styleUrls: ['./load-file.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatDividerModule,
        MatButtonModule,
        MatIconModule,
    ],
})
export class LoadFileComponent implements OnInit {
    private fileService = inject(FileService);
    fileStateService = inject(FileStateService);

    constructor(private http: HttpClient) { }


    selectedFile: File | null = null;
    selectedFileName: string | null = null;
    uploadUrl: string | null = null;

    @Output() fileLoaded = new EventEmitter<File>();

    ngOnInit(): void {
        this.reset();
    }

    private reset() {
        this.selectedFile = null;
        this.selectedFileName = null;
        this.fileStateService.setIsLoading(false);
        this.uploadUrl = null;
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) {
            this.reset();
            return;
        }

        this.selectedFile = input.files[0];
        this.selectedFileName = this.selectedFile.name;
        this.fileStateService.setIsLoading(true);

        this.fileService.postFile(this.selectedFile).subscribe({
            next: (response) => {
                this.fileStateService.setIsLoading(false);
                this.uploadUrl = response.url;
                this.fileStateService.setFileId("files/" + response.filename);
                this.fileStateService.setFileType("uploaded");
            },
            error: (error) => {
                console.error('Error uploading file:', error);
                this.fileStateService.setIsLoading(true);
            },
        });
    }

    onDoTranslate(): void {
        if (!this.selectedFile && this.fileStateService.getFileType() !== "uploaded") {
            return;
        }

        this.fileStateService.setIsLoading(true);
        this.fileStateService.setFileType("translating");
        const id_with_folder = this.fileStateService.getFileId();
        const id = id_with_folder ? id_with_folder.split('/').pop() : null;
        if (id) {
            this.fileService.doTranslate(id).subscribe({
                next: (response) => {
                    this.fileStateService.setIsLoading(false);
                    this.fileStateService.setFileId("translated_files/" + response.translated_url);
                    this.fileStateService.setFileType("translated");
                },
                error: (error) => {
                    console.error('Error translating file:', error);
                    this.fileStateService.setIsLoading(false);
                },
            });
        }
    }

    downloadTranslatedFile(): void {
        const id_with_dir = this.fileStateService.getFileId();
        if (!id_with_dir) {
            console.error('No file selected or file is not translated.');
            return;
        }
        const id = id_with_dir ? id_with_dir.split('/').pop() : null;
        if (!(this.fileStateService.getFileType() === "translated" && id)) {
            console.error('No file selected or file is not translated.');
            return;
        }

        const downloadUrl = `${environment.apiUrl}/translated_files/${id}`;
        this.http.get(downloadUrl, { responseType: 'blob' }).subscribe(blob => {
            saveAs(blob, id);
        }, err => {
            console.error('Download error', err);
        });

    }
}
