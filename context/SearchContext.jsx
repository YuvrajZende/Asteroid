'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const SearchContext = createContext(null)

export function SearchProvider({ children }) {
    // Store recent searches in state, persisted to sessionStorage
    const [recentSearches, setRecentSearches] = useState([])
    const [currentSearch, setCurrentSearch] = useState(null)
    // Cache for full conversation data per libId
    const [conversationCache, setConversationCache] = useState({})

    // Load from sessionStorage on mount
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem('asteroid_recent_searches')
            if (stored) {
                const parsed = JSON.parse(stored)
                setRecentSearches(parsed)
            }

            const storedCurrent = sessionStorage.getItem('asteroid_current_search')
            if (storedCurrent) {
                setCurrentSearch(JSON.parse(storedCurrent))
            }

            // Load conversation cache
            const storedCache = sessionStorage.getItem('asteroid_conversation_cache')
            if (storedCache) {
                setConversationCache(JSON.parse(storedCache))
            }
        } catch (error) {
            console.error('Error loading search state:', error)
        }
    }, [])

    // Save to sessionStorage whenever recentSearches changes
    useEffect(() => {
        try {
            sessionStorage.setItem('asteroid_recent_searches', JSON.stringify(recentSearches))
        } catch (error) {
            console.error('Error saving search state:', error)
        }
    }, [recentSearches])

    // Save current search when it changes
    useEffect(() => {
        try {
            if (currentSearch) {
                sessionStorage.setItem('asteroid_current_search', JSON.stringify(currentSearch))
            } else {
                sessionStorage.removeItem('asteroid_current_search')
            }
        } catch (error) {
            console.error('Error saving current search:', error)
        }
    }, [currentSearch])

    // Save conversation cache when it changes
    useEffect(() => {
        try {
            sessionStorage.setItem('asteroid_conversation_cache', JSON.stringify(conversationCache))
        } catch (error) {
            console.error('Error saving conversation cache:', error)
        }
    }, [conversationCache])

    // Add a new search to recent searches
    const addSearch = (search) => {
        const newSearch = {
            ...search,
            timestamp: Date.now()
        }
        setRecentSearches(prev => {
            // Keep only the last 10 searches
            const updated = [newSearch, ...prev.filter(s => s.libId !== search.libId)].slice(0, 10)
            return updated
        })
        setCurrentSearch(newSearch)
    }

    // Cache the full conversation for a libId
    const cacheConversation = (libId, conversation) => {
        setConversationCache(prev => ({
            ...prev,
            [libId]: {
                conversation,
                cachedAt: Date.now()
            }
        }))
    }

    // Get cached conversation for a libId
    const getCachedConversation = (libId) => {
        const cached = conversationCache[libId]
        if (cached) {
            // Cache is valid for this session (until page refresh)
            return cached.conversation
        }
        return null
    }

    // Check if conversation is cached
    const hasConversationCache = (libId) => {
        return !!conversationCache[libId]
    }

    // Update a search with results
    const updateSearchResults = (libId, results) => {
        setRecentSearches(prev =>
            prev.map(search =>
                search.libId === libId
                    ? { ...search, results, hasResults: true }
                    : search
            )
        )
        if (currentSearch?.libId === libId) {
            setCurrentSearch(prev => ({ ...prev, results, hasResults: true }))
        }
    }

    // Get a search by libId
    const getSearch = (libId) => {
        return recentSearches.find(s => s.libId === libId)
    }

    // Clear all searches (on server restart/manual clear)
    const clearSearches = () => {
        setRecentSearches([])
        setCurrentSearch(null)
        setConversationCache({})
        sessionStorage.removeItem('asteroid_recent_searches')
        sessionStorage.removeItem('asteroid_current_search')
        sessionStorage.removeItem('asteroid_conversation_cache')
    }

    return (
        <SearchContext.Provider value={{
            recentSearches,
            currentSearch,
            addSearch,
            updateSearchResults,
            getSearch,
            clearSearches,
            setCurrentSearch,
            cacheConversation,
            getCachedConversation,
            hasConversationCache
        }}>
            {children}
        </SearchContext.Provider>
    )
}

export function useSearch() {
    const context = useContext(SearchContext)
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider')
    }
    return context
}

export default SearchContext
