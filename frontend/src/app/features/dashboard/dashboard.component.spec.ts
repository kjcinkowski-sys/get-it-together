import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { TodayIdentity } from '../../core/models/dashboard.model';
import { HabitLogStatus } from '../../core/models/habit-log.model';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { HabitLogService } from '../../core/services/habit-log.service';
import { HabitService } from '../../core/services/habit.service';
import { IdentityService } from '../../core/services/identity.service';
import { DashboardComponent } from './dashboard.component';

function identityWith(status: HabitLogStatus | null): TodayIdentity[] {
  return [
    {
      id: 'i1',
      statement: 'I am a runner',
      companion: 'Sprite',
      strength: 50,
      stage: 1,
      stageName: 'Sprout',
      habits: [{ id: 'h1', name: 'Run', frequencyType: 'Daily', targetPerWeek: 5, todayStatus: status }],
    },
  ];
}

describe('DashboardComponent tap-to-cycle', () => {
  let component: DashboardComponent;
  let checkInSpy: jasmine.Spy;

  beforeEach(async () => {
    checkInSpy = jasmine.createSpy('checkIn').and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: DashboardService, useValue: { today: () => of([]) } },
        { provide: HabitLogService, useValue: { checkIn: checkInSpy } },
        { provide: HabitService, useValue: { archive: () => of(void 0) } },
        { provide: IdentityService, useValue: { archive: () => of(void 0) } },
        { provide: AuthService, useValue: { currentUser: () => null, logout: () => {} } },
      ],
    }).compileComponents();

    component = TestBed.createComponent(DashboardComponent).componentInstance;
  });

  const cases: Array<[HabitLogStatus | null, HabitLogStatus]> = [
    [null, 'Completed'],
    ['Completed', 'Partial'],
    ['Partial', 'Missed'],
    ['Missed', 'Completed'],
  ];

  for (const [from, to] of cases) {
    it(`cycles ${from ?? 'unset'} → ${to}`, () => {
      component.identities.set(identityWith(from));
      component.cycleStatus(component.identities()[0].habits[0]);
      expect(checkInSpy).toHaveBeenCalledWith('h1', jasmine.any(String), to);
    });
  }

  it('applies the new status to the habit after a successful check-in', () => {
    component.identities.set(identityWith(null));
    component.cycleStatus(component.identities()[0].habits[0]);
    expect(component.identities()[0].habits[0].todayStatus).toBe('Completed');
  });

  it('ignores taps while a check-in is already in flight', () => {
    // A subject that never emits keeps pendingHabitId set, simulating a slow request.
    checkInSpy.and.returnValue(new Subject());
    component.identities.set(identityWith(null));
    const habit = component.identities()[0].habits[0];
    component.cycleStatus(habit);
    component.cycleStatus(habit);
    expect(checkInSpy).toHaveBeenCalledTimes(1);
  });
});
