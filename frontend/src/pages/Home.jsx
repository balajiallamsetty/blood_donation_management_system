import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import heroImage from "../assets/hero-blood-donation.jpg";
import Button from "../components/Button";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "../components/Card";
import { FaHeart, FaUsers, FaDatabase, FaBell, FaExclamationTriangle } from "react-icons/fa";
import Accordion from "../components/Accordion";
import Alert from "../components/Alert"; 
import "../styles/Home.css";

const Home = () => {
  // ✅ Example alert state
  const [alertVisible, setAlertVisible] = useState(true);

  useEffect(() => {
    // Automatically hide alert after 6 seconds
    const timer = setTimeout(() => setAlertVisible(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // ✅ FAQ content
  const faqItems = [
    {
      title: "Who can donate blood?",
      content:
        "Any healthy adult aged 18–65 years with no major medical conditions can safely donate blood every 3–4 months.",
    },
    {
      title: "How often can I donate blood?",
      content:
        "Men can donate every 3 months, and women every 4 months. This allows your body time to replenish red blood cells.",
    },
    {
      title: "Is my data secure on BloodConnect?",
      content:
        "Yes. We take data security seriously. Your personal and medical information is encrypted and never shared publicly.",
    },
    {
      title: "How do hospitals verify donor requests?",
      content:
        "All donor and hospital registrations go through a verification process before approval by BloodConnect administrators.",
    },
    {
      title: "How can I track my donations?",
      content:
        "Once you’re a registered donor, visit the Donor Portal to see your donation history and next eligible donation date.",
    },
  ];

  return (
    <div className="home-container">

      {/* ================= ALERT SECTION ================= */}
      {alertVisible && (
        <div className="home-alert">
          <Alert
            type="warning"
            title="⚠️ Scheduled Maintenance"
            description="BloodConnect will be temporarily unavailable on Sunday between 1:00 AM – 3:00 AM for essential upgrades."
            icon={<FaExclamationTriangle />}
          />
        </div>
      )}

      {/* ================= HERO SECTION ================= */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Save Lives Through
              <span className="highlight"> Smart Blood Donation</span>
            </h1>
            <p>
              Connect donors, hospitals, and recipients on a unified platform.
              Real-time blood inventory tracking and emergency request
              management for faster, life-saving coordination.
            </p>
            <div className="button-group">
              <Button asChild>
                <Link to="/donor">Become a Donor</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/request">Request Blood</Link>
              </Button>
            </div>
          </div>

          <div className="hero-image">
            <img
              src={heroImage}
              alt="Blood donation network connecting donors and recipients"
            />
          </div>
        </div>
      </section>

      {/* ================= FEATURES SECTION ================= */}
      <section className="features-section">
        <div className="features-header">
          <h2>How BloodConnect Works</h2>
          <p>
            Our integrated platform bridges the gap between blood donors and
            those in need
          </p>
        </div>

        <div className="feature-grid">
          <Card>
            <CardContent>
              <div className="icon-wrapper">
                <FaUsers />
              </div>
              <CardTitle>Donor Registration</CardTitle>
              <CardDescription>
                Quick signup with blood type, location, and contact details for
                instant matching.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="icon-wrapper">
                <FaDatabase />
              </div>
              <CardTitle>Real-Time Inventory</CardTitle>
              <CardDescription>
                Live tracking of blood stock by type and quantity across all
                registered facilities.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="icon-wrapper">
                <FaHeart />
              </div>
              <CardTitle>Emergency Requests</CardTitle>
              <CardDescription>
                Urgent blood requests matched instantly with available donors in
                your area.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="icon-wrapper">
                <FaBell />
              </div>
              <CardTitle>Smart Notifications</CardTitle>
              <CardDescription>
                Get alerts when your blood type is needed nearby or stock runs
                low.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="cta-section">
        <h2>Ready to Save Lives?</h2>
        <p>
          Join thousands of donors and help build a stronger, more responsive
          blood donation network.
        </p>
        <div className="button-group">
          <Button asChild>
            <Link to="/auth">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <NavLink to="/auth">Admin Access</NavLink>
          </Button>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="faq-section">
        <div className="faq-container">
          <h2>Frequently Asked Questions</h2>
          <p>Get quick answers about blood donation and using BloodConnect.</p>
          <Accordion items={faqItems} />
        </div>
      </section>
    </div>
  );
};

export default Home;
