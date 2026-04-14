import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassSpecSelectorComponent } from './class-spec-selector/class-spec-selector.component';

@NgModule({
  imports: [CommonModule, ClassSpecSelectorComponent],
  exports: [ClassSpecSelectorComponent],
})
export class FrontendSharedUiModule {}
