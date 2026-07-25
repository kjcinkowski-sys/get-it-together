import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompanionComponent } from '../../shared/companion/companion.component';
import { LogoComponent } from '../../shared/logo/logo.component';
import { StatsIdentity } from '../../core/models/stats.model';
import { StatsService } from '../../core/services/stats.service';

@Component({
  selector: 'app-stats',
  imports: [RouterLink, CompanionComponent, LogoComponent],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
})
export class StatsComponent implements OnInit {
  readonly identities = signal<StatsIdentity[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor(private readonly statsService: StatsService) {}

  ngOnInit(): void {
    this.statsService.overview().subscribe({
      next: (identities) => {
        this.identities.set(identities);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load your stats. Please refresh.');
        this.loading.set(false);
      },
    });
  }

  /** A short human summary of a habit's schedule, e.g. "Daily" or "Mon · Wed · Fri". */
  scheduleLabel(scheduledDays: number[]): string {
    if (scheduledDays.length >= 7) return 'Daily';

    const abbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekOrder = [1, 2, 3, 4, 5, 6, 0];
    return weekOrder
      .filter((day) => scheduledDays.includes(day))
      .map((day) => abbr[day])
      .join(' · ');
  }

  /** Short caption next to the stage name, e.g. "45% to next" or "fully grown". */
  growthCaption(identity: StatsIdentity): string {
    if (identity.stage >= 4) return 'fully grown';
    return `${identity.stageProgress}% to next`;
  }
}
