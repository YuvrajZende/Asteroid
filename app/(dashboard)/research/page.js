'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Loader2, ExternalLink, RefreshCw, FileText, Users, Calendar, Quote } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/services/supabase'
import { v4 as uuidv4 } from 'uuid'

const CATEGORIES = [
    { id: 'ai', label: 'AI & ML', icon: '/icons/ai.png' },
    { id: 'tech', label: 'Technology', icon: '/icons/technology.png' },
    { id: 'physics', label: 'Physics', icon: '/icons/physics.png' },
    { id: 'math', label: 'Mathematics', icon: '/icons/math.png' },
    { id: 'biology', label: 'Biology', icon: '/icons/biology.png' },
    { id: 'chemistry', label: 'Chemistry', icon: '/icons/chemistry.png' },
    { id: 'medicine', label: 'Medicine', icon: '/icons/health.png' },
    { id: 'engineering', label: 'Engineering', icon: '/icons/science.png' },
]

export default function ResearchPage() {
    const [activeCategory, setActiveCategory] = useState('ai')
    const [papers, setPapers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [cacheInfo, setCacheInfo] = useState(null)
    const router = useRouter()
    const { user, isSignedIn } = useUser()

    useEffect(() => {
        fetchPapers(activeCategory)
    }, [activeCategory])

    const fetchPapers = async (category, forceRefresh = false) => {
        setLoading(true)
        setError(null)
        try {
            const url = forceRefresh
                ? `/api/research?category=${category}&refresh=true`
                : `/api/research?category=${category}`
            const response = await fetch(url)
            const data = await response.json()

            if (data.error) {
                setError(data.error)
                setPapers([])
            } else {
                setPapers(data.papers || [])
                setCacheInfo(data.cached ? data.cacheAge : null)
            }
        } catch (err) {
            console.error('Error fetching papers:', err)
            setError('Failed to load research papers')
            setPapers([])
        } finally {
            setLoading(false)
        }
    }

    const handlePaperClick = async (paper) => {
        if (isSignedIn && user) {
            const libId = uuidv4()
            await supabase.from('Library').insert([{
                searchInput: paper.title,
                userEmail: user?.primaryEmailAddress?.emailAddress,
                type: 'Research',
                libId: libId
            }])
            router.push(`/search/${libId}`)
        } else {
            window.open(paper.link, '_blank')
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold text-foreground">Research Papers</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Top research papers from Google Scholar • Updated weekly
                        {cacheInfo && <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">Cached: {cacheInfo}</span>}
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    {CATEGORIES.map((category) => (
                        <Button
                            key={category.id}
                            variant={activeCategory === category.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveCategory(category.id)}
                            className="rounded-full whitespace-nowrap flex items-center gap-2"
                        >
                            <img
                                src={category.icon}
                                alt={category.label}
                                className="h-4 w-4 object-contain"
                                style={{ filter: activeCategory === category.id ? 'invert(1)' : 'none' }}
                            />
                            {category.label}
                        </Button>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchPapers(activeCategory, true)}
                        className="rounded-full ml-auto"
                        disabled={loading}
                        title="Refresh papers"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Papers Grid */}
                {!loading && !error && papers.length > 0 && (
                    <div className="grid gap-4">
                        {papers.map((paper) => (
                            <Card
                                key={paper.id}
                                className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30 group"
                                onClick={() => handlePaperClick(paper)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex gap-4">
                                        {/* Paper Icon */}
                                        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <FileText className="h-6 w-6 text-primary" />
                                        </div>

                                        {/* Paper Content */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                                                {paper.title}
                                            </h3>

                                            {paper.snippet && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                    {paper.snippet}
                                                </p>
                                            )}

                                            {/* Metadata */}
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                {paper.authors && (
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        <span className="truncate max-w-[200px]">{paper.authors}</span>
                                                    </div>
                                                )}
                                                {paper.year && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{paper.year}</span>
                                                    </div>
                                                )}
                                                {paper.citedBy > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Quote className="h-3 w-3" />
                                                        <span>{paper.citedBy} citations</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex-shrink-0 flex flex-col gap-2">
                                            {paper.pdfLink && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        window.open(paper.pdfLink, '_blank')
                                                    }}
                                                >
                                                    PDF
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.open(paper.link, '_blank')
                                                }}
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && papers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No papers found for this category</p>
                    </div>
                )}
            </div>
        </div>
    )
}
