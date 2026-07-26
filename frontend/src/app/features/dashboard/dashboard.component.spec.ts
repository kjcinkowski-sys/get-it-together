import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { throwError, of } from 'rxjs';
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
      companionName: null,
      stage: 1,
      stageName: 'Spark',
      stageProgress: 50,
      streakDays: 3,
      habits: [{ id: 'h1', name: 'Run', scheduledDays: [1, 3, 5], currentStreak: 2, status: status }],
    },
  ];
}

describe('DashboardComponent check-in', () => {
  let component: DashboardComponent;
  let checkInSpy: jasmine.Spy;

  beforeEach(async () => {
    checkInSpy = jasmine.createSpy('checkIn').and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: DashboardService, useValue: { forDate: () => of([]) } },
        { provide: HabitLogService, useValue: { checkIn: checkInSpy } },
        { provide: HabitService, useValue: { archive: () => of(void 0) } },
        { provide: IdentityService, useValue: { archive: () => of(void 0) } },
        { provide: AuthService, useValue: { currentUser: () => null, logout: () => {} } },
      ],
    }).compileComponents();

    component = TestBed.createComponent(DashboardComponent).componentInstance;
  });

  const statuses: HabitLogStatus[] = ['Completed', 'Partial', 'Missed'];

  for (const status of statuses) {
    it(`sends a "${status}" check-in for the chosen habit and date`, () => {
      component.identities.set(identityWith(null));
      component.checkIn('h1', status);
      expect(checkInSpy).toHaveBeenCalledWith('h1', component.today, status);
    });

    it(`applies "${status}" to the habit after a successful check-in`, () => {
      component.identities.set(identityWith(null));
      component.checkIn('h1', status);
      expect(component.identities()[0].habits[0].status).toBe(status);
    });
  }

  it('pops an encouraging bubble for the identity when a habit is completed', () => {
    component.identities.set(identityWith(null));
    component.checkIn('h1', 'Completed');
    expect(component.encouragements()['i1']).toBeTruthy();
  });

  it('does not show an encouraging bubble for a partial or missed check-in', () => {
    component.identities.set(identityWith(null));
    component.checkIn('h1', 'Missed');
    expect(component.encouragements()['i1']).toBeUndefined();
  });

  it('surfaces an error and leaves the status unchanged when the check-in fails', () => {
    checkInSpy.and.returnValue(throwError(() => new Error('boom')));
    component.identities.set(identityWith('Completed'));
    component.checkIn('h1', 'Missed');
    expect(component.identities()[0].habits[0].status).toBe('Completed');
    expect(component.errorMessage()).toBeTruthy();
  });
});
