import { Component } from '@angular/core';
import { LoadFileComponent } from '../../shared/load-file-component/load-file.component';
import { ShowFileComponent } from '../../shared/show-file-component/show-file.component';


@Component({
  selector: 'app-home-component',
  imports: [LoadFileComponent, ShowFileComponent],
  templateUrl: './home-component.component.html',
  styleUrl: './home-component.component.scss'
})
export class HomeComponentComponent {

}
