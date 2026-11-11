import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Events = () => {
    const [registeredEvents, setRegisteredEvents] = useState(new Set());

    const eventsList = [
        {
            id: 1,
            title: "Global AI & Machine Learning Hackathon 2026",
            date: "November 18, 2026 • 10:00 AM - 6:00 PM PKT",
            location: "Virtual & Computer Science Auditorium",
            category: "Hackathon",
            badgeColor: "bg-danger",
            description: "Build cutting-edge AI agents and neural applications in 24 hours. Mentorship from Google and academic researchers.",
            speakers: "Dr. Zaid Malik, Dr. Elena Rostova"
        },
        {
            id: 2,
            title: "Accessible Web Design & WCAG 2.2 Masterclass",
            date: "November 25, 2026 • 3:00 PM - 5:30 PM PKT",
            location: "LearningSphere Live Stream Hall A",
            category: "Workshop",
            badgeColor: "bg-primary",
            description: "Deep dive into keyboard accessibility, screen-reader compatibility, ARIA patterns, and accessible user experiences.",
            speakers: "Sara Ahmed, Senior Accessibility Engineer"
        },
        {
            id: 3,
            title: "Open Source Contributor Camp & Career Fair",
            date: "December 5, 2026 • 11:00 AM - 4:00 PM PKT",
            location: "Tech Incubator Center & Online",
            category: "Networking",
            badgeColor: "bg-success",
            description: "Connect with tech leaders, submit your first pull requests, and explore internship and software engineering roles.",
            speakers: "Tech Leads & Open Source Maintainers"
        }
    ];

    const toggleRegister = (id) => {
        setRegisteredEvents(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                alert("Registration cancelled.");
            } else {
                next.add(id);
                alert("Successfully registered! A calendar invite has been sent to your email.");
            }
            return next;
        });
    };

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="p-4 p-md-5 rounded-4 bg-white shadow-sm mb-4 border d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <span className="badge bg-primary px-3 py-1 mb-2">Campus &amp; Community Hub</span>
                    <h2 className="fw-bold text-dark mb-1">Upcoming Events &amp; Workshops</h2>
                    <p className="text-secondary mb-0">Join university webinars, coding bootcamps, masterclasses, and student competitions.</p>
                </div>
                <Link to="/courses" className="btn btn-primary fw-bold px-4">
                    Explore Online Courses &rarr;
                </Link>
            </div>

            {/* Events Grid */}
            <div className="row g-4">
                {eventsList.map(ev => {
                    const isRegistered = registeredEvents.has(ev.id);
                    return (
                        <div className="col-lg-4 col-md-6" key={ev.id}>
                            <div className="card h-100 border-0 shadow-sm rounded-4 p-4 bg-white d-flex flex-column justify-content-between">
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className={`badge ${ev.badgeColor} px-3 py-1`}>{ev.category}</span>
                                        <small className="text-muted">Free Entry</small>
                                    </div>
                                    <h5 className="fw-bold text-dark mb-2">{ev.title}</h5>
                                    <div className="text-secondary small mb-2">
                                        <div>📅 {ev.date}</div>
                                        <div>📍 {ev.location}</div>
                                        <div>🎙️ Speakers: {ev.speakers}</div>
                                    </div>
                                    <p className="text-muted small mt-3 mb-0">{ev.description}</p>
                                </div>

                                <div className="mt-4 pt-3 border-top">
                                    <button 
                                        className={`btn w-100 fw-bold ${isRegistered ? 'btn-success' : 'btn-outline-primary'}`}
                                        onClick={() => toggleRegister(ev.id)}
                                    >
                                        {isRegistered ? '✓ Registered (Click to Cancel)' : 'Reserve Seat Now'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Events;
