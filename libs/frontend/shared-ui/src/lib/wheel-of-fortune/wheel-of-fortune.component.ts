import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, input, output } from '@angular/core';

@Component({
  selector: 'lib-wheel-of-fortune',
  standalone: true,
  template: `
    <div class="wheel-host" [style.width.px]="size()" [style.height.px]="size()">
      <div class="wheel-pointer">&#9660;</div>
      <canvas #canvas [width]="size()" [height]="size()"></canvas>
    </div>
  `,
  styles: [
    `
      .wheel-host {
        position: relative;
        display: inline-block;
      }
      .wheel-pointer {
        position: absolute;
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
        color: #f0c040;
        font-size: 22px;
        z-index: 2;
        filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.7));
        line-height: 1;
      }
      canvas {
        display: block;
        border-radius: 50%;
      }
    `,
  ],
})
export class WheelOfFortuneComponent implements AfterViewInit, OnDestroy {
  readonly raiders = input<{ raiderId: string; name: string }[]>([]);
  readonly spinning = input(false);
  readonly winnerRaiderId = input<string | null>(null);
  readonly size = input(320);
  readonly spinDone = output<void>();

  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private animFrame: number | null = null;
  private currentAngle = -Math.PI / 2; // start with first segment at top
  private phase: 'idle' | 'spinning' | 'decelerating' | 'done' = 'idle';
  private decelerateStart = 0;
  private decelerateFromAngle = 0;
  private decelerateTargetAngle = 0;
  private readonly DECELERATE_MS = 3500;
  private readonly SPIN_VELOCITY = 0.06; // rad/frame (~3.4°/frame)
  private canvasReady = false;

  // 8 alternating segment colours (dark WoW-ish palette)
  private readonly COLORS = ['#5b21b6', '#1d4ed8', '#065f46', '#92400e', '#831843', '#155e75', '#3f6212', '#991b1b'];

  constructor() {
    effect(() => {
      const spinning = this.spinning();
      const winner = this.winnerRaiderId();
      // Raiders change → redraw
      void this.raiders();

      if (winner && this.phase !== 'decelerating' && this.phase !== 'done') {
        this.beginDecelerate(winner);
      } else if (spinning && !winner && this.phase === 'idle') {
        this.beginSpin();
      } else if (!spinning && !winner) {
        this.stopAll();
        this.drawWheel();
      }
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    this.canvasReady = true;
    this.drawWheel();
  }

  // ── State transitions ────────────────────────────────────────────────────────

  private beginSpin(): void {
    this.phase = 'spinning';
    this.loop();
  }

  private beginDecelerate(winnerRaiderId: string): void {
    const raiders = this.raiders();
    const n = raiders.length;
    if (n === 0) return;

    const winnerIndex = raiders.findIndex((r) => r.raiderId === winnerRaiderId);
    if (winnerIndex === -1) return;

    const segAngle = (2 * Math.PI) / n;
    // We want the pointer (top, -π/2) to point at the center of segment winnerIndex.
    // When wheel rotation = θ, segment i center is at θ + i*segAngle + segAngle/2.
    // We want: θ_target + winnerIndex*segAngle + segAngle/2 ≡ -π/2 (mod 2π)
    const rawTarget = -Math.PI / 2 - winnerIndex * segAngle - segAngle / 2;

    // Round to the nearest achievable angle above current, adding ≥3 full rotations for drama
    const current = this.currentAngle;
    const mod = (rawTarget - current) % (2 * Math.PI);
    const delta = ((mod + 2 * Math.PI) % (2 * Math.PI)) + 3 * 2 * Math.PI;

    this.decelerateFromAngle = current;
    this.decelerateTargetAngle = current + delta;
    this.decelerateStart = performance.now();
    this.phase = 'decelerating';

    if (this.animFrame === null) this.loop();
  }

  private stopAll(): void {
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.phase = 'idle';
  }

  // ── Animation loop ───────────────────────────────────────────────────────────

  private loop = (): void => {
    switch (this.phase) {
      case 'spinning':
        this.currentAngle += this.SPIN_VELOCITY;
        break;

      case 'decelerating': {
        const elapsed = performance.now() - this.decelerateStart;
        const t = Math.min(elapsed / this.DECELERATE_MS, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        this.currentAngle = this.decelerateFromAngle + (this.decelerateTargetAngle - this.decelerateFromAngle) * eased;

        if (t >= 1) {
          this.currentAngle = this.decelerateTargetAngle;
          this.phase = 'done';
          this.drawWheel();
          this.animFrame = null;
          this.spinDone.emit();
          return;
        }
        break;
      }

      default:
        this.animFrame = null;
        return;
    }

    this.drawWheel();
    this.animFrame = requestAnimationFrame(this.loop);
  };

  // ── Drawing ──────────────────────────────────────────────────────────────────

  drawWheel(): void {
    if (!this.canvasReady || !this.ctx) return;
    const ctx = this.ctx;
    const s = this.size();
    const cx = s / 2;
    const cy = s / 2;
    const outerR = cx - 6;
    const innerR = 18; // hub
    const raiders = this.raiders();
    const n = raiders.length;

    ctx.clearRect(0, 0, s, s);
    if (n === 0) return;

    const segAngle = (2 * Math.PI) / n;
    const winnerRaiderId = this.winnerRaiderId();

    // ── Segments ──
    for (let i = 0; i < n; i++) {
      const start = this.currentAngle + i * segAngle;
      const end = start + segAngle;
      const isWinner = this.phase === 'done' && raiders[i].raiderId === winnerRaiderId;
      const baseColor = this.COLORS[i % this.COLORS.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, start, end);
      ctx.closePath();
      ctx.fillStyle = isWinner ? this.lighten(baseColor, 40) : baseColor;
      if (isWinner) {
        ctx.shadowColor = '#f0c040';
        ctx.shadowBlur = 18;
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // ── Segment text ──
      ctx.save();
      const midAngle = start + segAngle / 2;
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      ctx.font = `bold ${n > 8 ? 10 : 12}px system-ui, sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      const raw = raiders[i].name;
      const label = raw.length > 14 ? raw.slice(0, 13) + '…' : raw;
      ctx.fillText(label, outerR - 12, 4);
      ctx.restore();
    }

    // ── Outer ring ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
    ctx.strokeStyle = this.phase === 'done' ? 'rgba(74, 222, 128, 0.6)' : 'rgba(240, 192, 64, 0.35)';
    ctx.lineWidth = this.phase === 'spinning' || this.phase === 'decelerating' ? 4 : 3;
    if (this.phase === 'spinning' || this.phase === 'decelerating') {
      ctx.shadowColor = '#f0c040';
      ctx.shadowBlur = 12;
    }
    ctx.stroke();
    ctx.restore();

    // ── Hub ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = '#0d1117';
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,192,64,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private lighten(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  }

  ngOnDestroy(): void {
    this.stopAll();
  }
}
