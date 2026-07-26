import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ThemePreference, ThemeService } from '../../core/services/theme.service';

/** Largest file we'll turn into a data URL, matching the API's ~1.5 MB avatar cap. */
const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024;

function supportedTimeZones(): string[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  if (typeof intl.supportedValuesOf === 'function') {
    try {
      return intl.supportedValuesOf('timeZone');
    } catch {
      // Fall through to the minimal list below.
    }
  }
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
  ];
}

function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly themeOptions: ReadonlyArray<{ value: ThemePreference; label: string }> = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  readonly timeZones = supportedTimeZones();
  readonly detectedTimeZone = detectTimeZone();

  readonly loading = signal(true);
  readonly loadError = signal(false);

  // Avatar is tracked outside the reactive form: `avatarUrl` is what's shown, and
  // `avatarDirty` records whether the user changed it this session so we only send
  // an avatar update when they actually touched it.
  readonly avatarUrl = signal<string | null>(null);
  private readonly avatarDirty = signal(false);
  readonly avatarError = signal<string | null>(null);

  readonly profileForm = this.fb.nonNullable.group({
    displayName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    timeZone: [''],
  });

  readonly savingProfile = signal(false);
  readonly profileError = signal<string | null>(null);
  readonly profileSaved = signal(false);

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  readonly savingPassword = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSaved = signal(false);

  readonly initials = computed(() => {
    const name = this.profileForm.controls.displayName.value.trim();
    if (!name) return '?';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  ngOnInit(): void {
    this.profileService.get().subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          displayName: profile.displayName,
          email: profile.email,
          timeZone: profile.timeZone ?? this.detectedTimeZone,
        });
        this.avatarUrl.set(profile.avatarUrl ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarError.set(null);

    if (!file.type.startsWith('image/')) {
      this.avatarError.set('Please choose an image file.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      this.avatarError.set('That image is too large. Please choose one under 1.5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarUrl.set(reader.result as string);
      this.avatarDirty.set(true);
    };
    reader.onerror = () => this.avatarError.set('Could not read that file. Please try another.');
    reader.readAsDataURL(file);

    // Let the same file be re-picked after a removal.
    input.value = '';
  }

  removeAvatar(): void {
    this.avatarUrl.set(null);
    this.avatarDirty.set(true);
    this.avatarError.set(null);
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.savingProfile()) return;

    this.savingProfile.set(true);
    this.profileError.set(null);
    this.profileSaved.set(false);

    const { displayName, email, timeZone } = this.profileForm.getRawValue();
    const avatarUrl = this.avatarDirty() ? (this.avatarUrl() ?? '') : null;

    this.profileService
      .update({ displayName, email, timeZone: timeZone || null, avatarUrl })
      .subscribe({
        next: (profile) => {
          this.savingProfile.set(false);
          this.profileSaved.set(true);
          this.avatarDirty.set(false);
          this.avatarUrl.set(profile.avatarUrl ?? null);
          this.authService.updateCurrentUser({
            displayName: profile.displayName,
            email: profile.email,
            avatarUrl: profile.avatarUrl,
            timeZone: profile.timeZone,
          });
        },
        error: (err: HttpErrorResponse) => {
          this.savingProfile.set(false);
          this.profileError.set(
            err.status === 409
              ? 'An account with this email already exists.'
              : (err.error?.message ?? 'Could not save your profile. Please try again.'),
          );
        },
      });
  }

  savePassword(): void {
    if (this.passwordForm.invalid || this.savingPassword()) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.passwordError.set("New passwords don't match.");
      return;
    }

    this.savingPassword.set(true);
    this.passwordError.set(null);
    this.passwordSaved.set(false);

    this.profileService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordSaved.set(true);
        this.passwordForm.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.savingPassword.set(false);
        this.passwordError.set(
          err.error?.message ?? 'Could not change your password. Please try again.',
        );
      },
    });
  }
}
