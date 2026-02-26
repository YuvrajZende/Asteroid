'use client'
import { SignUp } from '@clerk/nextjs'
import Image from 'next/image'

export default function SignUpPage() {
    return (
        <div className='min-h-screen flex'>
            {/* Left Panel - Branding */}
            <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0b0f14] via-[#111827] to-[#1a2332] relative overflow-hidden'>
                {/* Decorative elements */}
                <div className='absolute inset-0'>
                    <div className='absolute top-1/3 left-1/4 w-96 h-96 bg-[#82c8e5]/10 rounded-full blur-3xl' />
                    <div className='absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#82c8e5]/5 rounded-full blur-3xl' />
                    <div className='absolute top-1/2 right-1/3 w-64 h-64 bg-[#c9fdf2]/5 rounded-full blur-3xl' />
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
                        Get started
                    </h1>
                    <p className='text-xl text-white/70 mb-12 max-w-md leading-relaxed'>
                        Create your account and unlock the power of AI-driven search and discovery.
                    </p>

                    {/* Benefits */}
                    <div className='space-y-5'>
                        <div className='flex items-start gap-4'>
                            <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-[#82c8e5]/30 to-[#82c8e5]/10 flex items-center justify-center flex-shrink-0'>
                                <svg className='w-6 h-6 text-[#82c8e5]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                                </svg>
                            </div>
                            <div>
                                <h3 className='text-white font-medium mb-1'>Lightning Fast</h3>
                                <p className='text-white/60 text-sm'>Get instant AI-powered answers from across the web</p>
                            </div>
                        </div>
                        <div className='flex items-start gap-4'>
                            <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-[#82c8e5]/30 to-[#82c8e5]/10 flex items-center justify-center flex-shrink-0'>
                                <svg className='w-6 h-6 text-[#82c8e5]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' />
                                </svg>
                            </div>
                            <div>
                                <h3 className='text-white font-medium mb-1'>Research Mode</h3>
                                <p className='text-white/60 text-sm'>Deep dive into academic papers and publications</p>
                            </div>
                        </div>
                        <div className='flex items-start gap-4'>
                            <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-[#82c8e5]/30 to-[#82c8e5]/10 flex items-center justify-center flex-shrink-0'>
                                <svg className='w-6 h-6 text-[#82c8e5]' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' />
                                </svg>
                            </div>
                            <div>
                                <h3 className='text-white font-medium mb-1'>Multiple AI Models</h3>
                                <p className='text-white/60 text-sm'>Choose from GPT-4, Claude, Gemini & more</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Sign Up Form */}
            <div className='w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-[#0b0f14] overflow-y-auto'>
                <div className='w-full max-w-md py-8'>
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
                            Get started
                        </h1>
                        <p className='text-gray-600 dark:text-gray-400'>Create your Asteroid account</p>
                    </div>

                    {/* Desktop heading */}
                    <div className='hidden lg:block text-center mb-8'>
                        <h2 className='text-2xl font-semibold text-gray-900 dark:text-white mb-2'>Create your account</h2>
                        <p className='text-gray-600 dark:text-gray-400'>Start your journey with Asteroid</p>
                    </div>

                    {/* Clerk SignUp Component */}
                    <SignUp
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "shadow-none border-0 bg-transparent w-full",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsBlockButton: "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl py-3 font-medium transition-all hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200",
                                socialButtonsBlockButtonText: "font-medium text-gray-700 dark:text-gray-200",
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
                                formFieldRow: "flex gap-4",
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
                        path="/sign-up"
                    />
                </div>
            </div>
        </div>
    )
}