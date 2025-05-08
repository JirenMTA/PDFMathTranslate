import { Component, effect, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, } from '@angular/common/http';
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from '@angular/material/chips';
import { FileStateService } from '../../../services/FileStateService';
import { inject } from "@angular/core";
import { environment } from "../../../environments/environment";
import { MatProgressBarModule } from '@angular/material/progress-bar';


@Component({
    selector: 'show-file',
    standalone: true,
    templateUrl: './show-file.component.html',
    styleUrls: ['./show-file.component.scss'],
    imports: [MatButtonModule, MatChipsModule, CommonModule, MatProgressBarModule],
    providers: [HttpClient],
})
export class ShowFileComponent implements OnInit {
    currentPage = 1;
    sanitizedUrl: SafeResourceUrl;
    hasError = false;
    isLoading = false;
    stateSvc = inject(FileStateService);
    baseUrl = environment.apiUrl;


    constructor(
        private sanitizer: DomSanitizer,
    ) {
        this.sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
        effect(() => {
            const id = this.stateSvc.fileId();
            if (id) {
                this.updateUrl();
                this.currentPage = 1;
            }
        });

        effect(() => {
            this.isLoading = this.stateSvc.isLoading();
        });
    }

    ngOnInit(): void {
        this.updateUrl();
    }

    updateUrl() {
        const id = this.stateSvc.fileId();
        this.isLoading = true;
        this.hasError = false;

        const base = id
            ? `${this.baseUrl}/${id}?t=${Date.now()}#page=${this.currentPage}`
            : ``;

        const newUrl = this.sanitizer.bypassSecurityTrustResourceUrl(base);
        this.sanitizedUrl = newUrl;
        this.isLoading = false;
        this.hasError = false;
    }

    nextPage() {
        this.currentPage++;
        this.updateUrl();
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateUrl();
        }
    }
}