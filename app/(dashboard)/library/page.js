'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, Search, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { supabase } from "@/services/supabase"

export default function Library() {
  const { user } = useUser()
  const [searchHistory, setSearchHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSearchHistory()
    }
  }, [user])

  const fetchSearchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('Library')
        .select('*')
        .eq('userEmail', user?.primaryEmailAddress?.emailAddress)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching search history:', error)
      } else {
        setSearchHistory(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteSearchItem = async (libId) => {
    try {
      const { error } = await supabase
        .from('Library')
        .delete()
        .eq('libId', libId)

      if (error) {
        console.error('Error deleting item:', error)
      } else {
        setSearchHistory(searchHistory.filter(item => item.libId !== libId))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground">Please sign in to view your library</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Library</h1>
        <p className="text-muted-foreground">Your search history and saved content</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading your library...</p>
        </div>
      ) : searchHistory.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No search history yet</h3>
            <p className="text-muted-foreground mb-4">Start searching to build your library</p>
            <Button onClick={() => window.location.href = '/'}>
              Start Searching
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {searchHistory.map((item, index) => (
            <Card key={item.libId || item.id || `search-${index}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{item.searchInput}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.libId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/search/${item.libId}`}
                      >
                        View
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => item.libId ? deleteSearchItem(item.libId) : deleteSearchItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}