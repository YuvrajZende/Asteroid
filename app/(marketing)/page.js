
"use client";

import Script from "next/script";
import Link from "next/link";
import "./landing.css";
import ChatInputBox from "@/app/_components/ChatInputBox";

export default function Home() {
    return (
        <div className="asteroid-landing">
            {/* We can re-use ChatInputBox in a modal or a section if desired, but for now we render the verbatim landing page */}
            {/* <div className="absolute top-4 left-4 z-50 text-white"><ChatInputBox /></div> */}

            <div className="loading-screen" id="loading-screen">
                <video autoPlay muted playsInline className="loading-video" id="loading-video">
                    <source src="/Video-Project.mp4" type="video/mp4" />
                </video>

                {/*  Auriga-style Loading Overlay  */}
                <div className="loading-overlay">
                    {/*  Progress Bar Container  */}
                    <div className="loading-progress-container">
                        <div className="loading-bar-wrapper">
                            <div className="loading-bar" id="loading-bar"></div>
                        </div>
                        <div className="loading-status">
                            <span className="loading-colon">:</span>
                            <span className="loading-text" id="loading-text">LOADING...</span>
                        </div>
                    </div>

                    {/*  ASTEROID Text with Reveal Effect  */}
                    <div className="asteroid-text-container">
                        <div className="asteroid-text-wrapper">
                            {/*  Background text (black)  */}
                            <span className="asteroid-text asteroid-text-back">ASTEROID</span>
                            {/*  Foreground text (white, clipped)  */}
                            <span className="asteroid-text asteroid-text-front" id="asteroid-text-front">ASTEROID</span>
                        </div>
                    </div>
                </div>
            </div>

            {/*  Main Content (hidden initially)  */}
            <div className="main-content" id="main-content">

                {/*  Hero Section  */}
                <section className="hero" id="hero">
                    {/*  Starfield Background  */}
                    <div className="starfield" id="starfield"></div>

                    {/*  Nebula Gradient Overlay  */}
                    <div className="nebula-overlay"></div>

                    {/*  Planet Container with Canvas for Frame Animation  */}
                    <div className="planet-container" id="planet">
                        <canvas id="planet-canvas" className="planet-canvas"></canvas>
                    </div>

                    {/*  Headlines Layer (Behind Planet)  */}
                    <div className="headlines-layer">
                        <div className="headline headline-top" id="headline-top">
                            <h1 className="headline-primary">ASKED ?</h1>
                        </div>
                        <div className="headline headline-bottom" id="headline-bottom">
                            <h1 className="headline-primary">ANSWERED !!</h1>
                        </div>
                    </div>

                    {/*  Descriptions Layer (In Front of Planet)  */}
                    <div className="descriptions-layer">
                        <div className="description-top">
                            <span className="headline-label">MULTI-MODEL AI SEARCH</span>
                            <p className="headline-tagline">Answers with sources. News with context. Papers that matter.</p>
                            <p className="headline-description">Search the web using multiple AI models at once — compare responses,
                                verify claims with citations, and stay ahead with curated AI news + weekly top research papers.
                            </p>
                        </div>
                        <div className="description-bottom">
                            <span className="headline-sub">NEWS • PAPERS • VERIFIED</span>
                            <p className="headline-tagline">Answers with sources. News with context. Papers that matter.</p>
                            <p className="headline-description">Search the web using multiple AI models at once — compare responses,
                                verify claims with citations, and stay ahead with curated AI news + weekly top research papers.
                            </p>
                        </div>

                        {/*  CTA Button  */}
                        <div className="cta-container" id="cta">
                            <a href="#features" className="cta-button">
                                <span>Explore Now</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                    </div>

                </section>

                {/*  Fixed Navigation  */}
                <nav className="nav" id="nav">
                    <div className="nav-logo">
                        <img src="/asteroid-logo.png" alt="Asteroid Logo" className="nav-logo-img" />
                        <span>Asteroid</span>
                    </div>
                </nav>

                {/*  Features Section  */}
                <section className="features" id="features">
                    <div className="section-header">
                        <span className="section-label">CAPABILITIES</span>
                        <h2 className="section-title">Two Powerful Modes</h2>
                        <p className="section-subtitle">Choose how deep you want to go</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card" data-animate>
                            <div className="feature-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="1.5">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Web Search</h3>
                            <p className="feature-desc">Lightning-fast results with images, knowledge graphs, and related content.
                                Perfect for quick answers.</p>
                            <ul className="feature-list">
                                <li>Real-time web results</li>
                                <li>Image search</li>
                                <li>Knowledge panels</li>
                            </ul>
                        </div>

                        <div className="feature-card featured" data-animate>
                            <div className="feature-badge">RECOMMENDED</div>
                            <div className="feature-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="1.5">
                                    <path d="M12 2a10 10 0 1 0 10 10" />
                                    <path d="M12 12V6" />
                                    <path d="M12 12l4-4" />
                                    <circle cx="12" cy="12" r="2" />
                                </svg>
                            </div>
                            <h3 className="feature-title">Deep Think</h3>
                            <p className="feature-desc">Advanced AI-powered research that synthesizes information from multiple
                                sources
                                with expert analysis.</p>
                            <ul className="feature-list">
                                <li>Multi-source synthesis</li>
                                <li>Expert-level analysis</li>
                                <li>Verified citations</li>
                                <li>Research papers</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/*  AI Providers Section  */}
                <section className="providers" id="providers">
                    <div className="providers-layout">
                        {/*  Left Side - Text & Providers  */}
                        <div className="providers-content">
                            <div className="section-header-left">
                                <span className="section-label">AI MODELS</span>
                                <h2 className="section-title">Powered by the Best</h2>
                                <p className="section-subtitle">Compare responses from multiple AI providers and get the best
                                    answers for your queries.</p>
                            </div>

                            <div className="providers-grid">
                                <div className="provider-item" data-animate>
                                    <div className="provider-logo">G</div>
                                    <div className="provider-info">
                                        <span className="provider-name">Groq</span>
                                        <span className="provider-model">Llama 3.3 70B</span>
                                    </div>
                                </div>
                                <div className="provider-item" data-animate>
                                    <div className="provider-logo">✦</div>
                                    <div className="provider-info">
                                        <span className="provider-name">Gemini</span>
                                        <span className="provider-model">2.0 Flash</span>
                                    </div>
                                </div>
                                <div className="provider-item" data-animate>
                                    <div className="provider-logo">◈</div>
                                    <div className="provider-info">
                                        <span className="provider-name">OpenRouter</span>
                                        <span className="provider-model">Multi-Model</span>
                                    </div>
                                </div>
                                <div className="provider-item" data-animate>
                                    <div className="provider-logo">Z</div>
                                    <div className="provider-info">
                                        <span className="provider-name">z.ai</span>
                                        <span className="provider-model">Advanced Reasoning</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/*  Right Side - Video  */}
                        <div className="video-showcase">
                            <div className="video-container">
                                <video autoPlay muted loop playsInline className="showcase-video" id="models-video">
                                    <source src="/Models.mp4" type="video/mp4" />
                                </video>
                                <div className="video-overlay"></div>
                                <div className="video-frame"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/*  How It Works Section  */}
                <section className="how-it-works" id="how-it-works">
                    <div className="how-it-works-layout">
                        {/*  Left Side - Video  */}
                        <div className="video-showcase video-left">
                            <div className="video-container">
                                <video autoPlay muted loop playsInline className="showcase-video" id="working-video">
                                    <source src="/Working.mp4" type="video/mp4" />
                                </video>
                                <div className="video-overlay"></div>
                                <div className="video-frame"></div>
                            </div>
                        </div>

                        {/*  Right Side - Text & Steps  */}
                        <div className="how-it-works-content">
                            <div className="section-header-right">
                                <span className="section-label">WORKFLOW</span>
                                <h2 className="section-title">How It Works</h2>
                                <p className="section-subtitle">From question to answer in seconds</p>
                            </div>

                            <div className="steps-container">
                                <div className="step" data-animate>
                                    <div className="step-number">01</div>
                                    <div className="step-content">
                                        <h3>Enter Your Query</h3>
                                        <p>Ask anything — from quick facts to complex research questions</p>
                                    </div>
                                </div>
                                <div className="step" data-animate>
                                    <div className="step-number">02</div>
                                    <div className="step-content">
                                        <h3>Choose Your Mode</h3>
                                        <p>Select Web Search for speed or Deep Think for comprehensive analysis</p>
                                    </div>
                                </div>
                                <div className="step" data-animate>
                                    <div className="step-number">03</div>
                                    <div className="step-content">
                                        <h3>Get AI-Synthesized Results</h3>
                                        <p>Receive answers with citations, context, and follow-up suggestions</p>
                                    </div>
                                </div>
                                <div className="step" data-animate>
                                    <div className="step-number">04</div>
                                    <div className="step-content">
                                        <h3>Continue the Conversation</h3>
                                        <p>Ask follow-up questions — your search history is always saved</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/*  Stats Section  */}
                <section className="stats" id="stats">
                    <div className="stats-grid">
                        <div className="stat-item" data-animate>
                            <span className="stat-number" data-count="4">0</span>
                            <span className="stat-label">AI Providers</span>
                        </div>
                        <div className="stat-item" data-animate>
                            <span className="stat-number" data-count="99">0</span><span className="stat-suffix">%</span>
                            <span className="stat-label">Accuracy Rate</span>
                        </div>
                        <div className="stat-item" data-animate>
                            <span className="stat-number" data-count="500">0</span><span className="stat-suffix">ms</span>
                            <span className="stat-label">Avg Response</span>
                        </div>
                        <div className="stat-item" data-animate>
                            <span className="stat-number" data-count="24">0</span><span className="stat-suffix">/7</span>
                            <span className="stat-label">Available</span>
                        </div>
                    </div>
                </section>

                {/*  CTA Section  */}
                <section className="final-cta" id="final-cta">
                    <div className="cta-content" data-animate>
                        <h2 className="cta-title">Ready to Search Smarter?</h2>
                        <p className="cta-desc">Join thousands of researchers, developers, and curious minds using Asteroid.</p>
                        <a href="/search" className="cta-button-large">
                            <span>Start Searching — It's Free</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </section>

                {/*  Footer  */}
                <footer className="footer">
                    <div className="footer-content">
                        <div className="footer-logo">Asteroid</div>
                        <p className="footer-tagline">AI-Powered Search for the Curious Mind</p>
                        <div className="footer-links">
                            <a href="#">About</a>
                            <a href="#">Privacy</a>
                            <a href="#">Terms</a>
                            <a href="#">Contact</a>
                        </div>
                        <p className="footer-copyright">© 2025 Asteroid. All rights reserved.</p>
                    </div>
                </footer>

            </div> {/*  End main-content  */}

            <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" strategy="afterInteractive" />
            <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" strategy="afterInteractive" />
            <Script src="/script.js" strategy="lazyOnload" />
        </div>
    );
}
