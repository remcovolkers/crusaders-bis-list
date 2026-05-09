import { Component, input } from '@angular/core';
import { IRaidPlanParticipant, WOW_CLASS_REGISTRY } from '@crusaders-bis-list/shared-domain';

@Component({
  selector: 'lib-raider-card',
  imports: [],
  template: `
    <div
      class="raider-card"
      [style.border-left-color]="classColor()"
      [class]="'raider-card--' + participant().wowClass.toLowerCase().replace(' ', '-')"
    >
      <span class="raider-card__name">{{ participant().characterName }}</span>
      <span class="raider-card__spec" [style.color]="classColor()">{{ participant().spec }}</span>
    </div>
  `,
  styleUrl: './raider-card.component.scss',
})
export class RaiderCardComponent {
  readonly participant = input.required<IRaidPlanParticipant>();

  classColor(): string {
    return WOW_CLASS_REGISTRY[this.participant().wowClass]?.color ?? '#888';
  }
}
