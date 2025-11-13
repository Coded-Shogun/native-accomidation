/**
 * Registration Form Component
 * Client-side form with comprehensive validation
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { validateSAIdNumber } from '@/lib/utils';

const registerSchema = z
  .object({
    // Personal Information
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().regex(/^(\+27|0)[0-9]{9}$/, 'Please enter a valid SA phone number'),
    idNumber: z.string().refine((val) => validateSAIdNumber(val), {
      message: 'Please enter a valid South African ID number',
    }),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),

    // University Information
    universityName: z.string().min(2, 'University name is required'),
    courseOfStudy: z.string().min(2, 'Course of study is required'),
    yearOfStudy: z.string().min(1, 'Year of study is required'),
    studentNumber: z.string().min(5, 'Student number is required'),

    // Address
    homeAddress: z.string().min(5, 'Home address is required'),
    homeCity: z.string().min(2, 'City is required'),
    homeProvince: z.string().min(2, 'Province is required'),
    homePostalCode: z.string().min(4, 'Postal code is required'),

    // Emergency Contact
    emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
    emergencyContactPhone: z.string().regex(/^(\+27|0)[0-9]{9}$/, 'Please enter a valid phone number'),
    emergencyRelationship: z.string().min(2, 'Relationship is required'),

    // Account
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),

    // NSFAS
    nsfasBeneficiary: z.boolean(),
    nsfasReference: z.string().optional(),

    // Terms
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.nsfasBeneficiary && !data.nsfasReference) {
        return false;
      }
      return true;
    },
    {
      message: 'NSFAS reference is required for beneficiaries',
      path: ['nsfasReference'],
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nsfasBeneficiary: false,
      acceptTerms: false,
    },
  });

  const nsfasBeneficiary = watch('nsfasBeneficiary');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      alert(error instanceof Error ? error.message : 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-6 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
        <h3 className="mt-4 text-lg font-semibold text-green-900">
          Registration Successful!
        </h3>
        <p className="mt-2 text-sm text-green-700">
          Redirecting you to the login page...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-foreground">
              First Name *
            </label>
            <input
              {...register('firstName')}
              id="firstName"
              type="text"
              autoComplete="given-name"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
              aria-invalid={errors.firstName ? 'true' : 'false'}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-foreground">
              Last Name *
            </label>
            <input
              {...register('lastName')}
              id="lastName"
              type="text"
              autoComplete="family-name"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              disabled={isLoading}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email Address *
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            disabled={isLoading}
          />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground">
              Phone Number *
            </label>
            <input
              {...register('phone')}
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="0821234567"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              disabled={isLoading}
            />
            {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>}
          </div>

          {/* ID Number */}
          <div>
            <label htmlFor="idNumber" className="block text-sm font-medium text-foreground">
              SA ID Number *
            </label>
            <input
              {...register('idNumber')}
              id="idNumber"
              type="text"
              maxLength={13}
              placeholder="0001010000000"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              disabled={isLoading}
            />
            {errors.idNumber && (
              <p className="mt-1 text-sm text-destructive">{errors.idNumber.message}</p>
            )}
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground">
            Date of Birth *
          </label>
          <input
            {...register('dateOfBirth')}
            id="dateOfBirth"
            type="date"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            disabled={isLoading}
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-sm text-destructive">{errors.dateOfBirth.message}</p>
          )}
        </div>
      </div>

      {/* University Information */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground">University Information</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* University Name */}
          <div>
            <label htmlFor="universityName" className="block text-sm font-medium text-foreground">
              University Name *
            </label>
            <input
              {...register('universityName')}
              id="universityName"
              type="text"
              placeholder="e.g., University of Cape Town"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              disabled={isLoading}
            />
            {errors.universityName && (
              <p className="mt-1 text-sm text-destructive">{errors.universityName.message}</p>
            )}
          </div>

          {/* Student Number */}
          <div>
            <label htmlFor="studentNumber" className="block text-sm font-medium text-foreground">
              Student Number *
            </label>
            <input
              {...register('studentNumber')}
              id="studentNumber"
              type="text"
              placeholder="STDNT123456"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              disabled={isLoading}
            />
            {errors.studentNumber && (
              <p className="mt-1 text-sm text-destructive">{errors.studentNumber.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Course of Study */}
          <div>
            <label htmlFor="courseOfStudy" className="block text-sm font-medium text-foreground">
              Course of Study *
            </label>
            <input
              {...register('courseOfStudy')}
              id="courseOfStudy"
              type="text"
              placeholder="e.g., Computer Science"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              disabled={isLoading}
            />
            {errors.courseOfStudy && (
              <p className="mt-1 text-sm text-destructive">{errors.courseOfStudy.message}</p>
            )}
          </div>

          {/* Year of Study */}
          <div>
            <label htmlFor="yearOfStudy" className="block text-sm font-medium text-foreground">
              Year of Study *
            </label>
            <select
              {...register('yearOfStudy')}
              id="yearOfStudy"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              disabled={isLoading}
            >
              <option value="">Select year...</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year+</option>
            </select>
            {errors.yearOfStudy && (
              <p className="mt-1 text-sm text-destructive">{errors.yearOfStudy.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* NSFAS Information */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground">NSFAS Information</h3>

        {/* NSFAS Beneficiary Checkbox */}
        <div className="flex items-start">
          <input
            {...register('nsfasBeneficiary')}
            id="nsfasBeneficiary"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <label htmlFor="nsfasBeneficiary" className="ml-2 text-sm text-foreground">
            I am an NSFAS beneficiary
          </label>
        </div>

        {/* NSFAS Reference (conditional) */}
        {nsfasBeneficiary && (
          <div>
            <label htmlFor="nsfasReference" className="block text-sm font-medium text-foreground">
              NSFAS Reference Number *
            </label>
            <input
              {...register('nsfasReference')}
              id="nsfasReference"
              type="text"
              placeholder="NSFAS123456789"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
              disabled={isLoading}
            />
            {errors.nsfasReference && (
              <p className="mt-1 text-sm text-destructive">{errors.nsfasReference.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Password */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="text-lg font-semibold text-foreground">Create Password</h3>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password *
          </label>
          <div className="relative mt-1">
            <input
              {...register('password')}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-foreground"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            Confirm Password *
          </label>
          <div className="relative mt-1">
            <input
              {...register('confirmPassword')}
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-foreground"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="border-t border-border pt-6">
        <div className="flex items-start">
          <input
            {...register('acceptTerms')}
            id="acceptTerms"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <label htmlFor="acceptTerms" className="ml-2 text-sm text-foreground">
            I accept the{' '}
            <a href="/terms" className="text-primary underline hover:no-underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary underline hover:no-underline">
              Privacy Policy
            </a>
            *
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="mt-1 text-sm text-destructive">{errors.acceptTerms.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  );
}
