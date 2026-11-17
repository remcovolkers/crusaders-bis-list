import { Directive, ElementRef, OnDestroy, inject, input } from '@angular/core';
import { IItemTooltip } from '@crusaders-bis-list/shared-domain';

/** There is only ever one tooltip on the screen. */
let current: { el: HTMLElement; owner: unknown } | null = null;

const QUALITY_CLASS: Record<string, string> = {
  POOR: 'q-poor',
  COMMON: 'q-common',
  UNCOMMON: 'q-uncommon',
  RARE: 'q-rare',
  EPIC: 'q-epic',
  LEGENDARY: 'q-legendary',
};

function line(parent: HTMLElement, text: string, ...classes: string[]): void {
  const el = document.createElement('div');
  el.className = classes.map((c) => `item-tooltip__${c}`).join(' ');
  el.textContent = text;
  parent.appendChild(el);
}

/**
 * Hover text for an item icon: what the Blizzard item tooltip says (binding, type, stats, effects, set bonuses).
 * Shows on hover or keyboard focus, and on tap on touch screens. Nothing is shown when the item has no tooltip data
 * yet (it is filled by the next catalog sync). Content is added as text, never as HTML.
 *
 *   <img [libItemTooltip]="item.tooltip" [libItemTooltipName]="item.name" [libItemTooltipVia]="item.tierTokenName" />
 */
@Directive({
  selector: '[libItemTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
    '(click)': 'onClick()',
  },
})
export class ItemTooltipDirective implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly tooltip = input<IItemTooltip | null | undefined>(undefined, { alias: 'libItemTooltip' });
  readonly name = input<string>('', { alias: 'libItemTooltipName' });
  /** The tier token the item comes from, when the item shown is the set piece of a class. */
  readonly via = input<string | null | undefined>(undefined, { alias: 'libItemTooltipVia' });

  private readonly onScroll = (): void => this.hide();

  show(): void {
    const data = this.tooltip();
    if (!data) return;
    this.hide();

    const el = document.createElement('div');
    el.className = 'item-tooltip';
    el.setAttribute('role', 'tooltip');

    line(el, this.name(), 'name', QUALITY_CLASS[data.quality ?? ''] ?? 'q-common');
    const via = this.via();
    if (via) line(el, `via ${via}`, 'via');
    if (data.binding) line(el, data.binding, 'dim');
    if (data.unique) line(el, data.unique, 'dim');
    if (data.typeLine) line(el, data.typeLine, 'dim');
    if (data.stats?.length) line(el, data.stats.join(' · '), 'stats');
    for (const effect of data.effects ?? []) line(el, effect, 'effect');
    if (data.description) line(el, data.description, 'flavor');
    if (data.setName) line(el, data.setName, 'set');
    for (const effect of data.setEffects ?? []) line(el, effect, 'set-effect');
    line(el, 'Stat-waarden staan er niet bij: die hangen af van je upgrade track (Hero of Myth).', 'note');

    document.body.appendChild(el);
    this.position(el);
    current = { el, owner: this };
    window.addEventListener('scroll', this.onScroll, { capture: true, passive: true });
  }

  hide(): void {
    window.removeEventListener('scroll', this.onScroll, { capture: true });
    if (current) {
      current.el.remove();
      current = null;
    }
  }

  /** On touch screens there is no hover: a tap shows or hides the tooltip. */
  onClick(): void {
    if (!window.matchMedia('(hover: none)').matches) return;
    if (current?.owner === this) this.hide();
    else this.show();
  }

  /** Right of the icon, or left when there is no room; kept inside the screen. */
  private position(el: HTMLElement): void {
    const anchor = this.host.nativeElement.getBoundingClientRect();
    const { width, height } = el.getBoundingClientRect();
    const gap = 10;
    const fitsRight = anchor.right + gap + width <= window.innerWidth - 8;
    const left = fitsRight ? anchor.right + gap : Math.max(8, anchor.left - gap - width);
    const top = Math.min(Math.max(8, anchor.top), Math.max(8, window.innerHeight - height - 8));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  ngOnDestroy(): void {
    if (current?.owner === this) this.hide();
  }
}
