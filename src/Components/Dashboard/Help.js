import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, Book, MessageCircle, Mail } from 'lucide-react';
import './Help.css';

function Help() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('getting-started');
    const [expandedFaq, setExpandedFaq] = useState(null);

    const faqCategories = {
        'getting-started': {
            title: 'Getting Started',
            icon: Book,
            faqs: [
                {
                    question: 'How do I create my first workout?',
                    answer: 'Navigate to "New Workout" from the dashboard sidebar. Enter a workout name, date, and start adding exercises. For each exercise, you can add multiple sets with reps, weight, and rest time. Click "Save Workout" when done.'
                },
                {
                    question: 'What units does FitTrack Pro support?',
                    answer: 'FitTrack Pro supports both metric (kg, cm) and imperial (lbs, inches) units. You can change your preference in Settings > General > Measurement Units.'
                },
                {
                    question: 'How do I track my progress?',
                    answer: 'Your progress is automatically tracked through the Analytics section. View charts showing volume over time, workout frequency, and personal records. The dashboard also displays key statistics.'
                },
                {
                    question: 'Can I edit a workout after saving it?',
                    answer: 'Yes! Go to your Workouts list, find the workout you want to edit, and click on it. You can then modify exercises, sets, or any other details.'
                }
            ]
        },
        'workouts': {
            title: 'Workouts',
            icon: HelpCircle,
            faqs: [
                {
                    question: 'What exercise categories are available?',
                    answer: 'FitTrack Pro organizes exercises into: Chest, Back, Shoulders, Arms, Legs, Core, Cardio, and Other. This helps you track which muscle groups you\'re training.'
                },
                {
                    question: 'How is total volume calculated?',
                    answer: 'Total volume is calculated by multiplying weight × reps for each set, then summing all sets. For example: 3 sets of 10 reps at 50kg = 1,500kg total volume.'
                },
                {
                    question: 'Can I create workout templates?',
                    answer: 'While templates aren\'t available yet, you can duplicate previous workouts by viewing them in your workout history and using them as reference for new workouts.'
                },
                {
                    question: 'What is RPE?',
                    answer: 'RPE (Rate of Perceived Exertion) is a scale from 1-10 measuring how hard an exercise feels. 1 is very easy, 10 is maximum effort. This helps track intensity beyond just weight and reps.'
                }
            ]
        },
        'profile': {
            title: 'Profile & Settings',
            icon: MessageCircle,
            faqs: [
                {
                    question: 'How do I update my profile information?',
                    answer: 'Go to Profile from the dashboard sidebar and click "Edit Profile". You can update personal information, fitness level, and goals. Remember to save your changes.'
                },
                {
                    question: 'Can I change my email address?',
                    answer: 'For security reasons, email changes require verification. Contact support to request an email change for your account.'
                },
                {
                    question: 'What fitness goals can I set?',
                    answer: 'You can set up to 10 fitness goals including predefined options like "Lose Weight", "Build Muscle", "Increase Strength", or create custom goals that match your specific objectives.'
                },
                {
                    question: 'How do privacy settings work?',
                    answer: 'Privacy settings control who can see your profile and statistics. Set to "Private" to keep everything personal, or "Public" to share your fitness journey with the community.'
                }
            ]
        },
        'analytics': {
            title: 'Analytics',
            icon: Mail,
            faqs: [
                {
                    question: 'What metrics are tracked in Analytics?',
                    answer: 'Analytics tracks total workouts, volume over time, workout frequency by day, exercise distribution by category, personal records, and average workout duration.'
                },
                {
                    question: 'How are personal records calculated?',
                    answer: 'Personal records show your maximum weight and reps for each exercise across all your workouts. These update automatically as you log new achievements.'
                },
                {
                    question: 'Can I export my data?',
                    answer: 'Data export functionality is coming soon. You\'ll be able to export your workout history and analytics in CSV or PDF format.'
                },
                {
                    question: 'What time ranges can I view?',
                    answer: 'Analytics can be viewed for the last week, month, or year. Use the time range selector at the top of the Analytics page to switch between views.'
                }
            ]
        }
    };

    const filteredFaqs = () => {
        if (!searchTerm) return faqCategories[activeCategory].faqs;

        const allFaqs = [];
        Object.values(faqCategories).forEach(category => {
            category.faqs.forEach(faq => {
                if (
                    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
                ) {
                    allFaqs.push(faq);
                }
            });
        });
        return allFaqs;
    };

    const toggleFaq = (index) => {
        setExpandedFaq(expandedFaq === index ? null : index);
    };

    return (
        <div className="help-container">
            <div className="help-header">
                <h2>Help & Support</h2>
                <p className="help-subtitle">Find answers to common questions and learn how to use FitTrack Pro</p>
            </div>

            {/* Search Bar */}
            <div className="help-search">
                <Search size={20} />
                <input
                    type="text"
                    placeholder="Search for help..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="help-content">
                {/* Category Tabs */}
                {!searchTerm && (
                    <div className="help-categories">
                        {Object.entries(faqCategories).map(([key, category]) => (
                            <button
                                key={key}
                                className={`category-tab ${activeCategory === key ? 'active' : ''}`}
                                onClick={() => setActiveCategory(key)}
                            >
                                <category.icon size={20} />
                                <span>{category.title}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* FAQ List */}
                <div className="faq-list">
                    {searchTerm && (
                        <p className="search-results">
                            {filteredFaqs().length} results for "{searchTerm}"
                        </p>
                    )}

                    {filteredFaqs().map((faq, index) => (
                        <div key={index} className="faq-item">
                            <button
                                className="faq-question"
                                onClick={() => toggleFaq(index)}
                            >
                                <span>{faq.question}</span>
                                {expandedFaq === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                            {expandedFaq === index && (
                                <div className="faq-answer">
                                    <p>{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredFaqs().length === 0 && (
                        <div className="no-results">
                            <HelpCircle size={48} />
                            <h3>No results found</h3>
                            <p>Try searching with different keywords</p>
                        </div>
                    )}
                </div>

                {/* Quick Tips */}
                <div className="quick-tips">
                    <h3>Quick Tips</h3>
                    <div className="tips-grid">
                        <div className="tip-card">
                            <h4>💡 Consistency is Key</h4>
                            <p>Log your workouts regularly to see meaningful progress trends in your analytics.</p>
                        </div>
                        <div className="tip-card">
                            <h4>📊 Track Everything</h4>
                            <p>Include warm-up sets and rest times for the most accurate workout data.</p>
                        </div>
                        <div className="tip-card">
                            <h4>🎯 Set Realistic Goals</h4>
                            <p>Update your fitness goals in your profile to stay motivated and track progress.</p>
                        </div>
                        <div className="tip-card">
                            <h4>📈 Review Analytics Weekly</h4>
                            <p>Check your analytics regularly to identify patterns and adjust your training.</p>
                        </div>
                    </div>
                </div>

                {/* Contact Support */}
                <div className="contact-support">
                    <h3>Still Need Help?</h3>
                    <p>Can't find what you're looking for? Our support team is here to help.</p>
                    <div className="contact-options">
                        <a href="mailto:support@fittrackpro.com" className="contact-option">
                            <Mail size={24} />
                            <div>
                                <h4>Email Support</h4>
                                <p>support@fittrackpro.com</p>
                            </div>
                        </a>
                        <div className="contact-option">
                            <MessageCircle size={24} />
                            <div>
                                <h4>Live Chat</h4>
                                <p>Available Mon-Fri, 9am-5pm</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Help;