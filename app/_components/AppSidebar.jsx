'use client'
import React from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Compass, GalleryHorizontalEnd, LogIn, LogOut, Search } from 'lucide-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperclip } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { SignUpButton, SignInButton, UserButton, useUser, useClerk } from '@clerk/nextjs'

// Custom Research icon component using FontAwesome
const ResearchIcon = ({ className }) => (
    <FontAwesomeIcon icon={faPaperclip} className={className} />
)

const MenuOptions = [
    {
        title: 'Home',
        icon: Search,
        path: '/search',
    },
    {
        title: 'Discover',
        icon: Compass,
        path: '/discover',
    },
    {
        title: 'Research',
        icon: ResearchIcon,
        path: '/research',
    },
    {
        title: 'Library',
        icon: GalleryHorizontalEnd,
        path: '/library',
    },
    {
        title: 'Sign In',
        icon: LogIn,
        path: '/sign-in',
        authRequired: false
    },
    {
        title: 'Logout',
        icon: LogOut,
        path: '#',
        authRequired: true
    }
]

function AppSidebar() {
    const pathname = usePathname()
    const { isSignedIn, user } = useUser()
    const { signOut } = useClerk()
    const { theme } = useTheme()

    return (
        <Sidebar>
            <SidebarHeader className='bg-sidebar flex items-center justify-center py-4 px-4'>
                <div className='bg-transparent p-1 rounded-lg'>
                    <Image
                        src={theme === 'dark' ? '/logo-white.png' : '/logo.png'}
                        alt='Logo'
                        width={140}
                        height={60}
                        className='object-contain'
                    />
                </div>
            </SidebarHeader>
            <SidebarContent className='bg-sidebar px-3 pt-2'>
                <SidebarGroup>
                    <SidebarMenu className='space-y-2'>
                        {MenuOptions.filter(menu => {
                            if (menu.title === 'Sign In' && isSignedIn) return false;
                            if (menu.title === 'Logout' && !isSignedIn) return false;
                            return true;
                        }).map((menu, index) => {
                            const isActive = pathname === menu.path || (menu.path === '/' && pathname === '/')

                            if (menu.title === 'Sign In') {
                                return (
                                    <SidebarMenuItem key={index}>
                                        <SignInButton mode="modal">
                                            <SidebarMenuButton
                                                className="w-full justify-start px-3 py-3 transition-colors duration-200 hover:bg-primary/10 hover:text-primary cursor-pointer"
                                            >
                                                <menu.icon className='h-5 w-5 flex-shrink-0' />
                                                <span className='text-base font-medium'>
                                                    {menu.title}
                                                </span>
                                            </SidebarMenuButton>
                                        </SignInButton>
                                    </SidebarMenuItem>
                                )
                            }

                            if (menu.title === 'Logout') {
                                return (
                                    <SidebarMenuItem key={index}>
                                        <SidebarMenuButton
                                            onClick={() => signOut()}
                                            className="w-full justify-start px-3 py-3 transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                        >
                                            <menu.icon className='h-5 w-5 flex-shrink-0' />
                                            <span className='text-base font-medium'>
                                                {menu.title}
                                            </span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            }

                            return (
                                <SidebarMenuItem key={index}>
                                    <SidebarMenuButton
                                        asChild
                                        className={`w-full justify-start px-3 py-3 transition-colors duration-200 ${isActive
                                            ? 'bg-muted text-foreground font-semibold'
                                            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <Link href={menu.path} className='flex items-center gap-3'>
                                            <menu.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'font-bold' : ''}`} />
                                            <span className={`text-base ${isActive ? 'font-semibold' : 'font-normal'}`}>
                                                {menu.title}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                    {!isSignedIn && (
                        <div className='px-2 mt-4'>
                            <SignUpButton mode="modal">
                                <Button className='w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground'>
                                    Sign Up
                                </Button>
                            </SignUpButton>
                        </div>
                    )}
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className='bg-sidebar p-4'>
                {isSignedIn && user && (
                    <div className='flex items-center gap-3 p-3 bg-background/50 rounded-lg border'>
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-10 h-10"
                                }
                            }}
                        />
                        <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-foreground truncate'>
                                {user.fullName || user.firstName || 'User'}
                            </p>
                            <p className='text-xs text-muted-foreground truncate'>
                                {user.primaryEmailAddress?.emailAddress}
                            </p>
                        </div>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar
