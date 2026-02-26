'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase'
import { Search, Clock, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSearch } from '@/context/SearchContext'

export default function TopHeader() {
    const { user, isSignedIn } = useUser()
    const [recentSearches, setRecentSearches] = useState([])
    const router = useRouter()
    const pathname = usePathname()
    const { clearSearches, setCurrentSearch } = useSearch()

    useEffect(() => {
        if (isSignedIn && user) {
            fetchRecentSearches()
        }
    }, [isSignedIn, user])

    const fetchRecentSearches = async () => {
        try {
            const { data, error } = await supabase
                .from('Library')
                .select('searchInput, libId, created_at')
                .eq('userEmail', user?.primaryEmailAddress?.emailAddress)
                .order('created_at', { ascending: false })
                .limit(3)

            if (!error && data) {
                setRecentSearches(data)
            }
        } catch (error) {
            console.error('Error fetching recent searches:', error)
        }
    }

    const handleNewChat = () => {
        // Clear current search context (but keep recent searches for history)
        setCurrentSearch(null)
        router.push('/')
    }

    if (!isSignedIn) {
        return (
            <div className="flex items-center justify-between flex-1">
                <span
                    className="text-2xl text-foreground"
                    style={{
                        fontFamily: '"Canela Medium", "Canela", "Libre Baskerville", Georgia, serif',
                        fontWeight: 500,
                        letterSpacing: '-0.02em'
                    }}
                >
                    Welcome to Asteroid
                </span>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between flex-1">
            {/* User Greeting */}
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                        Hello, {user?.firstName || user?.fullName || 'User'}
                    </span>
                    {recentSearches.length > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {recentSearches.length} recent searches
                        </span>
                    )}
                </div>
            </div>

            {/* Center - Recent Searches */}
            <div className="flex items-center gap-3">
                {recentSearches.length > 0 && (
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-xs text-muted-foreground mr-2">Recent:</span>
                        {recentSearches.map((search, index) => (
                            <Link
                                key={search.libId || index}
                                href={`/search/${search.libId}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted/50 hover:bg-muted rounded-full border border-border/50 text-muted-foreground hover:text-foreground transition-colors max-w-[150px] truncate"
                            >
                                <Search className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{search.searchInput}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Right - New Chat Button */}
            {pathname !== '/' && (
                <Button
                    onClick={handleNewChat}
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full hover:bg-primary hover:text-primary-foreground transition-all"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Chat</span>
                </Button>
            )}
        </div>
    )
}
