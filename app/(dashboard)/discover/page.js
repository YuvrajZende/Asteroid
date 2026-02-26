'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Compass, Loader2, ExternalLink, Clock, RefreshCw } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/services/supabase'
import { v4 as uuidv4 } from 'uuid'

const CATEGORIES = [
  { id: 'general', label: 'Top Stories', icon: '/icons/general.png' },
  { id: 'technology', label: 'Technology', icon: '/icons/technology.png' },
  { id: 'science', label: 'Science', icon: '/icons/science.png' },
  { id: 'business', label: 'Business', icon: '/icons/business.png' },
  { id: 'entertainment', label: 'Entertainment', icon: '/icons/entertainment.png' },
  { id: 'health', label: 'Health', icon: '/icons/health.png' },
  { id: 'sports', label: 'Sports', icon: '/icons/sports.png' },
]

export default function Discover() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('general')
  const [error, setError] = useState(null)
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    fetchNews(activeCategory)
  }, [activeCategory])

  const fetchNews = async (category, forceRefresh = false) => {
    setLoading(true)
    setError(null)
    try {
      const url = forceRefresh
        ? `/api/news?category=${category}&refresh=true`
        : `/api/news?category=${category}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setArticles([])
      } else {
        setArticles(data.articles || [])
      }
    } catch (err) {
      console.error('Error fetching news:', err)
      setError('Failed to load news')
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const handleArticleClick = async (article) => {
    if (!user) {
      window.open(article.url, '_blank')
      return
    }

    // Create a search from the article title
    const libId = uuidv4()
    await supabase.from('Library').insert([{
      searchInput: article.title,
      userEmail: user?.primaryEmailAddress?.emailAddress,
      type: 'Search',
      libId: libId
    }])
    router.push(`/search/${libId}`)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Discover</h1>
        </div>
        <p className="text-muted-foreground">Explore trending news and topics from around the web</p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {CATEGORIES.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? 'default' : 'outline'}
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
          onClick={() => fetchNews(activeCategory, true)}
          className="rounded-full ml-auto"
          disabled={loading}
          title="Refresh news"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">{error}</p>
          <p className="text-sm">Make sure NEWS_API_KEY is set in your .env.local file</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-48 bg-muted" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Articles Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 border-border/50"
              onClick={() => handleArticleClick(article)}
            >
              {/* Image */}
              {article.image ? (
                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Compass className="h-12 w-12 text-primary/30" />
                </div>
              )}

              {/* Content */}
              <CardContent className="p-4">
                {/* Source and Time */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-medium text-primary">{article.source}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(article.publishedAt)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>

                {/* Description */}
                {article.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.description}
                  </p>
                )}

                {/* Read More */}
                <div className="mt-3 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Search this topic</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </div>
              </CardContent>
            </Card>
          ))}

          {articles.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Compass className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No articles found for this category</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}