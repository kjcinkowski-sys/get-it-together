import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toIsoDate, todayIso } from '../../core/util/date.util';

interface CalendarCell {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

@Component({
  selector: 'app-calendar',
  imports: [],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent {
  readonly today = todayIso();
  readonly weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // The month on screen, anchored to the 1st. Starts on the current month.
  private readonly anchor = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  readonly monthLabel = computed(() =>
    this.anchor().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
  );

  readonly weeks = computed<CalendarCell[][]>(() => this.buildMonth(this.anchor()));

  constructor(private readonly router: Router) {}

  previousMonth(): void {
    const a = this.anchor();
    this.anchor.set(new Date(a.getFullYear(), a.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const a = this.anchor();
    this.anchor.set(new Date(a.getFullYear(), a.getMonth() + 1, 1));
  }

  selectDay(cell: CalendarCell): void {
    if (cell.isFuture) return;
    // Drive the "My Identity" view via its date query param; today keeps the URL clean.
    this.router.navigate(['/'], {
      queryParams: { date: cell.iso === this.today ? null : cell.iso },
    });
  }

  private buildMonth(anchor: Date): CalendarCell[][] {
    const month = anchor.getMonth();
    const year = anchor.getFullYear();
    // Back up to the Sunday on or before the 1st, then lay out a fixed 6-week grid.
    const start = new Date(year, month, 1 - new Date(year, month, 1).getDay());

    const weeks: CalendarCell[][] = [];
    for (let w = 0; w < 6; w++) {
      const row: CalendarCell[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
        const iso = toIsoDate(date);
        row.push({
          iso,
          day: date.getDate(),
          inMonth: date.getMonth() === month,
          isToday: iso === this.today,
          isFuture: iso > this.today,
        });
      }
      weeks.push(row);
    }
    return weeks;
  }
}
