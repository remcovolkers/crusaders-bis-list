import { Component, ElementRef, HostListener, afterNextRender, computed, effect, inject, signal, resource } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { GUIDE_URL, GuideHeading, RenderedGuide } from './guide-renderer';

interface TocChapter {
  heading: GuideHeading;
  sections: GuideHeading[];
}

/**
 * The user guide inside the app. The content is the Markdown guide of the repository (one source of truth, also
 * readable on GitHub), fetched from the app's own assets and rendered here, with a table of contents that follows you
 * down the page. Other screens link to a part of it with `routerLink="/help" fragment="<heading id>"`.
 */
@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss'],
})
export class HelpComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly fragment = toSignal(this.route.fragment, { initialValue: null });
  protected readonly menuOpen = signal(false);
  protected readonly activeId = signal<string | null>(null);
  protected readonly zoomSrc = signal<{ src: string; alt: string } | null>(null);

  private readonly guideResource = resource<RenderedGuide, void>({
    // marked is only loaded when this page is opened
    loader: async () => {
      const [{ renderGuide }, response] = await Promise.all([
        import('./guide-renderer'),
        fetch(GUIDE_URL, { cache: 'no-cache' }),
      ]);
      if (!response.ok) throw new Error(`Handleiding laden mislukt (${response.status})`);
      return renderGuide(await response.text());
    },
  });

  protected readonly loading = this.guideResource.isLoading;
  protected readonly failed = computed(() => this.guideResource.status() === 'error');
  protected readonly title = computed(() => this.guideResource.value()?.title ?? 'Handleiding');
  /** Trusted: this is our own static guide, bundled with the app (not user input). */
  protected readonly html = computed<SafeHtml | null>(() => {
    const guide = this.guideResource.value();
    return guide ? this.sanitizer.bypassSecurityTrustHtml(guide.html) : null;
  });

  protected readonly toc = computed<TocChapter[]>(() => {
    const chapters: TocChapter[] = [];
    for (const heading of this.guideResource.value()?.headings ?? []) {
      if (heading.level === 2) chapters.push({ heading, sections: [] });
      else chapters[chapters.length - 1]?.sections.push(heading);
    }
    return chapters;
  });
  /** The chapter that is being read, so only its sections are unfolded in the table of contents. */
  protected readonly activeChapterId = computed(() => {
    const active = this.activeId();
    const chapter = this.toc().find((c) => c.heading.id === active || c.sections.some((s) => s.id === active));
    return chapter?.heading.id ?? null;
  });

  constructor() {
    // jump to the part that was linked (/help#chase) once the guide is on the page
    effect(() => {
      const fragment = this.fragment();
      if (this.html() && fragment) queueMicrotask(() => requestAnimationFrame(() => this.scrollTo(fragment, false)));
    });
    afterNextRender(() => this.scroller()?.addEventListener('scroll', () => this.onScroll(), { passive: true }));
  }

  private scroller(): HTMLElement | null {
    return this.host.nativeElement.closest('.app-main');
  }

  private scrollTo(id: string, smooth: boolean): void {
    const el = this.host.nativeElement.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    this.activeId.set(id);
  }

  /** Follow the table of contents / in-page links without leaving the page; keeps the URL shareable. */
  protected goTo(id: string, event?: Event): void {
    event?.preventDefault();
    this.menuOpen.set(false);
    this.scrollTo(id, true);
    void this.router.navigate([], { relativeTo: this.route, fragment: id, replaceUrl: true });
  }

  /** Links inside the guide and zooming a screenshot (the guide HTML is generated, so it is handled here). */
  @HostListener('click', ['$event'])
  protected onContentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.guide')) return;
    const link = target.closest('a');
    const href = link?.getAttribute('href');
    if (href?.startsWith('#')) return this.goTo(decodeURIComponent(href.slice(1)), event);
    if (target instanceof HTMLImageElement) this.zoomSrc.set({ src: target.src, alt: target.alt });
  }

  @HostListener('document:keydown.escape')
  protected closeZoom(): void {
    this.zoomSrc.set(null);
  }

  /** Highlight the heading that is at the top of the screen. */
  private onScroll(): void {
    const headings = this.guideResource.value()?.headings ?? [];
    const content = this.host.nativeElement;
    let current: string | null = null;
    for (const h of headings) {
      const el = content.querySelector<HTMLElement>(`[id="${CSS.escape(h.id)}"]`);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= 140) current = h.id;
      else break;
    }
    if (current !== this.activeId()) this.activeId.set(current);
  }
}
