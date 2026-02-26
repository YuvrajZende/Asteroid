'use client'

import { Copy, Check, ChevronDown } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState } from 'react'

/**
 * CodeResponseUI - Displays code generation results with language tabs
 * Similar to ChatGPT's code output interface
 */
export default function CodeResponseUI({ codeBlocks, solution, explanation }) {
    const [activeTab, setActiveTab] = useState(0)
    const [copiedIndex, setCopiedIndex] = useState(null)
    const [expandedBlocks, setExpandedBlocks] = useState({})

    const copyCode = (code, index) => {
        navigator.clipboard.writeText(code)
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
    }

    const toggleExpand = (index) => {
        setExpandedBlocks(prev => ({
            ...prev,
            [index]: !prev[index]
        }))
    }

    if (!codeBlocks || codeBlocks.length === 0) {
        return null
    }

    return (
        <div className="space-y-4">
            {/* Solution/Intro */}
            {solution && (
                <p className="text-foreground/90 leading-relaxed">{solution}</p>
            )}

            {/* Language Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
                {codeBlocks.map((block, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === index
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${activeTab === index ? 'bg-primary-foreground' : 'bg-current opacity-50'
                            }`} />
                        {block.language}
                    </button>
                ))}
            </div>

            {/* Code Block */}
            <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800 border-b border-zinc-700">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-sm text-zinc-400 font-mono">
                            {codeBlocks[activeTab]?.syntax || codeBlocks[activeTab]?.language.toLowerCase()}
                        </span>
                    </div>
                    <button
                        onClick={() => copyCode(codeBlocks[activeTab]?.code, activeTab)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-all"
                    >
                        {copiedIndex === activeTab ? (
                            <>
                                <Check className="h-4 w-4 text-green-400" />
                                <span className="text-green-400">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                <span>Copy code</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Code */}
                <div className={`relative ${!expandedBlocks[activeTab] && codeBlocks[activeTab]?.code.split('\n').length > 20
                        ? 'max-h-[400px] overflow-hidden'
                        : ''
                    }`}>
                    <SyntaxHighlighter
                        style={oneDark}
                        language={codeBlocks[activeTab]?.syntax || 'plaintext'}
                        PreTag="div"
                        customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            background: '#1e1e1e',
                        }}
                        showLineNumbers={true}
                        lineNumberStyle={{
                            minWidth: '2.5em',
                            paddingRight: '1em',
                            color: '#6e7681',
                            userSelect: 'none',
                        }}
                    >
                        {codeBlocks[activeTab]?.code || ''}
                    </SyntaxHighlighter>

                    {/* Fade overlay for long code */}
                    {!expandedBlocks[activeTab] && codeBlocks[activeTab]?.code.split('\n').length > 20 && (
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1e1e1e] to-transparent" />
                    )}
                </div>

                {/* Expand button for long code */}
                {codeBlocks[activeTab]?.code.split('\n').length > 20 && (
                    <button
                        onClick={() => toggleExpand(activeTab)}
                        className="w-full py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 border-t border-zinc-700 flex items-center justify-center gap-2 transition-colors"
                    >
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedBlocks[activeTab] ? 'rotate-180' : ''}`} />
                        {expandedBlocks[activeTab] ? 'Show less' : 'Show more'}
                    </button>
                )}
            </div>

            {/* All Languages Quick Copy */}
            <div className="flex flex-wrap gap-2">
                {codeBlocks.map((block, index) => (
                    index !== activeTab && (
                        <button
                            key={index}
                            onClick={() => copyCode(block.code, index)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border border-border/50 transition-all"
                        >
                            {copiedIndex === index ? (
                                <>
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy {block.language}</span>
                                </>
                            )}
                        </button>
                    )
                ))}
            </div>

            {/* Explanation */}
            {explanation && (
                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Explanation</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
                </div>
            )}
        </div>
    )
}
