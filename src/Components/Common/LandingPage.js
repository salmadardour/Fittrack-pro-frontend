import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import '../../Index.css';

function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef();
  const titleRef = useRef();
  const subtitleRef = useRef();
  const cardRef = useRef();
  const buttonRef = useRef();
  const floatingElementsRef = useRef([]);
  const statsRef = useRef([]);

  useEffect(() => {
    const tl = gsap.timeline();

    // Set initial states
    gsap.set([titleRef.current, subtitleRef.current, cardRef.current], {
      opacity: 0,
      y: 100
    });

    // Create floating animation for background elements
    floatingElementsRef.current.forEach((el, index) => {
      if (el) {
        gsap.to(el, {
          y: -20,
          duration: 2 + index * 0.5,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
          delay: index * 0.3
        });
      }
    });

    // Main animation sequence
    tl.to(titleRef.current, {
      duration: 1.5,
      opacity: 1,
      y: 0,
      ease: "power4.out"
    })
      .to(subtitleRef.current, {
        duration: 1,
        opacity: 1,
        y: 0,
        ease: "power3.out"
      }, "-=1")
      .to(cardRef.current, {
        duration: 1.2,
        opacity: 1,
        y: 0,
        ease: "back.out(1.7)"
      }, "-=0.5");

    // Stats counter animation
    statsRef.current.forEach((stat, index) => {
      if (stat) {
        const finalValue = stat.dataset.value;
        gsap.to(stat, {
          duration: 2,
          delay: 1.5 + index * 0.2,
          textContent: finalValue,
          roundProps: "textContent",
          ease: "power2.out"
        });
      }
    });

    // Button hover animations
    const button = buttonRef.current;
    if (button) {
      const handleMouseEnter = () => {
        gsap.to(button, {
          duration: 0.4,
          scale: 1.05,
          rotationX: 5,
          ease: "power2.out"
        });
      };

      const handleMouseLeave = () => {
        gsap.to(button, {
          duration: 0.4,
          scale: 1,
          rotationX: 0,
          ease: "power2.out"
        });
      };

      button.addEventListener('mouseenter', handleMouseEnter);
      button.addEventListener('mouseleave', handleMouseLeave);

      // Mouse movement parallax
      const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        const xPos = (clientX / innerWidth - 0.5) * 20;
        const yPos = (clientY / innerHeight - 0.5) * 20;

        gsap.to('.floating-element', {
          duration: 2,
          x: xPos,
          y: yPos,
          ease: "power2.out"
        });
      };

      window.addEventListener('mousemove', handleMouseMove);

      return () => {
        button.removeEventListener('mouseenter', handleMouseEnter);
        button.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  const handleGetStarted = () => {
    navigate('/register');
  };

  return (
    <div className="hero-container" ref={heroRef}>
      {/* Floating Background Elements */}
      <div className="floating-elements">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="floating-element"
            ref={el => floatingElementsRef.current[i] = el}
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 2) * 40}%`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      <div className="container">
        <div className="hero-content">
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <div className="stat-number" ref={el => statsRef.current[0] = el} data-value="2847">0</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" ref={el => statsRef.current[1] = el} data-value="18429">0</div>
              <div className="stat-label">Workouts Tracked</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" ref={el => statsRef.current[2] = el} data-value="89">0</div>
              <div className="stat-label">Success Rate %</div>
            </div>
          </div>

          <h1 className="hero-title" ref={titleRef}>
            <span className="title-main">FitTrack</span>
            <span className="title-accent">Pro</span>
          </h1>

          <p className="hero-subtitle" ref={subtitleRef}>
            Where innovation meets transformation.
            <br />
            <span className="subtitle-highlight">Redefine your fitness journey.</span>
          </p>

          <div className="hero-card" ref={cardRef}>
            <div className="card-glow"></div>
            <h2 className="card-title">
              The Future of Fitness Tracking
            </h2>
            <p className="card-description">
              Experience next-generation analytics, AI-powered insights, and
              seamless progress tracking that adapts to your unique journey.
            </p>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="feature-icon pulse"></div>
                </div>
                <h3>Smart Analytics</h3>
                <p>AI-powered insights</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="feature-icon trend"></div>
                </div>
                <h3>Progress Tracking</h3>
                <p>Real-time monitoring</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <div className="feature-icon target"></div>
                </div>
                <h3>Goal Setting</h3>
                <p>Personalized targets</p>
              </div>
            </div>

            <button className="cta-button" ref={buttonRef} onClick={handleGetStarted}>
              <span className="button-text">Start Your Transformation</span>
              <div className="button-shine"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;