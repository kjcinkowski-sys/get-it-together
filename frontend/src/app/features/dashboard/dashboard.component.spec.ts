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
      habits: [
        { id: 'h1', name: 'Run', type: 'Build', scheduledDays: [1, 3, 5], currentStreak: 2, status },
      ],
    },
  ];
}

function breakIdentityWith(status: HabitLogStatus | null): TodayIdentity[] {
  return [
    {
      id: 'i2',
      statement: 'I am in control',
      companion: 'Sprite',
      companionName: null,
      stage: 1,
      stageName: 'Spark',
      stageProgress: 50,
      streakDays: 5,
      habits: [
        {
          id: 'b1',
          name: 'No late-night snacking',
          type: 'Break',
          scheduledDays: [0, 1, 2, 3, 4, 5, 6],
          currentStreak: 5,
          status,
        },
      ],
    },
  ];
}

describe('DashboardComponent check-in', () => {
  let component: DashboardComponent;
  let checkInSpy: jasmine.Spy;
  let clearSpy: jasmine.Spy;

  beforeEach(async () => {
    checkInSpy = jasmine.createSpy('checkIn').and.returnValue(of({}));
    clearSpy = jasmine.createSpy('clear').and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: DashboardService, useValue: { forDate: () => of([]) } },
        { provide: HabitLogService, useValue: { checkIn: checkInSpy, clear: clearSpy } },
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

  it('surfaces an error and leaves the status unchanged when the check-in fails', () => {
    checkInSpy.and.returnValue(throwError(() => new Error('boom')));
    component.identities.set(identityWith('Completed'));
    component.checkIn('h1', 'Missed');
    expect(component.identities()[0].habits[0].status).toBe('Completed');
    expect(component.errorMessage()).toBeTruthy();
  });

  it('records a break-habit slip as a "Slipped" log and resets the clean streak', () => {
    component.identities.set(breakIdentityWith(null));
    component.checkInBreak('b1', 'Slip');
    expect(checkInSpy).toHaveBeenCalledWith('b1', component.today, 'Slipped');
    expect(component.identities()[0].habits[0].status).toBe('Slipped');
    expect(component.identities()[0].habits[0].currentStreak).toBe(0);
  });

  it('clears the day (no log) when a break habit is marked a success', () => {
    component.identities.set(breakIdentityWith('Slipped'));
    component.checkInBreak('b1', 'Success');
    expect(clearSpy).toHaveBeenCalledWith('b1', component.today);
    expect(checkInSpy).not.toHaveBeenCalled();
    expect(component.identities()[0].habits[0].status).toBeNull();
  });
});
