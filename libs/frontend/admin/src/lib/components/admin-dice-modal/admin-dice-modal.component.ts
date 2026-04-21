import { Component, computed, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  AssignmentStatus,
  IEligibleRaider,
  IItem,
  ITEM_CATEGORY_LABELS,
  TIER_LABELS,
  ItemCategory,
  WOW_CLASS_REGISTRY,
  RollEvent,
  SpectatorInfo,
} from '@crusaders-bis-list/shared-domain';
import { ToastService, WheelOfFortuneComponent } from '@crusaders-bis-list/frontend-shared-ui';
import { AdminService } from '../../services/admin.service';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectCurrentUser } from '@crusaders-bis-list/frontend-auth';

@Component({
  selector: 'lib-admin-dice-modal',
  imports: [NgClass, WheelOfFortuneComponent],
  templateUrl: './admin-dice-modal.component.html',
  styleUrls: ['./admin-dice-modal.component.scss'],
})
export class AdminDiceModalComponent implements OnInit, OnDestroy {
  readonly item = input.required<IItem>();
  readonly bossId = input.required<string>();
  readonly eligibleRaiders = input.required<IEligibleRaider[]>();
  readonly selectedDifficulty = input.required<AssignmentStatus>();

  readonly closed = output<void>();
  readonly winnerSelected = output<IEligibleRaider>();

  readonly sessionId = signal<string | null>(null);
  readonly shareUrl = signal<string | null>(null);
  readonly rolling = signal(false);
  readonly winner = signal<IEligibleRaider | null>(null);
  readonly wheelDone = signal(false);
  readonly loading = signal(true);
  readonly spectators = signal<SpectatorInfo[]>([]);

  readonly tierLabels = TIER_LABELS;
  readonly categoryLabels = ITEM_CATEGORY_LABELS;
  readonly ItemCategory = ItemCategory;

  readonly diceRaidersMapped = computed(() =>
    this.eligibleRaiders().map((r) => ({
      raiderId: r.raiderId,
      name: r.characterName,
      color: WOW_CLASS_REGISTRY[r.wowClass]?.color,
    })),
  );

  private sseSource: EventSource | null = null;
  private diceRollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly toast = inject(ToastService);
  private readonly adminService = inject(AdminService);
  private readonly store = inject(Store);
  private readonly currentUser = toSignal(this.store.select(selectCurrentUser));

  ngOnInit(): void {
    const raiders = this.diceRaidersMapped();
    const item = this.item();
    this.adminService
      .createRollSession(
        item.name,
        item.iconUrl,
        item.secondaryIconUrl,
        this.tierLabels[this.selectedDifficulty()],
        this.bossId(),
        raiders,
      )
      .subscribe({
        next: ({ sessionId }) => {
          this.sessionId.set(sessionId);
          this.shareUrl.set(`${window.location.origin}/roll/${sessionId}`);
          this.loading.set(false);
          this.connectSse(sessionId);
        },
        error: () => {
          this.toast.show('Kon dobbelsteensessie niet aanmaken.', 'error');
          this.closed.emit();
        },
      });
  }

  rollDice(): void {
    const id = this.sessionId();
    if (!id || this.rolling()) return;

    this.wheelDone.set(false);
    this.rolling.set(true);
    this.winner.set(null);
    // SSE is already open since session creation; re-connect only if it was closed
    if (!this.sseSource) {
      this.connectSse(id);
    }

    this.adminService.startRoll(id).subscribe({
      error: () => {
        this.teardownSse();
        this.rolling.set(false);
        this.toast.show('Kon de roll niet starten.', 'error');
      },
    });
  }

  onWheelDone(): void {
    this.wheelDone.set(true);
  }

  copyShareUrl(): void {
    const url = this.shareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => this.toast.show('Deellink gekopieerd!'));
  }

  assignFromDice(): void {
    const w = this.winner();
    if (!w) return;
    this.winnerSelected.emit(w);
    this.closed.emit();
  }

  close(): void {
    this.teardownSse();
    this.closed.emit();
  }

  private connectSse(sessionId: string): void {
    this.teardownSse();
    const apiBase = this.adminService.getBase();
    const myDisplayName = this.currentUser()?.displayName ?? 'Admin';
    const url = `${apiBase}/roll-sessions/${sessionId}/stream?displayName=${encodeURIComponent(myDisplayName)}`;
    this.sseSource = new EventSource(url);

    this.sseSource.onmessage = (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as RollEvent;
      if (event.type === 'tick') {
        // tick events don't affect our internal state - WoF component handles animation
      } else if (event.type === 'winner') {
        const found = this.eligibleRaiders().find((r) => r.raiderId === event.raiderId) ?? null;
        this.winner.set(found);
        this.rolling.set(false);
        this.teardownSse();
      } else if (event.type === 'spectators') {
        this.spectators.set(event.spectators ?? []);
      }
    };

    this.sseSource.onerror = () => {
      this.teardownSse();
      this.rolling.set(false);
    };
  }

  private teardownSse(): void {
    if (this.sseSource) {
      this.sseSource.close();
      this.sseSource = null;
    }
    if (this.diceRollTimer) {
      clearTimeout(this.diceRollTimer);
      this.diceRollTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.teardownSse();
  }
}
