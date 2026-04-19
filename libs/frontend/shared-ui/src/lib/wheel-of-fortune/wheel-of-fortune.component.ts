import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, input, output } from '@angular/core';

@Component({
  selector: 'lib-wheel-of-fortune',
  standalone: true,
  template: `
    <div class="wheel-host" [style.width.px]="size()" [style.height.px]="size()">
      <div class="wheel-pointer"></div>
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
        top: -2px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 22px solid #f0c040;
        z-index: 2;
        filter: drop-shadow(0 2px 8px rgba(240, 192, 64, 0.85));
      }
      canvas {
        display: block;
        border-radius: 50%;
      }
    `,
  ],
})
export class WheelOfFortuneComponent implements AfterViewInit, OnDestroy {
  readonly raiders = input<{ raiderId: string; name: string; color?: string }[]>([]);
  readonly spinning = input(false);
  readonly winnerRaiderId = input<string | null>(null);
  readonly size = input(320);
  readonly itemIconUrl = input<string | undefined>(undefined);
  readonly secondaryIconUrl = input<string | undefined>(undefined);
  readonly spinDone = output<void>();

  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private animFrame: number | null = null;
  private currentAngle = -Math.PI / 2; // start with first segment at top
  private phase: 'idle' | 'spinning' | 'decelerating' | 'done' = 'idle';
  private decelerateStart = 0;
  private decelerateFromAngle = 0;
  private decelerateTargetAngle = 0;
  private readonly DECELERATE_MS = 4000;
  private readonly SPIN_VELOCITY = 0.065;
  private canvasReady = false;

  private hubPrimaryImg: HTMLImageElement | null = null;
  private hubSecondaryImg: HTMLImageElement | null = null;

  // Vibrant Wheel-of-Fortune palette
  private readonly COLORS = ['#1a56db', '#f97316', '#16a34a', '#ef4444', '#8b5cf6', '#d97706', '#14b8a6', '#db2777'];

  constructor() {
    effect(() => {
      const url = this.itemIconUrl();
      if (url) {
        const img = new Image();
        img.onload = () => {
          this.hubPrimaryImg = img;
          if (this.canvasReady) this.drawWheel();
        };
        img.src = url;
      } else {
        this.hubPrimaryImg = null;
      }
    });

    effect(() => {
      const url = this.secondaryIconUrl();
      if (url) {
        const img = new Image();
        img.onload = () => {
          this.hubSecondaryImg = img;
          if (this.canvasReady) this.drawWheel();
        };
        img.src = url;
      } else {
        this.hubSecondaryImg = null;
      }
    });

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
    const outerR = cx - 8;
    const hubR = Math.min(44, Math.round(outerR * 0.28));
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
      const baseColor = raiders[i].color ?? this.COLORS[i % this.COLORS.length];
      // Slightly darken very bright class colors (e.g. Mage #FFF468) for readability
      const effectiveColor = this.cap(baseColor);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, start, end);
      ctx.closePath();

      if (isWinner) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, this.lighten(effectiveColor, 60));
        grad.addColorStop(1, this.lighten(effectiveColor, 20));
        ctx.fillStyle = grad;
        ctx.shadowColor = '#f0c040';
        ctx.shadowBlur = 22;
      } else {
        const grad = ctx.createRadialGradient(cx, cy, hubR, cx, cy, outerR);
        grad.addColorStop(0, this.lighten(effectiveColor, 28));
        grad.addColorStop(1, this.darken(effectiveColor, 12));
        ctx.fillStyle = grad;
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // ── Segment text ──
      ctx.save();
      const midAngle = start + segAngle / 2;
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);
      ctx.textAlign = 'right';
      const fontSize = n > 10 ? 9 : n > 7 ? 11 : 13;
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 3;
      const raw = raiders[i].name;
      const label = raw.length > 14 ? raw.slice(0, 13) + '…' : raw;
      ctx.fillText(label, outerR - 14, 4);
      ctx.restore();
    }

    // ── Gold outer ring ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
    if (this.phase === 'done') {
      ctx.strokeStyle = '#4ade80';
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 14;
    } else {
      const ringGrad = ctx.createLinearGradient(cx - outerR, cy, cx + outerR, cy);
      ringGrad.addColorStop(0, '#92660a');
      ringGrad.addColorStop(0.25, '#f0c040');
      ringGrad.addColorStop(0.5, '#c9a84c');
      ringGrad.addColorStop(0.75, '#f0c040');
      ringGrad.addColorStop(1, '#92660a');
      ctx.strokeStyle = ringGrad;
      if (this.phase === 'spinning' || this.phase === 'decelerating') {
        ctx.shadowColor = '#f0c040';
        ctx.shadowBlur = 14;
      }
    }
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();

    // ── Segment-boundary notch triangles on outer rim ──
    for (let i = 0; i < n; i++) {
      const angle = this.currentAngle + i * segAngle;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx + (outerR + 3) * Math.cos(angle - 0.055), cy + (outerR + 3) * Math.sin(angle - 0.055));
      ctx.lineTo(cx + (outerR + 3) * Math.cos(angle + 0.055), cy + (outerR + 3) * Math.sin(angle + 0.055));
      ctx.lineTo(cx + (outerR - 5) * Math.cos(angle), cy + (outerR - 5) * Math.sin(angle));
      ctx.closePath();
      ctx.fillStyle = '#f0c040';
      ctx.fill();
      ctx.restore();
    }

    // ── Hub background ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, 2 * Math.PI);
    const hubGrad = ctx.createRadialGradient(cx - hubR * 0.3, cy - hubR * 0.3, 1, cx, cy, hubR);
    hubGrad.addColorStop(0, '#1f2937');
    hubGrad.addColorStop(1, '#0d1117');
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.restore();

    // ── Item icon in hub ──
    const iconR = hubR - 5;
    if (this.hubPrimaryImg && this.hubSecondaryImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, iconR, 0, 2 * Math.PI);
      ctx.clip();

      // Primary: top-left triangle
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - iconR - 1, cy - iconR - 1);
      ctx.lineTo(cx + iconR + 1, cy - iconR - 1);
      ctx.lineTo(cx - iconR - 1, cy + iconR + 1);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(this.hubPrimaryImg, cx - iconR, cy - iconR, iconR * 2, iconR * 2);
      ctx.restore();

      // Secondary: bottom-right triangle
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx + iconR + 1, cy - iconR - 1);
      ctx.lineTo(cx + iconR + 1, cy + iconR + 1);
      ctx.lineTo(cx - iconR - 1, cy + iconR + 1);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(this.hubSecondaryImg, cx - iconR, cy - iconR, iconR * 2, iconR * 2);
      ctx.restore();

      // Diagonal divider line
      ctx.beginPath();
      ctx.moveTo(cx - iconR, cy + iconR);
      ctx.lineTo(cx + iconR, cy - iconR);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    } else if (this.hubPrimaryImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, iconR, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(this.hubPrimaryImg, cx - iconR, cy - iconR, iconR * 2, iconR * 2);
      ctx.restore();
    }

    // ── Hub gold ring ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(240,192,64,0.8)';
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

  private darken(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `rgb(${r},${g},${b})`;
  }

  /** Clamp perceived brightness so very pale colors (e.g. Priest white, Rogue yellow) stay readable on the wheel. */
  private cap(hex: string): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness < 180) return hex;
    const scale = 0.65;
    const nr = Math.round(r * scale);
    const ng = Math.round(g * scale);
    const nb = Math.round(b * scale);
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.stopAll();
  }
}
