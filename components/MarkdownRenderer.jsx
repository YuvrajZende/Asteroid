'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, ArrowRight } from 'lucide-react'
import { useState, useRef } from 'react'

export default function MarkdownRenderer({ content, sources = [], onQuestionClick }) {
    const [copiedCode, setCopiedCode] = useState(null)
    const inRelatedQuestions = useRef(false)

    const copyCode = (code, index) => {
        navigator.clipboard.writeText(code)
        setCopiedCode(index)
        setTimeout(() => setCopiedCode(null), 2000)
    }

    // Replace citation markers [1], [2] with links
    const processedContent = content?.replace(/\[(\d+)\]/g, (match, num) => {
        const source = sources[parseInt(num) - 1]
        if (source) {
            return `[${num}](${source.url})`
        }
        return match
    }) || ''

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
                components={{
                    // Code blocks with syntax highlighting
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const codeString = String(children).replace(/\n$/, '')
                        const codeIndex = node?.position?.start?.line

                        if (!inline && match) {
                            return (
                                <div className="relative group my-4">
                                    <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 rounded-t-lg border-b border-zinc-700">
                                        <span className="text-xs text-zinc-400 font-mono">{match[1]}</span>
                                        <button
                                            onClick={() => copyCode(codeString, codeIndex)}
                                            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                                        >
                                            {copiedCode === codeIndex ? (
                                                <>
                                                    <Check className="h-3.5 w-3.5" />
                                                    <span>Copied!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-3.5 w-3.5" />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <SyntaxHighlighter
                                        style={oneDark}
                                        language={match[1]}
                                        PreTag="div"
                                        customStyle={{
                                            margin: 0,
                                            borderRadius: '0 0 0.5rem 0.5rem',
                                            fontSize: '13px',
                                        }}
                                        {...props}
                                    >
                                        {codeString}
                                    </SyntaxHighlighter>
                                </div>
                            )
                        }

                        // Inline code
                        return (
                            <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono text-primary" {...props}>
                                {children}
                            </code>
                        )
                    },

                    // Headers
                    h1: ({ children }) => (
                        <h1 className="text-xl font-bold text-foreground mt-6 mb-3">{children}</h1>
                    ),
                    h2: ({ children }) => {
                        const text = String(children).toLowerCase()
                        const isRelatedQuestions = text.includes('related') && text.includes('question')
                        inRelatedQuestions.current = isRelatedQuestions
                        if (isRelatedQuestions) {
                            return (
                                <h2 className="flex items-center gap-2 text-lg font-bold text-primary mt-8 mb-4 border-b border-primary/20 pb-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {children}
                                </h2>
                            )
                        }
                        return (
                            <h2 className="text-lg font-semibold text-primary mt-5 mb-2">{children}</h2>
                        )
                    },
                    h3: ({ children }) => (
                        <h3 className="text-base font-semibold text-foreground mt-4 mb-2">{children}</h3>
                    ),

                    // Paragraphs
                    p: ({ children }) => (
                        <p className="text-foreground/90 leading-relaxed mb-3">{children}</p>
                    ),

                    // Lists
                    ul: ({ children }) => {
                        if (inRelatedQuestions.current) {
                            return <ul className="space-y-2 my-4">{children}</ul>
                        }
                        return <ul className="space-y-1.5 my-3 ml-4">{children}</ul>
                    },
                    ol: ({ children }) => (
                        <ol className="space-y-1.5 my-3 ml-4 list-decimal">{children}</ol>
                    ),
                    li: ({ children }) => {
                        // Get the text content for related questions
                        const textContent = typeof children === 'string' ? children :
                            Array.isArray(children) ? children.map(c => typeof c === 'string' ? c : c?.props?.children || '').join('') : ''

                        if (inRelatedQuestions.current && onQuestionClick) {
                            return (
                                <li
                                    onClick={() => onQuestionClick(textContent)}
                                    className="group flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-primary/10 border border-transparent hover:border-primary/20 cursor-pointer transition-all duration-200"
                                >
                                    <span className="flex-1 font-medium text-foreground group-hover:text-primary transition-colors">
                                        {children}
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </li>
                            )
                        }
                        return (
                            <li className="text-foreground/90 flex items-start gap-2">
                                <span className="text-primary mt-1.5 text-xs">•</span>
                                <span>{children}</span>
                            </li>
                        )
                    },

                    // Links (citations)
                    a: ({ href, children }) => {
                        const isNumber = /^\d+$/.test(String(children))
                        if (isNumber) {
                            const source = sources[parseInt(String(children)) - 1]
                            const domain = source?.siteName || (href ? new URL(href).hostname.replace('www.', '') : '')
                            return (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 text-[11px] font-medium bg-primary/15 text-primary rounded-md hover:bg-primary/25 transition-colors"
                                >
                                    <span>{domain}</span>
                                </a>
                            )
                        }
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                {children}
                            </a>
                        )
                    },

                    // Strong/Bold
                    strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                    ),

                    // Emphasis/Italic
                    em: ({ children }) => (
                        <em className="italic">{children}</em>
                    ),

                    // Blockquotes
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary/50 pl-4 my-4 text-muted-foreground italic">
                            {children}
                        </blockquote>
                    ),

                    // Tables
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-4 rounded-lg border border-border/50">
                            <table className="w-full text-sm">{children}</table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-muted/50">{children}</thead>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-2 text-left font-semibold text-foreground border-b border-border/50">{children}</th>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-2 text-muted-foreground border-b border-border/30">{children}</td>
                    ),
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    )
}
