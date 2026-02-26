'use client'

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Search,
  Loader2,
  Globe,
  Image as ImageIcon,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share2,
  SendHorizontal,
  Sparkles,
  Check,
  Code2
} from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { supabase } from "@/services/supabase"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import CodeResponseUI from "@/components/CodeResponseUI"
import { isCodeRequest, isFixRequest } from "@/services/intentDetector"
import { useSearch } from "@/context/SearchContext"
import { v4 as uuidv4 } from 'uuid'

export default function SearchResults() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedModel = searchParams.get('model') || 'groq'
  const { user } = useUser()

  // Conversation thread state - array of {query, searchResults, aiAnswer, images, sources}
  const [conversation, setConversation] = useState([])
  const [originalQuery, setOriginalQuery] = useState('') // Store the first/original query for header
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('answer')
  const [followUpQuery, setFollowUpQuery] = useState('')
  const [copied, setCopied] = useState(null)
  const [currentlyLoading, setCurrentlyLoading] = useState(null) // Index of currently loading message
  const [showShareMenu, setShowShareMenu] = useState(false)

  const conversationEndRef = useRef(null)
  const inputRef = useRef(null)
  const initialFetchDone = useRef(false)
  const { getCachedConversation, cacheConversation, hasConversationCache } = useSearch()

  useEffect(() => {
    // Prevent double-fetch from React StrictMode in development
    if (initialFetchDone.current) return
    initialFetchDone.current = true
    fetchInitialSearch()
  }, [params.libId])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversation, currentlyLoading])

  // Cache conversation whenever it updates (for returning without re-calling APIs)
  useEffect(() => {
    if (conversation.length > 0 && !conversation.some(msg => msg.loading)) {
      // Only cache when all messages are done loading
      cacheConversation(params.libId, conversation)
      console.log('Conversation cached for', params.libId)
    }
  }, [conversation, params.libId])

  const fetchInitialSearch = async () => {
    try {
      // Check if we have cached conversation data
      const cachedConversation = getCachedConversation(params.libId)
      if (cachedConversation && cachedConversation.length > 0) {
        console.log('Loading conversation from cache')
        setConversation(cachedConversation)
        setOriginalQuery(cachedConversation[0]?.query || '')
        setLoading(false)
        return
      }

      // No cache, fetch from database and call APIs
      const { data, error } = await supabase
        .from('Library')
        .select('*')
        .eq('libId', params.libId)
        .single()

      if (error) {
        setError('Search not found')
        console.error('Error fetching search data:', error)
      } else {
        // Store original query for header display
        setOriginalQuery(data.searchInput)
        // Start the conversation with the initial query
        await addToConversation(data.searchInput, 0)
      }
    } catch (error) {
      setError('Failed to load search results')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToConversation = async (query, index) => {
    // Detect if this is a code generation request
    const isCodeMode = isCodeRequest(query)
    const isFixMode = isFixRequest(query)

    // Add placeholder for the new message
    setConversation(prev => [...prev, {
      query,
      searchResults: null,
      aiAnswer: null,
      codeResponse: null,
      images: [],
      sources: [],
      socialFeedback: null,
      isCodeMode,
      loading: true
    }])
    setCurrentlyLoading(index)

    try {
      // CODE GENERATION MODE - Skip web search for coding queries
      if (isCodeMode) {
        console.log('Code mode detected, generating code...')
        const codeResponse = await fetch('/api/code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, isFixMode, model: selectedModel }),
        })

        if (codeResponse.ok) {
          const codeData = await codeResponse.json()
          setConversation(prev => prev.map((item, i) =>
            i === index ? {
              ...item,
              codeResponse: codeData,
              isCodeMode: true,
              loading: false
            } : item
          ))
        } else {
          // Code generation failed, mark as done with error
          setConversation(prev => prev.map((item, i) =>
            i === index ? { ...item, loading: false, error: true } : item
          ))
        }
        setCurrentlyLoading(null)
        return
      }

      // NORMAL SEARCH MODE - Web search + AI summary
      // Perform web search
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, count: 10 }),
      })

      if (!searchResponse.ok) throw new Error('Search failed')
      const searchData = await searchResponse.json()

      // Update conversation with search results
      setConversation(prev => prev.map((item, i) =>
        i === index ? { ...item, searchResults: searchData, images: searchData.images || [], sources: searchData.webResults?.slice(0, 6) || [] } : item
      ))

      // Get AI answer
      if (searchData.webResults?.length) {
        const aiResponse = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, searchResults: searchData.webResults, model: selectedModel }),
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          setConversation(prev => prev.map((item, i) =>
            i === index ? {
              ...item,
              aiAnswer: aiData,
              sources: aiData.sources || searchData.webResults?.slice(0, 6) || [],
              loading: false
            } : item
          ))

          // Fetch social feedback in background (non-blocking)
          fetch('/api/social', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          }).then(res => res.ok ? res.json() : null)
            .then(socialData => {
              if (socialData) {
                setConversation(prev => prev.map((item, i) =>
                  i === index ? { ...item, socialFeedback: socialData } : item
                ))
              }
            }).catch(err => console.log('Social fetch error:', err))

        } else {
          // AI failed but we have search results, still mark as done
          setConversation(prev => prev.map((item, i) =>
            i === index ? { ...item, loading: false } : item
          ))
        }
      } else {
        // No web results, still mark as done
        setConversation(prev => prev.map((item, i) =>
          i === index ? { ...item, loading: false } : item
        ))
      }
    } catch (error) {
      console.error('Search error:', error)
      setConversation(prev => prev.map((item, i) =>
        i === index ? { ...item, loading: false, error: true } : item
      ))
    } finally {
      setCurrentlyLoading(null)
    }
  }

  const handleFollowUp = async () => {
    if (!followUpQuery.trim() || currentlyLoading !== null) return

    const query = followUpQuery.trim()
    setFollowUpQuery('')

    // Save to database (optional - for history)
    if (user) {
      await supabase.from('Library').insert([{
        searchInput: query,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        type: 'Search',
        libId: uuidv4(),
        parentLibId: params.libId // Link to parent conversation
      }])
    }

    // Add to current conversation thread
    await addToConversation(query, conversation.length)

    // Focus back on input
    inputRef.current?.focus()
  }

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopied(index)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-28 w-28 bg-muted rounded-xl flex-shrink-0"></div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Search Not Found</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>Go Back Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Fixed */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              {/* Tabs */}
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-full">
                <button
                  onClick={() => setActiveTab('answer')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'answer'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Answer
                </button>
                <button
                  onClick={() => setActiveTab('links')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'links'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Globe className="h-4 w-4" />
                  Links
                </button>
                <button
                  onClick={() => setActiveTab('images')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'images'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  Images
                </button>
              </div>
            </div>

            {/* Current Query Display */}
            <div className="flex-1 flex justify-center px-4">
              <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full max-w-md truncate text-sm font-medium shadow-sm">
                {originalQuery || 'Searching...'}
              </div>
            </div>

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
                onClick={() => setShowShareMenu(!showShareMenu)}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              {/* Share Dropdown */}
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-xl shadow-lg py-2 z-50">
                  <button
                    onClick={() => {
                      const url = window.location.href
                      const text = `Check out this search: ${originalQuery}`
                      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
                      setShowShareMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      const url = window.location.href
                      const text = `Check out this search: ${originalQuery}`
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
                      setShowShareMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X (Twitter)
                  </button>
                  <button
                    onClick={() => {
                      const url = window.location.href
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
                      setShowShareMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </button>
                  <div className="border-t border-border my-1"></div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      setCopied('link')
                      setTimeout(() => setCopied(null), 2000)
                      setShowShareMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {copied === 'link' ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Thread - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
          {conversation.map((message, index) => (
            <div key={index} className="space-y-6">
              {/* User Query Bubble */}
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground px-5 py-3 rounded-3xl max-w-lg shadow-lg">
                  <span className="text-sm font-medium">{message.query}</span>
                </div>
              </div>

              {/* Loading State */}
              {message.loading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <span className="mt-4 text-muted-foreground">Searching the web...</span>
                </div>
              )}

              {/* Answer Content */}
              {!message.loading && activeTab === 'answer' && (
                <div className="space-y-6">
                  {/* Image Carousel */}
                  {message.images?.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                      {message.images.slice(0, 6).map((img, imgIndex) => (
                        <a
                          key={imgIndex}
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 group"
                        >
                          <div className="relative w-32 h-24 rounded-xl overflow-hidden bg-muted border border-border/50 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]">
                            <img
                              src={img.thumbnail || img.src}
                              alt={img.title}
                              className="w-full h-full object-cover"
                              onError={(e) => e.target.parentElement.style.display = 'none'}
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* CODE RESPONSE - Show code blocks with language tabs */}
                  {message.isCodeMode && message.codeResponse && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Code2 className="h-3.5 w-3.5" />
                        <span className="font-medium">Code generated by AI</span>
                      </div>
                      <CodeResponseUI
                        codeBlocks={message.codeResponse.codeBlocks}
                        solution={message.codeResponse.solution}
                        explanation={message.codeResponse.explanation}
                      />
                    </div>
                  )}

                  {/* AI Answer - For non-code queries */}
                  {!message.isCodeMode && (
                    <div className="space-y-4">
                      {message.aiAnswer?.isAI && (
                        <div className="flex items-center gap-2 text-xs text-primary">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span className="font-medium">AI-powered answer</span>
                        </div>
                      )}

                      {/* Main Answer with Markdown */}
                      <div className="text-foreground leading-relaxed">
                        <MarkdownRenderer
                          content={message.aiAnswer?.rawContent || message.aiAnswer?.answer || message.searchResults?.webResults?.[0]?.description || ''}
                          sources={message.sources}
                          onQuestionClick={(question) => {
                            setFollowUpQuery(question)
                            setTimeout(() => handleFollowUp(), 100)
                          }}
                        />
                      </div>

                      {/* Key Points */}
                      {message.aiAnswer?.keyPoints?.length > 0 && (
                        <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                          <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Key Takeaways
                          </h4>
                          <ul className="space-y-2">
                            {message.aiAnswer.keyPoints.map((point, pointIndex) => (
                              <li key={pointIndex} className="flex items-start gap-2 text-sm text-foreground">
                                <span className="text-primary mt-1">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Sources */}
                      {message.sources?.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-border/50">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Sources</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {message.sources.map((source, sourceIndex) => (
                              <a
                                key={sourceIndex}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-2 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors group"
                              >
                                <span className="flex items-center justify-center w-5 h-5 bg-primary/20 text-primary text-xs font-bold rounded">
                                  {source.number || sourceIndex + 1}
                                </span>
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=16`}
                                  alt=""
                                  className="w-4 h-4 rounded-sm"
                                />
                                <span className="flex-1 text-sm text-muted-foreground group-hover:text-foreground truncate">
                                  {source.title || source.siteName}
                                </span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Community Feedback */}
                      {message.socialFeedback && (message.socialFeedback.reddit?.length > 0 || message.socialFeedback.twitter?.length > 0) && (
                        <div className="mt-6 pt-4 border-t border-border/50">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            What People Are Saying
                          </h4>

                          {/* Two Column Layout */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Reddit Column */}
                            {message.socialFeedback.reddit?.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                    <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                                    </svg>
                                  </div>
                                  <span className="text-xs font-semibold text-orange-600">Reddit</span>
                                </div>
                                {message.socialFeedback.reddit?.slice(0, 2).map((post, postIndex) => (
                                  <a
                                    key={`reddit-${postIndex}`}
                                    href={post.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 bg-gradient-to-r from-orange-50 to-transparent hover:from-orange-100 border-l-2 border-orange-400 rounded-r-lg transition-all group"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-medium text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded">{post.subreddit}</span>
                                    </div>
                                    <p className="text-sm font-medium text-foreground group-hover:text-orange-700 line-clamp-1">{post.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.snippet}</p>
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* X/Twitter Column */}
                            {message.socialFeedback.twitter?.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                  </div>
                                  <span className="text-xs font-semibold text-slate-700">X / Twitter</span>
                                </div>
                                {message.socialFeedback.twitter?.slice(0, 2).map((post, postIndex) => (
                                  <a
                                    key={`twitter-${postIndex}`}
                                    href={post.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 bg-gradient-to-r from-slate-50 to-transparent hover:from-slate-100 border-l-2 border-slate-400 rounded-r-lg transition-all group"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-medium text-slate-600">{post.username}</span>
                                    </div>
                                    <p className="text-sm text-foreground group-hover:text-slate-700 line-clamp-2">{post.snippet || post.title}</p>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full ml-auto"
                          onClick={() => copyToClipboard(message.aiAnswer?.rawContent || message.aiAnswer?.answer || '', index)}
                        >
                          {copied === index ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Links Tab Content */}
              {!message.loading && activeTab === 'links' && (
                <div className="space-y-3">
                  {message.searchResults?.webResults?.map((result, resultIndex) => (
                    <a
                      key={resultIndex}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={result.favicon}
                          alt=""
                          className="w-5 h-5 rounded mt-0.5"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">{result.siteName}</span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
                            {result.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {result.description}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Images Tab Content */}
              {!message.loading && activeTab === 'images' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {message.images?.map((img, imgIndex) => (
                    <a
                      key={imgIndex}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/50 hover:border-border transition-all hover:shadow-lg">
                        <img
                          src={img.thumbnail || img.src}
                          alt={img.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => e.target.parentElement.style.display = 'none'}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-xs text-white line-clamp-2">{img.title}</p>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                  {message.images?.length === 0 && (
                    <div className="col-span-full text-center py-16 text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No images found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Divider between messages */}
              {index < conversation.length - 1 && (
                <div className="border-t border-border/30 my-8" />
              )}
            </div>
          ))}

          {/* Auto-scroll anchor */}
          <div ref={conversationEndRef} />
        </div>
      </div>

      {/* Follow-up Input - Fixed at bottom */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 p-2 rounded-2xl border border-border bg-background shadow-lg">
            <div className="flex items-center gap-2 pl-2">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask a follow-up..."
              value={followUpQuery}
              onChange={(e) => setFollowUpQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
              disabled={currentlyLoading !== null}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground py-2 disabled:opacity-50"
            />
            <Button
              size="sm"
              onClick={handleFollowUp}
              disabled={!followUpQuery.trim() || currentlyLoading !== null}
              className="rounded-xl h-9 px-4"
            >
              {currentlyLoading !== null ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}