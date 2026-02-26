'use client'

import Image from 'next/image'
import React, { useState } from 'react'
import { Globe, Sparkles, SendHorizontal, Plus, X, LogIn, Loader2, ChevronDown, Check, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser, SignInButton } from '@clerk/nextjs'
import { supabase } from '@/services/supabase'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/ThemeContext'
import { useSearch } from '@/context/SearchContext'
import { AIModelsOptions } from '@/services/Shared'

function ChatInputBox() {
    const [userSearchInput, setUserSearchInput] = useState('')
    const { user, isSignedIn } = useUser()
    const [searchMode, setSearchMode] = useState('web') // 'web' or 'deep'
    const [selectedModel, setSelectedModel] = useState(AIModelsOptions[0]) // Default to first model
    const [loading, setLoading] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const router = useRouter()
    const { theme } = useTheme()
    const { recentSearches, addSearch } = useSearch()

    const onSearchQuery = async () => {
        if (!userSearchInput.trim()) return

        if (!isSignedIn) {
            setShowAuthModal(true)
            return
        }

        setLoading(true)
        try {
            const libId = uuidv4()
            const searchData = {
                searchInput: userSearchInput,
                userEmail: user?.primaryEmailAddress?.emailAddress,
                type: searchMode === 'deep' ? 'Research' : 'Search',
                libId: libId,
                aiModel: selectedModel.id
            }

            const { error } = await supabase.from('Library').insert([searchData])

            if (error) {
                console.error('Error saving search:', error)
                return
            }

            // Save to context for persistence
            addSearch(searchData)

            // Clear input and navigate
            setUserSearchInput('')
            router.push(`/search/${libId}?model=${selectedModel.id}`)
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && userSearchInput.trim()) {
            e.preventDefault()
            onSearchQuery()
        }
    }

    const userName = user?.firstName || user?.fullName?.split(' ')[0] || 'there'

    return (
        <div className='flex flex-col min-h-[calc(100vh-80px)] items-center justify-center w-full px-4'>
            {/* Logo */}
            <div className='mb-8'>
                <Image
                    src={theme === 'dark' ? '/logo-white.png' : '/logo.png'}
                    alt='Asteroid'
                    width={380}
                    height={120}
                    priority
                    className='object-contain'
                />
            </div>

            {/* Greeting */}
            <h1 className='text-4xl md:text-5xl font-semibold text-foreground mb-12 text-center'>
                Hi, {isSignedIn ? userName : 'there'}
            </h1>

            {/* Search Input Container */}
            <div className='w-full max-w-2xl'>
                <div className='bg-card border border-border rounded-2xl shadow-lg overflow-hidden'>
                    {/* Input Field */}
                    <div className='px-5 py-4'>
                        <input
                            type='text'
                            placeholder='How can I help you today?'
                            value={userSearchInput}
                            onChange={(e) => setUserSearchInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className='w-full text-lg bg-transparent outline-none placeholder:text-muted-foreground/60 text-foreground'
                        />
                    </div>

                    {/* Bottom Action Bar */}
                    <div className='flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/30'>
                        <div className='flex items-center gap-2'>
                            {/* Plus Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className='h-8 w-8 p-0 rounded-lg hover:bg-muted'
                            >
                                <Plus className='h-4 w-4 text-muted-foreground' />
                            </Button>

                            {/* Web Search Toggle */}
                            <button
                                onClick={() => setSearchMode('web')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${searchMode === 'web'
                                    ? 'bg-background border border-border text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                            >
                                <Globe className='h-4 w-4' />
                                Web Search
                            </button>

                            {/* Deep Think Toggle */}
                            <button
                                onClick={() => setSearchMode('deep')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${searchMode === 'deep'
                                    ? 'bg-primary/10 border border-primary/30 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                            >
                                <Sparkles className='h-4 w-4' />
                                Deep Think
                            </button>
                        </div>

                        <div className='flex items-center gap-2'>
                            {/* Model Selector Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className='h-8 px-3 rounded-lg hover:bg-muted gap-1.5 text-muted-foreground hover:text-foreground'
                                    >
                                        <span className='text-sm'>{selectedModel.icon}</span>
                                        <span className='text-xs font-medium hidden sm:inline'>{selectedModel.name}</span>
                                        <ChevronDown className='h-3 w-3' />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className='w-64'>
                                    <DropdownMenuLabel className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                                        Model
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {AIModelsOptions.map((model) => (
                                        <DropdownMenuItem
                                            key={model.id}
                                            onClick={() => setSelectedModel(model)}
                                            className='p-3 cursor-pointer flex items-center justify-between'
                                        >
                                            <div className='flex items-center gap-2'>
                                                <span className='text-lg'>{model.icon}</span>
                                                <div>
                                                    <p className='text-sm font-medium'>{model.name}</p>
                                                    <p className='text-xs text-muted-foreground'>{model.description}</p>
                                                </div>
                                            </div>
                                            {selectedModel.id === model.id && (
                                                <Check className='h-4 w-4 text-primary' />
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Send Button */}
                            <Button
                                size="sm"
                                onClick={onSearchQuery}
                                disabled={loading || !userSearchInput.trim()}
                                className='h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50'
                            >
                                {loading ? (
                                    <Loader2 className='h-4 w-4 text-primary-foreground animate-spin' />
                                ) : (
                                    <SendHorizontal className='h-4 w-4 text-primary-foreground' />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sign In Prompt */}
                {!isSignedIn && (
                    <div className='mt-4 text-center'>
                        <SignInButton mode="modal">
                            <button className='text-sm text-muted-foreground hover:text-primary transition-colors'>
                                Sign in to save your searches
                            </button>
                        </SignInButton>
                    </div>
                )}

                {/* Recent Searches */}
                {isSignedIn && recentSearches.length > 0 && (
                    <div className='mt-6 w-full'>
                        <div className='flex items-center gap-2 mb-3'>
                            <Clock className='h-4 w-4 text-muted-foreground' />
                            <span className='text-sm font-medium text-muted-foreground'>Recent Searches</span>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            {recentSearches.slice(0, 5).map((search) => (
                                <button
                                    key={search.libId}
                                    onClick={() => router.push(`/search/${search.libId}?model=${search.aiModel || 'groq'}`)}
                                    className='group flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted rounded-xl border border-border/50 hover:border-primary/30 transition-all text-left'
                                >
                                    <span className='text-sm text-foreground truncate max-w-[200px]'>
                                        {search.searchInput}
                                    </span>
                                    <ArrowRight className='h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all' />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Authentication Modal */}
            {showAuthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md mx-4 bg-background rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
                        <button
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/80 transition-colors z-10"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </button>

                        <div className="p-8 pb-6 text-center bg-gradient-to-b from-primary/10 to-transparent">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Sparkles className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Sign in to continue
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                Create an account or sign in to start searching with AI
                            </p>
                        </div>

                        <div className="p-8 pt-4 space-y-4">
                            <SignInButton mode="modal">
                                <Button
                                    className="w-full h-12 text-base font-medium gap-2 rounded-xl bg-primary hover:bg-primary/90"
                                    onClick={() => setShowAuthModal(false)}
                                >
                                    <LogIn className="h-5 w-5" />
                                    Sign In
                                </Button>
                            </SignInButton>

                            <div className="pt-4 border-t border-border/50">
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                        Multiple AI models to choose from
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                        Save searches to your library
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                        Deep Think mode for research
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatInputBox