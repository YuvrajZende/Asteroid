'use client'
import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'

export default function SignInPage() {
  return (
    <div className='min-h-screen flex'>
      {/* Left Panel - Branding */}
      <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0b0f14] via-[#111827] to-[#1a2332] relative overflow-hidden'>
        {/* Decorative elements */}
        <div className='absolute inset-0'>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-[#82c8e5]/10 rounded-full blur-3xl' />
          <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#82c8e5]/5 rounded-full blur-3xl' />
        </div>

        {/* Content */}
        <div className='relative z-10 flex flex-col justify-center px-16 text-white'>
          {/* Logo */}
          <div className='mb-12'>
            <Image
              src='/logo-white.png'
              alt='Asteroid'
              width={200}
              height={60}
              className='object-contain'
            />
          </div>

          {/* Welcome Text */}
          <h1
            className='text-5xl mb-6 text-white/95'
            style={{
              fontFamily: 'var(--font-serif), "Libre Baskerville", Georgia, serif',
              fontWeight: 400,
              letterSpacing: '-0.02em'
            }}
          >
            Welcome back
          </h1>
          <p className='text-xl text-white/70 mb-12 max-w-md leading-relaxed'>
            Your AI-powered search companion. Discover, research, and explore with intelligent answers.
          </p>

          {/* Features */}
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-[#82c8e5]/20 flex items-center justify-center'>
                <svg className='w-5 h-5 text-[#82c8e5]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                </svg>
              </div>
              <span className='text-white/80'>Intelligent web search</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-[#82c8e5]/20 flex items-center justify-center'>
                <svg className='w-5 h-5 text-[#82c8e5]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' />
                </svg>
              </div>
              <span className='text-white/80'>Deep Think mode for research</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-[#82c8e5]/20 flex items-center justify-center'>
                <svg className='w-5 h-5 text-[#82c8e5]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
                </svg>
              </div>
              <span className='text-white/80'>Personal search library</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-[#0b0f14]'>
        <div className='w-full max-w-md'>
          {/* Mobile Logo */}
          <div className='lg:hidden mb-8 flex justify-center'>
            <Image
              src='/logo.png'
              alt='Asteroid'
              width={180}
              height={50}
              className='object-contain dark:hidden'
            />
            <Image
              src='/logo-white.png'
              alt='Asteroid'
              width={180}
              height={50}
              className='object-contain hidden dark:block'
            />
          </div>

          {/* Mobile Welcome Text */}
          <div className='lg:hidden text-center mb-8'>
            <h1
              className='text-3xl text-gray-900 dark:text-white mb-2'
              style={{
                fontFamily: 'var(--font-serif), "Libre Baskerville", Georgia, serif',
                fontWeight: 400
              }}
            >
              Welcome back
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>Sign in to continue to Asteroid</p>
          </div>

          {/* Desktop heading */}
          <div className='hidden lg:block text-center mb-8'>
            <h2 className='text-2xl font-semibold text-gray-900 dark:text-white mb-2'>Sign in to your account</h2>
            <p className='text-gray-600 dark:text-gray-400'>Enter your details below</p>
          </div>

          {/* Clerk SignIn Component */}
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-0 bg-transparent w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl py-3 font-medium transition-all hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200",
                socialButtonsBlockButtonText: "font-medium text-gray-700 dark:text-gray-200",
                socialButtonsBlockButtonArrow: "text-gray-500",
                dividerLine: "bg-gray-200 dark:bg-gray-700",
                dividerText: "text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-[#0b0f14]",
                formFieldLabel: "text-gray-700 dark:text-gray-200 font-medium text-sm mb-1.5",
                formFieldInput: "rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-3 px-4 focus:border-[#82c8e5] focus:ring-2 focus:ring-[#82c8e5]/20 transition-all placeholder:text-gray-400",
                formButtonPrimary: "bg-[#0f172a] hover:bg-[#1e293b] dark:bg-[#82c8e5] dark:hover:bg-[#6bb8d8] rounded-xl py-3 font-semibold text-white dark:text-[#0f172a] transition-all",
                footerActionLink: "text-[#82c8e5] hover:text-[#5fb4d6] font-medium",
                footerActionText: "text-gray-600 dark:text-gray-400",
                identityPreviewEditButton: "text-[#82c8e5]",
                formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                alert: "rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
                alertText: "text-sm text-red-700 dark:text-red-300",
                formFieldLabelRow: "mb-1",
                formFieldHintText: "text-gray-500 text-xs",
                otpCodeFieldInput: "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg",
              },
              variables: {
                colorPrimary: "#82c8e5",
                colorText: "#1f2937",
                colorTextSecondary: "#6b7280",
                colorBackground: "transparent",
                borderRadius: "0.75rem",
              }
            }}
            routing="path"
            path="/sign-in"
          />
        </div>
      </div>
    </div>
  )
}