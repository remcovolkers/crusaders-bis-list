import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { IBoss, IRaidPlanBossNote, BossNoteStatus, AddBossResourceDto } from '@crusaders-bis-list/shared-domain';
import { RaidPlanService } from '../../services/raid-plan.service';
import { ToastService } from '@crusaders-bis-list/frontend-shared-ui';

interface OEmbedResponse {
  title: string;
  thumbnail_url?: string;
}

@Component({
  selector: 'lib-boss-planning',
  imports: [FormsModule],
  templateUrl: './boss-planning.component.html',
  styleUrl: './boss-planning.component.scss',
})
export class BossPlanningComponent {
  private readonly service = inject(RaidPlanService);
  private readonly toast = inject(ToastService);

  readonly raidPlanId = input.required<string>();
  readonly bosses = input.required<IBoss[]>();
  readonly readonly = input(false);

  private readonly bossNotesResource = rxResource({
    params: () => this.raidPlanId(),
    stream: ({ params: id }) => this.service.getBossNotes(id),
  });

  /** bossId → note (derived from resource) */
  readonly noteMap = computed(() => {
    const map = new Map<string, IRaidPlanBossNote>();
    for (const n of this.bossNotesResource.value() ?? []) map.set(n.bossId, n);
    return map;
  });
  /** bossId → collapsed */
  readonly collapsed = signal<Set<string>>(new Set([]));
  /** bossId → new resource URL being typed */
  readonly pendingUrl = signal<Map<string, string>>(new Map());
  /** bossId → loading indicator for resource add */
  readonly addingResource = signal<Set<string>>(new Set());

  readonly statuses: BossNoteStatus[] = ['progression', 'farm', 'skip'];

  // ── Collapse ──────────────────────────────────────────────────────────────────

  toggleCollapse(bossId: string): void {
    this.collapsed.update((set) => {
      const next = new Set(set);
      if (next.has(bossId)) next.delete(bossId);
      else next.add(bossId);
      return next;
    });
  }

  isCollapsed(bossId: string): boolean {
    return this.collapsed().has(bossId);
  }

  // ── Notes / status ───────────────────────────────────────────────────────────

  getNote(bossId: string): IRaidPlanBossNote | undefined {
    return this.noteMap().get(bossId);
  }

  getNotes(bossId: string): string {
    return this.getNote(bossId)?.notes ?? '';
  }

  getStatus(bossId: string): BossNoteStatus {
    return this.getNote(bossId)?.status ?? 'progression';
  }

  onNotesChange(bossId: string, value: string): void {
    this.debounceNotesSave(bossId, value);
  }

  private noteTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private debounceNotesSave(bossId: string, notes: string): void {
    const existing = this.noteTimers.get(bossId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.service.upsertBossNote(this.raidPlanId(), bossId, { notes }).subscribe({
        next: (updated) => this.patchNoteMap(updated),
        error: () => this.toast.show('Opslaan notities mislukt.', 'error'),
      });
    }, 600);
    this.noteTimers.set(bossId, timer);
  }

  onStatusChange(bossId: string, status: BossNoteStatus): void {
    this.service.upsertBossNote(this.raidPlanId(), bossId, { status }).subscribe({
      next: (updated) => this.patchNoteMap(updated),
      error: () => this.toast.show('Opslaan status mislukt.', 'error'),
    });
  }

  // ── Resources ────────────────────────────────────────────────────────────────

  getPendingUrl(bossId: string): string {
    return this.pendingUrl().get(bossId) ?? '';
  }

  onUrlInput(bossId: string, url: string): void {
    this.pendingUrl.update((m) => new Map(m).set(bossId, url));
  }

  async addResource(bossId: string): Promise<void> {
    const url = this.getPendingUrl(bossId).trim();
    if (!url) return;

    this.addingResource.update((s) => new Set(s).add(bossId));

    let dto: AddBossResourceDto;
    if (this.isYoutube(url)) {
      try {
        const oembed = await this.fetchOEmbed(url);
        dto = {
          url,
          title: oembed.title,
          thumbnailUrl: oembed.thumbnail_url,
          type: 'youtube',
        };
      } catch {
        dto = { url, title: url, type: 'youtube' };
      }
    } else {
      dto = { url, title: url, type: 'link' };
    }

    this.service.addBossResource(this.raidPlanId(), bossId, dto).subscribe({
      next: (updated) => {
        this.patchNoteMap(updated);
        this.pendingUrl.update((m) => {
          const next = new Map(m);
          next.delete(bossId);
          return next;
        });
        this.addingResource.update((s) => {
          const next = new Set(s);
          next.delete(bossId);
          return next;
        });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (err: any) => {
        const status: number | undefined = err?.status;
        const serverMsg: string | undefined = err?.error?.message;
        let msg = 'Resource toevoegen mislukt.';
        if (serverMsg) {
          msg = serverMsg;
        } else if (status === 403) {
          msg = 'Je hebt geen rechten om resources toe te voegen.';
        } else if (status === 404) {
          msg = 'Raidplan of boss niet gevonden. Ververs de pagina.';
        } else if (status === 0) {
          msg = 'Geen verbinding met de server. Controleer je internet.';
        }
        this.toast.show(msg, 'error');
        this.addingResource.update((s) => {
          const next = new Set(s);
          next.delete(bossId);
          return next;
        });
      },
    });
  }

  deleteResource(bossId: string, resourceId: string): void {
    const note = this.getNote(bossId);
    if (!note) return;
    this.service.deleteBossResource(this.raidPlanId(), bossId, resourceId).subscribe({
      next: () => {
        this.bossNotesResource.update((notes) =>
          (notes ?? []).map((n) =>
            n.bossId === bossId ? { ...n, resources: n.resources.filter((r) => r.id !== resourceId) } : n,
          ),
        );
      },
      error: () => this.toast.show('Verwijderen mislukt.', 'error'),
    });
  }

  isAdding(bossId: string): boolean {
    return this.addingResource().has(bossId);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private isYoutube(url: string): boolean {
    return url.includes('youtube.com/watch') || url.includes('youtu.be/');
  }

  private async fetchOEmbed(url: string): Promise<OEmbedResponse> {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const resp = await fetch(oembedUrl);
    if (!resp.ok) throw new Error('oEmbed failed');
    return resp.json() as Promise<OEmbedResponse>;
  }

  private patchNoteMap(note: IRaidPlanBossNote): void {
    this.bossNotesResource.update((notes) => {
      const arr = [...(notes ?? [])];
      const idx = arr.findIndex((n) => n.bossId === note.bossId);
      if (idx >= 0) arr[idx] = note;
      else arr.push(note);
      return arr;
    });
  }

  groupedBosses(): { raidName: string; color: string; bosses: IBoss[] }[] {
    const groups = new Map<string, { color: string; bosses: IBoss[] }>();
    for (const boss of this.bosses()) {
      const key = boss.raidName ?? 'Onbekend';
      if (!groups.has(key)) groups.set(key, { color: boss.raidAccentColor ?? '#888', bosses: [] });
      groups.get(key)!.bosses.push(boss);
    }
    return Array.from(groups.entries()).map(([raidName, v]) => ({ raidName, ...v }));
  }
}
