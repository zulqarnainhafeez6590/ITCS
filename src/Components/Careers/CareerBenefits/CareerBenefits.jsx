import React from "react";
import "./CareerBenefits.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBillWave, faHospital, faUmbrellaBeach, faRocket, faLaptopCode, faGraduationCap, faUsers, faPizzaSlice } from "@fortawesome/free-solid-svg-icons";


const CareerBenefits = () => {
  const benefits = [
    {
      icon: faHospital,
      title: "Health Insurance & OPD",
      description: "Comprehensive coverage for yourself and your family, including OPD benefits."
    },
    {
      icon: faMoneyBillWave,
      title: "Provident Fund",
      description: "Secure your future with our provident fund scheme with no employee deductions."
    },
    {
      icon: faUmbrellaBeach,
      title: "Annual Paid Leaves",
      description: "Generous allocation of annual and sick leaves for your well-being."
    },
    {
      icon: faRocket,
      title: "Compensation Plans",
      description: "Competitive salary structures and attractive compensation packages."
    },
    {
      icon: faGraduationCap,
      title: "Paid Certifications",
      description: "Get reimbursed for professional certifications and skill training."
    },
    {
      icon: faUsers,
      title: "Quarterly Meetups",
      description: "Engaging team meetups and social activities to build strong bonds."
    },
    {
      icon: faPizzaSlice,
      title: "Stars of the Month",
      description: "Regular recognition and rewards for our outstanding performers."
    },
    {
      icon: faMoneyBillWave,
      title: "Referral Bonuses",
      description: "Earn rewards for bringing great talent into the ITCS family."
    }
  ];

  return (
    <section className="career-benefits">
      <div className="benefits-container">
        <div className="section-header">
          <span className="section-badge">BENEFITS</span>
          <h2>Why Join Our Team?</h2>
          <p>We believe in taking care of our people. Here's what we offer to help you thrive.</p>
        </div>
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card" data-index={index}>
              <div className="benefit-icon">
                <FontAwesomeIcon icon={benefit.icon} />
              </div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CareerBenefits;

